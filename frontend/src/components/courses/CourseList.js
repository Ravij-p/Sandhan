import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Play, Users } from "lucide-react";
import axios from "axios";

const PRIMARY = "#51596c";
const SECONDARY = "#c6b9a9";
const ACCENT = "#dad9d7";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      if (response.data.success) setCourses(response.data.courses);
      else setError("No courses found");
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: PRIMARY }}></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
      <div className="text-center">
        <p style={{ color: PRIMARY }}>{error}</p>
        <button onClick={fetchCourses}
          className="mt-4 px-4 py-2 text-white rounded-lg"
          style={{ backgroundColor: PRIMARY }}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 sm:pt-28 md:pt-24 lg:pt-20" style={{ backgroundColor: ACCENT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: PRIMARY }}>Our Courses</h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: SECONDARY }}>
            Comprehensive courses designed to help you achieve your goals
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto w-16 h-16 mb-4" style={{ color: SECONDARY }} />
            <p className="text-xl font-semibold" style={{ color: PRIMARY }}>No courses available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id}
                onClick={() => navigate(`/course/${course._id}`)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border"
                style={{ borderColor: SECONDARY }}>
                {/* Thumbnail */}
                <div className="relative h-44 rounded-t-xl overflow-hidden" style={{ backgroundColor: PRIMARY }}>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-14 h-14 opacity-40 text-white" />
                    </div>
                  )}
                  {(course.onlinePrice > 0 || course.offlinePrice > 0) && (
                    <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-sm font-semibold"
                      style={{ backgroundColor: SECONDARY, color: PRIMARY }}>
                      {course.onlinePrice > 0 && course.offlinePrice > 0 ? (
                        <span>₹{course.onlinePrice.toLocaleString()} / ₹{course.offlinePrice.toLocaleString()}</span>
                      ) : course.onlinePrice > 0 ? (
                        <span>₹{course.onlinePrice.toLocaleString()}</span>
                      ) : (
                        <span>₹{course.offlinePrice.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
                    style={{ backgroundColor: ACCENT, color: PRIMARY }}>
                    {course.category?.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: PRIMARY }}>{course.title}</h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: SECONDARY }}>{course.description}</p>

                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex items-center" style={{ color: PRIMARY }}>
                      <Clock className="w-4 h-4 mr-2" style={{ color: SECONDARY }} />
                      {course.duration}
                    </div>
                    <div className="flex items-center" style={{ color: PRIMARY }}>
                      <Play className="w-4 h-4 mr-2" style={{ color: SECONDARY }} />
                      Video Lectures
                    </div>
                    <div className="flex items-center" style={{ color: PRIMARY }}>
                      <Users className="w-4 h-4 mr-2" style={{ color: SECONDARY }} />
                      Expert Faculty
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}>
                    View Course Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
