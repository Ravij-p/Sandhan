import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  BookOpen,
  Play,
  DollarSign,
  TrendingUp,
  LogOut,
  Plus,
  Settings,
  FileText,
  ShieldCheck,
  Image,
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`);
      setStats(response.data.stats);
      setRecentEnrollments(response.data.recentEnrollments);
      setCourseStats(response.data.courseStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchDashboardData();
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/features`);
        setFeatures(res.data.features || []);
      } catch (e) {
        // ignore
      }
    })();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
  };

  const testCourseAPI = async () => {
    try {
      console.log("Testing course API...");
      const response = await axios.get(`${API_BASE_URL}/courses/test/all`);
      console.log("All courses response:", response.data);
      alert(`Found ${response.data.totalCourses} total courses in database`);
    } catch (error) {
      console.error("Test API error:", error);
      alert("Error testing API: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-full sm:w-auto justify-center sm:justify-start"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Courses
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.totalCourses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Play className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Videos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.totalVideos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{stats?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Recent Enrollments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Recent Enrollments
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentEnrollments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent enrollments
                </div>
              ) : (
                recentEnrollments.map((student) => (
                  <div key={student._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500">
                          {student.enrolledCourses?.length || 0} courses
                          enrolled
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(student.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course Statistics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Course Performance
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {courseStats.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No course data available
                </div>
              ) : (
                courseStats.map((course) => (
                  <div key={course._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {course.enrollmentCount} students enrolled
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{course.totalRevenue?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Features */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = {
                BookOpen,
                Play,
                FileText,
                ShieldCheck,
                Settings,
                Image,
              }[f.icon] || Settings;
              return (
                <button
                  key={f.key}
                  onClick={() => navigate(f.path)}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <Icon className="text-blue-600" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-600">{f.description}</p>
                  </div>
                </button>
              );
            })}
            {features.length === 0 && (
              <div className="text-sm text-gray-500">No features available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
