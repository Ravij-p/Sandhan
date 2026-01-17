import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Play,
  Users,
  ArrowLeft,
  Lock,
  CheckCircle,
  Download,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

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
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [upiUrl, setUpiUrl] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showPayLoader, setShowPayLoader] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [priceDetails, setPriceDetails] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpaySuccess, setRazorpaySuccess] = useState(false);
  const [razorpayError, setRazorpayError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const fetchCourseDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      if (response.data.success && response.data.course) {
        setCourse(response.data.course);
      } else {
        setError("Course not found or invalid response");
      }
    } catch (error) {
      setError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, courseId]);

  const fetchVideos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/videos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setVideos(response.data.videos);
    } catch (error) {
      // ignore
    }
  }, [API_BASE_URL, courseId]);

  const fetchMaterials = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/documents/courses/${courseId}/materials`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setMaterials(response.data.materials || []);
      }
    } catch (error) {
      // ignore
    }
  }, [API_BASE_URL, courseId]);

  const checkEnrollment = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/payments/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const enrollments = response.data.enrollments;
      const enrolled = enrollments.some(
        (enrollment) => enrollment.course?._id === courseId
      );
      setIsEnrolled(enrolled);

      if (enrolled) {
        fetchVideos();
        fetchMaterials();
      }
    } catch (error) {
      // ignore
    }
  }, [API_BASE_URL, courseId, fetchVideos, fetchMaterials]);

  useEffect(() => {
    fetchCourseDetails();
    if (isAuthenticated) {
      if (isAdmin) {
        setIsEnrolled(true);
        fetchVideos();
        fetchMaterials();
      } else if (isStudent) {
        checkEnrollment();
      }
    }
  }, [
    fetchCourseDetails,
    fetchVideos,
    fetchMaterials,
    checkEnrollment,
    isAuthenticated,
    isStudent,
    isAdmin,
  ]);

  const downloadWithAuth = async (documentId, filename) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/documents/stream/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        console.error("Download failed", res.status, await res.text());
        alert("Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
    }
  };

  const handleEnroll = () => {
    setReceipt(null);
    setPriceDetails(null);
    setRazorpaySuccess(false);
    setRazorpayError("");
    setShowEnrollmentModal(true);
  };

  const detectOS = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(ua)) return "android";
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    return "other";
  };

  const buildUpiParams = ({ pa, pn, am, tn }) => {
    const cu = "INR";
    const params = new URLSearchParams({ pa, pn, am: String(am), cu, tn });
    return params.toString();
  };

  const openSpecificUpi = async (scheme) => {
    if (!buyerName || !buyerEmail || !buyerPhone) {
      alert("Please enter name, email and 10-digit phone number");
      return;
    }
    if (!/^\d{10}$/.test(buyerPhone)) {
      alert("Phone number must be 10 digits");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/upi-payments/initiate-public`,
        {
          courseId,
          email: buyerEmail,
          phone: buyerPhone,
          name: buyerName,
        }
      );
      if (res.data.success) {
        const pa = process.env.UPI_VPA || "7600837122@hdfcbank";
        const pn = "Tushti IAS";
        const amountWithGst = String(
          Number(course.price) + 0.18 * Number(course.price)
        );
        const tn = `Payment for ${course.title} - ${buyerEmail}`;
        const params = buildUpiParams({ pa, pn, am: amountWithGst, tn });
        setUpiUrl(`upi://pay?${params}`);
        setPaymentStatus("pending");
        setShowPayLoader(true);
        setTimeout(() => {
          setShowPayLoader(false);
          window.location.href = `${scheme}${
            scheme.includes("gpay") ? "upi/pay?" : "pay?"
          }${params}`;
        }, 800);
        setReceipt({
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          course: course.title,
          amount: course.price,
          status: "pending",
        });
      }
    } catch (e) {
      alert("Failed to initiate UPI payment");
    }
  };

  const handleInitiateUpi = async () => {
    if (!buyerName || !buyerEmail || !buyerPhone) {
      alert("Please enter name, email and 10-digit phone number");
      return;
    }
    if (!/^\d{10}$/.test(buyerPhone)) {
      alert("Phone number must be 10 digits");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/upi-payments/initiate-public`,
        {
          courseId,
          email: buyerEmail,
          phone: buyerPhone,
          name: buyerName,
        }
      );
      if (res.data.success) {
        const pa = process.env.UPI_VPA || "7600837122@hdfcbank";
        const pn = "Tushti IAS";
        const amountWithGst = String(
          Number(course.price) + 0.18 * Number(course.price)
        );
        const tn = `Payment for ${course.title} - ${buyerEmail}`;
        const params = buildUpiParams({ pa, pn, am: amountWithGst, tn });
        const os = detectOS();
        const upiGeneric = `upi://pay?${params}`;
        setUpiUrl(upiGeneric);
        setToastMsg(
          "After paying, your login credentials will be emailed to you. Please check your email."
        );
        setTimeout(() => setToastMsg(""), 6000);
        setPaymentStatus("pending");
        setShowPayLoader(true);
        setTimeout(() => {
          setShowPayLoader(false);
          if (os === "android") {
            window.location.href = upiGeneric;
          } else if (os === "other") {
            setShowQrCode(true);
          }
          // ios: buttons are shown; do not auto-open
        }, 1200);
        setReceipt({
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          course: course.title,
          amount: course.price,
          status: "pending",
        });
      }
    } catch (e) {
      alert("Failed to initiate UPI payment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Course not found"}</p>
          <button
            onClick={() => navigate("/courses")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-40 sm:pt-36 md:pt-32 lg:pt-28">
      {showPayLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-900 font-semibold">
              Redirecting to payment app… Please do not press back.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/courses")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {course.category.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            {/* Course Overview */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 truncate">
                {course.title}
              </h2>

              <p className="text-gray-600 mb-2">{course.description}</p>
              <p className="mb-6">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{course.price.toLocaleString()}
                </span>
                <span className="ml-2 text-gray-700 font-medium">
                  + 18% GST
                </span>
              </p>

              {/* Course Stats (ratings removed) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {videos.length}
                  </div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {course.duration}
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">50</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
              </div>

              {/* Course Features */}
              {course.features && course.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What you'll learn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {course.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-gray-600 break-words"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrollment Status */}
              {isAuthenticated && isStudent && (
                <div className="mb-6">
                  {isEnrolled ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          You are enrolled in this course!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Lock className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 font-medium">
                          Enroll to access course videos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                {isEnrolled ? (
                  <button
                    onClick={() => navigate(`/course/${courseId}/videos`)}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Start Learning</span>
                    <span className="sm:hidden inline">Start</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="flex-1 bg-yellow-400 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">
                      Enroll Now – ₹{course.price.toLocaleString()} + 18% GST
                    </span>
                    <span className="sm:hidden inline">Enroll</span>
                  </button>
                )}
              </div>
            </div>

            {/* Course Curriculum */}
            {isEnrolled && videos.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Curriculum
                </h3>
                <div className="space-y-3">
                  {videos.map((video, index) => (
                    <div
                      key={video._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 truncate">
                            {video.title}
                          </h4>
                          {video.duration > 0 && (
                            <p className="text-sm text-gray-600">
                              {Math.floor(video.duration / 60)}:
                              {(video.duration % 60)
                                .toString()
                                .padStart(2, "0")}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/course/${courseId}/video/${video._id}`)
                        }
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Watch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              isEnrolled && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Course Curriculum
                  </h3>
                  <p className="text-gray-600">
                    No videos available for this course.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Course Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Course Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">
                    ₹{course.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{course.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Videos</span>
                  <span className="font-semibold">{videos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language</span>
                  <span className="font-semibold">{course.language}</span>
                </div>
                {paymentStatus === "pending" && (
                  <div className="mt-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p>
                      Your payment is still pending. If you do not complete the
                      payment, you cannot access the course. Please make sure
                      your payment is completed.
                    </p>
                    <p>
                      If payment is successfull , do not worry , you will will
                      be enrolled within 24 hours.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Not done payment?
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Materials Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Materials
              </h3>
              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {m.title}
                        </h4>
                        {m.description && (
                          <p className="text-sm text-gray-600">
                            {m.description}
                          </p>
                        )}
                      </div>
                      {isEnrolled || isAdmin ? (
                        <button
                          onClick={() =>
                            downloadWithAuth(m._id, m.originalName)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center whitespace-nowrap"
                          title="Download"
                        >
                          <Download className="w-4 h-4 mr-2" />{" "}
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      ) : (
                        <div className="text-yellow-700 text-sm flex items-center">
                          <Lock className="w-4 h-4 mr-2" /> Purchase to download
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No materials available.</p>
              )}
            </div>

            {/* Instructor Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Instructor
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Expert Faculty</h4>
                  <p className="text-sm text-gray-600">Tushti IAS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Enroll in Course
                </h2>
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 space-y-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Course</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {course.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{course.price.toLocaleString()} + 18% GST
                    </span>
                  </div>
                  {priceDetails && (
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base price</span>
                        <span className="font-medium">
                          ₹{priceDetails.baseAmount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gateway charges</span>
                        <span className="font-medium">
                          ₹{priceDetails.serviceCharge}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900">Total payable</span>
                        <span className="text-gray-900">
                          ₹{priceDetails.totalAmount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="Email ID"
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Phone Number (10 digits)"
                    className="px-3 py-2 border rounded"
                  />
                </div>
              </div>
              {!receipt ? (
                <div className="space-y-4">
                  <button
                    onClick={async () => {
                      if (!buyerName || !buyerEmail || !buyerPhone) {
                        alert(
                          "Please enter name, email and 10-digit phone number"
                        );
                        return;
                      }
                      if (!/^\d{10}$/.test(buyerPhone)) {
                        alert("Phone number must be 10 digits");
                        return;
                      }

                      setRazorpayError("");
                      setRazorpayLoading(true);

                      try {
                        if (!window.Razorpay) {
                          await new Promise((resolve, reject) => {
                            const script = document.createElement("script");
                            script.src =
                              "https://checkout.razorpay.com/v1/checkout.js";
                            script.onload = resolve;
                            script.onerror = reject;
                            document.body.appendChild(script);
                          });
                        }

                        const response = await axios.post(
                          `${API_BASE_URL}/payments/public/course/create-order`,
                          {
                            courseId,
                            name: buyerName,
                            email: buyerEmail,
                            mobile: buyerPhone,
                          }
                        );

                        if (!response.data.success) {
                          setRazorpayError(
                            response.data.error ||
                              "Failed to create payment order"
                          );
                          return;
                        }

                        const {
                          orderId,
                          amount,
                          amountInPaise,
                          currency,
                          key,
                          breakdown,
                          course: courseData,
                        } = response.data;

                        const details = breakdown || {
                          baseAmount: courseData.price,
                          serviceCharge: amount - courseData.price,
                          totalAmount: amount,
                        };

                        setPriceDetails(details);

                        const options = {
                          key,
                          amount: amountInPaise,
                          currency,
                          name: "Tushti IAS",
                          description: course.title,
                          order_id: orderId,
                          handler: async function (rzpResponse) {
                            try {
                              const verifyRes = await axios.post(
                                `${API_BASE_URL}/payments/public/course/verify-payment`,
                                {
                                  razorpay_order_id:
                                    rzpResponse.razorpay_order_id,
                                  razorpay_payment_id:
                                    rzpResponse.razorpay_payment_id,
                                  razorpay_signature:
                                    rzpResponse.razorpay_signature,
                                  courseId: courseData.id,
                                  email: buyerEmail,
                                  name: buyerName,
                                  mobile: buyerPhone,
                                }
                              );

                              if (verifyRes.data.success) {
                                setRazorpaySuccess(true);
                                setIsEnrolled(true);
                                fetchVideos();
                                fetchMaterials();
                              } else {
                                setRazorpayError(
                                  verifyRes.data.error ||
                                    "Payment verification failed"
                                );
                              }
                            } catch (err) {
                              setRazorpayError(
                                "Payment verification failed. Please contact support."
                              );
                            }
                          },
                          prefill: {
                            name: buyerName,
                            email: buyerEmail,
                            contact: buyerPhone,
                          },
                          theme: {
                            color: "#163233",
                          },
                        };

                        const rzp = new window.Razorpay(options);
                        rzp.open();
                      } catch (err) {
                        const message =
                          (err.response &&
                            err.response.data &&
                            err.response.data.error) ||
                          err.message ||
                          "Failed to initiate payment. Please try again.";
                        setRazorpayError(message);
                      } finally {
                        setRazorpayLoading(false);
                      }
                    }}
                    disabled={razorpayLoading}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {razorpayLoading ? "Processing…" : "Pay with Razorpay"}
                  </button>

                  {razorpaySuccess && (
                    <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded p-3 text-center">
                      Payment successful. You will receive your login details
                      within 24 hours.
                    </div>
                  )}

                  {razorpayError && (
                    <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded p-3 text-center">
                      {razorpayError}
                    </div>
                  )}

                  <p className="text-xs text-gray-600 text-center">
                    Use a unique email. For further payments, use the same
                    email.
                  </p>
                  <p className="text-xs text-gray-600 text-center">
                    After any successful payment, you will receive your
                    credentials within 24 hours. If not, please call the number
                    shown on the home screen.
                  </p>

                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Your payment is under verification. If you have paid then
                      , within 24 hours, you’ll get access to your course.
                    </p>
                  </div>
                  <div className="text-sm bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{receipt.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{receipt.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{receipt.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course:</span>
                      <span className="font-medium">{receipt.course}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₹{receipt.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">
                        {receipt.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Desktop */}
      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-sm w-full">
            <button
              onClick={() => setShowQrCode(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Scan to Pay</h2>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas value={upiUrl} size={200} />
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Scan this QR code with your UPI app to complete payment
            </p>
            <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
              <p className="break-all">{upiUrl}</p>
            </div>
            <button
              onClick={() => setShowQrCode(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
