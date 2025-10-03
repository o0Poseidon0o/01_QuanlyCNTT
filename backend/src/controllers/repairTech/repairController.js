// backend/src/controllers/repairTech/repairController.js
const { Op } = require("sequelize");
const sequelize = require("../../config/database");

// Models
const RepairRequest = require("../../models/RepairTech/repairRequest");
const RepairHistory = require("../../models/RepairTech/repairHistory");
const RepairDetail = require("../../models/RepairTech/repairDetail");
const RepairPartUsed = require("../../models/RepairTech/repairPartUsed");
const RepairFiles = require("../../models/RepairTech/repairFiles");
const Devices = require("../../models/Techequipment/devices");
const User = require("../../models/Users/User");
const RepairVendor = require("../../models/RepairTech/repairVendor");

/* =================== Helpers =================== */
const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Map alias -> Nhãn (tiếng Việt)
const STATUS_MAP = new Map([
  ["duoc_yeu_cau", "Được yêu cầu"],
  ["requested", "Được yêu cầu"],
  ["approved", "Đã duyệt"],
  ["da_duyet", "Đã duyệt"],
  ["dang_xu_ly", "Đang xử lý"],
  ["in_progress", "Đang xử lý"],
  ["cho_linh_kien", "Chờ linh kiện"],
  ["pending_parts", "Chờ linh kiện"],
  ["hoan_tat", "Hoàn tất"],
  ["completed", "Hoàn tất"],
  ["huy", "Huỷ"],
  ["huy_bo", "Huỷ"],
  ["canceled", "Huỷ"],
  ["cancelled", "Huỷ"],
]);

const SEVERITY_MAP = new Map([
  ["thap", "Thấp"],
  ["low", "Thấp"],
  ["trung_binh", "Trung bình"],
  ["medium", "Trung bình"],
  ["cao", "Cao"],
  ["high", "Cao"],
  ["khan", "Khẩn"],
  ["khan_cap", "Khẩn"],
  ["critical", "Khẩn"],
]);

const PRIORITY_MAP = new Map([
  ["thap", "Thấp"],
  ["low", "Thấp"],
  ["binh_thuong", "Bình thường"],
  ["binhthuong", "Bình thường"],
  ["normal", "Bình thường"],
  ["cao", "Cao"],
  ["high", "Cao"],
  ["urgent", "Cao"],
]);

const ensureEnum = (value, dictionary, fallback = undefined) => {
  if (value == null || value === "") return fallback;
  const normalized = normalizeKey(value);
  if (dictionary.has(normalized)) {
    return dictionary.get(normalized);
  }
  return fallback;
};

// Từ điển trạng thái dạng "chuẩn hoá key" <-> "label"
const STATUS_ALIASES = new Map([
  ["duoc_yeu_cau", "requested"],
  ["requested", "requested"],
  ["approved", "approved"],
  ["da_duyet", "approved"],
  ["dang_xu_ly", "in_progress"],
  ["in_progress", "in_progress"],
  ["cho_linh_kien", "pending_parts"],
  ["pending_parts", "pending_parts"],
  ["hoan_tat", "completed"],
  ["completed", "completed"],
  ["huy", "canceled"],
  ["huy_bo", "canceled"],
  ["canceled", "canceled"],
  ["cancelled", "canceled"],
]);

const STATUS_LABELS = {
  requested: "Được yêu cầu",
  approved: "Đã duyệt",
  in_progress: "Đang xử lý",
  pending_parts: "Chờ linh kiện",
  completed: "Hoàn tất",
  canceled: "Huỷ",
};

const STATUS_DICT = {
  defaultKey: "requested",
  toCanonical: (val, fallback = "requested") => {
    if (!val) return fallback;
    const key = STATUS_ALIASES.get(normalizeKey(val));
    return key || fallback;
  },
  getLabel: (key, fallbackLabel = null) => STATUS_LABELS[key] || fallbackLabel || key,
};

