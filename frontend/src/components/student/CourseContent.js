import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Play, Clock, ArrowLeft, BookOpen } from "lucide-react";
import axios from "axios";

const CourseContent = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent, isAdmin } = useAuth();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchedProgress, setWatchedProgress] = useState({});

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    fetchCourseContent();
  }, [courseId, isAuthenticated, navigate]);

  const fetchCourseContent = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/videos`,
        { headers }
      );
      setCourse(response.data.course);
      setVideos(response.data.videos);

      if (response.data.videos.length > 0) {
        setSelectedVideo(response.data.videos[0]);
      }

      // Fetch watched progress (if student)
      if (isStudent) {
        const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers,
        });
        const progressMap = profileRes.data?.user?.watchedProgress || {};
        const obj = Object.fromEntries(
          Array.from(
            progressMap instanceof Map
              ? progressMap.entries()
              : Object.entries(progressMap)
          )
        );
        setWatchedProgress(obj);
      }
    } catch (error) {
      console.error("Error fetching course content:", error);
      if (error.response?.status === 403) {
        setError(
          "You need to be enrolled in this course to access the videos."
        );
      } else {
        setError("Failed to load course content");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {course?.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {course?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {selectedVideo ? (
                <div>
                  <div className="aspect-video bg-black">
                    <video
                      key={selectedVideo._id}
                      controls
                      className="w-full h-full"
                      poster={selectedVideo.thumbnail}
                    >
                      <source src={selectedVideo.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {selectedVideo.title}
                    </h2>
                    {selectedVideo.description && (
                      <p className="text-sm sm:text-base text-gray-600">
                        {selectedVideo.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="mx-auto text-gray-400 mb-4 w-12 h-12 sm:w-12 sm:h-12" />
                    <p className="text-sm sm:text-base text-gray-600">
                      Select a video to start watching
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Course Videos
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {videos.length} videos
                </p>
              </div>
              <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                {videos.map((video, index) => (
                  <div
                    key={video._id}
                    onClick={() => setSelectedVideo(video)}
                    className={`p-3 sm:p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedVideo?._id === video._id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-6 sm:w-12 sm:h-8 bg-gray-200 rounded flex items-center justify-center">
                          <Play
                            size={12}
                            className="text-gray-600 sm:w-4 sm:h-4"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {index + 1}. {video.title}
                        </h4>
                        {video.duration > 0 && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={10} className="mr-1 sm:w-3 sm:h-3" />
                            {formatDuration(video.duration)}
                          </div>
                        )}
                        {watchedProgress[video._id] !== undefined &&
                          video.duration > 0 && (
                            <div className="mt-2 w-full bg-gray-200 rounded h-1">
                              <div
                                className="bg-red-500 h-1 rounded"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (watchedProgress[video._id] /
                                      video.duration) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
