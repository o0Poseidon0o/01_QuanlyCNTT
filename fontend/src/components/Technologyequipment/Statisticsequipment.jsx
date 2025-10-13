import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/httpClient";

const API_BASE = "http://localhost:5000/api";

const BASE_COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#facc15", "#a855f7",
  "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#2dd4bf",
  "#60a5fa", "#34d399", "#fb7185", "#fde047", "#6366f1",
  "#84cc16", "#06b6d4", "#f59e0b", "#d946ef", "#f43f5e",
];

/** ==== Donut chart utils ==== */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutSlicePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const pOuterStart = polarToCartesian(cx, cy, rOuter, startDeg);
  const pOuterEnd   = polarToCartesian(cx, cy, rOuter, endDeg);
  const pInnerEnd   = polarToCartesian(cx, cy, rInner, endDeg);
  const pInnerStart = polarToCartesian(cx, cy, rInner, startDeg);
  return [
    `M ${pOuterStart.x} ${pOuterStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${pOuterEnd.x} ${pOuterEnd.y}`,
    `L ${pInnerEnd.x} ${pInnerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${pInnerStart.x} ${pInnerStart.y}`,
    "Z",
  ].join(" ");
}
const PieDonut = ({ data, colorsMap, radius=120, innerRadius=70, onHoverIndex, hoverIndex=null }) => {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const cx = radius + 6, cy = radius + 6, w = (radius + 6) * 2, h = w;
  if (!total) return <p className="text-sm text-gray-500">Không có dữ liệu để vẽ biểu đồ.</p>;
  let acc = -90;
  const slices = data.map((d, idx) => {
    const val = Number(d.value) || 0;
    const deg = (val / total) * 360;
    const start = acc, end = acc + deg; acc = end;
    return { ...d, start, end, idx };
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {slices.map((s) => {
        const isHover = hoverIndex === s.idx;
        const rOuter = isHover ? radius + 6 : radius;
        const path = donutSlicePath(cx, cy, rOuter, innerRadius, s.start, s.end);
        const fill = colorsMap[s.label] || "#e5e7eb";
        return (
          <path
            key={s.label}
            d={path}
            fill={fill}
            stroke="#fff"
            strokeWidth={1}
            style={{ cursor: "pointer", transition: "all .15s ease", opacity: isHover ? 0.9 : 1 }}
            onMouseEnter={() => onHoverIndex?.(s.idx)}
            onMouseLeave={() => onHoverIndex?.(null)}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={innerRadius - 1} fill="#fff" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-700" style={{ fontSize: 18, fontWeight: 700 }}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 12 }}>
        Tổng thiết bị
      </text>
    </svg>
  );
};

const Statisticsequipment = () => {
  const [deviceStats, setDeviceStats] = useState([]); // [{label, value}]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Bộ lọc phòng ban
  const [departments, setDepartments] = useState([]); // [{id_departments, department_name}]
  const [selectedDept, setSelectedDept] = useState(""); // "" = tất cả

  // Hiển thị
  const [displayMode, setDisplayMode] = useState("count"); // "count" | "percent"
  const [hoverIndex, setHoverIndex] = useState(null);

  // Lấy danh sách phòng ban (nếu có endpoint khác, đổi URL bên dưới)
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API_BASE}/departments/all-departments`);
        const arr = r.data?.departments ?? r.data ?? [];
        setDepartments(Array.isArray(arr) ? arr : []);
      } catch {
        setDepartments([]); // nếu không có API, vẫn cho nhập tay ID nếu muốn (tuỳ chỉnh thêm)
      }
    })();
  }, []);

  // Lấy thống kê theo bộ lọc
  const fetchStats = async (deptId) => {
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

  useEffect(() => { fetchStats(selectedDept); }, [selectedDept]);

  const total = useMemo(() => deviceStats.reduce((s, d) => s + (Number(d.value) || 0), 0), [deviceStats]);

  const colorMap = useMemo(() => {
    const map = {};
    deviceStats.forEach((d, idx) => { map[d.label] = BASE_COLORS[idx % BASE_COLORS.length]; });
    return map;
  }, [deviceStats]);

  const legend = useMemo(() => {
    const arr = [...deviceStats];
    arr.sort((a, b) => (b.value || 0) - (a.value || 0));
    return arr;
  }, [deviceStats]);

  const activeItem = hoverIndex != null ? deviceStats[hoverIndex] : null;
  const activePct = activeItem && total ? Math.round((activeItem.value / total) * 100) : 0;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Thống kê hệ thống</h1>
        <p className="text-gray-600">Thiết bị theo loại (lọc được theo phòng ban)</p>
      </div>

      {loading && <div className="mb-4 text-gray-600">Đang tải dữ liệu…</div>}
      {!!err && <div className="mb-4 text-red-600">{err}</div>}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              title="Chế độ hiển thị"
            >
              <option value="count">Hiển thị: Số lượng</option>
              <option value="percent">Hiển thị: %</option>
            </select>
          </div>
        </div>

        {(!deviceStats || deviceStats.length === 0) ? (
          <p className="text-sm text-gray-500">Không có dữ liệu thiết bị.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="flex items-center justify-center">
              <PieDonut
                data={deviceStats}
                colorsMap={colorMap}
                radius={120}
                innerRadius={70}
                hoverIndex={hoverIndex}
                onHoverIndex={setHoverIndex}
              />
            </div>

            <div className="space-y-4">
              {activeItem ? (
                <div className="rounded-lg border p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-3 w-3 rounded"
                      style={{ backgroundColor: colorMap[activeItem.label] || "#e5e7eb" }}
                    />
                    <span className="font-medium text-gray-800">{activeItem.label}</span>
                  </div>
                  <div className="mt-1 text-gray-700 tabular-nums">
                    {displayMode === "percent"
                      ? `${activePct}%`
                      : `${activeItem.value} thiết bị`}{" "}
                    <span className="text-gray-500 text-sm">
                      ({Math.round((activeItem.value / (total || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-3 text-gray-600 bg-gray-50">
                  Di chuột vào lát biểu đồ để xem chi tiết.
                </div>
              )}

              <div className="max-h-[60vh] overflow-auto pr-1">
                <ul className="space-y-2">
                  {legend.map((d) => {
                    const pct = total ? Math.round((d.value / total) * 100) : 0;
                    const idx = deviceStats.findIndex((x) => x.label === d.label);
                    const isHover = hoverIndex === idx;
                    return (
                      <li
                        key={d.label}
                        className={`flex items-center justify-between gap-3 p-2 rounded ${isHover ? "bg-blue-50" : ""}`}
                        onMouseEnter={() => setHoverIndex(idx)}
                        onMouseLeave={() => setHoverIndex(null)}
                        style={{ cursor: "default" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-flex h-3 w-3 rounded"
                            style={{ backgroundColor: colorMap[d.label] || "#e5e7eb" }}
                          />
                          <span className="text-sm text-gray-700 truncate" title={d.label}>
                            {d.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800 tabular-nums">
                          {displayMode === "percent" ? `${pct}%` : d.value}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statisticsequipment;
