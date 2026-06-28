import React, { useState, useEffect } from "react";
import { ChevronDown, Menu, User, LogOut } from "lucide-react";
import CoursePage from "./components/coursePages";
import Header from "./components/Header";
import CardSlider from "./CardSlider";
import { Routes, Route, useNavigate, NavLink } from "react-router-dom";
import { AboutPage } from "./components/aboutPage";
import { TestSeriesPage } from "./components/testSeriesPage";
import RefundPolicy from "./components/PolicyPages/refundPolicy";
import PrivacyPolicy from "./components/PolicyPages/privacyPolicy";
import TermsAndConditions from "./components/PolicyPages/TermsAndConditions";
import ContactPage from "./components/PolicyPages/ContactPage";
import ShippingPolicy from "./components/PolicyPages/shippingPage";
import ReportsPage from "./components/Reports";

import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthModal from "./components/auth/AuthModal";
import StudentDashboard from "./components/student/StudentDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminStudentsPage from "./components/admin/AdminStudentsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CourseList from "./components/courses/CourseList";
import CourseDetail from "./components/courses/CourseDetail";
import VideoPlayer from "./components/courses/VideoPlayer";
import CourseContent from "./components/student/CourseContent";
import CourseMaterials from "./components/student/CourseMaterials";
import AdminCoursePage from "./components/admin/AdminCoursePage";
import CreateCoursePage from "./components/admin/CreateCoursePage";
import AdminTestSeriesManagement from "./components/admin/AdminTestSeriesManagement";
import AdminUpiApprovals from "./components/admin/AdminUpiApprovals";
import ScrollToTop from "./components/ScrollToTop";

const PRIMARY = "#51596c";
const SECONDARY = "#c6b9a9";
const ACCENT = "#dad9d7";

