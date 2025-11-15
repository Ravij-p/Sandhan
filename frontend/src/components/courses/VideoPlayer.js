import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Clock,
  BookOpen,
  Lock,
} from "lucide-react";
import axios from "axios";

const VideoPlayer = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent, isAdmin } = useAuth();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumeTime, setResumeTime] = useState(0);
  const lastSavedRef = useRef(0);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    checkEnrollment();
  }, [courseId, isAuthenticated, isStudent, isAdmin, navigate]);

  useEffect(() => {
    if (isEnrolled && videoId) {
      fetchVideoDetails();
    }
  }, [isEnrolled, videoId]);

  const checkEnrollment = async () => {
    try {
      if (isAdmin) {
        setIsEnrolled(true);
        await fetchCourseVideos();
        if (videoId) await fetchVideoDetails();
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/payments/enrollments`);
      const enrollments = response.data.enrollments;
      const enrolled = enrollments.some(
        (enrollment) => enrollment.course?._id === courseId
      );
      setIsEnrolled(enrolled);

      if (enrolled) {
        fetchCourseVideos();
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
      setError("Failed to verify enrollment");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseVideos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/videos`,
        { headers }
      );
      setCourse(response.data.course);
      setVideos(response.data.videos);
    } catch (error) {
      console.error("Error fetching course videos:", error);
      setError("Failed to load course videos");
    }
  };

  const fetchVideoDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/videos/${videoId}`,
        { headers }
      );
      setCurrentVideo(response.data.video);
      setVideoUrl(response.data.video?.videoUrl);

      if (isStudent) {
        const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
        const progress = profileRes.data?.user?.watchedProgress || {};
        const resume = progress[videoId] || 0;
        setResumeTime(resume);
      }
    } catch (error) {
      console.error("Error fetching video details:", error);
      setError("Failed to load video");
    }
  };

  const handleVideoSelect = (video) => {
    navigate(`/course/${courseId}/video/${video._id}`);
  };

  const togglePlayPause = () => {
    const video = document.getElementById("video-player");
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.getElementById("video-player");
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = async () => {
    const video = document.getElementById("video-player");
    if (video) {
      setCurrentTime(video.currentTime);
      const now = Date.now();
      if (isStudent && now - lastSavedRef.current > 5000) {
        lastSavedRef.current = now;
        try {
          const token = localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.patch(
            `${API_BASE_URL}/courses/${courseId}/videos/${videoId}/progress`,
            { timestamp: Math.floor(video.currentTime) },
            { headers }
          );
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = document.getElementById("video-player");
    if (video) {
      setDuration(video.duration);
      if (resumeTime && resumeTime < video.duration) {
        video.currentTime = resumeTime;
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Course Not Enrolled
          </h2>
          <p className="text-gray-600 mb-4">
            You need to enroll in this course to access the videos.
          </p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500"
          >
            Enroll Now
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
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {course?.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentVideo?.title || "Select a video"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currentVideo && videoUrl ? (
                <div className="relative">
                  <video
                    id="video-player"
                    className="w-full aspect-video bg-black"
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Custom Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={togglePlayPause}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button
                          onClick={toggleMute}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                        >
                          {isMuted ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                        <span className="text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full">
                        <Maximize size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="mx-auto text-gray-400 mb-4 w-12 h-12" />
                    <p className="text-gray-600">
                      Select a video to start watching
                    </p>
                  </div>
                </div>
              )}

              {/* Video Info */}
              {currentVideo && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentVideo.title}
                  </h2>
                  {currentVideo.description && (
                    <p className="text-gray-600">{currentVideo.description}</p>
                  )}
                  <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
                    {currentVideo.duration > 0 && (
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        {formatTime(currentVideo.duration)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      {course?.title}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Course Videos
                </h3>
                <p className="text-sm text-gray-600">{videos.length} videos</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {videos.map((video, index) => (
                  <div
                    key={video._id}
                    onClick={() => handleVideoSelect(video)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      currentVideo?._id === video._id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <Play size={16} className="text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {index + 1}. {video.title}
                        </h4>
                        {video.duration > 0 && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            {formatTime(video.duration)}
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

export default VideoPlayer;
