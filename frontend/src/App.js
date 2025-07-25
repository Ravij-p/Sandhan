import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Menu } from "lucide-react";
import CoursePage from "./components/coursePages";
import Header from "./components/Header";
import { sliderCards, courseCards } from "./slides/sliderCards";
import { Routes, Route, useNavigate, NavLink } from "react-router-dom";
import { AboutPage } from "./components/aboutPage";
import { TestSeriesPage } from "./components/testSeriesPage";
import RefundPolicy from "./components/PolicyPages/refundPolicy";
import PrivacyPolicy from "./components/PolicyPages/privacyPolicy";
import TermsAndConditions from "./components/PolicyPages/TermsAndConditions";
import ContactPage from "./components/PolicyPages/ContactPage";
import ShippingPolicy, {
  ShippingPage,
} from "./components/PolicyPages/shippingPage";
const App = () => {
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [isNeetSubmenuOpen, setIsNeetSubmenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    // Optional: Uncomment below if you want ad only once per visit
    const adShown = sessionStorage.getItem("adShown");
    if (!adShown) {
      setShowAd(true);
      sessionStorage.setItem("adShown", "true");
    }
  }, []);
  const closeAd = () => {
    setShowAd(false);
  };
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#f9dc41] shadow-md px-4 mt-20 sm:mt-14 lg:mt-8">
      <div className="container mx-auto flex items-center justify-between py-3">
        <div className="flex items-center space-x-3">
          <img src="/Logo.svg" alt="Logo" width={50} height={50} />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            SANDHAN GROUP OF INSTITUTE
          </h1>
        </div>
        <div className="hidden lg:flex items-center space-x-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-800 hover:bg-gray-200"
              }`
            }
          >
            Home
          </NavLink>
          <div className="relative">
            <button
              onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
              className="flex items-center space-x-1 px-3 py-2 rounded text-gray-800 hover:bg-gray-200"
            >
              <span>Courses</span>
              <ChevronDown size={16} />
            </button>

            {isCoursesDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border min-w-32 z-50">
                {["/ssc", "/gpsc", "/upsc", "/talati", "/ethics"].map(
                  (path, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(path);
                        setIsCoursesDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 ${
                        idx === 0 ? "rounded-t-lg" : ""
                      } ${idx === 4 ? "rounded-b-lg" : ""}`}
                    >
                      {path.slice(1).toUpperCase()}
                    </button>
                  )
                )}

                {/* NEET with submenu */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsNeetSubmenuOpen(true)}
                  onMouseLeave={() => setIsNeetSubmenuOpen(false)}
                >
                  <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center justify-between">
                    <span>NEET</span>
                    <ChevronRight size={16} />
                  </button>

                  {isNeetSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border min-w-48 z-60">
                      <button
                        onClick={() => {
                          navigate("/neet11");
                          setIsNeetSubmenuOpen(false);
                          setIsCoursesDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-t-lg"
                      >
                        NEET Class 11 Program
                      </button>
                      <button
                        onClick={() => {
                          navigate("/neet12");
                          setIsNeetSubmenuOpen(false);
                          setIsCoursesDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-b-lg"
                      >
                        NEET Class 12 Program
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <NavLink
            to="/testSeries"
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-800 hover:bg-gray-200"
              }`
            }
          >
            Test Series
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-800 hover:bg-gray-200"
              }`
            }
          >
            About
          </NavLink>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-gray-800"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden flex flex-col space-y-1 pb-3 px-2">
          <button
            onClick={() => {
              navigate("/");
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 rounded text-gray-800 hover:bg-gray-200"
          >
            Home
          </button>
          {/* Courses Mobile */}
          <div className="px-2">
            <button
              onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
              className="flex items-center justify-between w-full px-2 py-2 text-gray-800 hover:bg-gray-200"
            >
              <span>Courses</span>
              <ChevronDown size={16} />
            </button>

            {isCoursesDropdownOpen && (
              <div className="flex flex-col pl-4 space-y-1">
                {["/ssc", "/gpsc", "/upsc", "/talati", "/ethics"].map(
                  (path, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(path);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100"
                    >
                      {path.slice(1).toUpperCase()}
                    </button>
                  )
                )}

                {/* NEET with submenu for mobile */}
                <div>
                  <button
                    onClick={() => setIsNeetSubmenuOpen(!isNeetSubmenuOpen)}
                    className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>NEET</span>
                    <ChevronDown size={14} />
                  </button>

                  {isNeetSubmenuOpen && (
                    <div className="flex flex-col pl-4 space-y-1 mt-1">
                      <button
                        onClick={() => {
                          navigate("/neet11");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                      >
                        NEET Class 11 Program
                      </button>
                      <button
                        onClick={() => {
                          navigate("/neet12");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                      >
                        NEET Class 12 Program
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <NavLink
            to="/testSeries"
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-800 hover:bg-gray-200"
              }`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Test Series
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3 py-2 rounded ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-800 hover:bg-gray-200"
              }`
            }
          >
            About
          </NavLink>
        </div>
      )}
    </nav>
  );
  const CardSlider = () => {
    const n = sliderCards.length;
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % n);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + n) % n);

    const getVisibleCards = () => {
      const cards = [];
      for (let i = 0; i < 2; i++) {
        const index = (currentSlide + i) % n;
        cards.push(sliderCards[index]);
      }
      return cards;
    };

    return (
      <div className="relative bg-white py-6 lg:py-12 ">
        <div className="container mx-auto px-4">
          <h2
            className="text-2xl lg:text-3xl font-bold text-center mb-0 lg:mb-6"
            style={{ color: "#163233" }}
          >
            Featured Programs
          </h2>

          <div className="relative max-w-4xl mx-auto">
            <button
              onClick={prevSlide}
              className="absolute left-2 lg:-left-12 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#f9dc41" }}
            >
              <ChevronLeft size={20} className="lg:w-6 lg:h-6" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-12 lg:mx-0">
              {getVisibleCards().map((card) => (
                <div
                  key={card.id}
                  className={`text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
                  onClick={() => {
                    navigate(`${card.routing_link}`);
                  }}
                >
                  <img src={card.img_link} alt="SSC" height={300} width={480} />
                </div>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="absolute right-2 lg:-right-12 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#f9dc41" }}
            >
              <ChevronRight size={20} className="lg:w-6 lg:h-6" />
            </button>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: 8 }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index ? "bg-yellow-400" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };
  const StaticCourseCards = () => (
    <div className="py-16" style={{ backgroundColor: "#fafaee" }}>
      <div className="container mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ color: "#163233" }}
        >
          Our Courses
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courseCards.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(course.route)}
              className={`${course.color} p-6 rounded-xl shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-yellow-400`}
            >
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "#163233" }}
              >
                {course.title}
              </h3>
              <p className="text-gray-700 mb-4">{course.description}</p>
              <button
                className="px-4 py-2 rounded-lg font-medium transition-colors hover:shadow-md"
                style={{ backgroundColor: "#f9dc41", color: "#163233" }}
              >
                Explore Course
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const HomePage = () => (
    <div className="pt-40 lg:pt-20">
      {showAd && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-0 max-w-md w-full">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white bg-red-500 rounded-full w-8 h-8 text-center text-xl"
              onClick={closeAd}
            >
              &times;
            </button>

            {/* Ad Image */}
            <img
              src="/Advertisement.jpg" // Replace with your path
              alt="Advertisement"
              className="w-full rounded-b-lg object-contain"
            />
          </div>
        </div>
      )}
      <CardSlider />
      <StaticCourseCards />
    </div>
  );

  return (
    <div className="min-h-screen">
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
      </Routes>
    </div>
  );
};

export default App;
