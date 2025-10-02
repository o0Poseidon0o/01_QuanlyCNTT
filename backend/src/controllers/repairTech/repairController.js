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

const normalizeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

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

function toVND(n) { return Number(n || 0); }

const listRepairs = async (req, res) => {
  try {
    const { q, status, severity, includeCanceled } = req.query;

    // ----- where cho RepairRequest -----
    const where = {};
    // Ẩn ticket "canceled" mặc định, muốn xem cả thì truyền ?includeCanceled=1
    if (!includeCanceled || includeCanceled === "0") {
      where.status = { [Op.ne]: CANCELED_VALUE };
    }
    if (status && status !== "all") {
      const resolvedStatus = ensureEnum(status, STATUS_MAP);
      if (resolvedStatus) where.status = resolvedStatus;
    }
    if (severity && severity !== "all") {
      const resolvedSeverity = ensureEnum(severity, SEVERITY_MAP);
      if (resolvedSeverity) where.severity = resolvedSeverity;
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
        // required:true = INNER JOIN để loại record mồ côi device
        { model: Devices, attributes: ["id_devices", "name_devices"], required: true },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
      ],
    });

    // ----- chi tiết: dùng [Op.in] khi query theo mảng id -----
    const ids = rows.map((r) => r.id_repair);
    let detailsMap = new Map();
    if (ids.length) {
      const details = await RepairDetail.findAll({
        where: { id_repair: { [Op.in]: ids } },
      });
      detailsMap = new Map(details.map((d) => [d.id_repair, d.toJSON()]));
    }

    // ----- map data trả về -----
    const num = (v) => Number(v || 0);

    const data = rows.map((r) => {
      const d = detailsMap.get(r.id_repair) || {};
      const total_cost = num(d.labor_cost) + num(d.parts_cost) + num(d.other_cost);
      return {
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
        assignee: d.technician_user || null,
        vendor_name: d.id_vendor || null,
        repair_type: d.repair_type || "in_house",
        total_cost,
      };
    });

    // ----- chống cache ở mọi tầng -----
    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");

    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

/** ====== GET /api/repairs/:id  (an toàn, không NaN) ====== */
const getRepair = async (req, res) => {
  try {
    // id đến từ params (đã được ràng buộc chỉ là số ở routes)
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid id_repair" });
    }

    // Lấy ticket + device + reporter/approver
    const ticket = await RepairRequest.findByPk(id, {
      include: [
        { model: Devices, attributes: ["id_devices", "name_devices"] },
        { model: User, as: "Reporter", attributes: ["id_users", "username"] },
        { model: User, as: "Approver", attributes: ["id_users", "username"] },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Lấy detail, vendor (nếu có)
    const detail = await RepairDetail.findOne({
      where: { id_repair: id },
      include: [
        { model: RepairVendor, attributes: ["id_vendor", "vendor_name", "phone", "email"] },
        { model: User, as: "Technician", attributes: ["id_users", "username"] },
      ],
    });

    // Lấy history/parts/files
    const [history, parts, files] = await Promise.all([
      RepairHistory.findAll({
        where: { id_repair: id },
        order: [["created_at", "ASC"]],
        include: [{ model: User, attributes: ["id_users", "username"], foreignKey: "actor_user" }],
      }),
      RepairPartUsed.findAll({
        where: { id_repair: id },
        order: [["id_part_used", "ASC"]],
      }),
      RepairFile.findAll({
        where: { id_repair: id },
        order: [["uploaded_at", "ASC"]],
        include: [{ model: User, attributes: ["id_users", "username"], foreignKey: "uploaded_by" }],
      }),
    ]);

    // Chống cache
    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Pragma", "no-cache");

    return res.json({
      ticket,
      detail,
      history,
      parts,
      files,
    });
  } catch (e) {
    console.error("getRepairSafe error:", e);
    return res.status(500).json({ message: "Server error", error: e?.message || String(e) });
  }
};

/** ====== GET /api/repairs/summary  (an toàn, không join phức tạp) ====== */
const yyyyMM = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};


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

    const r = await RepairRequest.create({
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
    }, { transaction: t });

    await RepairHistory.create({
      id_repair: r.id_repair,
      actor_user: reported_by,
      old_status: null,
      new_status: resolvedStatus,
      note: "Created ticket",
      created_at: new Date(),
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ id_repair: r.id_repair });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

const updateStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const { actor_user, new_status, note } = req.body;

    const r = await RepairRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!r) return res.status(404).json({ message: "Not found" });

    const old_status = r.status;
    const resolvedStatus = ensureEnum(new_status, STATUS_MAP, old_status);
    r.status = resolvedStatus;
    r.last_updated = new Date();
    await r.save({ transaction: t });

    await RepairHistory.create({
      id_repair: id,
      actor_user,
      old_status,
      new_status: resolvedStatus,
      note: note || null,
      created_at: new Date(),
    }, { transaction: t });

    await t.commit();
    res.json({ ok: true });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

const upsertDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body; // {repair_type, technician_user, id_vendor, start_time, end_time, total_labor_hours, labor_cost, parts_cost, other_cost, outcome, warranty_extend_mon, next_maintenance_date}
    const [detail] = await RepairDetail.upsert({ id_repair: id, ...payload });
    res.json({ ok: true, id_repair_detail: detail.id_repair_detail });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

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
      })),
    );
    res.status(201).json({ count: created.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadFiles = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const uploaded_by = Number(req.body.uploaded_by) || null;
    const files = (req.files || []).map(f => ({
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

// Tổng hợp an toàn, không join phức tạp để tránh lỗi dialect/association
const getSummaryStatsSafe = async (req, res) => {
  try {
    const requests = await RepairRequest.findAll({
      attributes: ["id_repair", "status", "severity", "date_reported"],
      order: [["date_reported", "DESC"]],
    });

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
    const statusMap = new Map();
    for (const r of requests) {
      const key = String(r.status || "").toLowerCase();
      statusMap.set(key, (statusMap.get(key) || 0) + 1);
    }
    const status = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    // Chi phí theo tháng
    const monthlyMap = new Map();
    const num = (v) => Number(v || 0);
    for (const r of requests) {
      const d = detailsMap.get(r.id_repair) || {};
      const cost = num(d.labor_cost) + num(d.parts_cost) + num(d.other_cost);
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
  listRepairs,
  updateStatus,
  upsertDetail,
  addPart,
  uploadFiles,
  getSummaryStatsSafe,
  createRequest,
  getRepair,
};
