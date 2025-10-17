// src/components/Staticsequipment/Statisticsequipment.jsx
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
import { useLocation } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const API_BASE = "http://localhost:5000/api";

const BASE_COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#facc15", "#a855f7",
  "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#2dd4bf",
  "#60a5fa", "#34d399", "#fb7185", "#fde047", "#6366f1",
  "#84cc16", "#06b6d4", "#f59e0b", "#d946ef", "#f43f5e",
];

/** Phát hiện màu theo Light/Dark để chữ sáng rõ hơn */
function getThemeColors() {
  const isDark =
    document.documentElement.classList.contains("dark") ||
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

  return {
    text: isDark ? "#F3F4F6" : "#111827",
    subText: isDark ? "#D1D5DB" : "#4B5563",
    grid: isDark ? "rgba(229,231,235,0.15)" : "rgba(156,163,175,0.3)",
    border: isDark ? "#374151" : "#E5E7EB",
    cardBg: isDark ? "bg-gray-800" : "bg-white",
    cardBorder: isDark ? "border-gray-700" : "border-gray-200",
    link: isDark ? "text-sky-400" : "text-sky-600",
  };
}

/** Plugin vẽ text giữa doughnut (tổng) */
const centerTextPlugin = {
  id: "centerText",
  afterDraw(chart, _args, opts) {
    const { ctx } = chart;
    const dsMeta = chart.getDatasetMeta(0);
    if (!dsMeta || !dsMeta.data || !dsMeta.data.length) return;
    const { x, y } = dsMeta.data[0];
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = opts.color;
    ctx.font = "700 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(opts.textTop || "", x, y - 4);
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = opts.subColor;
    ctx.fillText(opts.textBottom || "", x, y + 14);
    ctx.restore();
  },
};
ChartJS.register(centerTextPlugin);

