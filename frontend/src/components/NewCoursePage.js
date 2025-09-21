import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Play, Clock, User, Lock } from "lucide-react";
import axios from "axios";

const NewCoursePage = ({ courseType }) => {
  const { user, isAuthenticated, isStudent } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  // Legacy course data for backward compatibility
  const legacyCourseData = {
    gpsc: {
      title: "GPSC Class 1-2",
      description: "Gujarat Public Service Commission examination coaching",
      price: 10000,
      with_material_fees: 17500,
      cancelled_fee: "₹32,000",
    },
    upsc: {
      title: "UPSC Exam Prelims + Mains",
      description: "25 Prelims + 30 Mains Tests with detailed solutions with printed class notes, 2 lectures per Day",
      price: 35000,
      with_material_fees: 35000,
      cancelled_fee: "₹45,000",
    },
  };

  useEffect(() => {
    // For now, use legacy data. In production, fetch from API
    const legacyCourse = legacyCourseData[courseType] || legacyCourseData.gpsc;
    setCourse(legacyCourse);
    setLoading(false);

    // Check if student is enrolled (if authenticated)
    if (isAuthenticated && isStudent) {
      checkEnrollment();
    }
  }, [courseType, isAuthenticated, isStudent]);

  const checkEnrollment = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/enrollments`);
      const enrollments = response.data.enrollments;
      const enrolled = enrollments.some(
        (enrollment) => enrollment.course?.title === course.title
      );
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      // Show login modal or redirect to login
      alert("Please login to enroll in this course");
      return;
    }
    setShowEnrollmentForm(true);
  };

  const handlePayment = async () => {
    if (!isAuthenticated || !isStudent) {
      alert("Please login as a student to enroll");
      return;
    }

    setPaymentLoading(true);

    try {
      // For now, use legacy payment flow
      // In production, this would use the new payment system
      alert("Payment integration will be updated to use the new system");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <div className="py-20" style={{ backgroundColor: "#fafaee" }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#163233" }}>
            {course.title}
          </h1>
          <p className="text-lg text-gray-700 mb-8">{course.description}</p>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#163233" }}
                >
                  Course Features
                </h3>
                <ul className="text-left text-gray-700 space-y-2">
                  <li>• Expert Faculty</li>
                  <li>• Comprehensive Study Material</li>
                  <li>• Regular Mock Tests</li>
                  <li>• Doubt Clearing Sessions</li>
                  <li>• Video Lectures</li>
                  <li>• Progress Tracking</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#163233" }}
                >
                  Duration & Fees
                </h3>
                <div className="text-left text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>12 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch Size:</span>
                    <span>50 students</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <div>
                      <del className="font-bold text-red-500 mr-2">
                        {course.cancelled_fee}
                      </del>
                      <span className="font-bold text-green-600">
                        ₹{course.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Status */}
            {isAuthenticated && isStudent && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                {isEnrolled ? (
                  <div className="flex items-center justify-center space-x-2 text-blue-800">
                    <BookOpen size={20} />
                    <span className="font-medium">You are enrolled in this course!</span>
                    <button
                      onClick={() => window.location.href = "/dashboard"}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Access Course
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-orange-800">
                    <Lock size={20} />
                    <span className="font-medium">You need to enroll to access course content</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-center space-x-4">
              {isEnrolled ? (
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="px-8 py-3 rounded-lg font-medium text-lg transition-all hover:shadow-lg transform hover:scale-105 bg-green-600 text-white"
                >
                  <Play className="inline mr-2" size={20} />
                  Access Course
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={paymentLoading}
                  className="px-8 py-3 rounded-lg font-medium text-lg transition-all hover:shadow-lg transform hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: "#f9dc41", color: "#163233" }}
                >
                  {paymentLoading ? "Processing..." : "Enroll Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Form Modal */}
      {showEnrollmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#163233" }}>
                  Enroll for {course.title}
                </h2>
                <button
                  onClick={() => setShowEnrollmentForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">
                  Course Details:
                </h3>
                <p className="text-sm text-gray-700">{course.description}</p>
                <p className="text-sm text-gray-700 mt-1">
                  Fees:{" "}
                  <span className="font-bold text-green-600">
                    ₹{course.price.toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Enrollment Process:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Click "Pay Now" to proceed with payment</li>
                    <li>2. Complete payment using Razorpay</li>
                    <li>3. Get instant access to course content</li>
                    <li>4. Start learning immediately!</li>
                  </ol>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEnrollmentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-[#163233] rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {paymentLoading ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCoursePage;
