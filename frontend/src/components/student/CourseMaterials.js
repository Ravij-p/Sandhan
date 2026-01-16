// c:\Sandhan\frontend\src\components\student\CourseMaterials.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Download, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!isAuthenticated || !isStudent) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const [cRes, mRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/courses/${courseId}`),
          axios.get(`${API_BASE_URL}/documents/courses/${courseId}/materials`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCourse(cRes.data.course || null);
        setMaterials(mRes.data.materials || []);
      } catch (e) {
        setError("Failed to load materials");
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE_URL, courseId, isAuthenticated, isStudent, navigate]);

  const downloadWithAuth = async (documentId, filename) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/stream/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Download failed", res.status, await res.text());
        alert("Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading materials...</p>
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
            onClick={() => navigate(`/course/${courseId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {course?.title || "Course"}
                </h1>
                <p className="text-xs text-gray-600">Materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          {materials.length > 0 ? (
            <div className="divide-y">
              {materials.map((m) => (
                <div
                  key={m._id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{m.title}</div>
                    {m.description && (
                      <div className="text-sm text-gray-600">
                        {m.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => downloadWithAuth(m._id, m.originalName)}
                    className="px-3 py-2 border rounded text-blue-600 hover:bg-blue-50 flex items-center whitespace-nowrap"
                    title="Download"
                  >
                    <Download size={16} className="mr-2" /> <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No materials available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseMaterials;
