import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen, Play, Users, ArrowLeft, Lock,
  CheckCircle, Download, X, Receipt,
} from "lucide-react";
import axios from "axios";

const PRIMARY = "#353841";
const SECONDARY = "#C8B8A9";
const ACCENT = "#fcfcfc";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function calcPricing(baseAmount) {
  const gatewayFeePercent = 0.02;
  const gstPercent = 0.18;
  const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
  const totalAmount = Math.ceil(baseAmount / (1 - totalDeductionPercent));
  const gatewayCharge = totalAmount - baseAmount;
  return { baseAmount, gatewayCharge, totalAmount };
}

// Normalise server breakdown — server may return gatewayCharge or serviceCharge
function normalisePricing(breakdown) {
  if (!breakdown) return null;
  return {
    baseAmount: Number(breakdown.baseAmount) || 0,
    gatewayCharge: Number(breakdown.gatewayCharge ?? breakdown.serviceCharge) || 0,
    totalAmount: Number(breakdown.totalAmount) || 0,
  };
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, isAdmin } = useAuth();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // 'online' or 'offline'

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [formError, setFormError] = useState("");

  // Payment state
  const [step, setStep] = useState("form"); // form | paying | success
  const [pricing, setPricing] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState(null);
  const [receiptCourse, setReceiptCourse] = useState(null);
  const [userPassword, setUserPassword] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");

  const fetchCourse = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      if (res.data.success) {
        const fetchedCourse = res.data.course;
        setCourse(fetchedCourse);
        
        // Auto-select mode if only one is available
        if (fetchedCourse.onlinePrice && !fetchedCourse.offlinePrice) {
          setSelectedMode('online');
        } else if (fetchedCourse.offlinePrice && !fetchedCourse.onlinePrice) {
          setSelectedMode('offline');
        } else if (fetchedCourse.onlinePrice && fetchedCourse.offlinePrice) {
          setSelectedMode('online'); // Default to online if both available
        } else if (fetchedCourse.price) {
          // Legacy price field
          setSelectedMode('online');
        }
      } else {
        setError("Course not found");
      }
    } catch {
      setError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchVideos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos(res.data.videos || []);
    } catch {}
  }, [courseId]);

  const fetchMaterials = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/documents/courses/${courseId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setMaterials(res.data.materials || []);
    } catch {}
  }, [courseId]);

  const checkEnrollment = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/payments/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enrolled = res.data.enrollments.some(
        (e) => e.course?._id === courseId
      );
      setIsEnrolled(enrolled);
      if (enrolled) { fetchVideos(); fetchMaterials(); }
    } catch {}
  }, [courseId, fetchVideos, fetchMaterials]);

  useEffect(() => {
    fetchCourse();
    if (isAuthenticated) {
      if (isAdmin) { setIsEnrolled(true); fetchVideos(); fetchMaterials(); }
      else if (isStudent) checkEnrollment();
    }
  }, [fetchCourse, fetchVideos, fetchMaterials, checkEnrollment, isAuthenticated, isStudent, isAdmin]);

  const openModal = () => {
    setName(""); setEmail(""); setMobile("");
    setFormError(""); setPayError("");
    setStep("form"); setPricing(null);
    setReceiptNumber(null); setReceiptCourse(null);
    
    // Auto-select mode if only one available
    if (course.onlinePrice && !course.offlinePrice) {
      setSelectedMode('online');
    } else if (course.offlinePrice && !course.onlinePrice) {
      setSelectedMode('offline');
    }
    
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Name is required");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setFormError("Valid email is required");
    if (!/^\d{10}$/.test(mobile)) return setFormError("10-digit mobile number is required");
    
    // Check if mode is selected when both are available
    if (course.onlinePrice && course.offlinePrice && !selectedMode) {
      return setFormError("Please select a mode (Online or Offline)");
    }
    
    setFormError("");
    const currentPrice = getCurrentPrice();
    if (currentPrice && course) setPricing(calcPricing(currentPrice));
    setStep("paying");
  };

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });

  const handlePay = async () => {
    setPayError(""); setProcessing(true);
    try {
      await loadRazorpay();
      const orderRes = await axios.post(`${API_BASE_URL}/payments/public/course/create-order`, {
        courseId, name, email, mobile, selectedMode,
      });
      if (!orderRes.data.success) {
        setPayError(orderRes.data.error || "Failed to create order");
        return;
      }
      const { orderId, amountInPaise, currency, key, course: courseData, breakdown } = orderRes.data;
      if (breakdown) setPricing(normalisePricing(breakdown));

      const rzp = new window.Razorpay({
        key,
        amount: amountInPaise,
        currency,
        name: "Tushti IAS",
        description: course.title,
        order_id: orderId,
        handler: async (rzpResponse) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payments/public/course/verify-payment`, {
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_signature: rzpResponse.razorpay_signature,
              courseId: courseData.id,
              email, name, mobile,
              selectedMode,
            });
            if (verifyRes.data.success) {
              setReceiptNumber(verifyRes.data.receiptNumber);
              setReceiptCourse(verifyRes.data.course?.title || course.title);
              setUserPassword(verifyRes.data.password);
              if (verifyRes.data.breakdown) setPricing(normalisePricing(verifyRes.data.breakdown));
              setIsEnrolled(true);
              setStep("success");
              fetchVideos(); fetchMaterials();
            } else {
              setPayError(verifyRes.data.error || "Payment verification failed");
            }
          } catch {
            setPayError("Payment verification failed. Contact support.");
          }
        },
        prefill: { name, email, contact: mobile },
        theme: { color: PRIMARY },
      });
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.error || err.message || "Payment failed. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = () => {
    const url = `${API_BASE_URL}/payments/receipt/${receiptNumber}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `TushtiIAS_Receipt_${receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadWithAuth = async (documentId, filename) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/stream/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Download failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // GPSC banner — only portrait_gpsc_course.jpeg exists, show it uncropped
  const GpscBanner = () => (
    <div
      className="w-full mb-6 rounded-xl shadow overflow-hidden"
      style={{ backgroundColor: "#dad9d7" }}
    >
      <img
        src="/portrait_gpsc_course.jpeg"
        alt="GPSC Course"
        style={{
          display: "block",
          width: "100%",
          maxHeight: "520px",
          objectFit: "contain",     /* full image visible, no cropping */
          objectPosition: "center",
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: PRIMARY }}></div>
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
      <div className="text-center">
        <p style={{ color: PRIMARY }}>{error || "Course not found"}</p>
        <button onClick={() => navigate("/courses")}
          className="mt-4 px-4 py-2 text-white rounded-lg"
          style={{ backgroundColor: PRIMARY }}>Back to Courses</button>
      </div>
    </div>
  );

  const getCurrentPrice = () => {
    if (selectedMode === 'online' && course.onlinePrice) return course.onlinePrice;
    if (selectedMode === 'offline' && course.offlinePrice) return course.offlinePrice;
    return course.price || 0;
  };

  const pricingPreview = calcPricing(getCurrentPrice());

  return (
    <div className="min-h-screen pt-40 sm:pt-36 md:pt-32 lg:pt-28" style={{ backgroundColor: ACCENT }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: SECONDARY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <button onClick={() => navigate("/courses")}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ backgroundColor: ACCENT }}>
              <ArrowLeft size={20} style={{ color: PRIMARY }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{course.title}</h1>
              <p className="text-sm" style={{ color: SECONDARY }}>{course.category?.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {course.category === "gpsc" && <GpscBanner />}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-3" style={{ color: PRIMARY }}>{course.title}</h2>
              <p className="mb-4" style={{ color: PRIMARY, opacity: 0.8 }}>{course.description}</p>

              {/* Mode Selection Toggle - Show only if both modes available */}
              {course.onlinePrice && course.offlinePrice && (
                <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: "#f0f0f0" }}>
                  <div className="text-sm mb-3 font-semibold" style={{ color: PRIMARY }}>Select Course Mode:</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedMode('online')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedMode === 'online' ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedMode === 'online' ? PRIMARY : 'white',
                        color: selectedMode === 'online' ? 'white' : PRIMARY,
                        border: `2px solid ${PRIMARY}`
                      }}
                    >
                      Online
                      <div className="text-sm mt-1">₹{course.onlinePrice.toLocaleString()}</div>
                    </button>
                    <button
                      onClick={() => setSelectedMode('offline')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedMode === 'offline' ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedMode === 'offline' ? PRIMARY : 'white',
                        color: selectedMode === 'offline' ? 'white' : PRIMARY,
                        border: `2px solid ${PRIMARY}`
                      }}
                    >
                      Offline
                      <div className="text-sm mt-1">₹{course.offlinePrice.toLocaleString()}</div>
                    </button>
                  </div>
                  {selectedMode === 'offline' && course.location && (
                    <div className="mt-3 text-sm" style={{ color: PRIMARY }}>
                      <strong>Location:</strong> {course.location}
                    </div>
                  )}
                </div>
              )}

              {/* Price display - Transparent pricing */}
              <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: ACCENT }}>
                <div className="text-sm mb-2 font-medium" style={{ color: PRIMARY }}>
                  {course.onlinePrice && course.offlinePrice ? (
                    selectedMode ? `${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Mode - Price Breakdown` : "Price Breakdown"
                  ) : course.onlinePrice ? (
                    "Online Mode - Price Breakdown"
                  ) : course.offlinePrice ? (
                    "Offline Mode - Price Breakdown"
                  ) : (
                    "Price Breakdown"
                  )}
                </div>
                {course.onlinePrice && course.offlinePrice && !selectedMode ? (
                  // Show both prices when both available and none selected
                  <>
                    <div className="mb-3 pb-3 border-b" style={{ borderColor: SECONDARY }}>
                      <div className="font-semibold mb-2" style={{ color: PRIMARY }}>Online Mode:</div>
                      <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                        <span>Course Price</span><span>₹{course.onlinePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                        <span>Razorpay Charges (2% + 18% GST)</span>
                        <span>₹{calcPricing(course.onlinePrice).gatewayCharge.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm mt-1" style={{ color: PRIMARY }}>
                        <span>Total</span><span>₹{calcPricing(course.onlinePrice).totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2" style={{ color: PRIMARY }}>Offline Mode:</div>
                      <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                        <span>Course Price</span><span>₹{course.offlinePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                        <span>Razorpay Charges (2% + 18% GST)</span>
                        <span>₹{calcPricing(course.offlinePrice).gatewayCharge.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm mt-1" style={{ color: PRIMARY }}>
                        <span>Total</span><span>₹{calcPricing(course.offlinePrice).totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    {course.location && (
                      <div className="mt-3 pt-3 text-xs border-t" style={{ borderColor: SECONDARY, color: PRIMARY }}>
                        <strong>Offline Location:</strong> {course.location}
                      </div>
                    )}
                  </>
                ) : (
                  // Show selected mode price or single available price
                  <>
                    <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                      <span>Course Price</span><span>₹{getCurrentPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: PRIMARY }}>
                      <span>Razorpay Charges (2% + 18% GST)</span>
                      <span>₹{pricingPreview.gatewayCharge.toLocaleString()}</span>
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold" style={{ color: PRIMARY, borderColor: SECONDARY }}>
                      <span>Grand Total</span><span>₹{pricingPreview.totalAmount.toLocaleString()}</span>
                    </div>
                    {selectedMode === 'offline' && course.location && (
                      <div className="mt-3 pt-3 text-xs border-t" style={{ borderColor: SECONDARY, color: PRIMARY }}>
                        <strong>Location:</strong> {course.location}
                      </div>
                    )}
                  </>
                )}
              </div>

              {course.features?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: PRIMARY }}>What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {course.features.map((f, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: SECONDARY }} />
                        <span style={{ color: PRIMARY }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAuthenticated && isStudent && (
                <div className="mb-5">
                  {isEnrolled ? (
                    <div className="rounded-lg p-4 flex items-center" style={{ backgroundColor: ACCENT }}>
                      <CheckCircle className="w-5 h-5 mr-2" style={{ color: PRIMARY }} />
                      <span className="font-medium" style={{ color: PRIMARY }}>You are enrolled in this course!</span>
                    </div>
                  ) : (
                    <div className="rounded-lg p-4 flex items-center border" style={{ borderColor: SECONDARY, backgroundColor: "#faf9f8" }}>
                      <Lock className="w-5 h-5 mr-2" style={{ color: SECONDARY }} />
                      <span className="font-medium" style={{ color: PRIMARY }}>Enroll to access course content</span>
                    </div>
                  )}
                </div>
              )}

              {isEnrolled ? (
                <button onClick={() => navigate(`/course/${courseId}/videos`)}
                  className="flex items-center justify-center w-full py-3 px-6 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: PRIMARY }}>
                  <Play className="w-5 h-5 mr-2" /> Start Learning
                </button>
              ) : (
                <>
                  {course.onlinePrice || course.offlinePrice || course.price ? (
                    <button onClick={openModal}
                      className="flex items-center justify-center w-full py-3 px-6 rounded-lg font-semibold"
                      style={{ backgroundColor: SECONDARY, color: PRIMARY }}>
                      <BookOpen className="w-5 h-5 mr-2" />
                      {course.onlinePrice && course.offlinePrice ? (
                        selectedMode ? `Register Now — ₹${pricingPreview.totalAmount.toLocaleString()} Total` : "Register Now — Select Mode"
                      ) : (
                        `Register Now — ₹${pricingPreview.totalAmount.toLocaleString()} Total`
                      )}
                    </button>
                  ) : (
                    <div className="text-center py-3 text-sm" style={{ color: SECONDARY }}>
                      Pricing information not available
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Curriculum */}
            {isEnrolled && videos.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: PRIMARY }}>Course Curriculum</h3>
                <div className="space-y-2">
                  {videos.map((video) => (
                    <div key={video._id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderColor: ACCENT }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                          <Play className="w-4 h-4" style={{ color: PRIMARY }} />
                        </div>
                        <span className="font-medium text-sm" style={{ color: PRIMARY }}>{video.title}</span>
                      </div>
                      <button onClick={() => navigate(`/course/${courseId}/video/${video._id}`)}
                        className="font-medium text-sm" style={{ color: PRIMARY }}>Watch</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: PRIMARY }}>Course Info</h3>
              <div className="space-y-2">
                {course.onlinePrice && course.offlinePrice ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: SECONDARY }}>Online Price</span>
                      <span className="font-medium" style={{ color: PRIMARY }}>₹{course.onlinePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: SECONDARY }}>Offline Price</span>
                      <span className="font-medium" style={{ color: PRIMARY }}>₹{course.offlinePrice.toLocaleString()}</span>
                    </div>
                  </>
                ) : course.onlinePrice ? (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: SECONDARY }}>Price (Online)</span>
                    <span className="font-medium" style={{ color: PRIMARY }}>₹{course.onlinePrice.toLocaleString()}</span>
                  </div>
                ) : course.offlinePrice ? (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: SECONDARY }}>Price (Offline)</span>
                    <span className="font-medium" style={{ color: PRIMARY }}>₹{course.offlinePrice.toLocaleString()}</span>
                  </div>
                ) : course.price ? (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: SECONDARY }}>Price</span>
                    <span className="font-medium" style={{ color: PRIMARY }}>₹{course.price.toLocaleString()}</span>
                  </div>
                ) : null}
                {[
                  ["Duration", course.duration],
                  ["Videos", videos.length],
                  ["Language", course.language],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span style={{ color: SECONDARY }}>{l}</span>
                    <span className="font-medium" style={{ color: PRIMARY }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: PRIMARY }}>Materials</h3>
              {materials.length > 0 ? (
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: ACCENT }}>
                      <span className="text-sm font-medium truncate" style={{ color: PRIMARY }}>{m.title}</span>
                      {isEnrolled || isAdmin ? (
                        <button onClick={() => downloadWithAuth(m._id, m.originalName)}
                          className="flex items-center text-sm" style={{ color: PRIMARY }}>
                          <Download className="w-4 h-4 mr-1" />
                        </button>
                      ) : (
                        <Lock className="w-4 h-4" style={{ color: SECONDARY }} />
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm" style={{ color: SECONDARY }}>No materials available.</p>}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: PRIMARY }}>Instructor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                  <Users className="w-6 h-6" style={{ color: PRIMARY }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: PRIMARY }}>Expert Faculty</p>
                  <p className="text-sm" style={{ color: SECONDARY }}>Tushti IAS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold" style={{ color: PRIMARY }}>
                  {step === "success" ? "Payment Successful!" : "Register for Course"}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X size={22} style={{ color: PRIMARY }} />
                </button>
              </div>

              {/* Course name */}
              <div className="rounded-lg p-3 mb-4 text-sm font-medium" style={{ backgroundColor: ACCENT, color: PRIMARY }}>
                {course.title}
              </div>

              {/* STEP: Form */}
              {step === "form" && (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  {/* Mode Selection - Show only if both modes available */}
                  {course.onlinePrice && course.offlinePrice && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: PRIMARY }}>Select Mode *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedMode('online')}
                          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                            selectedMode === 'online' ? 'ring-2' : ''
                          }`}
                          style={{
                            backgroundColor: selectedMode === 'online' ? PRIMARY : 'white',
                            color: selectedMode === 'online' ? 'white' : PRIMARY,
                            border: `2px solid ${PRIMARY}`
                          }}
                        >
                          Online
                          <div className="text-xs mt-1">₹{course.onlinePrice.toLocaleString()}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMode('offline')}
                          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                            selectedMode === 'offline' ? 'ring-2' : ''
                          }`}
                          style={{
                            backgroundColor: selectedMode === 'offline' ? PRIMARY : 'white',
                            color: selectedMode === 'offline' ? 'white' : PRIMARY,
                            border: `2px solid ${PRIMARY}`
                          }}
                        >
                          Offline
                          <div className="text-xs mt-1">₹{course.offlinePrice.toLocaleString()}</div>
                        </button>
                      </div>
                      {selectedMode === 'offline' && course.location && (
                        <div className="mt-2 text-xs" style={{ color: PRIMARY }}>
                          <strong>Location:</strong> {course.location}
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                    style={{ borderColor: SECONDARY, color: PRIMARY }}
                  />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email ID *"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                    style={{ borderColor: SECONDARY, color: PRIMARY }}
                  />
                  <input
                    type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile Number (10 digits) *"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                    style={{ borderColor: SECONDARY, color: PRIMARY }}
                  />
                  {formError && <p className="text-red-600 text-sm">{formError}</p>}
                  <button type="submit"
                    className="w-full py-3 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}>
                    Continue to Payment
                  </button>
                </form>
              )}

              {/* STEP: Price breakdown + Pay */}
              {step === "paying" && pricing && (
                <div className="space-y-4">
                  <div className="rounded-lg p-4 text-sm space-y-2" style={{ backgroundColor: ACCENT }}>
                    <div className="font-semibold mb-1" style={{ color: PRIMARY }}>Price Breakdown</div>
                    <div className="flex justify-between" style={{ color: PRIMARY }}>
                      <span>Course Price</span><span>₹{pricing.baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: PRIMARY }}>
                      <span>Razorpay Charges (2% + 18% GST)</span>
                      <span>₹{pricing.gatewayCharge.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold" style={{ color: PRIMARY, borderColor: SECONDARY }}>
                      <span>Grand Total</span><span>₹{pricing.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-sm rounded p-3" style={{ backgroundColor: "#f9f9f8", color: PRIMARY }}>
                    <div><strong>Name:</strong> {name}</div>
                    <div><strong>Email:</strong> {email}</div>
                    <div><strong>Mobile:</strong> {mobile}</div>
                  </div>
                  {payError && <p className="text-red-600 text-sm">{payError}</p>}
                  <button onClick={handlePay} disabled={processing}
                    className="w-full py-3 rounded-lg font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}>
                    {processing ? "Processing…" : `Pay ₹${pricing.totalAmount.toLocaleString()} via Razorpay`}
                  </button>
                  <button onClick={() => setStep("form")}
                    className="w-full py-2 rounded-lg text-sm border"
                    style={{ borderColor: SECONDARY, color: PRIMARY }}>
                    Back
                  </button>
                  <p className="text-xs text-center" style={{ color: SECONDARY }}>
                    Secure payment powered by Razorpay
                  </p>
                </div>
              )}

              {/* STEP: Success + Receipt */}
              {step === "success" && (
                <div className="space-y-4">
                  <div className="rounded-lg p-4 flex items-center" style={{ backgroundColor: "#d4edda" }}>
                    <CheckCircle className="w-5 h-5 mr-2" style={{ color: "#155724" }} />
                    <span className="font-medium text-sm" style={{ color: "#155724" }}>
                      Payment verified! You are now enrolled.
                    </span>
                  </div>

                  {/* Password Display */}
                  {userPassword && (
                    <div className="rounded-lg p-4 border-2" style={{ backgroundColor: "#fff3cd", borderColor: "#d32f2f" }}>
                      <div className="font-bold text-sm mb-2" style={{ color: "#d32f2f" }}>
                        ⚠ YOUR LOGIN PASSWORD
                      </div>
                      <div className="bg-white p-3 rounded border font-mono text-lg font-bold text-center mb-2" style={{ borderColor: "#d32f2f", color: "#d32f2f" }}>
                        {userPassword}
                      </div>
                      <div className="text-xs" style={{ color: "#856404" }}>
                        <strong>IMPORTANT:</strong> Save this password! Use it to login and access your courses.
                        This password is also in your receipt PDF.
                      </div>
                    </div>
                  )}

                  {pricing && (
                    <div className="rounded-lg p-4 text-sm space-y-2" style={{ backgroundColor: "#f9f9f8" }}>
                      <div className="font-semibold mb-1" style={{ color: PRIMARY }}>Receipt Details</div>
                      <div className="flex justify-between" style={{ color: PRIMARY }}>
                        <span>Receipt No</span><span className="font-mono">{receiptNumber}</span>
                      </div>
                      <div className="flex justify-between" style={{ color: PRIMARY }}>
                        <span>Course</span><span>{receiptCourse}</span>
                      </div>
                      <div className="flex justify-between" style={{ color: PRIMARY }}>
                        <span>Course Price</span><span>₹{pricing.baseAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between" style={{ color: PRIMARY }}>
                        <span>Razorpay Charges</span><span>₹{pricing.gatewayCharge?.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold" style={{ color: PRIMARY, borderColor: SECONDARY }}>
                        <span>Grand Total Paid</span><span>₹{pricing.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <button onClick={downloadReceipt}
                    className="w-full py-3 rounded-lg font-semibold flex items-center justify-center text-white"
                    style={{ backgroundColor: PRIMARY }}>
                    <Receipt className="w-5 h-5 mr-2" /> Download Receipt (PDF)
                  </button>
                  <button onClick={() => setShowModal(false)}
                    className="w-full py-2 rounded-lg text-sm border"
                    style={{ borderColor: SECONDARY, color: PRIMARY }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
