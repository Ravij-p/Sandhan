import { useState } from "react";
import axios from "axios";
import RazorpayButton from "./razorpay_button";
const CoursePage = ({ courseType }) => {
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    phoneNumber: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const courseData = {
    gpsc: {
      title: "GPSC Class 1-2",
      description: "Gujarat Public Service Commission examination coaching",
      fees: "₹17,500",
      cancelled_fee: "₹32,000",
    },
    upsc: {
      title: "UPSC Exam Prelims + Mains",
      description:
        "25 Prelims + 30 Mains Tests with detailed solutions with printed class notes, 2 lectures per Day",
      fees: "35,000",
      cancelled_fee: "₹45,000",
    },
  };

  const course = courseData[courseType] || courseData.gpsc;

  const API = process.env.REACT_APP_API_BASE_URL;

  const handleSendOTP = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    setIsVerifying(true);
    try {
      await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formData.phoneNumber }),
      });

      alert("OTP sent successfully");
      setOtpSent(true);
    } catch (err) {
      alert("Failed to send OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await axios.post(`${API}/verify-otp`, {
        mobile: formData.phoneNumber,
        otp,
      });

      setIsVerified(true);
      alert("OTP verified successfully");
    } catch (err) {
      alert("Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmitEnrollment = async () => {
    const { firstName, surname, phoneNumber } = formData;

    if (!firstName || !surname || !isVerified) {
      alert("Please fill all fields and verify your phone number");
      return;
    }

    try {
      const res = await axios.post(`${API}/register`, {
        name: firstName,
        surname,
        mobile: phoneNumber,
        password: "testpass123", // You can change logic or generate randomly
      });

      const { username } = res.data;
      console.log("User registered with username:", username);

      // Now trigger Razorpay Payment
      const order = await axios.post(`${API}/create-order`, {
        amount: 1000,
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: order.data.amount,
        currency: "INR",
        name: "Sandhan Academy",
        description: "Course Enrollment",
        order_id: order.data.id,
        handler: async function (response) {
          // Payment success
          await axios.post(`${API}/payment-success`, {
            userId: username,
            amount: 1000,
            paymentId: response.razorpay_payment_id,
            receiptUrl: order.data.receipt,
          });

          alert("Payment successful! Receipt will be sent.");
        },
        prefill: {
          name: `${firstName} ${surname}`,
          contact: phoneNumber,
        },
        theme: {
          color: "#163233",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Registration or payment failed");
    }
  };

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
                        {course.fees}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              disabled
              onClick={() => setShowEnrollmentForm(true)}
              className="mt-8 px-8 py-3 rounded-lg font-medium text-lg transition-all hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: "#f9dc41", color: "#163233" }}
            >
              Contact now
            </button>
          </div>
        </div>
      </div>

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
                    {course.fees}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname *
                  </label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your surname"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>

                {otpSent && !isVerified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter OTP *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        required
                      />
                      <button
                        onClick={handleVerifyOTP}
                        disabled={isVerifying}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEnrollmentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  {formData.firstName &&
                    formData.phoneNumber &&
                    course?.title && (
                      <RazorpayButton
                        name={formData.firstName}
                        mobile={formData.phoneNumber}
                        course={course.title}
                      />
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
