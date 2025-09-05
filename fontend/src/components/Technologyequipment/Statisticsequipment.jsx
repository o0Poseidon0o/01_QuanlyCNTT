import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://localhost:5000/api";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#2ECC71", "#F39C12", "#E67E22", "#9B59B6", "#1ABC9C"];

const Statisticsequipment = () => {
  const [deviceStats, setDeviceStats] = useState([]);        // [{ device_type, count }]
  const [userStats, setUserStats] = useState([]);            // [{ department_name, count }]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setErr("");
        setLoading(true);

        const [devRes, usrRes] = await Promise.all([
          axios.get(`${API_BASE}/stasdevices/devices`),
          axios.get(`${API_BASE}/stasusers/users`),
        ]);

        if (!cancelled) {
          // Chuẩn hoá dữ liệu, fallback nếu backend trả khác key
          const devData = (devRes.data || []).map((r) => ({
            device_type: r.device_type || r.device_type || r["Devicetype.device_type"] || "Khác",
            count: Number(r.count || r.total || 0),
          }));

          const usrData = (usrRes.data || []).map((r) => ({
            department_name: r.department_name || r["Department.department_name"] || "Chưa gán bộ phận",
            count: Number(r.count || r.total || 0),
          }));

          setDeviceStats(devData);
          setUserStats(usrData);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Không lấy được dữ liệu thống kê.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const totalDevices = useMemo(
    () => deviceStats.reduce((s, i) => s + (Number(i.count) || 0), 0),
    [deviceStats]
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Thống kê hệ thống</h1>

      {loading && <div className="mb-4 text-gray-600">Đang tải dữ liệu…</div>}
      {!!err && <div className="mb-4 text-red-600">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ tròn - Thiết bị theo loại */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Thống kê thiết bị theo loại
            </h2>
            <span className="text-sm text-gray-500">Tổng: {totalDevices}</span>
          </div>

          <div className="text-sm text-gray-500 mb-3">
            {deviceStats.length === 0 && !loading ? "Chưa có dữ liệu" : null}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={deviceStats}
                dataKey="count"
                nameKey="device_type"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {deviceStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ cột - Người dùng theo bộ phận */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            Thống kê người dùng theo bộ phận
          </h2>

          <div className="text-sm text-gray-500 mb-3">
            {userStats.length === 0 && !loading ? "Chưa có dữ liệu" : null}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={userStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department_name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statisticsequipment;
