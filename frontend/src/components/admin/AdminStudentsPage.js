import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, AlertCircle, CheckCircle, Copy } from "lucide-react";

const BG   = "#fcfcfc";
const DARK = "#353841";
const MID  = "#C8B8A9";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const AdminStudentsPage = () => {
  const [students, setStudents]       = useState([]);
  const [formNotPaid, setFormNotPaid] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState("paid");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseStudents, setCourseStudents] = useState([]);
  const [copied, setCopied]           = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const h = { Authorization: `Bearer ${token}` };
        const [sRes, cRes, fnpRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/students?limit=200`, { headers: h }),
          axios.get(`${API_BASE_URL}/admin/courses`, { headers: h }),
          axios.get(`${API_BASE_URL}/admin/students/form-not-paid`, { headers: h }),
        ]);
        setStudents(sRes.data.students || []);
        setCourses(cRes.data.courses || []);
        setFormNotPaid(fnpRes.data.students || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const fetchCourseStudents = async (courseId) => {
    if (!courseId) { setCourseStudents([]); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/admin/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourseStudents(res.data.students || []);
    } catch {}
  };

  const copyPassword = (id, pwd) => {
    navigator.clipboard.writeText(pwd).catch(() => {});
    setCopied((p) => ({ ...p, [id]: true }));
    setTimeout(() => setCopied((p) => ({ ...p, [id]: false })), 2000);
  };

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile?.includes(search)
  );
  const paidStudents = filtered.filter((s) =>
    s.enrolledCourses?.some((e) => e.paymentStatus === "paid")
  );

  if (loading) return (
    <div className="p-8 text-center" style={{ backgroundColor: BG }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: DARK }} />
    </div>
  );

  const Tab = ({ id, label, count }) => (
    <button onClick={() => setActiveTab(id)}
      className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      style={{
        backgroundColor: activeTab === id ? DARK : MID,
        color: activeTab === id ? BG : DARK,
      }}>
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  const PasswordRow = ({ id, pwd }) => (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className="text-xs" style={{ color: MID }}>Password:</span>
      {pwd ? (
        <>
          <span className="text-xs font-mono px-2 py-1 rounded select-all"
            style={{ backgroundColor: MID + "40", color: DARK }}>
            {pwd}
          </span>
          <button onClick={() => copyPassword(id, pwd)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ backgroundColor: copied[id] ? "#4ade80" : MID, color: DARK }}>
            <Copy size={12} />
            {copied[id] ? "Copied!" : "Copy"}
          </button>
          <span className="text-xs italic" style={{ color: MID }}>
            Please copy password
          </span>
        </>
      ) : (
        <span className="text-xs" style={{ color: MID }}>No password assigned</span>
      )}
    </div>
  );

  return (
    <div className="space-y-5" style={{ backgroundColor: BG }}>
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Tab id="paid"    label="Paid Students"           count={paidStudents.length} />
        <Tab id="notpaid" label="Form Filled – Not Paid"  count={formNotPaid.length} />
        <Tab id="course"  label="By Course" />
      </div>

      {/* ── PAID STUDENTS ── */}
      {activeTab === "paid" && (
        <div className="rounded-xl shadow p-5" style={{ backgroundColor: BG, border: `1px solid ${MID}` }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} style={{ color: DARK }} />
            <h2 className="font-semibold text-base" style={{ color: DARK }}>Paid Students</h2>
          </div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border"
            style={{ borderColor: MID }}>
            <Search size={16} style={{ color: MID }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / email / mobile"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: DARK }} />
          </div>
          {paidStudents.length === 0 ? (
            <p className="text-sm" style={{ color: MID }}>No paid students found.</p>
          ) : (
            <div className="space-y-3">
              {paidStudents.map((s) => (
                <div key={s._id} className="p-4 rounded-lg border"
                  style={{ borderColor: MID, backgroundColor: BG }}>
                  <div className="font-medium" style={{ color: DARK }}>{s.name}</div>
                  <div className="text-sm" style={{ color: MID }}>{s.email} · {s.mobile}</div>
                  <div className="text-xs mt-1" style={{ color: DARK }}>
                    {s.enrolledCourses?.filter((e) => e.paymentStatus === "paid").map((e, i) => (
                      <span key={i} className="inline-block mr-2 px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: MID + "50", color: DARK }}>
                        {e.course?.title || "Course"}
                      </span>
                    ))}
                  </div>
                  <PasswordRow id={s._id} pwd={s.tempPassword} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FORM FILLED NOT PAID ── */}
      {activeTab === "notpaid" && (
        <div className="rounded-xl shadow p-5" style={{ backgroundColor: BG, border: `1px solid ${MID}` }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} style={{ color: MID }} />
            <h2 className="font-semibold text-base" style={{ color: DARK }}>Form Filled — Not Paid</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: MID }}>
            Filled enrollment form but payment not completed.
          </p>
          {formNotPaid.length === 0 ? (
            <p className="text-sm" style={{ color: MID }}>No pending students.</p>
          ) : (
            <div className="space-y-2">
              {formNotPaid.map((s) => (
                <div key={s._id} className="flex items-start justify-between py-3 border-b"
                  style={{ borderColor: MID + "60" }}>
                  <div>
                    <div className="font-medium text-sm" style={{ color: DARK }}>{s.name}</div>
                    <div className="text-xs" style={{ color: MID }}>{s.email} · {s.mobile}</div>
                    <div className="text-xs mt-0.5" style={{ color: MID }}>
                      {new Date(s.formFilledAt || s.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: MID + "50", color: DARK }}>Not Paid</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BY COURSE ── */}
      {activeTab === "course" && (
        <div className="rounded-xl shadow p-5" style={{ backgroundColor: BG, border: `1px solid ${MID}` }}>
          <h2 className="font-semibold text-base mb-4" style={{ color: DARK }}>Students by Course</h2>
          <select value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); fetchCourseStudents(e.target.value); }}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none mb-4"
            style={{ borderColor: MID, color: DARK, backgroundColor: BG }}>
            <option value="">Select a course</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>

          {selectedCourse && (
            courseStudents.length === 0 ? (
              <p className="text-sm" style={{ color: MID }}>No students enrolled in this course.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: MID }}>{courseStudents.length} student(s)</p>
                {courseStudents.map((cs) => (
                  <div key={cs._id} className="p-4 rounded-lg border"
                    style={{ borderColor: MID, backgroundColor: BG }}>
                    <div className="font-medium" style={{ color: DARK }}>{cs.name}</div>
                    <div className="text-sm" style={{ color: MID }}>{cs.email} · {cs.mobile}</div>
                    {cs.receiptNumber && (
                      <div className="text-xs mt-1 font-mono" style={{ color: MID }}>
                        Receipt: {cs.receiptNumber}
                      </div>
                    )}
                    {cs.amount && (
                      <div className="text-xs" style={{ color: MID }}>
                        Paid: ₹{cs.amount.toLocaleString()}
                      </div>
                    )}
                    <PasswordRow id={cs._id} pwd={cs.tempPassword} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudentsPage;
