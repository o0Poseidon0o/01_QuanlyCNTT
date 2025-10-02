const STATUS_META = {
  requested: { label: "Được yêu cầu", className: "bg-slate-200 text-slate-700" },
  approved: { label: "Đã duyệt", className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Đang xử lý", className: "bg-amber-100 text-amber-700" },
  pending_parts: { label: "Chờ linh kiện", className: "bg-violet-100 text-violet-700" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Huỷ", className: "bg-rose-100 text-rose-700" },
};

export const resolveStatusMeta = (statusKey, preferredLabel) => {
  const meta = STATUS_META[statusKey] || {};
  return {
    label: preferredLabel || meta.label || statusKey,
    className: meta.className || "bg-slate-200 text-slate-700",
  };
};

export default STATUS_META;
