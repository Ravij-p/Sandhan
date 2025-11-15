import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Lock,
  CheckCircle,
  Download,
  Share2,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent, isAdmin } = useAuth();
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

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

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
  }, [courseId, isAuthenticated, isStudent, isAdmin]);

  const fetchCourseDetails = async () => {
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
  };

  const checkEnrollment = async () => {
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
  };

  const fetchVideos = async () => {
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
  };

  const fetchMaterials = async () => {
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
  };

  const downloadWithAuth = async (documentId, filename) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/stream/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (!isAuthenticated) {
      alert("Please login to enroll in this course");
      return;
    }
    setShowEnrollmentModal(true);
    // Build UPI URL from course payment config or fallback to course price
    let upi = "";
    if (course?.payment?.upiLink) {
      upi = course.payment.upiLink
        .replace("{course_amount}", String(course.price || 0))
        .replace("{course}", encodeURIComponent(course.title || "Course"))
        .replace(
          "{student_email}",
          encodeURIComponent(user?.email || "student@tushtiias.com")
        );
    } else {
      const pa = "merchant@upi";
      const pn = "TushtiIAS";
      const am = String(course.price || 0);
      upi = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;
    }
    setUpiUrl(upi);
    setShowQrCode(true);
  };

  const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);

  const handleInitiateUpi = async () => {
    if (!isAuthenticated || !isStudent) {
      alert("Please login as a student to enroll");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/upi-payments/initiate`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUpiUrl(res.data.upiUrl);

        if (isMobile()) {
          // Mobile: Open UPI app directly
          window.location.href = res.data.upiUrl;
        } else {
          // Desktop: Show QR code
          setShowQrCode(true);
        }
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
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{course.price.toLocaleString()}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 truncate">
                {course.title}
              </h2>

              <p className="text-gray-600 mb-6">{course.description}</p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">4.8</div>
                  <div className="text-sm text-gray-600">Rating</div>
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
                    <span className="hidden sm:inline">Enroll Now - ₹{course.price.toLocaleString()}</span>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Curriculum</h3>
                  <p className="text-gray-600">No videos available for this course.</p>
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
                  <span className="text-gray-600">Level</span>
                  <span className="font-semibold">Beginner</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language</span>
                  <span className="font-semibold">English</span>
                </div>
              </div>
            </div>

            {/* Materials Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials</h3>
              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">{m.title}</h4>
                        {m.description && <p className="text-sm text-gray-600">{m.description}</p>}
                      </div>
                      {isEnrolled || isAdmin ? (
                        <button
                          onClick={() => downloadWithAuth(m._id, m.originalName)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center whitespace-nowrap"
                          title="Download"
                        >
                          <Download className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Download</span>
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
                <h2 className="text-xl font-bold text-gray-900">Enroll in Course</h2>
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Course Price</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{course.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {!receipt ? (
                <div className="space-y-4">
                  <button
                    onClick={handleInitiateUpi}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    {isMobile() ? "Pay via UPI" : "Generate QR Code"}
                  </button>
                  <p className="text-xs text-gray-600">
                    Course will be accessible after admin approval. No UTR is required.
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
                    <h3 className="font-semibold text-yellow-900 mb-1">Payment Submitted</h3>
                    <p className="text-sm text-yellow-800">
                      Your payment is under verification. Within 24 hours, you’ll get access to your course.
                    </p>
                  </div>
                  <div className="text-sm bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{receipt.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-medium">{receipt.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span><span className="font-medium">{receipt.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Course:</span><span className="font-medium">{receipt.course}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-medium">₹{receipt.amount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="font-medium capitalize">{receipt.status}</span></div>
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
