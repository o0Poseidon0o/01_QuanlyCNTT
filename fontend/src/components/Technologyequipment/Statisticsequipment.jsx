import React from "react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

// ✅ Dữ liệu mẫu cho biểu đồ thiết bị
const deviceStats = [
  { device_type: "Laptop", count: 12 },
  { device_type: "Monitor", count: 8 },
  { device_type: "Printer", count: 3 },
  { device_type: "Server", count: 2 },
  { device_type: "Router", count: 5 },
];

// ✅ Dữ liệu mẫu cho biểu đồ người dùng
const userStats = [
  { department_name: "IT", count: 10 },
  { department_name: "HR", count: 6 },
  { department_name: "Finance", count: 4 },
  { department_name: "Sales", count: 8 },
  { department_name: "Marketing", count: 5 },
];

const Statisticsequipment = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Thống kê hệ thống</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ tròn - Thiết bị theo loại */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            Thống kê thiết bị theo loại
          </h2>
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
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={userStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department_name" />
              <YAxis />
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
