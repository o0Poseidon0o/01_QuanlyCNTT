const STATUS_META = Object.freeze({
  requested: { label: "Được yêu cầu", className: "bg-slate-200 text-slate-700" },
  approved: { label: "Đã duyệt", className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Đang xử lý", className: "bg-amber-100 text-amber-700" },
  pending_parts: { label: "Chờ linh kiện", className: "bg-violet-100 text-violet-700" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Huỷ", className: "bg-rose-100 text-rose-700" },
});

export const STATUS_KEYS = Object.freeze(Object.keys(STATUS_META));

export const SEVERITY_OPTIONS = Object.freeze([
  { value: "critical", label: "Khẩn" },
  { value: "high", label: "Cao" },
  { value: "medium", label: "Trung bình" },
  { value: "low", label: "Thấp" },
]);

export const PRIORITY_OPTIONS = Object.freeze([
  { value: "urgent", label: "Khẩn" },
  { value: "high", label: "Cao" },
  { value: "normal", label: "Bình thường" },
  { value: "low", label: "Thấp" },
]);

export const resolveStatusMeta = (statusKey, preferredLabel) => {
  const meta = STATUS_META[statusKey] || {};
  return {
    label: preferredLabel || meta.label || statusKey,
    className: meta.className || "bg-slate-200 text-slate-700",
  };
};

// Backwards compatibility for legacy imports that expected STATUS_MAP
export const STATUS_MAP = STATUS_META;

export default STATUS_META;