const Statisticsequipment = () => {
  const theme = getThemeColors();
  const location = useLocation();

  /** Key để ép remount chart khi đổi route (fix: vào trang thấy UI cũ) */
  const [viewKey, setViewKey] = useState(0);
  useEffect(() => {
    setViewKey((k) => k + 1);
    // tùy ý: reset bộ lọc khi vào trang từ route khác
    setSelectedDept("");
  }, [location.pathname]);

  /** Dữ liệu Doughnut: thiết bị theo loại (lọc được theo phòng ban) */
  const [deviceStats, setDeviceStats] = useState([]); // [{label, value}]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /** Danh sách phòng ban + chọn lọc cho doughnut */
  const [departments, setDepartments] = useState([]); // [{id_departments, department_name}]
  const [selectedDept, setSelectedDept] = useState(""); // "" = tất cả
  const selectedDeptName = useMemo(() => {
    const found = departments.find(d => String(d.id_departments) === String(selectedDept));
    return found?.department_name || "";
  }, [departments, selectedDept]);

  /** Dữ liệu Bar: tổng thiết bị theo phòng ban */
  const [deptTotals, setDeptTotals] = useState([]); // [{deptName, total}]
  const [deptNameToId, setDeptNameToId] = useState({}); // map name -> id (để click bar lọc doughnut)
  const [barLimit, setBarLimit] = useState(20); // top N

  /** Helper chống cache cho axios */
  const nocache = () => ({ headers: { "Cache-Control": "no-cache" }, params: { _ts: Date.now() } });

  // Lấy danh sách phòng ban
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API_BASE}/departments/all-departments`, nocache());
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
    // cũng ép refetch khi viewKey đổi (khi vào lại route)
  }, [viewKey]);

  // Lấy dữ liệu doughnut theo phòng ban
  const fetchTypeStats = async (deptId) => {
    try {
      setErr("");
      setLoading(true);
      const url = `${API_BASE}/stasdevices/devices${deptId ? `?department_id=${deptId}` : ""}`;
      const devRes = await axios.get(url, nocache());
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

  // Lấy dữ liệu tổng theo phòng ban
  const fetchDeptTotals = async () => {
    try {
      const r = await axios.get(`${API_BASE}/stasdevices/by-department`, nocache());
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

  // fetch khi đổi bộ lọc & khi vào lại route
  useEffect(() => { fetchTypeStats(selectedDept); }, [selectedDept, viewKey]);
  useEffect(() => { fetchDeptTotals(); }, [viewKey]);

  /** Tổng để hiển thị ở giữa doughnut loại thiết bị (toàn hệ thống hoặc theo phòng ban) */
  const totalAll = useMemo(
    () => deviceStats.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [deviceStats]
  );

  /** Tổng gộp theo phòng ban (dựa vào API by-department đã DISTINCT) */
  const totalFromDept = useMemo(
    () => deptTotals.reduce((s, x) => s + (Number(x.total) || 0), 0),
    [deptTotals]
  );

  /** Kiểm tra khớp tổng — chỉ thông báo, không hiệu chỉnh */
  const isTotalMismatch = useMemo(() => {
    if (selectedDept) return false;
    return totalAll !== totalFromDept;
  }, [totalAll, totalFromDept, selectedDept]);

  /** Tính “VL vs HCM” từ deptTotals */
  const vlVsHcm = useMemo(() => {
    const vl = deptTotals
      .filter((x) => /\(VL\)/i.test(x.deptName))
      .reduce((s, x) => s + (Number(x.total) || 0), 0);

    const total = deptTotals.reduce((s, x) => s + (Number(x.total) || 0), 0);
    const hcm = Math.max(total - vl, 0);

    return { vl, hcm, total };
  }, [deptTotals]);

  /** Colors map cho doughnut (theo loại) */
  const colorMapTypes = useMemo(() => {
    const map = {};
    deviceStats.forEach((d, idx) => { map[d.label] = BASE_COLORS[idx % BASE_COLORS.length]; });
    return map;
  }, [deviceStats]);

  /** Dataset + options cho Doughnut loại thiết bị */
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
      legend: { position: "right", labels: { color: theme.text } },
      title: {
        display: true,
        text: `Thiết bị theo loại ${selectedDept ? `(${selectedDeptName})` : "(Toàn hệ thống)"}`,
        color: theme.text,
      },
      tooltip: {
        bodyColor: theme.text,
        titleColor: theme.text,
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
        color: theme.text,
        subColor: theme.subText,
      },
    },
    cutout: "62%",
  }), [totalAll, selectedDept, selectedDeptName, theme]);

  /** Doughnut “VL vs HCM” */
  const vlHcmData = useMemo(() => ({
    labels: ["Vĩnh Long (VL)", "HCM"],
    datasets: [{
      data: [vlVsHcm.vl, vlVsHcm.hcm],
      backgroundColor: [BASE_COLORS[0], BASE_COLORS[8]],
      borderWidth: 1,
    }],
  }), [vlVsHcm]);

  const vlHcmOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: theme.text } },
      title: { display: true, text: "Phân bổ thiết bị: VL vs HCM", color: theme.text },
      tooltip: {
        bodyColor: theme.text,
        titleColor: theme.text,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed ?? 0;
            const pct = vlVsHcm.total ? Math.round((val / vlVsHcm.total) * 100) : 0;
            return `${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
      centerText: {
        textTop: `${vlVsHcm.total}`,
        textBottom: "Tổng thiết bị",
        color: theme.text,
        subColor: theme.subText,
      },
    },
    cutout: "62%",
  }), [vlVsHcm, theme]);

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
      legend: { display: false, labels: { color: theme.text } },
      title: { display: true, text: "Tổng số thiết bị theo phòng ban", color: theme.text },
      tooltip: {
        bodyColor: theme.text,
        titleColor: theme.text,
        callbacks: { label: (ctx) => ` ${ctx.raw} thiết bị` },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0, color: theme.text }, grid: { color: theme.grid } },
      y: { ticks: { autoSkip: false, color: theme.text }, grid: { color: theme.grid } },
    },
    onClick: (_evt, elements) => {
      if (!elements?.length) return;
      const idx = elements[0].index;
      const label = barLabels[idx];
      const id = deptNameToId[label];
      if (id) setSelectedDept(String(id));
    },
  };

  /** === Thống kê nhanh theo phòng ban (QCTM: 3 PC, 4 Laptop, …) === */
  const quickSummary = useMemo(() => {
    if (!selectedDept || deviceStats.length === 0) return [];
    return [...deviceStats]
      .filter(x => (Number(x.value) || 0) > 0)
      .sort((a, b) => b.value - a.value);
  }, [selectedDept, deviceStats]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">📊 Thống kê hệ thống</h1>
        {!selectedDept && (
          <div
            className={`ml-auto text-xs px-3 py-2 rounded border ${isTotalMismatch ? "text-red-600 border-red-400 dark:text-rose-300 dark:border-rose-400" : "opacity-80"}`}
            title="So sánh tổng toàn hệ thống và tổng gộp theo phòng ban"
          >
            Tổng (theo loại): <b>{totalAll}</b> &nbsp;|&nbsp; Theo phòng ban: <b>{totalFromDept}</b>
            {isTotalMismatch && <span> &nbsp;• Phát hiện lệch tổng</span>}
          </div>
        )}
        {selectedDept && (
          <div className="ml-auto text-xs px-3 py-2 rounded border opacity-80" style={{ borderColor: theme.border }}>
            Đang lọc: <b>{selectedDeptName}</b> • Tổng: <b>{totalAll}</b>
          </div>
        )}
      </div>

      {loading && <div className="mb-4 opacity-80">Đang tải dữ liệu…</div>}
      {!!err && <div className="mb-4 text-red-600 dark:text-rose-400">{err}</div>}

      {/* Bố cục 3 cột ở màn lớn */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Doughnut: Thiết bị theo loại (lọc phòng ban) */}
        <div className={`rounded-2xl shadow-sm border p-6 ${getThemeColors().cardBg} border ${getThemeColors().cardBorder}`}>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm opacity-80">Phòng ban:</label>
            <select
              className="px-2 py-1 rounded text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
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
                className={`ml-auto text-sm underline ${getThemeColors().link}`}
                onClick={() => setSelectedDept("")}
                title="Bỏ lọc"
              >
                Bỏ lọc
              </button>
            )}
          </div>

          {(!deviceStats || deviceStats.length === 0) ? (
            <p className="text-sm opacity-70">Không có dữ liệu thiết bị.</p>
          ) : (
            <div className="h-[340px]">
              {/* key để chart remount khi đổi route */}
              <Doughnut key={`doughnut-${viewKey}-${selectedDept || "all"}`} data={doughnutData} options={doughnutOptions} />
            </div>
          )}

          {/* Legend nhỏ bên dưới (xếp theo giảm dần) */}
          {deviceStats.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {[...deviceStats].sort((a, b) => b.value - a.value).map((d, idx) => (
                <div key={d.label} className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex h-3 w-3 rounded"
                    style={{ backgroundColor: (BASE_COLORS[idx % BASE_COLORS.length]) }}
                  />
                  <span className="text-xs opacity-90 truncate" title={d.label}>
                    {d.label}
                  </span>
                  <span className="ml-auto text-xs tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doughnut: VL vs HCM */}
        <div className={`rounded-2xl shadow-sm border p-6 ${theme.cardBg} border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-80">
              Tự nhận diện theo tên phòng ban (có “(VL)” → Vĩnh Long; còn lại → HCM)
            </span>
          </div>
          <div className="h-[360px]">
            <Doughnut key={`vlhcm-${viewKey}`} data={vlHcmData} options={vlHcmOptions} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded" style={{ background: BASE_COLORS[0] }} />
              <span>VL:</span>
              <span className="ml-auto font-medium tabular-nums">{vlVsHcm.vl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded" style={{ background: BASE_COLORS[8] }} />
              <span>HCM:</span>
              <span className="ml-auto font-medium tabular-nums">{vlVsHcm.hcm}</span>
            </div>
          </div>
        </div>

        {/* Bar ngang: Tổng thiết bị theo phòng ban */}
        <div className={`rounded-2xl shadow-sm border p-6 ${theme.cardBg} border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-80">
              Click một phòng ban để lọc biểu đồ “Thiết bị theo loại”
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-80">Hiển thị:</label>
              <select
                value={barLimit}
                onChange={(e) => setBarLimit(Number(e.target.value))}
                className="px-2 py-1 rounded text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={0}>Tất cả</option>
              </select>
            </div>
          </div>

          {deptTotals.length === 0 ? (
            <p className="text-sm opacity-70">Chưa có dữ liệu tổng theo phòng ban.</p>
          ) : (
            <div className="h-[460px]">
              <Bar key={`bar-${viewKey}`} data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>

      {/* === Thống kê nhanh theo phòng ban (QCTM: 3 PC, 4 Laptop, ...) === */}
      <div className="mt-8">
        <div className={`rounded-2xl shadow-sm border p-6 ${theme.cardBg} border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              🧮 Thống kê nhanh theo phòng ban
              {selectedDeptName ? `: ${selectedDeptName}` : ""}
            </h2>
            {!selectedDept && (
              <span className="text-sm opacity-75">
                Chọn 1 phòng ban (ví dụ <b>QCTM</b>) để xem chi tiết “PC: 3, Laptop: 4, …”
              </span>
            )}
          </div>

          {selectedDept ? (
            quickSummary.length === 0 ? (
              <p className="text-sm opacity-70">Phòng ban này chưa có dữ liệu thiết bị.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickSummary.map((it, idx) => (
                  <div
                    key={it.label}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                    style={{ borderColor: theme.border }}
                  >
                    <span
                      className="inline-block h-3 w-3 rounded"
                      style={{ background: BASE_COLORS[idx % BASE_COLORS.length] }}
                    />
                    <span className="text-sm truncate" title={it.label}>{it.label}</span>
                    <span className="ml-auto font-medium tabular-nums">{it.value}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm opacity-75">
              Hãy chọn phòng ban ở phần “Thiết bị theo loại” hoặc click 1 thanh trong biểu đồ Bar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statisticsequipment;
