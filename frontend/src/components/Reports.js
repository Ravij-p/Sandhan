import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#845EC2",
  "#D65DB1",
];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const apiBaseURL = process.env.REACT_APP_API_BASE_URL || "";
  // Fetch Stats
  useEffect(() => {
    axios
      .get(`${apiBaseURL}/stats`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Stats fetch error:", err));
  }, [apiBaseURL]);

  // Fetch Payments
  const fetchPayments = useCallback(async (pageNo = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${apiBaseURL}/payments?page=${pageNo}&limit=10`
      );
      setPayments(res.data.payments);
      setPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Payments fetch error:", err);
    }
    setLoading(false);
  }, [apiBaseURL]);

  useEffect(() => {
    fetchPayments(page);
  }, [page, fetchPayments]);

  // Excel Download
  const handleExportExcel = () => {
    axios({
      url: `${apiBaseURL}/export/excel`,
      method: "GET",
      responseType: "blob",
    }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Tushti_IAS_Report.xlsx");
      document.body.appendChild(link);
      link.click();
    });
  };

  return (
    <div className="p-6 space-y-8 pt-15 mt-15">
      <h1 className="text-2xl font-bold mt-16">📊 Reports & Analytics</h1>

      {/* Stats Section */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-2">Overall Stats</h2>
            <p className="text-gray-600">
              ✅ Total Paid Students: <b>{stats.totalStudents}</b>
            </p>
            <p className="text-gray-600">
              💰 Total Amount Collected: <b>₹{stats.totalAmount}</b>
            </p>
          </div>

          <div className="bg-white shadow rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-2">Download Report</h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
              onClick={handleExportExcel}
            >
              ⬇️ Export Excel
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && stats.courseStats.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">Students by Course</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.courseStats}
                  dataKey="students"
                  nameKey="course"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.courseStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">
              Amount Collected per Course
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.courseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Mobile</th>
                <th className="p-2 text-left">Course</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.mobile}</td>
                  <td className="p-2">{p.course}</td>
                  <td className="p-2">₹{p.amount}</td>
                  <td className="p-2">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-4 py-2 rounded-lg shadow ${page === 1
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            ◀ Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-4 py-2 rounded-lg shadow ${page === totalPages
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