// Đọc enum values trong Model (nếu cột là ENUM)
const getEnumValues = (model, attribute) =>
  (model?.rawAttributes?.[attribute]?.values || []).slice();

const alignEnumValue = (enumValues, candidate, fallback = candidate) => {
  if (!candidate) return fallback;
  const normalized = normalizeKey(candidate);
  for (const value of enumValues || []) {
    if (normalizeKey(value) === normalized) return value;
  }
  return fallback;
};

const STATUS_ENUM_VALUES = getEnumValues(RepairRequest, "status");
const SEVERITY_ENUM_VALUES = getEnumValues(RepairRequest, "severity");
const PRIORITY_ENUM_VALUES = getEnumValues(RepairRequest, "priority");

// 🔸 REPAIR_TYPE enum trong DB (ví dụ: "Nội bộ" | "Bên ngoài")
const REPAIR_TYPE_ENUM_VALUES = getEnumValues(RepairDetail, "repair_type");

// alias nhóm vendor/internal
const VENDOR_ALIASES = new Set(["vendor", "external", "ben_ngoai", "ngoai", "outsourced", "outsource"]);
const INTERNAL_ALIASES = new Set(["internal", "inhouse", "noi_bo", "noibo"]);

const resolveRepairTypeEnumValue = (raw, { id_vendor } = {}) => {
  let key = normalizeKey(raw || "");
  if (!key) key = toInt(id_vendor) ? "vendor" : "internal";
  const wantVendor = VENDOR_ALIASES.has(key);

  if (REPAIR_TYPE_ENUM_VALUES && REPAIR_TYPE_ENUM_VALUES.length) {
    for (const ev of REPAIR_TYPE_ENUM_VALUES) {
      const nev = normalizeKey(ev);
      if (wantVendor && VENDOR_ALIASES.has(nev)) return ev;   // "Bên ngoài"
      if (!wantVendor && INTERNAL_ALIASES.has(nev)) return ev; // "Nội bộ"
    }
    // fallback
    return REPAIR_TYPE_ENUM_VALUES[0];
  }
  return wantVendor ? "vendor" : "internal";
};

const CANCELED_VALUE = alignEnumValue(
  STATUS_ENUM_VALUES,
  STATUS_DICT.getLabel("canceled") || "canceled",
  STATUS_DICT.getLabel("canceled") || "canceled"
);

const DEFAULT_STATUS = alignEnumValue(
  STATUS_ENUM_VALUES,
  STATUS_DICT.getLabel("requested") || STATUS_ENUM_VALUES[0],
  STATUS_DICT.getLabel("requested") || STATUS_ENUM_VALUES[0]
);

const DEFAULT_SEVERITY = alignEnumValue(
  SEVERITY_ENUM_VALUES,
  SEVERITY_MAP.get("medium") || SEVERITY_ENUM_VALUES[0],
  SEVERITY_MAP.get("medium") || SEVERITY_ENUM_VALUES[0]
);

const DEFAULT_PRIORITY = alignEnumValue(
  PRIORITY_ENUM_VALUES,
  PRIORITY_MAP.get("normal") || PRIORITY_ENUM_VALUES[0],
  PRIORITY_MAP.get("normal") || PRIORITY_ENUM_VALUES[0]
);

// Thêm label VN vào response + giữ key chuẩn cho status
const formatEnumsForResponse = (row) => {
  const statusKey = STATUS_DICT.toCanonical(row.status, row.status);
  return {
    ...row,
    status: statusKey,
    status_label: STATUS_DICT.getLabel(statusKey, row.status),
    severity_label: ensureEnum(row.severity, SEVERITY_MAP, row.severity),
    priority_label: ensureEnum(row.priority, PRIORITY_MAP, row.priority),
  };
};

