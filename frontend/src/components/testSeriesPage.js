import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, ShoppingCart, CheckCircle, X } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";

export const TestSeriesPage = () => {
  const { user } = useAuth();
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment States
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [upiUrl] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [priceDetails, setPriceDetails] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpaySuccess, setRazorpaySuccess] = useState(false);
  const [razorpayError, setRazorpayError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  // Fetch test series
  const fetchTestSeries = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/test-series`);
      if (response.data.success) {
        setTestSeries(response.data.testSeries);
      } else {
        setError("Failed to load test series");
      }
    } catch (err) {
      console.error("Error fetching test series:", err);
      setError("Failed to load test series");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchTestSeries();
  }, [fetchTestSeries]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setBuyerName(user.name || "");
      setBuyerEmail(user.email || "");
      setBuyerPhone(user.phone || "");
    }
  }, [user]);

  const handleBuyClick = (series) => {
    setSelectedSeries(series);
    setPriceDetails(null);
    setRazorpaySuccess(false);
    setRazorpayError("");
    setShowEnrollmentModal(true);
  };

  if (loading) {
    return (
      <div className="pt-40 sm:pt-36 md:pt-32 lg:pt-28">
        <div className="py-20" style={{ backgroundColor: "#fafaee" }}>
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test series...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 sm:pt-36 md:pt-32 lg:pt-28">
      <div className="py-20" style={{ backgroundColor: "#fafaee" }}>
        <div className="container mx-auto px-4">
          <h1
            className="text-3xl md:text-4xl font-bold text-center mb-4"
            style={{ color: "#163233" }}
          >
            Test Series & Mock Tests
          </h1>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Practice with our comprehensive test series designed to help you
            excel in your exams. Get access to multiple mock tests with detailed
            analysis.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testSeries.map((series) => (
              <div
                key={series._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {series.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {series.description}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Number of Tests</span>
                    <span className="font-semibold text-gray-900">
                      {series.numberOfTests}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {series.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                      {series.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {series.features && series.features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Features:
                    </h4>
                    <ul className="space-y-1">
                      {series.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {series.features.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{series.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{series.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        One-time payment
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyClick(series)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {testSeries.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-gray-400 w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Test Series Available
              </h3>
              <p className="text-gray-600">
                Check back later for new test series and mock tests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enrollment/Payment Modal */}
      {showEnrollmentModal && selectedSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Purchase Test Series
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
                    <span className="text-gray-600">Test Series</span>
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {selectedSeries.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{selectedSeries.price}
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
                  <label className="block text-xs text-gray-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Email ID
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="10-digit phone number"
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              </div>

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
                        `${API_BASE_URL}/payments/public/test-series/create-order`,
                        {
                          testSeriesId: selectedSeries._id,
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
                        testSeries,
                      } = response.data;

                      const details = breakdown || {
                        baseAmount: testSeries.price,
                        serviceCharge: amount - testSeries.price,
                        totalAmount: amount,
                      };

                      setPriceDetails(details);

                      const options = {
                        key,
                        amount: amountInPaise,
                        currency,
                        name: "Tushti IAS",
                        description: testSeries.title,
                        order_id: orderId,
                        handler: async function (rzpResponse) {
                          try {
                            const verifyRes = await axios.post(
                              `${API_BASE_URL}/payments/public/test-series/verify-payment`,
                              {
                                razorpay_order_id:
                                  rzpResponse.razorpay_order_id,
                                razorpay_payment_id:
                                  rzpResponse.razorpay_payment_id,
                                razorpay_signature:
                                  rzpResponse.razorpay_signature,
                                testSeriesId: testSeries.id,
                                email: buyerEmail,
                                name: buyerName,
                                mobile: buyerPhone,
                              }
                            );

                            if (verifyRes.data.success) {
                              setRazorpaySuccess(true);
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
                  Use a unique email. For further payments, use the same email.
                </p>
                <p className="text-xs text-gray-600 text-center">
                  After any successful payment, you will receive your
                  credentials within 24 hours. If not, please call the number
                  shown on the home screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-sm text-gray-600 mt-3 text-center">
              Scan with any UPI app (GPay, PhonePe, Paytm) to complete payment.
            </p>
            <p className="text-xs text-gray-500 mt-2 text-center">
              After payment, please allow some time for verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
