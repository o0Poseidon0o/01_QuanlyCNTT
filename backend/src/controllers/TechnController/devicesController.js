const Devices = require("../../models/Techequipment/devices");
const Cpu = require("../../models/Techequipment/cpu");
const Ram = require("../../models/Techequipment/ram");
const Memory = require("../../models/Techequipment/memory");
const Screen = require("../../models/Techequipment/screen");
const Devicetype = require("../../models/Techequipment/devicestype");
const User = require("../../models/Users/User");
const Operationsystem = require("../../models/Techequipment/operationsystem");

// Lấy tất cả thiết bị (kèm quan hệ)
const getAllDevices = async (req, res) => {
  try {
    const devices = await Devices.findAll({
      include: [
        { model: Cpu },
        { model: Ram },
        { model: Memory },
        { model: Screen },
        { model: Devicetype },
        { model: User },
        { model: Operationsystem }
      ]
    });
    res.status(200).json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Error fetching devices", error: error.message });
  }
};

// Lấy thiết bị theo ID
const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Devices.findByPk(id, {
      include: [
        { model: Cpu },
        { model: Ram },
        { model: Memory },
        { model: Screen },
        { model: Devicetype },
        { model: User },
        { model: Operationsystem }
      ]
    });
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ message: "Error fetching device", error: error.message });
  }
};

// Thêm thiết bị
const addDevice = async (req, res) => {
  const {
    id_devices,
    id_devicetype,
    id_cpu,
    id_ram,
    id_memory,
    id_screen,
    id_users,
    id_operationsystem,
    name_devices,
    date_buydevices,
    date_warranty
  } = req.body;

  try {
    // Kiểm tra tất cả các trường bắt buộc
    if (
      !id_devices ||
      !id_devicetype ||
      !name_devices ||
      !date_buydevices ||
      !date_warranty
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Kiểm tra id_devices có tồn tại chưa
    const existingDevice = await Devices.findByPk(id_devices);
    if (existingDevice) {
      return res.status(400).json({ message: "ID thiết bị đã tồn tại" });
    }

    // Tạo mới thiết bị
    const newDevice = await Devices.create({
      id_devices,
      id_devicetype,
      id_cpu,
      id_ram,
      id_memory,
      id_screen,
      id_users,
      id_operationsystem,
      name_devices,
      date_buydevices,
      date_warranty
    });

    res.status(201).json({
      message: "Thêm thiết bị thành công",
      device: newDevice
    });
  } catch (error) {
    console.error("Lỗi khi thêm thiết bị:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// Cập nhật thiết bị
const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_devicetype, id_cpu, id_ram, id_memory, id_screen, id_users, id_operationsystem,
      name_devices, date_buydevices, date_warranty
    } = req.body;

    const device = await Devices.findByPk(id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    await device.update({
      id_devicetype, id_cpu, id_ram, id_memory, id_screen, id_users, id_operationsystem,
      name_devices, date_buydevices, date_warranty
    });

    res.status(200).json({ message: "Device updated successfully", device });
  } catch (error) {
    res.status(500).json({ message: "Error updating device", error: error.message });
  }
};

// Xóa thiết bị
const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Devices.findByPk(id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    await device.destroy();
    res.status(200).json({ message: "Device deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting device", error: error.message });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  addDevice,
  updateDevice,
  deleteDevice
};
