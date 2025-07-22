import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Menu } from "lucide-react";
import CoursePage from "./components/coursePages";
import Header from "./components/Header";
import { sliderCards, courseCards } from "./slides/sliderCards";
import { AboutPage } from "./components/aboutPage";
import { TestSeriesPage } from "./components/testSeriesPage";
const Router = ({ children }) => children;
const App = () => {
  const [currentRoute, setCurrentRoute] = useState("/");
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = (path) => {
    setCurrentRoute(path);
    setIsCoursesDropdownOpen(false);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
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
          <button
            onClick={() => navigate("/")}
            className={`px-3 py-2 rounded ${
              currentRoute === "/"
                ? "bg-gray-800 text-white"
                : "text-gray-800 hover:bg-gray-200"
            }`}
          >
            Home
          </button>
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
                {[
                  "/ssc",
                  "/neet",
                  "/gpsc",
                  "/upsc",
                  "/talati",
                  "/ethics  ",
                ].map((path, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(path)}
                    className={`block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 ${
                      idx === 0 ? "rounded-t-lg" : ""
                    } ${idx === 3 ? "rounded-b-lg" : ""}`}
                  >
                    {path.slice(1).toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/testSeries")}
            className={`px-3 py-2 rounded ${
              currentRoute === "/testSeries"
                ? "bg-gray-800 text-white"
                : "text-gray-800 hover:bg-gray-200"
            }`}
          >
            Test Series
          </button>

          <button
            onClick={() => navigate("/about")}
            className={`px-3 py-2 rounded ${
              currentRoute === "/about"
                ? "bg-gray-800 text-white"
                : "text-gray-800 hover:bg-gray-200"
            }`}
          >
            About
          </button>
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
                {[
                  "/ssc",
                  "/neet",
                  "/gpsc",
                  "/upsc",
                  "/talati",
                  "ethicsandessay",
                ].map((path, idx) => (
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
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/testSeries");
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
          >
            Test Series
          </button>

          <button
            onClick={() => {
              navigate("/about");
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
          >
            About
          </button>
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
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#f9dc41" }}
            >
              <ChevronLeft size={24} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#f9dc41" }}
            >
              <ChevronRight size={24} />
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
      <CardSlider />
      <StaticCourseCards />
    </div>
  );
  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case "/":
        return <HomePage />;
      case "/about":
        return <AboutPage />;
      case "/testSeries":
        return <TestSeriesPage />;
      case "/ssc":
        return <CoursePage courseType="ssc" />;
      case "/neet":
        return <CoursePage courseType="neet" />;
      case "/gpsc":
        return <CoursePage courseType="gpsc" />;
      case "/upsc":
        return <CoursePage courseType="upsc" />;
      case "/talati":
        return <CoursePage courseType="talati" />;
      default:
        return <HomePage />;
    }
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <Navigation />
        {renderCurrentRoute()}
      </div>
    </Router>
  );
};

export default App;
