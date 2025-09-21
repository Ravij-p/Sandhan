import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Users, Clock, Star } from "lucide-react";
import axios from "axios";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses from:", `${API_BASE_URL}/courses`);
      const response = await axios.get(`${API_BASE_URL}/courses`);
      console.log("Courses response:", response.data);
      if (response.data.success && response.data.courses) {
        setCourses(response.data.courses);
      } else {
        setError("No courses found or invalid response");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load courses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    console.log("Navigating to course:", courseId);
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchCourses}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Courses
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive range of courses designed to help you
            achieve your goals
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No courses available
            </h3>
            <p className="text-gray-600">Check back later for new courses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {courses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course._id)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl overflow-hidden">
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
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">4.8</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Play className="w-4 h-4 mr-2" />
                      <span>Video Lectures</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Expert Faculty</span>
                    </div>
                  </div>

                  {/* Course Features List */}
                  {course.features && course.features.length > 0 && (
                    <div className="mb-4">
                      <ul className="space-y-1">
                        {course.features.slice(0, 3).map((feature, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-center"
                          >
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    View Course Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of students who have already enrolled in our
              courses
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              >
                Browse All Courses
              </button>
              <button
                onClick={() => navigate("/about")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
