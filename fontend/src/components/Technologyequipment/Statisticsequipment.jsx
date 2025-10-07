import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/httpClient";

const API_BASE = "http://localhost:5000/api";

// Bảng màu mặc định (sẽ tự mở rộng nếu thiếu)
const BASE_COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#facc15", "#a855f7",
  "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#2dd4bf",
  "#60a5fa", "#34d399", "#fb7185", "#fde047", "#6366f1",
  "#84cc16", "#06b6d4", "#f59e0b", "#d946ef", "#f43f5e",
];

/** ===== Utils ===== */
function groupByDepartment(rows) {
  const out = {};
  for (const r of rows) {
    const dept = String(
      r.department_name ||
        r["Department.department_name"] ||
        "Chưa gán bộ phận"
    );
    const type = String(
      r.device_type ||
        r["Devicetype.device_type"] ||
        r.type ||
        "Khác"
    );
    const cnt = Number(r.count || r.total || 0);
    if (!out[dept]) out[dept] = { total: 0, types: {} };
    out[dept].types[type] = (out[dept].types[type] || 0) + cnt;
    out[dept].total += cnt;
  }
  return out;
}

function collectAllTypes(deviceStats, byDeptGrouped) {
  const set = new Set(
    (deviceStats || []).map((d) => String(d.device_type || "Khác"))
  );
  Object.values(byDeptGrouped || {}).forEach((dept) => {
    Object.keys(dept.types || {}).forEach((t) => set.add(String(t)));
  });
  return Array.from(set);
}

