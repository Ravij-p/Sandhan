import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  BookOpen,
  Play,
  DollarSign,
  LogOut,
  Settings,
  FileText,
  ShieldCheck,
  Image,
} from "lucide-react";
import axios from "axios";

const BG   = "#fcfcfc";
const DARK = "#353841";
const MID  = "#C8B8A9";

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
  }, [fetchDashboardData, API_BASE_URL]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: DARK }}></div>
          <p className="mt-4 text-sm" style={{ color: MID }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: BG, borderColor: MID }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/Logo.svg" alt="Logo" width={32} height={32} className="sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold" style={{ color: DARK }}>Admin Dashboard</h1>
                <p className="text-xs sm:text-sm" style={{ color: MID }}>Welcome, {user?.name}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm rounded-lg"
              style={{ color: MID }}>
              <LogOut size={14} /><span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{ color: DARK, borderColor: MID }}>{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { label: "Total Students", value: stats?.totalStudents || 0, Icon: Users },
            { label: "Total Courses",  value: stats?.totalCourses  || 0, Icon: BookOpen },
            { label: "Total Videos",   value: stats?.totalVideos   || 0, Icon: Play },
            { label: "Total Revenue",  value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, Icon: DollarSign },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-lg shadow p-4 sm:p-6 border"
              style={{ backgroundColor: BG, borderColor: MID }}>
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{ backgroundColor: MID + "40" }}>
                  <Icon size={20} style={{ color: DARK }} />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium" style={{ color: MID }}>{label}</p>
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: DARK }}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Recent Enrollments */}
          <div className="rounded-lg shadow border" style={{ backgroundColor: BG, borderColor: MID }}>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ borderColor: MID }}>
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: DARK }}>Recent Enrollments</h2>
            </div>
            <div className="divide-y" style={{ borderColor: MID }}>
              {recentEnrollments.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: MID }}>No recent enrollments</div>
              ) : (
                recentEnrollments.map((student) => (
                  <div key={student._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: DARK }}>{student.name}</h3>
                        <p className="text-sm" style={{ color: MID }}>{student.email}</p>
                        <p className="text-xs" style={{ color: MID }}>{student.enrolledCourses?.length || 0} courses enrolled</p>
                      </div>
                      <p className="text-xs" style={{ color: MID }}>{new Date(student.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course Statistics */}
          <div className="rounded-lg shadow border" style={{ backgroundColor: BG, borderColor: MID }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: MID }}>
              <h2 className="text-lg font-semibold" style={{ color: DARK }}>Course Performance</h2>
            </div>
            <div className="divide-y" style={{ borderColor: MID }}>
              {courseStats.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: MID }}>No course data available</div>
              ) : (
                courseStats.map((course) => (
                  <div key={course._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: DARK }}>{course.title}</h3>
                        <p className="text-sm" style={{ color: MID }}>{course.enrollmentCount} students enrolled</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: DARK }}>₹{course.totalRevenue?.toLocaleString()}</p>
                        <p className="text-xs" style={{ color: MID }}>Revenue</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Features */}
        <div className="mt-8 rounded-lg shadow p-6 border" style={{ backgroundColor: BG, borderColor: MID }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: DARK }}>Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = { BookOpen, Play, FileText, ShieldCheck, Settings, Image }[f.icon] || Settings;
              return (
                <button key={f.key} onClick={() => navigate(f.path)}
                  className="flex items-center space-x-3 p-4 border rounded-lg text-left"
                  style={{ borderColor: MID, backgroundColor: BG }}>
                  <Icon size={24} style={{ color: DARK }} />
                  <div>
                    <h3 className="font-medium" style={{ color: DARK }}>{f.title}</h3>
                    <p className="text-sm" style={{ color: MID }}>{f.description}</p>
                  </div>
                </button>
              );
            })}
            {features.length === 0 && (
              <div className="text-sm" style={{ color: MID }}>No features available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