const yyyyMM = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/* ============ Small helpers dùng lại cho các list/search ============ */
const buildWhereFromCommonQuery = (query, { defaultExcludeCanceled = true } = {}) => {
  const {
    q,
    status,
    severity,
    priority,
    reported_by,
    id_devices,
    includeCanceled,
    from,
    to,
  } = query || {};

  const where = {};

  const excludeCanceled =
    defaultExcludeCanceled &&
    (!includeCanceled || includeCanceled === "0" || includeCanceled === 0);

  if (excludeCanceled) {
    if (!where.status) where.status = {};
    where.status[Op.ne] = CANCELED_VALUE;
  }

  if (status && status !== "all") {
    const resolvedStatusLabel = ensureEnum(status, STATUS_MAP);
    if (resolvedStatusLabel) {
      where.status = { [Op.iLike]: resolvedStatusLabel };
    } else {
      // cũng chấp nhận key (requested/in_progress/...)
      const key = STATUS_DICT.toCanonical(status, null);
      if (key) where.status = { [Op.iLike]: STATUS_DICT.getLabel(key, key) };
    }
  }

  if (severity && severity !== "all") {
    const resolvedSeverity = ensureEnum(severity, SEVERITY_MAP);
    if (resolvedSeverity) where.severity = { [Op.iLike]: resolvedSeverity };
  }

  if (priority && priority !== "all") {
    const resolvedPriority = ensureEnum(priority, PRIORITY_MAP);
    if (resolvedPriority) where.priority = { [Op.iLike]: resolvedPriority };
  }

  if (reported_by) where.reported_by = reported_by;
  if (id_devices) where.id_devices = id_devices;

  if (from || to) {
    where.date_reported = {};
    if (from) where.date_reported[Op.gte] = new Date(from);
    if (to) where.date_reported[Op.lte] = new Date(to);
  }

  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { issue_description: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return where;
};

const fetchDetailsMapByIds = async (ids) => {
  if (!ids?.length) return new Map();
  const details = await RepairDetail.findAll({
    where: { id_repair: { [Op.in]: ids } },
    include: [
      { model: RepairVendor, attributes: ["id_vendor", "vendor_name", "phone", "email"] },
      { model: User, as: "Technician", attributes: ["id_users", "username"] },
    ],
  });
  return new Map(details.map((d) => [d.id_repair, d.toJSON()]));
};

const hydrateRowsForList = async (rows) => {
  const num = (v) => Number(v || 0);
  const ids = rows.map((r) => r.id_repair);
  const detailsMap = await fetchDetailsMapByIds(ids);

  return rows.map((instance) => {
    const r = instance.toJSON();
    const d = detailsMap.get(r.id_repair) || {};
    const technicianName = d.Technician?.username || null;
    const total_cost = num(d.labor_cost) + num(d.parts_cost) + num(d.other_cost);

    return formatEnumsForResponse({
      id_repair: r.id_repair,
      device_name: r.Device?.name_devices || "",
      device_code: r.id_devices,
      title: r.title,
      issue_description: r.issue_description,
      severity: r.severity,
      priority: r.priority,
      status: r.status,
      date_reported: r.date_reported,
      sla_hours: r.sla_hours,
      reporter_id: r.reported_by,
      reporter_name: r.Reporter?.username || null,
      assignee: technicianName || d.technician_user || null,
      vendor_id: d.id_vendor || null,
      vendor_name: d.RepairVendor?.vendor_name || null,
      repair_type: d.repair_type || null,
      start_time: d.start_time || null,
      end_time: d.end_time || null,
      total_labor_hours: d.total_labor_hours || null,
      labor_cost: num(d.labor_cost),
      parts_cost: num(d.parts_cost),
      other_cost: num(d.other_cost),
      outcome: d.outcome || null,
      warranty_extend_mon: d.warranty_extend_mon || null,
      next_maintenance_date: d.next_maintenance_date || null,
      total_cost,
    });
  });
};

/* =================== Controllers =================== */

// (Giữ nguyên) GET /api/repairs  — filter nhẹ
const listRepairs = async (req, res) => {
  try {
    const { q, status, severity, includeCanceled } = req.query;

    const excludeCanceled = !includeCanceled || includeCanceled === "0" || includeCanceled === 0;

    const where = {};
    let resolvedStatusForFilter = null;

    if (excludeCanceled) {
      if (!where.status) where.status = {};
      where.status[Op.ne] = CANCELED_VALUE;
    }

    if (status && status !== "all") {
      const resolvedStatusLabel = ensureEnum(status, STATUS_MAP);
      if (resolvedStatusLabel) {
        resolvedStatusForFilter = resolvedStatusLabel;
        where.status = { [Op.iLike]: resolvedStatusLabel };
      }
    }

    if (severity && severity !== "all") {
      const resolvedSeverity = ensureEnum(severity, SEVERITY_MAP);
      if (resolvedSeverity) where.severity = { [Op.iLike]: resolvedSeverity };
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { issue_description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const rows = await RepairRequest.findAll({
      where,
      order: [["date_reported", "DESC"]],
      include: [
        { model: Devices, as: "Device", attributes: ["id_devices", "name_devices"], required: true },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
      ],
    });

    const cancelKey = normalizeKey(CANCELED_VALUE || "canceled");
    const filteredRows =
      excludeCanceled && !resolvedStatusForFilter
        ? rows.filter((row) => normalizeKey(row.status) !== cancelKey)
        : rows;

    const data = await hydrateRowsForList(filteredRows);

    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");
    return res.json(data);
  } catch (e) {
    console.error("listRepairs error:", e);
    return res.status(500).json({ message: "Server error", detail: e?.message || undefined });
  }
};

/* ==== MỚI ====  GET /api/repairs/all  */
const listAllRepairs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || "200", 10)));
    const offset = (page - 1) * limit;

    const where = buildWhereFromCommonQuery(req.query, { defaultExcludeCanceled: true });

    const { rows, count } = await RepairRequest.findAndCountAll({
      where,
      include: [
        { model: Devices, as: "Device", attributes: ["id_devices", "name_devices"], required: true },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
      ],
      order: [["date_reported", "DESC"]],
      limit,
      offset,
    });

    const data = await hydrateRowsForList(rows);

    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");
    return res.json({ page, limit, total: count, repairs: data });
  } catch (e) {
    console.error("listAllRepairs error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

/* ==== MỚI ====  GET /api/repairs/search */
const searchRepairs = async (req, res) => {
  try {
    // Hỗ trợ: id_repair, reported_by, id_devices, status, severity, priority, q, from, to
    const { id_repair } = req.query;

    const where = buildWhereFromCommonQuery(req.query, { defaultExcludeCanceled: true });

    // Nếu truyền id_repair thì ưu tiên nó (nhưng KHÔNG bắt buộc phải có)
    if (id_repair != null && id_repair !== "") {
      const id = toInt(id_repair);
      if (!id) return res.status(400).json({ message: "Invalid id_repair" });
      where.id_repair = id;
    }

    const rows = await RepairRequest.findAll({
      where,
      include: [
        { model: Devices, as: "Device", attributes: ["id_devices", "name_devices"], required: true },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
      ],
      order: [["date_reported", "DESC"]],
      limit: Math.max(1, Math.min(500, parseInt(req.query.limit || "200", 10))),
    });

    const data = await hydrateRowsForList(rows);

    // Nếu chỉ tìm theo id_repair: trả object hoặc null
    if (req.query.id_repair != null && req.query.id_repair !== "") {
      return res.json(data.length ? data[0] : null);
    }
    return res.json({ repairs: data });
  } catch (e) {
    console.error("searchRepairs error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

/* ==== MỚI ====  GET /api/repairs/user/:id */
const listRepairsByUser = async (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid user id" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || "200", 10)));
    const offset = (page - 1) * limit;

    const baseWhere = buildWhereFromCommonQuery(
      { ...req.query, reported_by: id },
      { defaultExcludeCanceled: true }
    );

    const { rows, count } = await RepairRequest.findAndCountAll({
      where: baseWhere,
      include: [
        { model: Devices, as: "Device", attributes: ["id_devices", "name_devices"], required: true },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
      ],
      order: [["date_reported", "DESC"]],
      limit,
      offset,
    });

    const data = await hydrateRowsForList(rows);

    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");
    return res.json({ page, limit, total: count, repairs: data });
  } catch (e) {
    console.error("listRepairsByUser error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

/** GET /api/repairs/:id */
const getRepair = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id_repair" });
    }

    const ticket = await RepairRequest.findByPk(id, {
      include: [
        { model: Devices, as: "Device", attributes: ["id_devices", "name_devices"] },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
        { model: User, as: "Approver", attributes: ["id_users", "username"] },
      ],
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const detail = await RepairDetail.findOne({
      where: { id_repair: id },
      include: [
        { model: RepairVendor, attributes: ["id_vendor", "vendor_name", "phone", "email"] },
        { model: User, as: "Technician", attributes: ["id_users", "username"] },
      ],
    });

    const [history, parts, files] = await Promise.all([
      RepairHistory.findAll({
        where: { id_repair: id },
        order: [["created_at", "ASC"]],
        include: [{ model: User, attributes: ["id_users", "username"] }],
      }),
      RepairPartUsed.findAll({ where: { id_repair: id }, order: [["id_part_used", "ASC"]] }),
      RepairFiles.findAll({
        where: { id_repair: id },
        order: [["uploaded_at", "ASC"]],
        include: [{ model: User, attributes: ["id_users", "username"] }],
      }),
    ]);

    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");

    const ticketJson = ticket.toJSON();
    const ticketPayload = formatEnumsForResponse({
      ...ticketJson,
      device_name: ticketJson.Device?.name_devices || null,
      reporter_name: ticketJson.Reporter?.username || null,
      approver_name: ticketJson.Approver?.username || null,
    });
    delete ticketPayload.Device;
    delete ticketPayload.Reporter;
    delete ticketPayload.Approver;

    const detailJson = detail ? detail.toJSON() : null;
    const detailPayload = detailJson
      ? {
          ...detailJson,
          vendor_name: detailJson.RepairVendor?.vendor_name || null,
          vendor_phone: detailJson.RepairVendor?.phone || null,
          vendor_email: detailJson.RepairVendor?.email || null,
          technician_name: detailJson.Technician?.username || null,
        }
      : null;
    if (detailPayload) {
      delete detailPayload.RepairVendor;
      delete detailPayload.Technician;
    }

    const historyJson = history.map((h) => {
      const row = h.toJSON();
      const oldStatusKey = STATUS_DICT.toCanonical(row.old_status, row.old_status);
      const newStatusKey = STATUS_DICT.toCanonical(row.new_status, row.new_status);
      return {
        ...row,
        actor_name: row.User?.username || null,
        old_status: oldStatusKey,
        old_status_label: STATUS_DICT.getLabel(oldStatusKey, row.old_status),
        new_status: newStatusKey,
        new_status_label: STATUS_DICT.getLabel(newStatusKey, row.new_status),
      };
    });
    historyJson.forEach((entry) => delete entry.User);

    const partsJson = parts.map((p) => p.toJSON());
    const filesJson = files.map((f) => {
      const row = f.toJSON();
      return { ...row, uploader_name: row.User?.username || null };
    });
    filesJson.forEach((file) => delete file.User);

    return res.json({
      ticket: ticketPayload,
      detail: detailPayload,
      history: historyJson,
      parts: partsJson,
      files: filesJson,
    });
  } catch (e) {
    console.error("getRepair error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message || String(e) });
  }
};

/** POST /api/repairs (create) */
const createRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      id_devices,
      reported_by,
      title,
      issue_description,
      severity = "medium",
      priority = "normal",
      sla_hours = null,
      date_down = null,
      expected_date = null,
    } = req.body;

    const resolvedSeverity = ensureEnum(severity, SEVERITY_MAP, "Trung bình");
    const resolvedPriority = ensureEnum(priority, PRIORITY_MAP, "Bình thường");
    const resolvedStatus = ensureEnum("requested", STATUS_MAP, "Được yêu cầu");

    const r = await RepairRequest.create(
      {
        id_devices,
        reported_by,
        title,
        issue_description,
        severity: resolvedSeverity,
        priority: resolvedPriority,
        status: resolvedStatus,
        date_reported: new Date(),
        sla_hours,
        date_down,
        expected_date,
        last_updated: new Date(),
      },
      { transaction: t }
    );

    await RepairHistory.create(
      {
        id_repair: r.id_repair,
        actor_user: reported_by,
        old_status: null,
        new_status: resolvedStatus,
        note: "Created ticket",
        created_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ id_repair: r.id_repair });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/repairs/:id/status */
const updateStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const { new_status, note } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid id_repair" });
    }

    // 1) Lấy ticket & khoá record
    const r = await RepairRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!r) {
      await t.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    // 2) Lấy detail để thử lấy technician_user
    const detail = await RepairDetail.findOne({
      where: { id_repair: id },
      transaction: t,
    });

    // 3) Resolve status
    const old_status = r.status;
    const resolvedStatus = ensureEnum(new_status, STATUS_MAP, old_status) || old_status;

    r.status = resolvedStatus;
    r.last_updated = new Date();
    await r.save({ transaction: t });

    // 4) Chọn actor_user hợp lệ theo id_users
    const findExistingUserId = async (userId) => {
      const v = toInt(userId);
      if (!v) return null;
      const u = await User.findOne({
        where: { id_users: v },
        attributes: ["id_users"],
        transaction: t,
      });
      return u ? v : null;
    };

    const candidates = [
      req.body?.actor_user,
      detail?.technician_user,
      detail?.technician_id,
      r.reported_by,
      r.approved_by,
    ].filter((x) => x != null);

    let actorId = null;
    for (const c of candidates) {
      actorId = await findExistingUserId(c);
      if (actorId) break;
    }

    if (!actorId) {
      const any = await User.findOne({
        attributes: ["id_users"],
        order: [["id_users", "ASC"]],
        transaction: t,
      });
      actorId = any?.id_users ?? null;
    }

    // 5) Tạo history
    const historyPayload = {
      id_repair: id,
      old_status,
      new_status: resolvedStatus,
      note: note || null,
      created_at: new Date(),
    };
    if (actorId) historyPayload.actor_user = actorId;

    await RepairHistory.create(historyPayload, { transaction: t });

    await t.commit();
    return res.json({ ok: true, actor_user: actorId ?? null });
  } catch (e) {
    await t.rollback();
    console.error("updateStatus error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

/** PUT /api/repairs/:id/detail (upsert) */
const upsertDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id_repair" });
    }

    const {
      repair_type,
      technician_user,
      id_vendor,
      total_labor_hours,
      labor_cost,
      parts_cost,
      other_cost,
      outcome,
      start_time,
      end_time,
      warranty_extend_mon,
      next_maintenance_date,
    } = req.body || {};

    // Map alias -> giá trị ENUM hợp lệ trong DB
    const repairTypeEnum = resolveRepairTypeEnumValue(repair_type, { id_vendor });
    const chosenIsVendor = VENDOR_ALIASES.has(normalizeKey(repairTypeEnum));

    const payload = {
      id_repair: id,
      repair_type: repairTypeEnum,
      technician_user: chosenIsVendor ? null : toInt(technician_user),
      id_vendor: chosenIsVendor ? toInt(id_vendor) : null,
      total_labor_hours: toNum(total_labor_hours),
      labor_cost: toNum(labor_cost),
      parts_cost: toNum(parts_cost),
      other_cost: toNum(other_cost),
      outcome: (outcome ?? "").toString().trim() || null,
      start_time: start_time || null,
      end_time: end_time || null,
      warranty_extend_mon: toInt(warranty_extend_mon),
      next_maintenance_date: next_maintenance_date || null,
    };

    const [detail] = await RepairDetail.upsert(payload);
    return res.json({ ok: true, id_repair_detail: detail.id_repair_detail });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/repairs/options (users & vendors cho dropdown) */
const getAssigneeVendorOptions = async (req, res) => {
  try {
    const [users, vendors] = await Promise.all([
      User.findAll({
        attributes: ["id_users", "username"],
        order: [["username", "ASC"]],
        limit: 500,
      }),
      RepairVendor.findAll({
        attributes: ["id_vendor", "vendor_name"],
        order: [["vendor_name", "ASC"]],
        limit: 500,
      }),
    ]);
    return res.json({
      users: users.map((u) => ({ id: u.id_users, name: u.username })),
      vendors: vendors.map((v) => ({ id: v.id_vendor, name: v.vendor_name })),
    });
  } catch (e) {
    console.error("getAssigneeVendorOptions error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

/** POST /api/repairs/:id/parts (bulk add) */
const addPart = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const parts = Array.isArray(req.body) ? req.body : [req.body];
    const created = await RepairPartUsed.bulkCreate(
      parts.map((p) => ({
        id_repair: id,
        part_name: p.part_name,
        part_code: p.part_code,
        qty: p.qty || 1,
        unit_cost: p.unit_cost || 0,
        supplier_name: p.supplier_name || null,
        note: p.note || null,
      }))
    );
    res.status(201).json({ count: created.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

/** POST /api/repairs/:id/files (multer upload) */
const uploadFiles = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const uploaded_by = Number(req.body.uploaded_by) || null;
    const files = (req.files || []).map((f) => ({
      id_repair: id,
      file_path: f.path.replace(/\\/g, "/"),
      file_name: f.filename,
      mime_type: f.mimetype,
      uploaded_by,
      uploaded_at: new Date(),
    }));
    const created = await RepairFiles.bulkCreate(files);
    res.status(201).json({ count: created.length, files: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/repairs/summary (safe, gọn gàng) */
const getSummaryStatsSafe = async (req, res) => {
  try {
    const requests = await RepairRequest.findAll({
      attributes: ["id_repair", "status", "date_reported"],
      order: [["date_reported", "DESC"]],
    });

    // Map id_repair -> chi phí trong RepairDetail
    const ids = requests.map((r) => r.id_repair);
    let detailsMap = new Map();
    if (ids.length) {
      const details = await RepairDetail.findAll({
        attributes: ["id_repair", "labor_cost", "parts_cost", "other_cost"],
        where: { id_repair: { [Op.in]: ids } },
      });
      detailsMap = new Map(details.map((d) => [d.id_repair, d.toJSON()]));
    }

    // Phân phối trạng thái
    const statusCounts = new Map();
    for (const r of requests) {
      const key = STATUS_DICT.toCanonical(r.status, STATUS_DICT.defaultKey);
      statusCounts.set(key, (statusCounts.get(key) || 0) + 1);
    }
    const status = Array.from(statusCounts.entries()).map(([name, value]) => ({
      name,
      label: STATUS_DICT.getLabel(name, name),
      value,
    }));

    // Chi phí theo tháng
    const monthlyMap = new Map();
    for (const r of requests) {
      const d = detailsMap.get(r.id_repair) || {};
      const cost = toNum(d.labor_cost) + toNum(d.parts_cost) + toNum(d.other_cost);
      const bucket = yyyyMM(r.date_reported || new Date());
      monthlyMap.set(bucket, (monthlyMap.get(bucket) || 0) + cost);
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([month, cost]) => ({ month, cost }));

    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");
    return res.json({ status, monthly });
  } catch (e) {
    console.error("getSummaryStatsSafe error:", e);
    return res.status(500).json({ message: "Summary error", error: e?.message || String(e) });
  }
};

module.exports = {
  // cũ
  listRepairs,
  updateStatus,
  upsertDetail,
  addPart,
  uploadFiles,
  getSummaryStatsSafe,
  createRequest,
  getRepair,
  getAssigneeVendorOptions,

  // mới cho FE UserProfile
  listAllRepairs,
  searchRepairs,
  listRepairsByUser,
};
