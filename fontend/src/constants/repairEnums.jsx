// src/constants/repairEnums.js

// Badge classes cho trạng thái (dùng ở list/sheet)
export const STATUS_MAP = {
  requested:     { label: "Requested",     cls: "bg-slate-200 text-slate-700" },
  approved:      { label: "Approved",      cls: "bg-blue-100 text-blue-700" },
  in_progress:   { label: "In progress",   cls: "bg-amber-100 text-amber-700" },
  pending_parts: { label: "Pending parts", cls: "bg-violet-100 text-violet-700" },
  completed:     { label: "Completed",     cls: "bg-emerald-100 text-emerald-700" },
  canceled:      { label: "Canceled",      cls: "bg-rose-100 text-rose-700" },
};

// Options cho filter/select (nếu bạn dùng ở UI lọc)
export const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In progress" },
  { value: "pending_parts", label: "Pending parts" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];
