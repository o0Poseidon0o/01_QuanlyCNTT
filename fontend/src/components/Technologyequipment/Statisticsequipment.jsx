import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/httpClient";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const API_BASE = "http://localhost:5000/api";

const BASE_COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#facc15", "#a855f7",
  "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#2dd4bf",
  "#60a5fa", "#34d399", "#fb7185", "#fde047", "#6366f1",
  "#84cc16", "#06b6d4", "#f59e0b", "#d946ef", "#f43f5e",
];

/** Vẽ text giữa doughnut (tổng) */
const centerTextPlugin = {
  id: "centerText",
  afterDraw(chart, _args, opts) {
    const { ctx } = chart;
    const dsMeta = chart.getDatasetMeta(0);
    if (!dsMeta || !dsMeta.data || !dsMeta.data.length) return;
    const { x, y } = dsMeta.data[0];
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = opts.color || "#374151";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(opts.textTop || "", x, y - 4);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = opts.subColor || "#6b7280";
    ctx.fillText(opts.textBottom || "", x, y + 14);
    ctx.restore();
  },
};
ChartJS.register(centerTextPlugin);

const Statisticsequipment = () => {
  /** Dữ liệu Doughnut: thiết bị theo loại (lọc được theo phòng ban) */
  const [deviceStats, setDeviceStats] = useState([]); // [{label, value}]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /** Danh sách phòng ban + chọn lọc cho doughnut */
  const [departments, setDepartments] = useState([]); // [{id_departments, department_name}]
  const [selectedDept, setSelectedDept] = useState(""); // "" = tất cả

  /** Dữ liệu Bar: tổng thiết bị theo phòng ban */
  const [deptTotals, setDeptTotals] = useState([]); // [{deptName, total}]
  const [deptNameToId, setDeptNameToId] = useState({}); // map name -> id (để click bar lọc doughnut)
  const [barLimit, setBarLimit] = useState(20); // top N

  // Lấy danh sách phòng ban
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API_BASE}/departments/all-departments`);
        const arr = r.data?.departments ?? r.data ?? [];
        const list = Array.isArray(arr) ? arr : [];
        setDepartments(list);
        const map = {};
        list.forEach((d) => { if (d?.department_name) map[d.department_name] = d.id_departments; });
        setDeptNameToId(map);
      } catch {
        setDepartments([]);
        setDeptNameToId({});
      }
    })();
  }, []);

  // Lấy dữ liệu doughnut theo phòng ban
  const fetchTypeStats = async (deptId) => {
    try {
      setErr("");
      setLoading(true);
      const url = `${API_BASE}/stasdevices/devices${deptId ? `?department_id=${deptId}` : ""}`;
      const devRes = await axios.get(url);
      const devData = (devRes.data || []).map((r) => ({
        label: String(r.device_type || r["Devicetype.device_type"] || r.type || "Khác"),
        value: Number(r.count || r.total || 0),
      }));
      setDeviceStats(devData);
    } catch (e) {
      console.error(e);
      setErr("Không lấy được dữ liệu thống kê.");
      setDeviceStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu tổng theo phòng ban (từ /by-department, cộng dồn theo department_name)
  const fetchDeptTotals = async () => {
    try {
      const r = await axios.get(`${API_BASE}/stasdevices/by-department`);
      const rows = Array.isArray(r.data) ? r.data : [];
      const map = {};
      for (const row of rows) {
        const name = row.department_name || "Chưa gán bộ phận";
        const cnt = Number(row.count || 0);
        map[name] = (map[name] || 0) + cnt;
      }
      const arr = Object.entries(map).map(([deptName, total]) => ({ deptName, total }));
      arr.sort((a, b) => b.total - a.total);
      setDeptTotals(arr);
    } catch (e) {
      console.warn("Không lấy được tổng theo phòng ban:", e?.message || e);
      setDeptTotals([]);
    }
  };

  useEffect(() => { fetchTypeStats(selectedDept); }, [selectedDept]);
  useEffect(() => { fetchDeptTotals(); }, []);

  const totalAll = useMemo(
    () => deviceStats.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [deviceStats]
  );

  /** Colors map cho doughnut (theo loại) */
  const colorMapTypes = useMemo(() => {
    const map = {};
    deviceStats.forEach((d, idx) => { map[d.label] = BASE_COLORS[idx % BASE_COLORS.length]; });
    return map;
  }, [deviceStats]);

  /** Dataset cho Doughnut */
  const doughnutData = useMemo(() => {
    const labels = deviceStats.map((d) => d.label);
    const data = deviceStats.map((d) => d.value);
    const backgroundColor = labels.map((lab, idx) => colorMapTypes[lab] || BASE_COLORS[idx % BASE_COLORS.length]);
    return {
      labels,
      datasets: [{ data, backgroundColor, borderWidth: 1 }],
    };
  }, [deviceStats, colorMapTypes]);

  const doughnutOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
      title: {
        display: true,
        text: `Thiết bị theo loại ${selectedDept ? `(PB #${selectedDept})` : "(Toàn hệ thống)"}`,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed ?? 0;
            const pct = totalAll ? Math.round((value / totalAll) * 100) : 0;
            return `${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
      centerText: {
        textTop: `${totalAll}`,
        textBottom: "Tổng thiết bị",
      },
    },
    cutout: "62%",
  }), [totalAll, selectedDept]);

  /** Dữ liệu cho Bar ngang (tổng theo phòng ban) */
  const topDeptTotals = useMemo(() => {
    if (!barLimit) return deptTotals;
    return deptTotals.slice(0, barLimit);
  }, [deptTotals, barLimit]);

  const barLabels = topDeptTotals.map((x) => x.deptName);
  const barValues = topDeptTotals.map((x) => x.total);
  const barColors = barLabels.map((_, i) => BASE_COLORS[i % BASE_COLORS.length]);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "Tổng thiết bị",
        data: barValues,
        backgroundColor: barColors,
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Tổng số thiết bị theo phòng ban" },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} thiết bị`,
        },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { ticks: { autoSkip: false } },
    },
    onClick: (_evt, elements) => {
      if (!elements?.length) return;
      const idx = elements[0].index;
      const label = barLabels[idx];
      const id = deptNameToId[label];
      if (id) setSelectedDept(String(id));
    },
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Thống kê hệ thống</h1>
        <p className="text-gray-600">Tổng quan theo phòng ban & chi tiết theo loại thiết bị</p>
      </div>

      {loading && <div className="mb-4 text-gray-600">Đang tải dữ liệu…</div>}
      {!!err && <div className="mb-4 text-red-600">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doughnut: Thiết bị theo loại (lọc phòng ban) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Phòng ban:</label>
            <select
              className="px-2 py-1 border rounded text-sm"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              title="Lọc theo phòng ban"
            >
              <option value="">Tất cả</option>
              {departments.map((d) => (
                <option key={d.id_departments} value={d.id_departments}>
                  {d.department_name} (#{d.id_departments})
                </option>
              ))}
            </select>
            {selectedDept && (
              <button
                className="ml-auto text-sm text-blue-600 underline"
                onClick={() => setSelectedDept("")}
                title="Bỏ lọc"
              >
                Bỏ lọc
              </button>
            )}
          </div>

          {(!deviceStats || deviceStats.length === 0) ? (
            <p className="text-sm text-gray-500">Không có dữ liệu thiết bị.</p>
          ) : (
            <div className="h-[340px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}

          {/* Legend nhỏ bên dưới (xếp theo giảm dần) */}
          {deviceStats.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {[...deviceStats].sort((a, b) => b.value - a.value).map((d, idx) => (
                <div key={d.label} className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex h-3 w-3 rounded"
                    style={{ backgroundColor: colorMapTypes[d.label] || BASE_COLORS[idx % BASE_COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600 truncate" title={d.label}>
                    {d.label}
                  </span>
                  <span className="ml-auto text-xs text-gray-700 tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bar ngang: Tổng thiết bị theo phòng ban */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Click một phòng ban để lọc biểu đồ doughnut bên trái
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Hiển thị:</label>
              <select
                value={barLimit}
                onChange={(e) => setBarLimit(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={0}>Tất cả</option>
              </select>
            </div>
          </div>

          {deptTotals.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có dữ liệu tổng theo phòng ban.</p>
          ) : (
            <div className="h-[420px]">
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statisticsequipment;
