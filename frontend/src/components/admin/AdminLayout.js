// c:\Sandhan\frontend\src\components\admin\AdminLayout.js
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Play,
  FileText,
  ShieldCheck,
  Settings,
  Image,
  Users,
} from "lucide-react";
import axios from "axios";

const AdminLayout = ({ children }) => {
  const [features, setFeatures] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/features`);
        setFeatures(res.data.features || []);
      } catch {}
    })();
  }, [API_BASE_URL]);

  const iconMap = {
    BookOpen,
    Play,
    FileText,
    ShieldCheck,
    Settings,
    Image,
    Users,
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[90px] px-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Panel
              </h2>
            </div>
            <nav className="p-2 space-y-1">
              {features.map((f) => {
                const Icon = iconMap[f.icon] || Settings;
                return (
                  <NavLink
                    key={f.key}
                    to={f.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="text-sm">{f.title}</span>
                  </NavLink>
                );
              })}
              {/* Fallback essential links */}
              <NavLink
                to="/admin/students"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <Users size={18} />
                <span className="text-sm">Students</span>
              </NavLink>
            </nav>
          </div>
        </aside>
        <main className="col-span-12 lg:col-span-9">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
