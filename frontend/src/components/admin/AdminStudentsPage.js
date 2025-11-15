// c:\Sandhan\frontend\src\components\admin\AdminStudentsPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, UserPlus, UserMinus } from "lucide-react";

const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseStudents, setCourseStudents] = useState([]);
  const [enrollForm, setEnrollForm] = useState({
    email: "",
    mobile: "",
    amount: "",
  });
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/students`),
          axios.get(`${API_BASE_URL}/admin/courses`),
        ]);
        setStudents(sRes.data.students || []);
        setCourses(cRes.data.courses || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE_URL]);

  const fetchCourseStudents = async (courseId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/courses/${courseId}/students`
      );
      setCourseStudents(res.data.students || []);
    } catch {}
  };

  const handleSelectCourse = (id) => {
    setSelectedCourse(id);
    if (id) fetchCourseStudents(id);
  };

  const enrollStudent = async () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }
    try {
      const payload = {
        courseId: selectedCourse,
        email: enrollForm.email || undefined,
        studentId: undefined,
        mobile: enrollForm.mobile || undefined,
        amount: enrollForm.amount ? Number(enrollForm.amount) : undefined,
      };
      const res = await axios.post(`${API_BASE_URL}/admin/add-student-to-course`, payload);
      await fetchCourseStudents(selectedCourse);
      setEnrollForm({ email: "", mobile: "", amount: "" });
      alert("Student enrolled successfully");
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Failed to enroll student";
      alert(msg);
    }
  };

  const removeAccess = async (studentId) => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }
    if (!window.confirm("Remove access for this student?")) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/remove-student-from-course`, {
        courseId: selectedCourse,
        studentId,
      });
      await fetchCourseStudents(selectedCourse);
      alert("Access removed");
    } catch (e) {
      alert(e.response?.data?.error || "Failed to remove access");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto" />
        <p className="text-center mt-4 text-gray-600">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Students
        </h2>
        <div className="flex items-center mb-4">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name/email/mobile"
            className="flex-1 px-3 py-2 border rounded"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students
            .filter(
              (s) =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase()) ||
                s.mobile.includes(search)
            )
            .slice(0, 10)
            .map((s) => (
              <div key={s._id} className="p-4 border rounded">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-gray-600">{s.email}</div>
                <div className="text-sm text-gray-600">{s.mobile}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Enroll / Manage Course Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedCourse}
            onChange={(e) => handleSelectCourse(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Student email (optional)"
            value={enrollForm.email}
            onChange={(e) =>
              setEnrollForm({ ...enrollForm, email: e.target.value })
            }
            className="px-3 py-2 border rounded"
          />
          <input
            placeholder="Student mobile (optional)"
            value={enrollForm.mobile}
            onChange={(e) =>
              setEnrollForm({ ...enrollForm, mobile: e.target.value })
            }
            className="px-3 py-2 border rounded"
          />
          <input
            placeholder="Amount (optional)"
            value={enrollForm.amount}
            onChange={(e) =>
              setEnrollForm({ ...enrollForm, amount: e.target.value })
            }
            className="px-3 py-2 border rounded"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={enrollStudent}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
          >
            <UserPlus size={16} className="mr-2" /> Enroll
          </button>
        </div>

        {selectedCourse && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">
              Students in selected course
            </h3>
            <div className="divide-y">
              {courseStudents.map((cs) => (
                <div
                  key={cs._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{cs.name}</div>
                    <div className="text-sm text-gray-600">
                      {cs.email} · {cs.mobile}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAccess(cs._id)}
                    className="px-3 py-2 border rounded text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <UserMinus size={16} className="mr-2" /> Remove
                  </button>
                </div>
              ))}
              {courseStudents.length === 0 && (
                <div className="text-sm text-gray-500">No students</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;
