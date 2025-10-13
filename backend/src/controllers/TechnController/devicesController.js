// backend/src/controllers/Techequipment/devicesController.js
const sequelize = require("../../config/database");                // ⬅️ thêm
const User = require("../../models/Users/User");                   // ⬅️ nếu muốn gán user ngay
const DeviceAssignment = require("../../models/Techequipment/DeviceAssignment"); // ⬅️ nếu muốn gán user ngay

const Devices = require("../../models/Techequipment/devices");
const Cpu = require("../../models/Techequipment/cpu");
const Ram = require("../../models/Techequipment/ram");
const Memory = require("../../models/Techequipment/memory");
const Screen = require("../../models/Techequipment/screen");
const Devicetype = require("../../models/Techequipment/devicestype");
const Operationsystem = require("../../models/Techequipment/operationsystem");

const pickUpdatable = (body) => ({
  id_devicetype:      body.id_devicetype ?? null,
  id_cpu:             body.id_cpu ?? null,
  id_ram:             body.id_ram ?? null,
  id_memory:          body.id_memory ?? null,
  id_screen:          body.id_screen ?? null,
  id_operationsystem: body.id_operationsystem ?? null,
  name_devices:       body.name_devices,
  date_buydevices:    body.date_buydevices,
  date_warranty:      body.date_warranty,
});

// GET /devices/all
const getAllDevices = async (_req, res) => {
  try {
    const devices = await Devices.findAll({
      include: [
        { model: Cpu },
        { model: Ram },
        { model: Memory },
        { model: Screen },
        { model: Devicetype },
        { model: Operationsystem },
      ],
      order: [["id_devices", "ASC"]],
    });
    res.status(200).json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Error fetching devices", error: error.message });
  }
};

// GET /devices/:id
const getDeviceById = async (req, res) => {
  try {
    const device = await Devices.findByPk(req.params.id, {
      include: [
        { model: Cpu },
        { model: Ram },
        { model: Memory },
        { model: Screen },
        { model: Devicetype },
        { model: Operationsystem },
      ],
    });
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.status(200).json(device);
  } catch (error) {
    console.error("getDeviceById error:", error);
    res.status(500).json({ message: "Error fetching device", error: error.message });
  }
};

// POST /devices/add
// POST /devices/add
const addDevice = async (req, res) => {
  // Dùng chính instance sequelize từ model để tránh lỗi "sequelize is not defined"
  const t = await Devices.sequelize.transaction();
  try {
    const {
      id_devices,           // BẮT BUỘC người dùng nhập
      id_devicetype,
      id_cpu,
      id_ram,
      id_memory,
      id_screen,
      id_operationsystem,
      name_devices,         // BẮT BUỘC
      date_buydevices,      // BẮT BUỘC
      date_warranty,        // BẮT BUỘC
    } = req.body;

    // Validate đầu vào bắt buộc
    if (!id_devices || !name_devices || !date_buydevices || !date_warranty) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Thiếu dữ liệu bắt buộc (id_devices, name_devices, date_buydevices, date_warranty)",
      });
    }

    // Kiểm tra trùng ID
    const existed = await Devices.findByPk(id_devices, { transaction: t });
    if (existed) {
      await t.rollback();
      return res.status(409).json({ message: "ID thiết bị đã tồn tại" });
    }

    // Tạo thiết bị với id_devices do người dùng nhập
    const device = await Devices.create(
      {
        id_devices, // >>> quan trọng: chèn đúng ID người dùng nhập
        id_devicetype: id_devicetype ?? null,
        id_cpu: id_cpu ?? null,
        id_ram: id_ram ?? null,
        id_memory: id_memory ?? null,
        id_screen: id_screen ?? null,
        id_operationsystem: id_operationsystem ?? null,
        name_devices,
        date_buydevices,
        date_warranty,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ message: "Thêm thiết bị thành công", device });
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi thêm thiết bị:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// PUT /devices/update/:id
const updateDevice = async (req, res) => {
  try {
    const device = await Devices.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const payload = pickUpdatable(req.body);
    await device.update(payload);

    const withInclude = await Devices.findByPk(device.id_devices, {
      include: [
        { model: Cpu },
        { model: Ram },
        { model: Memory },
        { model: Screen },
        { model: Devicetype },
        { model: Operationsystem },
      ],
    });

    res.status(200).json({ message: "Device updated successfully", device: withInclude });
  } catch (error) {
    console.error("updateDevice error:", error);
    res.status(500).json({ message: "Error updating device", error: error.message });
  }
};

// DELETE /devices/delete/:id
const deleteDevice = async (req, res) => {
  try {
    const device = await Devices.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    await device.destroy();
    res.status(200).json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("deleteDevice error:", error);
    res.status(500).json({ message: "Error deleting device", error: error.message });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  addDevice,
  updateDevice,
  deleteDevice,
};
