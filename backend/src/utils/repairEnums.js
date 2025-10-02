const canonicalKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const createEnumDictionary = (items, defaultKey) => {
  const keyByCanonical = new Map();
  const labelByKey = new Map();

  items.forEach(({ key, label, synonyms = [] }) => {
    labelByKey.set(key, label);
    [key, label, ...synonyms].forEach((variant) => {
      keyByCanonical.set(canonicalKey(variant), key);
    });
  });

  const resolveKey = (value) => {
    if (value == null || value === "") return null;
    return keyByCanonical.get(canonicalKey(value)) || null;
  };

  const toDb = (value, fallbackKey = defaultKey) => {
    const resolvedKey = resolveKey(value) || fallbackKey;
    if (!resolvedKey) return null;
    return labelByKey.get(resolvedKey) || null;
  };

  const toCanonical = (dbValue, fallbackKey = null) => resolveKey(dbValue) || fallbackKey;

  const getLabel = (key, fallback = null) => labelByKey.get(key) || fallback;

  const getKeys = () => Array.from(labelByKey.keys());

  return {
    defaultKey,
    resolveKey,
    toDb,
    toCanonical,
    getLabel,
    getKeys,
  };
};

const STATUS_DICT = createEnumDictionary(
  [
    { key: "requested", label: "Được yêu cầu", synonyms: ["được yêu cầu", "duoc yeu cau"] },
    { key: "approved", label: "Đã duyệt", synonyms: ["da duyet"] },
    { key: "in_progress", label: "Đang xử lý", synonyms: ["dang xu ly"] },
    { key: "pending_parts", label: "Chờ linh kiện", synonyms: ["cho linh kien"] },
    { key: "completed", label: "Hoàn tất", synonyms: ["hoan tat"] },
    { key: "canceled", label: "Huỷ", synonyms: ["huy", "cancelled", "hủy"] },
  ],
  "requested",
);

const SEVERITY_DICT = createEnumDictionary(
  [
    { key: "critical", label: "Khẩn", synonyms: ["khan", "khẩn"] },
    { key: "high", label: "Cao" },
    { key: "medium", label: "Trung bình", synonyms: ["trung binh"] },
    { key: "low", label: "Thấp", synonyms: ["thap"] },
  ],
  "medium",
);

const PRIORITY_DICT = createEnumDictionary(
  [
    { key: "urgent", label: "Cao", synonyms: ["khan"] },
    { key: "high", label: "Cao" },
    { key: "normal", label: "Bình thường", synonyms: ["binh thuong"] },
    { key: "low", label: "Thấp", synonyms: ["thap"] },
  ],
  "normal",
);

const formatTicketEnums = (row = {}) => {
  const statusKey = STATUS_DICT.toCanonical(row.status, row.status);
  const severityKey = SEVERITY_DICT.toCanonical(row.severity, row.severity);
  const priorityKey = PRIORITY_DICT.toCanonical(row.priority, row.priority);

  return {
    ...row,
    status: statusKey,
    status_label: STATUS_DICT.getLabel(statusKey, row.status),
    severity: severityKey,
    severity_label: SEVERITY_DICT.getLabel(severityKey, row.severity),
    priority: priorityKey,
    priority_label: PRIORITY_DICT.getLabel(priorityKey, row.priority),
  };
};

const formatHistoryEnums = (historyRow = {}) => {
  const oldStatusKey = STATUS_DICT.toCanonical(historyRow.old_status, historyRow.old_status);
  const newStatusKey = STATUS_DICT.toCanonical(historyRow.new_status, historyRow.new_status);

  return {
    ...historyRow,
    old_status: oldStatusKey,
    old_status_label: STATUS_DICT.getLabel(oldStatusKey, historyRow.old_status),
    new_status: newStatusKey,
    new_status_label: STATUS_DICT.getLabel(newStatusKey, historyRow.new_status),
  };
};

const getCanceledDbValue = () => STATUS_DICT.toDb("canceled", STATUS_DICT.defaultKey);
const getDefaultStatusDbValue = () => STATUS_DICT.toDb(STATUS_DICT.defaultKey, STATUS_DICT.defaultKey);
const getDefaultSeverityDbValue = () => SEVERITY_DICT.toDb(SEVERITY_DICT.defaultKey, SEVERITY_DICT.defaultKey);
const getDefaultPriorityDbValue = () => PRIORITY_DICT.toDb(PRIORITY_DICT.defaultKey, PRIORITY_DICT.defaultKey);

module.exports = {
  canonicalKey,
  createEnumDictionary,
  STATUS_DICT,
  SEVERITY_DICT,
  PRIORITY_DICT,
  formatTicketEnums,
  formatHistoryEnums,
  getCanceledDbValue,
  getDefaultStatusDbValue,
  getDefaultSeverityDbValue,
  getDefaultPriorityDbValue,
};
