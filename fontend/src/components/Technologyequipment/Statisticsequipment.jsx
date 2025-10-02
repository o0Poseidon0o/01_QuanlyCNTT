import React, { useEffect, useState, useMemo } from "react";
import axios from "../../lib/httpClient";

const API_BASE = "http://localhost:5000/api";
const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#facc15", "#a855f7", "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#2dd4bf"];

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

  const totalUsers = useMemo(
    () => userStats.reduce((s, i) => s + (Number(i.count) || 0), 0),
    [userStats],
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

          <div className="space-y-3">
            {deviceStats.map((entry, index) => {
              const pct = totalDevices > 0 ? Math.round((entry.count / totalDevices) * 100) : 0;
              const color = COLORS[index % COLORS.length];
              return (
                <div key={`${entry.device_type}-${index}`} className="flex items-center gap-3">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="w-40 text-sm text-gray-600">{entry.device_type}</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-gray-700">{entry.count}</div>
                  <div className="w-12 text-right text-xs text-gray-500">{pct}%</div>
                </div>
              );
            })}
            {deviceStats.length === 0 && !loading && (
              <p className="text-sm text-gray-500">Không có dữ liệu thiết bị.</p>
            )}
          </div>
        </div>

        {/* Biểu đồ cột - Người dùng theo bộ phận */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            Thống kê người dùng theo bộ phận
          </h2>

          <div className="text-sm text-gray-500 mb-3">
            {userStats.length === 0 && !loading ? "Chưa có dữ liệu" : null}
          </div>

          <div className="space-y-3">
            {userStats.map((entry, index) => {
              const pct = totalUsers > 0 ? Math.round((entry.count / totalUsers) * 100) : 0;
              const color = COLORS[(index + 3) % COLORS.length];
              return (
                <div key={`${entry.department_name}-${index}`} className="flex items-center gap-3">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="w-48 text-sm text-gray-600">{entry.department_name}</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-gray-700">{entry.count}</div>
                  <div className="w-12 text-right text-xs text-gray-500">{pct}%</div>
                </div>
              );
            })}
            {userStats.length === 0 && !loading && (
              <p className="text-sm text-gray-500">Không có dữ liệu người dùng.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statisticsequipment;
