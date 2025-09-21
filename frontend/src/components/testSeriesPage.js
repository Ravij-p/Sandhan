import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, ShoppingCart, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export const TestSeriesPage = () => {
  const { isAuthenticated, isStudent } = useAuth();
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const fetchTestSeries = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/test-series`);
      if (response.data.success) {
        setTestSeries(response.data.testSeries);
      } else {
        setError("Failed to load test series");
      }
    } catch (error) {
      console.error("Error fetching test series:", error);
      setError("Failed to load test series");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchTestSeries();
  }, [fetchTestSeries]);

  const handlePurchase = async (testSeriesId) => {
    if (!isAuthenticated || !isStudent) {
      alert("Please login as a student to purchase test series");
      return;
    }

    setPurchasing(testSeriesId);
    try {
      const token = localStorage.getItem("token");

      // Create payment order
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payments/test-series/create-order`,
        { testSeriesId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (orderResponse.data.success) {
        const { orderId, amount, key, testSeries } = orderResponse.data;

        // Initialize Razorpay
        const options = {
          key: key,
          amount: amount,
          currency: "INR",
          name: "Sandhan Academy",
          description: `Test Series: ${testSeries.title}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              // Verify payment
              const verifyResponse = await axios.post(
                `${API_BASE_URL}/payments/test-series/verify-payment`,
                {
                  ...response,
                  testSeriesId: testSeriesId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (verifyResponse.data.success) {
                alert("✅ Test series purchased successfully!");
                // Refresh test series to show updated status
                fetchTestSeries();
              } else {
                alert("❌ Payment verification failed");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              alert("❌ Payment verification failed");
            }
          },
          prefill: {
            name: "Student",
            email: "student@example.com",
            contact: "9999999999",
          },
          notes: {
            address: "Test Series Purchase",
          },
          theme: {
            color: "#163233",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("❌ Failed to initiate purchase. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 sm:pt-28 md:pt-24 lg:pt-20">
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
    <div className="pt-32 sm:pt-28 md:pt-24 lg:pt-20">
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
    </div>
  );
};
