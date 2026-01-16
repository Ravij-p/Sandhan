import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  ShoppingCart,
  CheckCircle,
  X,
  Smartphone,
  Apple,
} from "lucide-react";
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
  const [receipt, setReceipt] = useState(null);
  const [showPayLoader, setShowPayLoader] = useState(false);
  const [upiUrl, setUpiUrl] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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

  const handleBuyClick = (series) => {
    setSelectedSeries(series);
    setReceipt(null);
    setShowEnrollmentModal(true);
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
      // Use the updated endpoint that handles testSeriesId
      const res = await axios.post(
        `${API_BASE_URL}/upi-payments/initiate-public`,
        {
          testSeriesId: selectedSeries._id,
          email: buyerEmail,
          phone: buyerPhone,
          name: buyerName,
        }
      );

      if (res.data.success) {
        const pa = process.env.UPI_VPA || "7600837122@hdfcbank";
        const pn = "Tushti IAS";
        const tn = `Payment for ${selectedSeries.title} - ${buyerEmail}`;
        const params = buildUpiParams({ pa, pn, am: selectedSeries.price, tn });
        const os = detectOS();
        const upiGeneric = `upi://pay?${params}`;

        setUpiUrl(upiGeneric);
        setToastMsg(
          "After paying, your login credentials will be emailed to you. Please check your email."
        );
        setTimeout(() => setToastMsg(""), 6000);
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
          item: selectedSeries.title,
          amount: selectedSeries.price,
          status: "pending",
        });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to initiate UPI payment");
    }
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
          testSeriesId: selectedSeries._id,
          email: buyerEmail,
          phone: buyerPhone,
          name: buyerName,
        }
      );

      if (res.data.success) {
        const pa = process.env.UPI_VPA || "7600837122@hdfcbank";
        const pn = "Tushti IAS";
        const tn = `Payment for ${selectedSeries.title} - ${buyerEmail}`;
        const params = buildUpiParams({ pa, pn, am: selectedSeries.price, tn });
        setUpiUrl(`upi://pay?${params}`);
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
          item: selectedSeries.title,
          amount: selectedSeries.price,
          status: "pending",
        });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to initiate UPI payment");
    }
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

              {!receipt ? (
                <div className="space-y-4">
                  {(() => {
                    const os = detectOS();
                    if (os === "ios") {
                      return (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            Please select an app you have installed.
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              onClick={() => openSpecificUpi("gpay://")}
                              disabled={showPayLoader}
                              className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Apple size={16} /> GPay
                            </button>
                            <button
                              onClick={() => openSpecificUpi("phonepe://")}
                              disabled={showPayLoader}
                              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Smartphone size={16} /> PhonePe
                            </button>
                            <button
                              onClick={() => openSpecificUpi("paytmmp://")}
                              disabled={showPayLoader}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Smartphone size={16} /> Paytm
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={handleInitiateUpi}
                        disabled={showPayLoader}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {showPayLoader ? "Processing…" : "Pay Now"}
                      </button>
                    );
                  })()}

                  <p className="text-xs text-gray-600 text-center">
                    Secure payment powered by UPI
                  </p>

                  {toastMsg && (
                    <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2">
                      {toastMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Your payment is under verification. Within 24 hours,
                      you’ll get access.
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
                      <span className="text-gray-600">Item:</span>
                      <span className="font-medium">{receipt.item}</span>
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
