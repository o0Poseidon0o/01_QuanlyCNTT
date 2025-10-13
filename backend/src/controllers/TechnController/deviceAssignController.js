// backend/src/controllers/Techequipment/deviceAssignController.js
const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../../config/database");

const DeviceAssignment = require("../../models/Techequipment/DeviceAssignment");
const Devices = require("../../models/Techequipment/devices");
const User = require("../../models/Users/User");

// POST /assignments/checkin  { id_users, id_devices }
const checkin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_users, id_devices } = req.body;
    if (!id_users || !id_devices) {
      await t.rollback();
      return res.status(400).json({ message: "Thiếu id_users hoặc id_devices" });
    }

    const [user, device] = await Promise.all([
      User.findByPk(id_users, { transaction: t }),
      Devices.findByPk(id_devices, { transaction: t }),
    ]);
    if (!user)   { await t.rollback(); return res.status(404).json({ message: "Không tìm thấy user" }); }
    if (!device) { await t.rollback(); return res.status(404).json({ message: "Không tìm thấy thiết bị" }); }

    // Chặn cấp trùng khi đang active
    const existed = await DeviceAssignment.findOne({
      where: { id_users, id_devices, end_time: { [Op.is]: null } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existed) {
      await t.rollback();
      return res.status(409).json({ message: "Người dùng đã được gán thiết bị này và đang active" });
    }

    const created = await DeviceAssignment.create(
      { id_users, id_devices, end_time: null },
      { transaction: t }
    );

    await t.commit();

    // Reload kèm user để UI dùng ngay
    const withUser = await DeviceAssignment.findByPk(created.id_assignment, {
      include: [{ model: User, attributes: ["id_users", "username", "email_user"] }],
    });

    return res.status(201).json({ message: "Đã cấp thiết bị", assignment: withUser });
  } catch (e) {
    await t.rollback();
    console.error("checkin error:", e);
    // Unique index đệm an toàn nếu 2 request race
    if (String(e?.original?.code) === "23505") {
      return res.status(409).json({ message: "Bản ghi active trùng (unique partial index)" });
    }
    return res.status(400).json({ message: "Gán thiết bị thất bại", error: String(e) });
  }
};

// POST /assignments/checkout  { id_users, id_devices }
const checkout = async (req, res) => {
  try {
    const { id_users, id_devices } = req.body;
    if (!id_users || !id_devices) {
      return res.status(400).json({ message: "Thiếu id_users hoặc id_devices" });
    }

    const row = await DeviceAssignment.findOne({
      where: { id_users, id_devices, end_time: { [Op.is]: null } },
    });
    if (!row) return res.status(404).json({ message: "Không có bản ghi đang dùng để trả" });

    row.end_time = new Date();
    await row.save();

    return res.json({ message: "Đã trả thiết bị" });
  } catch (e) {
    console.error("checkout error:", e);
    return res.status(400).json({ message: "Trả thiết bị thất bại", error: String(e) });
  }
};

// GET /assignments/active/:id_devices
const activeUsersOfDevice = async (req, res) => {
  try {
    const { id_devices } = req.params;
    const rows = await DeviceAssignment.findAll({
      where: { id_devices, end_time: { [Op.is]: null } },
      include: [{ model: User, attributes: ["id_users", "username", "email_user"] }],
      order: [["start_time", "ASC"]],
    });
    return res.json(rows);
  } catch (e) {
    console.error("activeUsersOfDevice error:", e);
    return res.status(400).json({ message: "Lỗi truy vấn", error: String(e) });
  }
};

// GET /assignments/active-count
const activeCountMap = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id_devices, COUNT(*)::int AS cnt
       FROM tb_device_assignments
       WHERE end_time IS NULL
       GROUP BY id_devices`,
      { type: QueryTypes.SELECT }
    );
    const map = {};
    rows.forEach((r) => { map[String(r.id_devices)] = r.cnt; });
    return res.json(map);
  } catch (e) {
    console.error("activeCountMap error:", e);
    return res.status(400).json({ message: "Lỗi thống kê", error: String(e) });
  }
};

// GET /assignments/history/device/:id_devices
const historyOfDevice = async (req, res) => {
  try {
    const { id_devices } = req.params;
    const rows = await DeviceAssignment.findAll({
      where: { id_devices },
      include: [{ model: User, attributes: ["id_users", "username", "email_user"] }],
      order: [["start_time", "DESC"]],
    });
    return res.json(rows);
  } catch (e) {
    console.error("historyOfDevice error:", e);
    return res.status(400).json({ message: "Lỗi truy vấn", error: String(e) });
  }
};

// GET /assignments/active-by-user/:id_users
const activeDevicesOfUser = async (req, res) => {
  try {
    const { id_users } = req.params;
    const rows = await DeviceAssignment.findAll({
      where: { id_users, end_time: { [Op.is]: null } },
      include: [{ model: Devices }],
      order: [["start_time", "ASC"]],
    });
    return res.json(rows);
  } catch (e) {
    console.error("activeDevicesOfUser error:", e);
    return res.status(400).json({ message: "Lỗi truy vấn", error: String(e) });
  }
};

// GET /assignments/active-map  → { [id_devices]: [{id_users, username, email_user}, ...] }
const activeMap = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT da.id_devices, u.id_users, u.username, u.email_user
       FROM tb_device_assignments da
       JOIN tb_users u ON u.id_users = da.id_users
       WHERE da.end_time IS NULL
       ORDER BY da.id_devices, u.username`,
      { type: QueryTypes.SELECT }
    );
    const map = {};
    for (const r of rows) {
      const k = String(r.id_devices);
      if (!map[k]) map[k] = [];
      map[k].push({ id_users: r.id_users, username: r.username, email_user: r.email_user });
    }
    return res.json(map);
  } catch (e) {
    console.error("activeMap error:", e);
    return res.status(400).json({ message: "Lỗi truy vấn", error: String(e) });
  }
};

module.exports = {
  checkin,
  checkout,
  activeUsersOfDevice,
  activeCountMap,
  historyOfDevice,
  activeDevicesOfUser,
  activeMap,
};
