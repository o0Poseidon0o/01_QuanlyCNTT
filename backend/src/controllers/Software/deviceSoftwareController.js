// backend/src/controllers/software/deviceSoftwareController.js
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const Devices = require("../../models/Techequipment/devices");
const Software = require("../../models/Software/software");
const DeviceSoftware = require("../../models/Software/deviceSoftware");

/**
 * Cài phần mềm lên thiết bị
 * - Chặn trùng active bằng transaction (song song với partial unique index DB)
 */
const installSoftware = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_devices, id_software, installed_by, note, license_key_plain } = req.body;
    if (!id_devices || !id_software) {
      await t.rollback();
      return res.status(400).json({ message: "id_devices và id_software là bắt buộc." });
    }

    // Kiểm tra tồn tại
    const [device, software] = await Promise.all([
      Devices.findByPk(id_devices, { transaction: t }),
      Software.findByPk(id_software, { transaction: t }),
    ]);
    if (!device) { await t.rollback(); return res.status(404).json({ message: "Thiết bị không tồn tại." }); }
    if (!software){ await t.rollback(); return res.status(404).json({ message: "Phần mềm không tồn tại." }); }

    // Bảo đảm không có bản ghi installed đang active
    const exists = await DeviceSoftware.findOne({
      where: { id_devices, id_software, status: "installed" },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (exists) {
      await t.rollback();
      return res.status(409).json({ message: "Phần mềm này đã được cài trên thiết bị và đang ở trạng thái installed." });
    }

    const row = await DeviceSoftware.create(
      { id_devices, id_software, installed_by, note, license_key_plain, status: "installed" },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(row);
  } catch (err) {
    await t.rollback();
    console.error("installSoftware error:", err);
    // Bắt trùng unique index (partial)
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Đã có bản ghi installed cho (device, software)." });
    }
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

/** Gỡ phần mềm (đặt status=uninstalled + uninstall_date) */
const uninstallSoftware = async (req, res) => {
  try {
    const { id_devices, id_software } = req.body;
    if (!id_devices || !id_software) return res.status(400).json({ message: "id_devices và id_software là bắt buộc." });

    const row = await DeviceSoftware.findOne({ where: { id_devices, id_software, status: "installed" } });
    if (!row) return res.status(404).json({ message: "Không có bản ghi installed để gỡ." });

    row.status = "uninstalled";
    row.uninstall_date = new Date();
    await row.save();

    res.json(row);
  } catch (err) {
    console.error("uninstallSoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

/** Danh sách phần mềm của một thiết bị (tùy chọn onlyActive) */
const listSoftwareByDevice = async (req, res) => {
  try {
    const { id } = req.params;  // id_devices
    const { onlyActive } = req.query;

    const where = { id_devices: id };
    if (onlyActive === "true") where.status = "installed";

    const rows = await DeviceSoftware.findAll({
      where,
      include: [{ model: Software, attributes: ["id_software","name_software","version","vendor","license_type","category"] }],
      order: [["status","ASC"], ["install_date","DESC"]],
    });

    res.json(rows);
  } catch (err) {
    console.error("listSoftwareByDevice error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

/** Danh sách thiết bị đang cài 1 phần mềm */
const listDevicesBySoftware = async (req, res) => {
  try {
    const { id } = req.params; // id_software
    const { onlyActive } = req.query;

    const where = { id_software: id };
    if (onlyActive === "true") where.status = "installed";

    const rows = await DeviceSoftware.findAll({
      where,
      include: [{ model: Devices, attributes: ["id_devices","name_devices","date_buydevices","date_warranty"] }],
      order: [["status","ASC"], ["install_date","DESC"]],
    });

    res.json(rows);
  } catch (err) {
    console.error("listDevicesBySoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

module.exports = {
  installSoftware,
  uninstallSoftware,
  listSoftwareByDevice,
  listDevicesBySoftware,
};