const AppContent = () => {
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, isAdmin, logout } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api"}/courses`
        );
        const data = await res.json();
        if (data.success) setCourses(data.courses);
      } catch {}
      finally { setLoadingCourses(false); }
    };
    fetchCourses();
  }, []);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "#ffffff" : SECONDARY,
    backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
  });

  const Navigation = () => (
    <nav className="fixed top-8 left-0 right-0 z-50 shadow-md px-4" style={{ backgroundColor: PRIMARY }}>
      <div className="container mx-auto flex items-center justify-between py-2 sm:py-3">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <img src="/IAS-Logo-Design.svg" alt="Logo" width={160} height={80} className="sm:w-12 sm:h-12 flex-shrink-0" />
          <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate" style={{ color: ACCENT }}>TUSHTI IAS</h1>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center space-x-2">
          <NavLink to="/" className="px-3 py-2 rounded font-medium" style={navLinkStyle}>Home</NavLink>

          <div className="relative">
            <button onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
              className="flex items-center space-x-1 px-3 py-2 rounded font-medium"
              style={{ color: SECONDARY }}>
              <span>Courses</span><ChevronDown size={16} />
            </button>
            {isCoursesDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border min-w-48 z-50"
                style={{ borderColor: SECONDARY }}>
                <button onClick={() => { navigate("/courses"); setIsCoursesDropdownOpen(false); }}
                  className="block w-full text-left px-4 py-2 rounded-t-lg hover:opacity-80"
                  style={{ color: PRIMARY }}>All Courses</button>
                {loadingCourses
                  ? <div className="px-4 py-2 text-sm" style={{ color: SECONDARY }}>Loading...</div>
                  : courses.map((c, idx) => (
                    <button key={c._id}
                      onClick={() => { navigate(`/course/${c._id}`); setIsCoursesDropdownOpen(false); }}
                      className={`block w-full text-left px-4 py-2 hover:opacity-80 ${idx === courses.length - 1 ? "rounded-b-lg" : ""}`}
                      style={{ color: PRIMARY }}>{c.title}</button>
                  ))}
              </div>
            )}
          </div>

          <NavLink to="/testSeries" className="px-3 py-2 rounded font-medium" style={navLinkStyle}>Test Series</NavLink>
          <NavLink to="/about" className="px-3 py-2 rounded font-medium" style={navLinkStyle}>About</NavLink>

          {isAuthenticated ? (
            <div className="flex items-center space-x-1">
              {isStudent && (
                <NavLink to="/dashboard" className="flex items-center space-x-1 px-3 py-2 rounded text-sm" style={navLinkStyle}>
                  <User size={14} /><span className="hidden sm:inline">Dashboard</span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className="flex items-center space-x-1 px-3 py-2 rounded text-sm" style={navLinkStyle}>
                  <User size={14} /><span className="hidden sm:inline">Admin</span>
                </NavLink>
              )}
              <button onClick={logout} className="flex items-center space-x-1 px-3 py-2 rounded text-sm" style={{ color: SECONDARY }}>
                <LogOut size={14} /><span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1 px-3 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: SECONDARY, color: PRIMARY }}>
              <User size={14} /><span>Login</span>
            </button>
          )}
        </div>

        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1" style={{ color: ACCENT }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden flex flex-col space-y-1 pb-3 px-2">
          <button onClick={() => { navigate("/"); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-2 rounded" style={{ color: ACCENT }}>Home</button>
          <div className="px-2">
            <button onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
              className="flex items-center justify-between w-full px-2 py-2" style={{ color: ACCENT }}>
              <span>Courses</span><ChevronDown size={16} />
            </button>
            {isCoursesDropdownOpen && (
              <div className="flex flex-col pl-4 space-y-1">
                <button onClick={() => { navigate("/courses"); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-2 py-1" style={{ color: SECONDARY }}>All Courses</button>
                {courses.map((c) => (
                  <button key={c._id} onClick={() => { navigate(`/course/${c._id}`); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-2 py-1" style={{ color: SECONDARY }}>{c.title}</button>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/testSeries" className="px-3 py-2 rounded" style={{ color: SECONDARY }} onClick={() => setIsMobileMenuOpen(false)}>Test Series</NavLink>
          <NavLink to="/about" className="px-3 py-2 rounded" style={{ color: SECONDARY }} onClick={() => setIsMobileMenuOpen(false)}>About</NavLink>
          {isAuthenticated ? (
            <div className="space-y-1">
              {isStudent && (
                <NavLink to="/dashboard" className="flex items-center space-x-2 px-4 py-2 rounded"
                  style={{ color: SECONDARY }} onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={16} /><span>Dashboard</span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className="flex items-center space-x-2 px-4 py-2 rounded"
                  style={{ color: SECONDARY }} onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={16} /><span>Admin</span>
                </NavLink>
              )}
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-4 py-2 rounded w-full text-left" style={{ color: SECONDARY }}>
                <LogOut size={16} /><span>Logout</span>
              </button>
            </div>
          ) : (
            <button onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
              className="flex items-center space-x-2 px-4 py-2 rounded w-full text-left" style={{ color: SECONDARY }}>
              <User size={16} /><span>Login</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );

  const CourseCards = () => {
    const displayCourses = courses.slice(0, 6);

    if (loadingCourses && courses.length === 0) {
      return (
        <div className="py-16" style={{ backgroundColor: ACCENT }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12" style={{ color: PRIMARY }}>Our Courses</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: PRIMARY }}></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="py-16" style={{ backgroundColor: ACCENT }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: PRIMARY }}>Our Courses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {displayCourses.map((course) => (
              <div key={course._id}
                onClick={() => navigate(`/course/${course._id}`)}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300 border"
                style={{ borderColor: SECONDARY }}>
                <h3 className="text-xl font-bold mb-3" style={{ color: PRIMARY }}>{course.title}</h3>
                <p className="mb-4 line-clamp-3 text-sm" style={{ color: PRIMARY, opacity: 0.75 }}>{course.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                    {course.onlinePrice && course.offlinePrice
                      ? `₹${course.onlinePrice.toLocaleString()} / ₹${course.offlinePrice.toLocaleString()}`
                      : course.onlinePrice
                      ? `₹${course.onlinePrice.toLocaleString()}`
                      : course.offlinePrice
                      ? `₹${course.offlinePrice.toLocaleString()}`
                      : null}
                  </span>
                  <span className="text-sm" style={{ color: SECONDARY }}>{course.duration}</span>
                </div>
                <button className="px-4 py-2 rounded-lg font-medium w-full text-white" style={{ backgroundColor: PRIMARY }}>
                  Explore Course
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const HomePage = () => (
    <div className="pt-40 sm:pt-36 md:pt-32 lg:pt-28">
      <CardSlider />
      <CourseCards />
    </div>
  );

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Header />
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/testSeries" element={<TestSeriesPage />} />
        <Route path="/ssc" element={<CoursePage courseType="ssc" />} />
        <Route path="/neet11" element={<CoursePage courseType="neet11" />} />
        <Route path="/neet12" element={<CoursePage courseType="neet12" />} />
        <Route path="/gpsc" element={<CoursePage courseType="gpsc" />} />
        <Route path="/upsc" element={<CoursePage courseType="upsc" />} />
        <Route path="/talati" element={<CoursePage courseType="talati" />} />
        <Route path="/ethics" element={<CoursePage courseType="ethics" />} />
        <Route path="/refundPolicy" element={<RefundPolicy />} />
        <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/termsAndCondition" element={<TermsAndConditions />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/course/:courseId" element={<CourseDetail />} />
        <Route path="/course/:courseId/video/:videoId" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
        <Route path="/course/:courseId/videos" element={<ProtectedRoute><CourseContent /></ProtectedRoute>} />
        <Route path="/course/:courseId/materials" element={<ProtectedRoute><CourseMaterials /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute requireStudent={true}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute requireAdmin={true}><AdminLayout><AdminUpiApprovals /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute requireAdmin={true}><AdminLayout><AdminCoursePage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/courses/new" element={<ProtectedRoute requireAdmin={true}><AdminLayout><CreateCoursePage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/test-series" element={<ProtectedRoute requireAdmin={true}><AdminLayout><AdminTestSeriesManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute requireAdmin={true}><AdminLayout><AdminStudentsPage /></AdminLayout></ProtectedRoute>} />
      </Routes>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <footer className="py-4 text-center mt-8" style={{ backgroundColor: PRIMARY }}>
        <a href="/privacyPolicy" style={{ color: SECONDARY }}>Privacy Policy</a>
        {" | "}
        <a href="/termsAndCondition" style={{ color: SECONDARY }}>Terms & Conditions</a>
        {" | "}
        <a href="/refundPolicy" style={{ color: SECONDARY }}>Refund Policy</a>
      </footer>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
