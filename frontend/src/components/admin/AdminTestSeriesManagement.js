import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const AdminTestSeriesManagement = () => {
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestSeries, setEditingTestSeries] = useState(null);
  const [deletingTestSeries, setDeletingTestSeries] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const [newTestSeries, setNewTestSeries] = useState({
    title: "",
    description: "",
    price: "",
    category: "gpsc",
    duration: "3 months",
    numberOfTests: "",
    features: [],
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "gpsc",
    duration: "3 months",
    numberOfTests: "",
    features: [],
  });

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const fetchTestSeries = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/test-series/admin/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTestSeries(response.data.testSeries);
        setError("");
      } catch (error) {
        console.error("Error fetching test series:", error);
        setError("Failed to load test series");
        showNotification("Failed to load test series", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API_BASE_URL]
  );

  useEffect(() => {
    fetchTestSeries();
  }, [fetchTestSeries]);

  const handleCreateTestSeries = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/test-series`,
        {
          ...newTestSeries,
          price: parseFloat(newTestSeries.price),
          numberOfTests: parseInt(newTestSeries.numberOfTests),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Test series created successfully!");
        setShowCreateModal(false);
        setNewTestSeries({
          title: "",
          description: "",
          price: "",
          category: "gpsc",
          duration: "3 months",
          numberOfTests: "",
          features: [],
        });
        fetchTestSeries();
      }
    } catch (error) {
      console.error("Error creating test series:", error);
      showNotification(
        error.response?.data?.error || "Failed to create test series",
        "error"
      );
    }
  };

  const handleEditTestSeries = (testSeries) => {
    setEditingTestSeries(testSeries);
    setEditForm({
      title: testSeries.title,
      description: testSeries.description,
      price: testSeries.price.toString(),
      category: testSeries.category,
      duration: testSeries.duration,
      numberOfTests: testSeries.numberOfTests.toString(),
      features: testSeries.features || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateTestSeries = async (e) => {
    e.preventDefault();
    if (!editingTestSeries) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/test-series/${editingTestSeries._id}`,
        {
          ...editForm,
          price: parseFloat(editForm.price),
          numberOfTests: parseInt(editForm.numberOfTests),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Test series updated successfully!");
        setShowEditModal(false);
        setEditingTestSeries(null);
        fetchTestSeries();
      }
    } catch (error) {
      console.error("Error updating test series:", error);
      showNotification(
        error.response?.data?.error || "Failed to update test series",
        "error"
      );
    }
  };

  const handleDeleteTestSeries = async (testSeriesId) => {
    if (!window.confirm("Are you sure you want to delete this test series?")) {
      return;
    }

    setDeletingTestSeries(testSeriesId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${API_BASE_URL}/test-series/${testSeriesId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Test series deleted successfully!");
        fetchTestSeries();
      }
    } catch (error) {
      console.error("Error deleting test series:", error);
      showNotification(
        error.response?.data?.error || "Failed to delete test series",
        "error"
      );
    } finally {
      setDeletingTestSeries(null);
    }
  };

  const addFeature = (formData, setFormData) => {
    const feature = prompt("Enter feature:");
    if (feature && feature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, feature.trim()],
      });
    }
  };

  const removeFeature = (index, formData, setFormData) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const categories = [
    { value: "gpsc", label: "GPSC - Gujarat Public Service Commission" },
    { value: "upsc", label: "UPSC - Union Public Service Commission" },
    { value: "neet", label: "NEET - National Eligibility cum Entrance Test" },
    { value: "banking", label: "Banking - Banking Exams" },
    { value: "railway", label: "Railway - Railway Exams" },
    { value: "ssc", label: "SSC - Staff Selection Commission" },
    { value: "talati", label: "TALATI - Talati cum Mantri" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test series...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex-1">
              <p className="font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() =>
                setNotification({ show: false, message: "", type: "success" })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Test Series Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage test series and mock tests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchTestSeries(true)}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-[#163233] rounded-lg hover:bg-yellow-500 font-medium"
              >
                <Plus size={16} />
                <span>Add Test Series</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Test Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testSeries.map((series) => (
            <div
              key={series._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {series.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {series.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditTestSeries(series)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTestSeries(series._id)}
                      disabled={deletingTestSeries === series._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen size={16} />
                    <span>{series.numberOfTests} Tests</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{series.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign size={16} />
                    <span className="font-semibold text-green-600">
                      ₹{series.price}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {series.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {series.features && series.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {series.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                      {series.features.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                          +{series.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created: {new Date(series.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full ${
                        series.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {series.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {testSeries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 w-12 h-12" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No test series found
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating your first test series.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-yellow-400 text-[#163233] rounded-lg hover:bg-yellow-500 font-medium"
            >
              Create Test Series
            </button>
          </div>
        )}
      </div>

      {/* Create Test Series Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create Test Series
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTestSeries} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestSeries.title}
                    onChange={(e) =>
                      setNewTestSeries({
                        ...newTestSeries,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Enter test series title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newTestSeries.description}
                    onChange={(e) =>
                      setNewTestSeries({
                        ...newTestSeries,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Enter test series description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newTestSeries.price}
                      onChange={(e) =>
                        setNewTestSeries({
                          ...newTestSeries,
                          price: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Tests *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTestSeries.numberOfTests}
                      onChange={(e) =>
                        setNewTestSeries({
                          ...newTestSeries,
                          numberOfTests: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={newTestSeries.category}
                      onChange={(e) =>
                        setNewTestSeries({
                          ...newTestSeries,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newTestSeries.duration}
                      onChange={(e) =>
                        setNewTestSeries({
                          ...newTestSeries,
                          duration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="3 months"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {newTestSeries.features.map((feature, index) => (
                        <span
                          key={index}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() =>
                              removeFeature(
                                index,
                                newTestSeries,
                                setNewTestSeries
                              )
                            }
                            className="text-blue-500 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        addFeature(newTestSeries, setNewTestSeries)
                      }
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-yellow-400 text-[#163233] rounded-lg hover:bg-yellow-500 font-medium"
                  >
                    Create Test Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Series Modal */}
      {showEditModal && editingTestSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Test Series
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTestSeries(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateTestSeries} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Tests *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.numberOfTests}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          numberOfTests: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editForm.duration}
                      onChange={(e) =>
                        setEditForm({ ...editForm, duration: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {editForm.features.map((feature, index) => (
                        <span
                          key={index}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() =>
                              removeFeature(index, editForm, setEditForm)
                            }
                            className="text-blue-500 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addFeature(editForm, setEditForm)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTestSeries(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-yellow-400 text-[#163233] rounded-lg hover:bg-yellow-500 font-medium"
                  >
                    Update Test Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestSeriesManagement;
