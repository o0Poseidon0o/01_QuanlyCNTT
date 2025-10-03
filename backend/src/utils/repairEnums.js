// utils/ticketEnums.js (gợi ý tên file)

const RepairRequest = require("../models/RepairTech/repairRequest");

/**
 * Chuẩn hoá chuỗi để so khớp "không dấu, thường, snake"
 */
const canonicalKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Tìm giá trị enum trong danh sách enumValues khớp với 1 trong các ứng viên (candidates)
 */
const findEnumValue = (enumValues = [], candidates = []) => {
  const candidateSet = new Set((candidates || []).map((item) => canonicalKey(item)));
  for (const value of enumValues) {
    if (candidateSet.has(canonicalKey(value))) {
      return value;
    }
  }
  return null;
};

/**
 * Tạo từ điển enum độc lập với DB, nhưng map về đúng giá trị ENUM đang khai báo trong model
 * - enumValues: danh sách giá trị thực trong DB (Sequelize ENUM)
 * - definitions: [{ key, synonyms: [] }]: "key" là khoá canonical của bạn; synonyms để bắt nhiều cách viết
 * - requestedDefaultKey: khoá mặc định muốn dùng (nếu tồn tại)
 */
const createEnumDictionary = (enumValues = [], definitions = [], requestedDefaultKey = null) => {
  const canonicalLookup = new Map(); // canon(string) -> key
  const labelByKey = new Map();      // key -> dbValue

  // Map theo definitions (ưu tiên nếu khớp được vào enumValues)
  definitions.forEach(({ key, synonyms = [] }) => {
    if (!key) return;
    const variants = Array.from(new Set([key, ...synonyms]));
    const matchedValue = findEnumValue(enumValues, variants) || null;
    if (!matchedValue) return;

    labelByKey.set(key, matchedValue);

    // Gom tất cả biến thể tương đương matchedValue vào cùng 1 key
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

  // Tự động thêm những enum chưa được định nghĩa vào map (tự tạo key theo canonical)
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

  // Xác định defaultKey
  let defaultKey =
    requestedDefaultKey && labelByKey.has(requestedDefaultKey) ? requestedDefaultKey : null;

  if (!defaultKey) {
    const firstValue = enumValues[0];
    if (firstValue) {
      defaultKey =
        canonicalLookup.get(canonicalKey(firstValue)) || canonicalKey(firstValue) || null;
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
  };

  const toCanonical = (dbValue, fallbackKey = null) => resolveKey(dbValue) || fallbackKey;

  const getLabel = (key, fallback = null) => labelByKey.get(key) || fallback;

  const getKeys = () => Array.from(labelByKey.keys());
  const getValues = () => Array.from(labelByKey.values());

  return {
    defaultKey,
    resolveKey,
    toDb,
    toCanonical,
    getLabel,
    getKeys,
    getValues,
  };
};

/* ====== Đọc ENUM từ Sequelize model (an toàn khi chưa load) ====== */
const STATUS_VALUES = RepairRequest?.rawAttributes?.status?.values || [];
const SEVERITY_VALUES = RepairRequest?.rawAttributes?.severity?.values || [];
const PRIORITY_VALUES = RepairRequest?.rawAttributes?.priority?.values || [];

/* ====== Định nghĩa key + synonyms để map về giá trị thực trong ENUM ====== */
const STATUS_DEFINITIONS = [
  { key: "requested",      synonyms: ["requested", "Được yêu cầu", "duoc yeu cau", "yeu cau"] },
  { key: "approved",       synonyms: ["approved", "Đã duyệt", "da duyet"] },
  { key: "in_progress",    synonyms: ["in_progress", "Đang xử lý", "dang xu ly"] },
  { key: "pending_parts",  synonyms: ["pending_parts", "Chờ linh kiện", "cho linh kien"] },
  { key: "completed",      synonyms: ["completed", "Hoàn tất", "hoan tat", "da hoan tat"] },
  { key: "canceled",       synonyms: ["canceled", "cancelled", "Huỷ", "Hủy", "huy", "huy bo", "hủy bỏ"] },
];

const SEVERITY_DEFINITIONS = [
  { key: "critical", synonyms: ["critical", "Khẩn", "khan", "khẩn", "khẩn cấp", "khan cap"] },
  { key: "high",     synonyms: ["high", "Cao"] },
  { key: "medium",   synonyms: ["medium", "Trung bình", "trung binh"] },
  { key: "low",      synonyms: ["low", "Thấp", "thap"] },
];

const PRIORITY_DEFINITIONS = [
  { key: "urgent", synonyms: ["urgent", "Khẩn", "khẩn", "khẩn cấp", "cao"] },
  { key: "high",   synonyms: ["high", "Cao"] },
  { key: "normal", synonyms: ["normal", "Bình thường", "binh thuong"] },
  { key: "low",    synonyms: ["low", "Thấp", "thap"] },
];

/* ====== Tạo dictionary ====== */
const STATUS_DICT   = createEnumDictionary(STATUS_VALUES,   STATUS_DEFINITIONS,   "requested");
const SEVERITY_DICT = createEnumDictionary(SEVERITY_VALUES, SEVERITY_DEFINITIONS, "medium");
const PRIORITY_DICT = createEnumDictionary(PRIORITY_VALUES, PRIORITY_DEFINITIONS, "normal");

/* ====== Formatter cho ticket & history ====== */
const formatTicketEnums = (row = {}) => {
  const statusValue   = row.status;
  const severityValue = row.severity;
  const priorityValue = row.priority;

  const statusKey   = STATUS_DICT.toCanonical(statusValue, statusValue);
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
  };
};

const formatHistoryEnums = (historyRow = {}) => {
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
  };
};

/* ====== Helper lấy giá trị DB mặc định/huỷ ====== */
const getCanceledDbValue       = () => STATUS_DICT.toDb("canceled", STATUS_DICT.defaultKey);
const getDefaultStatusDbValue  = () => STATUS_DICT.toDb(STATUS_DICT.defaultKey, STATUS_DICT.defaultKey);
const getDefaultSeverityDbValue= () => SEVERITY_DICT.toDb(SEVERITY_DICT.defaultKey, SEVERITY_DICT.defaultKey);
const getDefaultPriorityDbValue= () => PRIORITY_DICT.toDb(PRIORITY_DICT.defaultKey, PRIORITY_DICT.defaultKey);

/* ====== Exports ====== */
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
