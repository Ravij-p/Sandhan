import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, ShoppingCart, CheckCircle, X } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { QRCodeCanvas } from "qrcode.react";

export const TestSeriesPage = () => {
  const { isAuthenticated, isStudent, user } = useAuth();
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState(null);
  const [qrCodeValue, setQrCodeValue] = useState(null); // store UPI QR link

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

  const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);

  // Handle purchase click
  const handlePurchase = async (testSeriesId) => {
    if (!isAuthenticated || !isStudent) {
      alert("Please login as a student to purchase test series");
      return;
    }

    setPurchasing(testSeriesId);

    try {
      const token = localStorage.getItem("token");
      const series = testSeries.find((t) => t._id === testSeriesId);
      const amount = series?.price || 0;

      // Save purchase intent in backend
      await axios.post(
        `${API_BASE_URL}/purchase`,
        {
          testSeriesId,
          email: user?.email,
          amount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Prepare UPI link
      const pa = process.env.REACT_APP_UPI_VPA || "xyz@xyz";
      const pn = process.env.REACT_APP_UPI_NAME || "Tushti IAS";
      const params = new URLSearchParams({
        pa,
        pn,
        am: String(amount),
        cu: "INR",
        tn: `Test Series ${series?.title || "Payment"}`,
      });
      const upiUrl = `upi://pay?${params.toString()}`;

      if (isMobile()) {
        // Mobile → open UPI app
        window.location.href = upiUrl;
      } else {
        // Desktop → show QR code
        setQrCodeValue(upiUrl);
      }

      alert(
        "After payment, please contact support with your UTR for test series access."
      );
    } catch (err) {
      console.error("Purchase error:", err);
      alert("❌ Failed to initiate purchase. Please try again.");
    } finally {
      setPurchasing(null);
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
                    onClick={() => handlePurchase(series._id)}
                    disabled={purchasing === series._id}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {purchasing === series._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Purchase Now</span>
                      </>
                    )}
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

      {/* QR Code Modal for Desktop */}
      {qrCodeValue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setQrCodeValue(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Scan to Pay</h2>
            <QRCodeCanvas value={qrCodeValue} size={200} />
            <p className="text-sm text-gray-600 mt-3 text-center">
              Scan with any UPI app to complete payment
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
