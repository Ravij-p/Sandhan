import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, Play, Clock, CheckCircle, User, LogOut } from "lucide-react";
import axios from "axios";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/enrollments`);
      setEnrollments(response.data.enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      setError("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img
                src="/Logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="sm:w-10 sm:h-10"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Student Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <User size={14} className="sm:w-4 sm:h-4" />
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                <span>Logout</span>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Enrolled Courses
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {enrollments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Completed
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  In Progress
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {enrollments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              My Courses
            </h2>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <BookOpen className="mx-auto text-gray-400 w-12 h-12 sm:w-12 sm:h-12" />
              <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">
                No courses enrolled
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                You haven't enrolled in any courses yet. Browse our courses to
                get started!
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="mt-4 px-4 py-2 bg-yellow-400 text-[#163233] rounded-lg font-medium hover:bg-yellow-500 text-sm sm:text-base"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <BookOpen className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                            {enrollment.course?.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {enrollment.course?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Enrolled
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          (window.location.href = `/course/${enrollment.course?._id}`)
                        }
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm w-full sm:w-auto"
                      >
                        <Play size={14} className="sm:w-4 sm:h-4" />
                        <span>Access Course</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
