import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  BookOpen,
  Play,
  Users,
  DollarSign,
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  Video,
  Settings,
  FileText,
} from "lucide-react";
import axios from "axios";

const AdminCoursePage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseVideos, setCourseVideos] = useState({});
  const [courseMaterials, setCourseMaterials] = useState({});
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    duration: "",
    order: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "gpsc",
    duration: "",
    features: [],
  });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    description: "",
    order: 0,
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
  const [dashboardStats, setDashboardStats] = useState({ totalStudents: 0, totalRevenue: 0 });
  const [courseEnrollment, setCourseEnrollment] = useState({});
  const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);

  // Notification system
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  }, []);

  const fetchCourses = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/admin/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCourses(response.data.courses);
        setError("");
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError("Failed to load courses");
        showNotification("Failed to load courses", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API_BASE_URL, showNotification]
  );

  useEffect(() => {
    fetchCourses();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const s = res.data.stats || {};
        setDashboardStats({
          totalStudents: s.totalStudents || 0,
          totalRevenue: s.totalRevenue || 0,
        });
      } catch (e) {}
    })();
  }, [fetchCourses, API_BASE_URL]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem("token");
        const results = await Promise.all(
          courses.map((c) =>
            axios.get(`${API_BASE_URL}/admin/courses/${c._id}/enrollment-count`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        const map = {};
        courses.forEach((c, i) => {
          map[c._id] = results[i]?.data?.enrollmentCount || 0;
        });
        setCourseEnrollment(map);
      } catch (e) {}
    };
    if (courses.length) fetchEnrollments();
  }, [courses, API_BASE_URL]);

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!videoFile || !selectedCourse) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("title", newVideo.title);
      formData.append("description", newVideo.description);
      formData.append("duration", newVideo.duration);
      formData.append("order", newVideo.order);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/courses/${selectedCourse._id}/videos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Video uploaded successfully!", "success");
        setShowVideoModal(false);
        setNewVideo({ title: "", description: "", duration: "", order: "" });
        setVideoFile(null);
        setSelectedCourse(null);
        fetchCourses(true); // Refresh to get updated video count
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      showNotification("Failed to upload video", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (courseId, materialId) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_BASE_URL}/courses/${courseId}/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        await fetchCourseMaterials(courseId);
        showNotification("Material deleted", "success");
      }
    } catch (error) {
      showNotification("Failed to delete material", "error");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    )
      return;

    setDeletingCourse(courseId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setCourses(courses.filter((course) => course._id !== courseId));
        showNotification("Course deleted successfully!", "success");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      showNotification("Failed to delete course", "error");
    } finally {
      setDeletingCourse(null);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      category: course.category,
      duration: course.duration || "",
      features: course.features || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/courses/${editingCourse._id}`,
        {
          ...editForm,
          price: parseFloat(editForm.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Course updated successfully!", "success");
        setShowEditModal(false);
        setEditingCourse(null);
        fetchCourses(true); // Refresh courses
      }
    } catch (error) {
      console.error("Error updating course:", error);
      showNotification("Failed to update course", "error");
    }
  };

  const fetchCourseVideos = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/admin/courses/${courseId}/videos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseVideos((prev) => ({
        ...prev,
        [courseId]: response.data.videos,
      }));
    } catch (error) {
      console.error("Error fetching course videos:", error);
    }
  };

  const fetchCourseMaterials = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/documents/courses/${courseId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourseMaterials((prev) => ({
        ...prev,
        [courseId]: res.data.materials || [],
      }));
    } catch (error) {
      console.error("Error fetching course materials:", error);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !documentFile) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("title", documentForm.title);
      formData.append("description", documentForm.description);
      formData.append("order", documentForm.order.toString());

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/documents/courses/${selectedCourse._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification("Document uploaded successfully!");
        setShowDocumentModal(false);
        setDocumentForm({ title: "", description: "", order: 0 });
        setDocumentFile(null);
        await fetchCourseMaterials(selectedCourse._id);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      showNotification(
        error.response?.data?.error || "Failed to upload document",
        "error"
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleViewVideos = async (course) => {
    setSelectedCourse(course);
    await fetchCourseVideos(course._id);
    setShowVideosModal(true);
  };

  const handleViewMaterials = async (course) => {
    setSelectedCourse(course);
    await fetchCourseMaterials(course._id);
    setShowMaterialsModal(true);
  };

  const handleDeleteVideo = async (courseId, videoId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingVideo(videoId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        // Update the course videos state
        setCourseVideos((prev) => ({
          ...prev,
          [courseId]:
            prev[courseId]?.filter((video) => video._id !== videoId) || [],
        }));
        // Refresh courses to update video count
        fetchCourses(true);
        showNotification("Video deleted successfully!", "success");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      showNotification("Failed to delete video", "error");
    } finally {
      setDeletingVideo(null);
    }
  };

  // Performance optimization with useMemo
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || course.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort courses
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "videoCount":
          aValue = a.videoCount || 0;
          bValue = b.videoCount || 0;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [courses, searchTerm, filterCategory, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-900">
            Loading courses...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we fetch your course data
          </p>
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
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() =>
                setNotification({ show: false, message: "", type: "success" })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Course Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your courses and video content
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchCourses(true)}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                title="Refresh"
              >
                <RefreshCw
                  size={20}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/admin/courses/new")}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                title="Add Course"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  <option value="gpsc">GPSC</option>
                  <option value="upsc">UPSC</option>
                  <option value="ssc">SSC</option>
                  <option value="neet11">NEET 11</option>
                  <option value="neet12">NEET 12</option>
                  <option value="talati">TALATI</option>
                  <option value="ethics">ETHICS</option>
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="videoCount-desc">Most Videos</option>
                  <option value="videoCount-asc">Least Videos</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Filter size={16} />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedCourses.length} of {courses.length}{" "}
              courses
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <X size={14} />
                <span>Clear search</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Courses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <Play className="text-white w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Videos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce(
                    (total, course) => total + (course.videoCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                <Users className="text-white w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.totalStudents}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <DollarSign className="text-white w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatINR(dashboardStats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Courses</h2>
          </div>

          {filteredAndSortedCourses.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto text-gray-400 w-12 h-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first course"}
              </p>
              {!searchTerm && filterCategory === "all" && (
                <button
                  onClick={() => navigate("/admin/courses/new")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Course
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      <Play className="inline w-4 h-4" title="Videos" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      <Users className="inline w-4 h-4" title="Students" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedCourses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {course.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {course.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {course.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{course.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.videoCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {courseEnrollment[course._id] || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewVideos(course)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Videos"
                          >
                            <Play size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowVideoModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Add Video"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            onClick={() => handleViewMaterials(course)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Materials"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Course"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/course/${course._id}`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Course"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            disabled={deletingCourse === course._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Course"
                          >
                            {deletingCourse === course._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Video Modal */}
      {showVideoModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Upload Video to {selectedCourse.title}
                </h2>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setSelectedCourse(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUploadVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video File *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 500MB. Supported formats: MP4, WebM, AVI,
                    MOV
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) =>
                      setNewVideo({ ...newVideo, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newVideo.description}
                    onChange={(e) =>
                      setNewVideo({ ...newVideo, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={newVideo.duration}
                      onChange={(e) =>
                        setNewVideo({ ...newVideo, duration: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={newVideo.order}
                      onChange={(e) =>
                        setNewVideo({ ...newVideo, order: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoModal(false);
                      setSelectedCourse(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Video"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Videos Management Modal */}
      {showVideosModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Videos in {selectedCourse.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage videos for this course •{" "}
                    {courseVideos[selectedCourse._id]?.length || 0} videos
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowVideosModal(false);
                      setShowVideoModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Upload size={16} />
                    <span>Add Video</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowVideosModal(false);
                      setSelectedCourse(null);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Videos List */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {courseVideos[selectedCourse._id]?.length > 0 ? (
                <div className="space-y-4">
                  {courseVideos[selectedCourse._id].map((video, index) => (
                    <div
                      key={video._id}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Play className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {video.description || "No description provided"}
                          </p>
                          <div className="flex items-center space-x-6 mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Settings className="w-3 h-3 mr-1" />
                              <span>Order: {video.order || 0}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {video.duration
                                  ? `${Math.floor(video.duration / 60)}:${(
                                      video.duration % 60
                                    )
                                      .toString()
                                      .padStart(2, "0")}`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // You can implement edit video functionality here
                            console.log("Edit video:", video);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit Video"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteVideo(selectedCourse._id, video._id)
                          }
                          disabled={deletingVideo === video._id}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Delete Video"
                        >
                          {deletingVideo === video._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No videos found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This course doesn't have any videos yet. Start building your
                    course content by adding your first video.
                  </p>
                  <button
                    onClick={() => {
                      setShowVideosModal(false);
                      setShowVideoModal(true);
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Upload size={20} />
                    <span>Add First Video</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Management Modal */}
      {showMaterialsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Materials in {selectedCourse.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage materials • {(courseMaterials[selectedCourse._id]||[]).length} items</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg"
                  >
                    <Upload size={16} />
                    <span>Add Material</span>
                  </button>
                  <button
                    onClick={() => { setShowMaterialsModal(false); setSelectedCourse(null); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {(courseMaterials[selectedCourse._id]||[]).length > 0 ? (
                <div className="space-y-4">
                  {courseMaterials[selectedCourse._id].map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <div className="font-semibold text-gray-900">{m.title || m.originalName}</div>
                        <div className="text-sm text-gray-500">{m.mimeType}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteMaterial(selectedCourse._id, m._id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No materials found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">Upload PDF, DOCX, ZIP, PPT files as course resources.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showDocumentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Material to {selectedCourse.title}</h2>
                <button onClick={() => { setShowDocumentModal(false); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <form onSubmit={handleDocumentUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                  <input type="file" accept=".pdf,.doc,.docx,.zip,.ppt,.pptx" onChange={(e) => setDocumentFile(e.target.files[0])} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                  <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOC/DOCX, ZIP, PPT/PPTX</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={documentForm.description} onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input type="number" value={documentForm.order} onChange={(e) => setDocumentForm({ ...documentForm, order: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowDocumentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Cancel</button>
                  <button type="submit" disabled={uploadingDocument} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{uploadingDocument ? "Uploading..." : "Upload"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Course</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCourse(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="gpsc">GPSC</option>
                      <option value="upsc">UPSC</option>
                      <option value="ssc">SSC</option>
                      <option value="neet11">NEET 11</option>
                      <option value="neet12">NEET 12</option>
                      <option value="talati">TALATI</option>
                      <option value="ethics">ETHICS</option>
                    </select>
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12 months"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCourse(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Update Course
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

export default AdminCoursePage;