/** ===== Biểu đồ thanh ngang cho TỔNG loại thiết bị ===== */
const HorizontalBars = ({
  data,            // [{ label, value }]
  mode = "count",  // "count" | "percent"
  total = 0,
  sort = "valueDesc", // valueDesc | valueAsc | labelAsc | labelDesc
  colorsMap = {},
  emptyText = "Chưa có dữ liệu",
}) => {
  const sorted = useMemo(() => {
    const arr = [...data];
    switch (sort) {
      case "valueAsc":
        arr.sort((a, b) => a.value - b.value); break;
      case "labelAsc":
        arr.sort((a, b) => a.label.localeCompare(b.label, "vi")); break;
      case "labelDesc":
        arr.sort((a, b) => b.label.localeCompare(a.label, "vi")); break;
      default:
        arr.sort((a, b) => b.value - a.value); break;
    }
    return arr;
  }, [data, sort]);

  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {sorted.map((d) => {
        const pct = total > 0 ? (d.value / total) * 100 : 0;
        const widthPct = mode === "percent" ? pct : (d.value / max) * 100;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-40 shrink-0 text-sm text-gray-700 truncate" title={d.label}>
              {d.label}
            </div>
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.max(2, Math.round(widthPct))}%`,
                  backgroundColor: colorsMap[d.label] || "#e5e7eb",
                }}
                title={`${d.label}: ${d.value}${mode === "percent" ? ` (${Math.round(pct)}%)` : ""}`}
              />
            </div>
            <div className="w-20 text-right text-sm tabular-nums">
              {mode === "percent" ? `${Math.round(pct)}%` : d.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** ===== Hàng stacked bar cho từng phòng ban ===== */
const StackedBarRow = ({ name, info, colorsMap }) => {
  const total = info.total || 0;
  const entries = Object.entries(info.types).sort((a, b) => b[1] - a[1]);
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-medium text-gray-800 truncate" title={name}>
          {name}
        </h3>
        <span className="text-sm text-gray-500">Tổng: {total}</span>
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
        <div className="flex h-full w-full">
          {entries.map(([type, cnt]) => {
            const pct = total > 0 ? Math.max(2, Math.round((cnt / total) * 100)) : 0;
            return (
              <span
                key={type}
                title={`${type}: ${cnt}`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: colorsMap[type] || "#e5e7eb",
                }}
              />
            );
          })}
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {entries.map(([type, cnt]) => (
          <li key={type} className="flex items-center gap-2">
            <span
              className="inline-flex h-3 w-3 rounded"
              style={{ backgroundColor: colorsMap[type] || "#e5e7eb" }}
            />
            <span className="text-sm text-gray-700 flex-1 truncate" title={type}>
              {type}
            </span>
            <span className="text-sm text-gray-600 font-medium">{cnt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Statisticsequipment = () => {
  const [deviceStats, setDeviceStats] = useState([]); // [{ device_type, count }]
  const [byDeptRows, setByDeptRows] = useState([]);   // [{ department_name, device_type, count }]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Controls
  const [totalMode, setTotalMode] = useState("count"); // count | percent
  const [totalSort, setTotalSort] = useState("valueDesc"); // valueDesc | valueAsc | labelAsc | labelDesc
  const [deptQuery, setDeptQuery] = useState("");
  const [deptLimit, setDeptLimit] = useState(10);
  const [showAllDepts, setShowAllDepts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        setErr("");
        setLoading(true);

        // Tổng theo loại thiết bị
        const devRes = await axios.get(`${API_BASE}/stasdevices/devices`);
        const devData = (devRes.data || []).map((r) => ({
          device_type: r.device_type || r["Devicetype.device_type"] || r.type || "Khác",
          count: Number(r.count || r.total || 0),
        }));

        // Theo bộ phận & loại thiết bị
        let deptResData = [];
        try {
          const deptRes = await axios.get(`${API_BASE}/stasdevices/by-department`);
          deptResData = (deptRes.data || []).map((r) => ({
            department_name: r.department_name || r["Department.department_name"] || "Chưa gán bộ phận",
            device_type: r.device_type || r["Devicetype.device_type"] || r.type || "Khác",
            count: Number(r.count || r.total || 0),
          }));
        } catch (e) {
          console.warn("[WARN] Thiếu API /stasdevices/by-department (sẽ chỉ hiển thị panel tổng).");
        }

        if (!cancelled) {
          setDeviceStats(devData);
          setByDeptRows(deptResData);
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

  const byDeptGrouped = useMemo(() => groupByDepartment(byDeptRows), [byDeptRows]);

  const allTypes = useMemo(
    () => collectAllTypes(deviceStats, byDeptGrouped),
    [deviceStats, byDeptGrouped]
  );

  const colorMap = useMemo(() => {
    const map = {};
    allTypes.forEach((t, idx) => { map[t] = BASE_COLORS[idx % BASE_COLORS.length]; });
    return map;
  }, [allTypes]);

  const totalBarData = useMemo(
    () => deviceStats.map(d => ({ label: String(d.device_type || "Khác"), value: Number(d.count || 0) })),
    [deviceStats]
  );

  // Lọc & giới hạn phòng ban
  const filteredDeptEntries = useMemo(() => {
    const entries = Object.entries(byDeptGrouped);
    const q = deptQuery.trim().toLowerCase();
    const filtered = q
      ? entries.filter(([name]) => name.toLowerCase().includes(q))
      : entries;
    // Sắp theo tổng giảm dần
    filtered.sort((a, b) => (b[1].total || 0) - (a[1].total || 0));
    if (showAllDepts) return filtered;
    return filtered.slice(0, Math.max(1, deptLimit));
  }, [byDeptGrouped, deptQuery, deptLimit, showAllDepts]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Thống kê hệ thống</h1>

      {loading && <div className="mb-4 text-gray-600">Đang tải dữ liệu…</div>}
      {!!err && <div className="mb-4 text-red-600">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel trái — Biểu đồ thanh ngang: Thiết bị theo loại (tổng) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-700">
                Thiết bị theo loại (toàn hệ thống)
              </h2>
              <span className="text-sm text-gray-500">Tổng: {totalDevices}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={totalMode}
                onChange={(e) => setTotalMode(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                title="Chế độ hiển thị"
              >
                <option value="count">Hiển thị: Số lượng</option>
                <option value="percent">Hiển thị: %</option>
              </select>

              <select
                value={totalSort}
                onChange={(e) => setTotalSort(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                title="Sắp xếp"
              >
                <option value="valueDesc">Sắp xếp: Nhiều → Ít</option>
                <option value="valueAsc">Sắp xếp: Ít → Nhiều</option>
                <option value="labelAsc">Sắp xếp: A → Z</option>
                <option value="labelDesc">Sắp xếp: Z → A</option>
              </select>
            </div>
          </div>

          <HorizontalBars
            data={totalBarData}
            mode={totalMode}
            total={totalDevices}
            sort={totalSort}
            colorsMap={colorMap}
            emptyText="Không có dữ liệu thiết bị."
          />

          {/* Legend màu (gói gọn, nhiều cột để đỡ dài) */}
          {totalBarData.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {totalBarData.map((d) => (
                <div key={d.label} className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex h-3 w-3 rounded"
                    style={{ backgroundColor: colorMap[d.label] || "#e5e7eb" }}
                  />
                  <span className="text-xs text-gray-600 truncate" title={d.label}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel phải — Stacked bars: Loại thiết bị theo từng bộ phận */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Loại thiết bị hiện có của từng bộ phận
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm phòng ban…"
                value={deptQuery}
                onChange={(e) => setDeptQuery(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              />
              <select
                value={deptLimit}
                onChange={(e) => { setShowAllDepts(false); setDeptLimit(Number(e.target.value) || 10); }}
                className="px-2 py-1 border rounded text-sm"
                title="Hiển thị top N theo tổng thiết bị"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
              <button
                type="button"
                className="px-3 py-1 border rounded text-sm"
                onClick={() => setShowAllDepts((v) => !v)}
                title="Xem tất cả phòng ban"
              >
                {showAllDepts ? "Hiển thị Top" : "Xem tất cả"}
              </button>
            </div>
          </div>

          {Object.keys(byDeptGrouped).length === 0 ? (
            <p className="text-sm text-gray-500">
              {loading ? "Đang tải dữ liệu…" : "Chưa có dữ liệu phân bố theo bộ phận."}
            </p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
              {filteredDeptEntries.map(([deptName, info]) => (
                <StackedBarRow
                  key={deptName}
                  name={deptName}
                  info={info}
                  colorsMap={colorMap}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statisticsequipment;
