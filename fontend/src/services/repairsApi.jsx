// src/services/repairsApi.js
import axios from "../lib/httpClient"; // ✅ dùng 1 axios instance duy nhất
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildCanonicalFinder = (groups) => {
  const index = new Map();
  Object.entries(groups).forEach(([canonical, synonyms]) => {
    index.set(normalizeKey(canonical), canonical);
    synonyms.forEach((syn) => {
      index.set(normalizeKey(syn), canonical);
    });
  });
  return (value) => {
    if (value == null) return undefined;
    return index.get(normalizeKey(value));
  };
};

const STATUS_GROUPS = {
  requested: ["requested", "Được yêu cầu", "được yêu cầu", "duoc yeu cau"],
  approved: ["approved", "Đã duyệt", "đã duyệt", "da duyet"],
  in_progress: ["in_progress", "Đang xử lý", "đang xử lý", "dang xu ly"],
  pending_parts: ["pending_parts", "Chờ linh kiện", "chờ linh kiện", "cho linh kien"],
  completed: ["completed", "Hoàn tất", "hoàn tất", "hoan tat"],
  canceled: ["canceled", "Huỷ", "Hủy", "huỷ", "huy"],
};

const SEVERITY_GROUPS = {
  critical: ["critical", "Khẩn"],
  high: ["high", "Cao"],
  medium: ["medium", "Trung bình"],
  low: ["low", "Thấp"],
};

const PRIORITY_GROUPS = {
  urgent: ["urgent"],
  high: ["high", "Cao"],
  normal: ["normal", "Bình thường"],
  low: ["low", "Thấp"],
};

const findStatus = buildCanonicalFinder(STATUS_GROUPS);
const findSeverity = buildCanonicalFinder(SEVERITY_GROUPS);
const findPriority = buildCanonicalFinder(PRIORITY_GROUPS);

const STATUS_TO_DB = {
  requested: "Được yêu cầu",
  approved: "Đã duyệt",
  in_progress: "Đang xử lý",
  pending_parts: "Chờ linh kiện",
  completed: "Hoàn tất",
  canceled: "Huỷ",
};

const SEVERITY_TO_DB = {
  critical: "Khẩn",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const PRIORITY_TO_DB = {
  urgent: "Cao",
  high: "Cao",
  normal: "Bình thường",
  low: "Thấp",
};

const fromBackendStatus = (value) => findStatus(value) || value;
const fromBackendSeverity = (value) => findSeverity(value) || value;
const fromBackendPriority = (value) => findPriority(value) || value;

const toBackendStatus = (value) => {
  const canonical = findStatus(value);
  return canonical && STATUS_TO_DB[canonical] ? STATUS_TO_DB[canonical] : value;
};

const toBackendSeverity = (value) => {
  const canonical = findSeverity(value);
  return canonical && SEVERITY_TO_DB[canonical] ? SEVERITY_TO_DB[canonical] : value;
};

const toBackendPriority = (value) => {
  const canonical = findPriority(value);
  return canonical && PRIORITY_TO_DB[canonical] ? PRIORITY_TO_DB[canonical] : value;
};

const statusLabelFromApi = (row, statusKey) => row.status_label || STATUS_TO_DB[statusKey] || row.status;
const severityLabelFromApi = (row, severityKey) => row.severity_label || SEVERITY_TO_DB[severityKey] || row.severity;
const priorityLabelFromApi = (row, priorityKey) => row.priority_label || PRIORITY_TO_DB[priorityKey] || row.priority;

const mapTicketFromApi = (row = {}) => {
  const statusKey = fromBackendStatus(row.status);
  const severityKey = fromBackendSeverity(row.severity);
  const priorityKey = fromBackendPriority(row.priority);
  return {
    ...row,
    status: statusKey,
    severity: severityKey,
    priority: priorityKey,
    status_label: statusLabelFromApi(row, statusKey),
    severity_label: severityLabelFromApi(row, severityKey),
    priority_label: priorityLabelFromApi(row, priorityKey),
  };
};

const mapHistoryFromApi = (entry = {}) => {
  const oldStatusKey = fromBackendStatus(entry.old_status);
  const newStatusKey = fromBackendStatus(entry.new_status);
  return {
    ...entry,
    old_status: oldStatusKey,
    new_status: newStatusKey,
    old_status_label: entry.old_status_label || statusLabelFromApi(entry, oldStatusKey),
    new_status_label: entry.new_status_label || statusLabelFromApi(entry, newStatusKey),
  };
};

const mapSummaryFromApi = (summary = {}) => {
  const status = Array.isArray(summary.status)
    ? summary.status.map((item) => {
        const statusKey = fromBackendStatus(item.name);
        return {
          ...item,
          name: statusKey,
          label: item.label || statusLabelFromApi(item, statusKey),
        };
      })
    : [];
  return { ...summary, status };
};

const preparePayload = (payload = {}) => {
  const next = { ...payload };
  if ("status" in next) next.status = toBackendStatus(next.status);
  if ("severity" in next) next.severity = toBackendSeverity(next.severity);
  if ("priority" in next) next.priority = toBackendPriority(next.priority);
  return next;
};

export const listRepairs = async (params = {}) => {
  const res = await axios.get(`${API_BASE}/repairs`, {
    params,
    headers: { "Cache-Control": "no-cache" },
  });
  const data = Array.isArray(res.data) ? res.data.map(mapTicketFromApi) : res.data;
  return data;
};

export const getRepair = async (id) => {
  const res = await axios.get(`${API_BASE}/repairs/${id}`);
  const data = res.data || {};
  const ticket = data.ticket ? mapTicketFromApi(data.ticket) : null;
  const detail = data.detail ? mapTicketFromApi(data.detail) : null;
  const history = Array.isArray(data.history) ? data.history.map(mapHistoryFromApi) : [];
  return { ...data, ticket, detail, history };
};

export const createRepair = async (payload) => {
  const res = await axios.post(`${API_BASE}/repairs`, preparePayload(payload));
  return res.data;
};

export const updateStatus = async (id, payload) => {
  const res = await axios.patch(`${API_BASE}/repairs/${id}/status`, {
    ...payload,
    new_status: toBackendStatus(payload?.new_status),
  });
  return res.data;
};

export const upsertDetail = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/repairs/${id}/detail`, preparePayload(payload));
  return res.data;
};

export const addPart = async (id, partOrArray) => {
  const list = Array.isArray(partOrArray) ? partOrArray : [partOrArray];
  const res = await axios.post(`${API_BASE}/repairs/${id}/parts`, list);
  return res.data;
};

export const uploadFiles = async (id, files, uploaded_by) => {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  if (uploaded_by) fd.append("uploaded_by", uploaded_by);
  const res = await axios.post(`${API_BASE}/repairs/${id}/files`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getSummaryStats = async () => {
  const res = await axios.get(`${API_BASE}/repairs/summary`, {
    params: { _ts: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return mapSummaryFromApi(res.data || {});
};

// ✅ đồng bộ dùng cùng axios instance
export const getAssigneeVendorOptions = async () => {
  const res = await axios.get(`${API_BASE}/repairs/options`);
  return res.data; // { users: [...], vendors: [...] }
};
