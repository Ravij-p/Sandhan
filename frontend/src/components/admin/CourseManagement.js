import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  Video,
  Settings,
} from "lucide-react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: "",
    category: "gpsc",
    duration: "12 months",
    features: [],
  });
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    duration: "",
    order: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [courseVideos, setCourseVideos] = useState({});
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  // Cloudinary Upload State for materials (video/pdf)
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialFile, setMaterialFile] = useState(null);
  const [materialType, setMaterialType] = useState("video");
  const [materialUploading, setMaterialUploading] = useState(false);
  const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  // Notification system
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  }, []);

  const uploadToCloudinary = async (file, resourceType) => {
    try {
      setMaterialUploading(true);
      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data?.error?.message || "Upload failed");
      return data.secure_url;
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedCourse) return;
    if (!materialTitle || !materialFile) {
      showNotification("Title and file are required", "error");
      return;
    }
    try {
      const url = await uploadToCloudinary(materialFile, materialType === "pdf" ? "raw" : "video");
      if (!url) return;
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/courses/${selectedCourse._id}/materials`, {
        title: materialTitle,
        fileUrl: url,
        fileType: materialType,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification("Material added", "success");
      setMaterialTitle("");
      setMaterialFile(null);
      setMaterialType("video");
      // refresh list
      fetchCourses(true);
    } catch (e) {
      console.error(e);
      showNotification("Failed to add material", "error");
    }
  };

  const fetchCourses = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
  }, [API_BASE_URL, showNotification]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/courses`, newCourse, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setCourses([...courses, response.data.course]);
        setShowCreateModal(false);
        setNewCourse({
          title: "",
          description: "",
          price: "",
          category: "gpsc",
          duration: "12 months",
          features: [],
        });
        showNotification("Course created successfully!", "success");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      showNotification("Failed to create course", "error");
    }
  };

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

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/courses/${selectedCourse._id}/videos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            'Authorization': `Bearer ${token}`
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

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    setDeletingCourse(courseId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  const fetchCourseVideos = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/admin/courses/${courseId}/videos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  const handleViewVideos = async (course) => {
    setSelectedCourse(course);
    await fetchCourseVideos(course._id);
    setShowVideosModal(true);
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
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
          <p className="mt-6 text-lg font-medium text-gray-900">Loading courses...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your course data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${notification.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
            }`}>
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: "", type: "success" })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Course Management
            </h2>
            <p className="text-gray-600">Manage your courses and video content</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Add Course</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="w-16 h-16 text-white opacity-80" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full px-3 py-1">
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{course.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {course.category.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {course.videoCount || 0} videos
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-1" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-1" />
                    <span>50 students</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewVideos(course)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <Play size={16} />
                    <span>View Videos</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowVideoModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Upload size={16} />
                    <span>Add Video</span>
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    disabled={deletingCourse === course._id}
                    className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingCourse === course._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Create New Course
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, title: e.target.value })
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
                      value={newCourse.description}
                      onChange={(e) =>
                        setNewCourse({
                          ...newCourse,
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
                        value={newCourse.price}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, price: e.target.value })
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
                        value={newCourse.category}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, category: e.target.value })
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
                      value={newCourse.duration}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, duration: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 12 months"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Create Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Videos in {selectedCourse.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Manage videos for this course
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setShowVideosModal(false);
                        setShowVideoModal(true);
                      }}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <Upload size={16} />
                      <span>Add Video</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowVideosModal(false);
                        setSelectedCourse(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Videos List */}
                <div className="space-y-4">
                  {courseVideos[selectedCourse._id]?.length > 0 ? (
                    <div className="grid gap-4">
                      {courseVideos[selectedCourse._id].map((video, index) => (
                        <div
                          key={video._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {video.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {video.description || "No description"}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  Order: {video.order || 0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Duration:{" "}
                                  {video.duration
                                    ? `${Math.floor(video.duration / 60)}:${(
                                      video.duration % 60
                                    )
                                      .toString()
                                      .padStart(2, "0")}`
                                    : "N/A"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Created:{" "}
                                  {new Date(video.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // You can implement edit video functionality here
                                console.log("Edit video:", video);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                              title="Edit Video"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteVideo(selectedCourse._id, video._id)
                              }
                              disabled={deletingVideo === video._id}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg disabled:opacity-50"
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
                    <div className="text-center py-8">
                      <Play className="mx-auto text-gray-400 w-12 h-12 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No videos found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        This course doesn't have any videos yet.
                      </p>
                      <button
                        onClick={() => {
                          setShowVideosModal(false);
                          setShowVideoModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add First Video
                      </button>
                    </div>
                  )}
                </div>

                {/* Materials (Video/PDF via Cloudinary) */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Materials (Video/PDF)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="e.g., Lecture 1 PDF"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                      <input
                        type="file"
                        accept={materialType === 'pdf' ? 'application/pdf' : 'video/*'}
                        onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={materialType}
                        onChange={(e) => setMaterialType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={handleAddMaterial}
                      disabled={materialUploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      style={{ cursor: 'pointer' }}
                    >
                      {materialUploading ? 'Uploading...' : 'Add Material'}
                    </button>
                    <p className="text-xs text-gray-500">Uploads use Cloudinary; URLs are stored in course materials.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      );
};

      export default CourseManagement;
