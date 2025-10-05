import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUpiApprovals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/upi-payments/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.items || []);
    } catch (e) {
      // eslint-disable-next-line
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const act = async (id, action) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_BASE_URL}/upi-payments/${id}/${action}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPending();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-28 md:pt-24 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-bold mb-4">Approve Payments</h1>
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-6 gap-2 p-3 text-xs font-semibold border-b">
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Course</div>
            <div>UTR</div>
            <div>Action</div>
          </div>
          {items.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No pending payments.</div>
          ) : (
            items.map((p) => (
              <div key={p._id} className="grid grid-cols-6 gap-2 p-3 text-sm border-b items-center">
                <div>{p.name}</div>
                <div className="truncate">{p.email}</div>
                <div>{p.phone}</div>
                <div>{p.courseTitle}</div>
                <div className="font-mono text-xs">{p.utrNumber}</div>
                <div className="space-x-2">
                  <button onClick={() => act(p._id, "approve")} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={() => act(p._id, "reject")} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUpiApprovals;


