<<<<<<< ours
=======
const RepairRequest = require("../models/RepairTech/repairRequest");

>>>>>>> theirs
const canonicalKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

<<<<<<< ours
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
=======
const findEnumValue = (enumValues = [], candidates = []) => {
  const candidateSet = new Set((candidates || []).map((item) => canonicalKey(item)));
  for (const value of enumValues) {
    if (candidateSet.has(canonicalKey(value))) {
      return value;
    }
  }
  return null;
};

const createEnumDictionary = (enumValues = [], definitions = [], requestedDefaultKey = null) => {
  const canonicalLookup = new Map();
  const labelByKey = new Map();

  definitions.forEach(({ key, synonyms = [] }) => {
    if (!key) return;
    const variants = Array.from(new Set([key, ...synonyms]));
    const matchedValue = findEnumValue(enumValues, variants) || null;
    if (!matchedValue) return;

    labelByKey.set(key, matchedValue);
    const allVariants = new Set([...variants, matchedValue]);
    enumValues.forEach((value) => {
      if (canonicalKey(value) === canonicalKey(matchedValue)) {
        allVariants.add(value);
      }
    });
    allVariants.forEach((variant) => {
      const canon = canonicalKey(variant);
      if (!canonicalLookup.has(canon)) {
        canonicalLookup.set(canon, key);
      }
    });
  });

  enumValues.forEach((value) => {
    const canon = canonicalKey(value);
    if (!canonicalLookup.has(canon)) {
      const autoKey = canon || value;
      canonicalLookup.set(canon, autoKey);
      if (!labelByKey.has(autoKey)) {
        labelByKey.set(autoKey, value);
      }
    }
  });

  let defaultKey = requestedDefaultKey && labelByKey.has(requestedDefaultKey) ? requestedDefaultKey : null;
  if (!defaultKey) {
    const firstValue = enumValues[0];
    if (firstValue) {
      defaultKey = canonicalLookup.get(canonicalKey(firstValue)) || canonicalKey(firstValue) || null;
    }
  }
  if (!defaultKey) {
    const iterator = labelByKey.keys();
    const firstKey = iterator.next();
    defaultKey = firstKey.value || null;
  }

  const resolveKey = (value) => {
    if (value == null || value === "") return null;
    return canonicalLookup.get(canonicalKey(value)) || null;
  };

  const toDb = (value, fallbackKey = defaultKey) => {
    const key = resolveKey(value) || fallbackKey;
    if (!key) return null;
    return labelByKey.get(key) || null;
>>>>>>> theirs
  };

  const toCanonical = (dbValue, fallbackKey = null) => resolveKey(dbValue) || fallbackKey;

  const getLabel = (key, fallback = null) => labelByKey.get(key) || fallback;

  const getKeys = () => Array.from(labelByKey.keys());
<<<<<<< ours
=======
  const getValues = () => Array.from(labelByKey.values());
>>>>>>> theirs

  return {
    defaultKey,
    resolveKey,
    toDb,
    toCanonical,
    getLabel,
    getKeys,
<<<<<<< ours
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
=======
    getValues,
  };
};

const STATUS_VALUES = RepairRequest?.rawAttributes?.status?.values || [];
const SEVERITY_VALUES = RepairRequest?.rawAttributes?.severity?.values || [];
const PRIORITY_VALUES = RepairRequest?.rawAttributes?.priority?.values || [];

const STATUS_DEFINITIONS = [
  { key: "requested", synonyms: ["requested", "Được yêu cầu", "duoc yeu cau", "yeu cau"] },
  { key: "approved", synonyms: ["approved", "Đã duyệt", "da duyet"] },
  { key: "in_progress", synonyms: ["in_progress", "Đang xử lý", "dang xu ly"] },
  { key: "pending_parts", synonyms: ["pending_parts", "Chờ linh kiện", "cho linh kien"] },
  { key: "completed", synonyms: ["completed", "Hoàn tất", "hoan tat", "da hoan tat"] },
  { key: "canceled", synonyms: ["canceled", "cancelled", "Huỷ", "Hủy", "huy", "huy bo", "hủy bỏ"] },
];

const SEVERITY_DEFINITIONS = [
  { key: "critical", synonyms: ["critical", "Khẩn", "khan", "khẩn", "khẩn cấp", "khan cap"] },
  { key: "high", synonyms: ["high", "Cao"] },
  { key: "medium", synonyms: ["medium", "Trung bình", "trung binh"] },
  { key: "low", synonyms: ["low", "Thấp", "thap"] },
];

const PRIORITY_DEFINITIONS = [
  { key: "urgent", synonyms: ["urgent", "Khẩn", "khẩn", "khẩn cấp", "cao"] },
  { key: "high", synonyms: ["high", "Cao"] },
  { key: "normal", synonyms: ["normal", "Bình thường", "binh thuong"] },
  { key: "low", synonyms: ["low", "Thấp", "thap"] },
];

const STATUS_DICT = createEnumDictionary(STATUS_VALUES, STATUS_DEFINITIONS, "requested");
const SEVERITY_DICT = createEnumDictionary(SEVERITY_VALUES, SEVERITY_DEFINITIONS, "medium");
const PRIORITY_DICT = createEnumDictionary(PRIORITY_VALUES, PRIORITY_DEFINITIONS, "normal");

const formatTicketEnums = (row = {}) => {
  const statusValue = row.status;
  const severityValue = row.severity;
  const priorityValue = row.priority;

  const statusKey = STATUS_DICT.toCanonical(statusValue, statusValue);
  const severityKey = SEVERITY_DICT.toCanonical(severityValue, severityValue);
  const priorityKey = PRIORITY_DICT.toCanonical(priorityValue, priorityValue);

  return {
    ...row,
    status_raw: statusValue,
    status: statusKey,
    status_label: STATUS_DICT.getLabel(statusKey, statusValue),
    severity_raw: severityValue,
    severity: severityKey,
    severity_label: SEVERITY_DICT.getLabel(severityKey, severityValue),
    priority_raw: priorityValue,
    priority: priorityKey,
    priority_label: PRIORITY_DICT.getLabel(priorityKey, priorityValue),
>>>>>>> theirs
  };
};

const formatHistoryEnums = (historyRow = {}) => {
<<<<<<< ours
  const oldStatusKey = STATUS_DICT.toCanonical(historyRow.old_status, historyRow.old_status);
  const newStatusKey = STATUS_DICT.toCanonical(historyRow.new_status, historyRow.new_status);

  return {
    ...historyRow,
    old_status: oldStatusKey,
    old_status_label: STATUS_DICT.getLabel(oldStatusKey, historyRow.old_status),
    new_status: newStatusKey,
    new_status_label: STATUS_DICT.getLabel(newStatusKey, historyRow.new_status),
=======
  const oldValue = historyRow.old_status;
  const newValue = historyRow.new_status;
  const oldStatusKey = STATUS_DICT.toCanonical(oldValue, oldValue);
  const newStatusKey = STATUS_DICT.toCanonical(newValue, newValue);

  return {
    ...historyRow,
    old_status_raw: oldValue,
    old_status: oldStatusKey,
    old_status_label: STATUS_DICT.getLabel(oldStatusKey, oldValue),
    new_status_raw: newValue,
    new_status: newStatusKey,
    new_status_label: STATUS_DICT.getLabel(newStatusKey, newValue),
>>>>>>> theirs
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
