const Devicetype = require('../../models/Techequipment/devicestype');
const Devices = require("../../models/Techequipment/devices");
const { Op } = require('sequelize');

// ➤ Thêm DeviceType
const addDeviceType = async (req, res) => {
  const { id_devicetype, device_type } = req.body;

  try {
    if (!id_devicetype || !device_type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Devicetype.findByPk(id_devicetype);
    if (exists) {
      return res.status(400).json({ message: "Device type ID already exists" });
    }

    const newDeviceType = await Devicetype.create({ id_devicetype, device_type });
    res.status(201).json({ message: "Device type added successfully", devicetype: newDeviceType });
  } catch (error) {
    console.error("Error adding device type:", error);
    res.status(500).json({ message: "Error adding device type", error: error.message });
  }
};

// ➤ Cập nhật DeviceType
const updateDeviceType = async (req, res) => {
  const { id } = req.params; // ✅ lấy id đúng với route
  const { device_type } = req.body;

  try {
    const devicetype = await Devicetype.findByPk(id);
    if (!devicetype) {
      return res.status(404).json({ message: "Device type not found" });
    }

    await devicetype.update({
      device_type: device_type || devicetype.device_type,
    });

    res.status(200).json({ message: "Device type updated successfully", devicetype });
  } catch (error) {
    console.error("Error updating device type:", error);
    res.status(500).json({ message: "Error updating device type", error: error.message });
  }
};


// ➤ Xóa DeviceType
const deleteDeviceType = async (req, res) => {
  const { id } = req.params; // ✅ đổi lại
  try {
    

    const deviceType = await Devicetype.findByPk(id); // ✅ dùng id
    if (!deviceType) {
      return res.status(404).json({ message: "Không tìm thấy Device Type" });
    }

    await Devices.update(
      { id_devicetype: null },
      { where: { id_devicetype: id }, validate: false }
    );

    await deviceType.destroy();
    return res.status(200).json({ message: "Xóa Device Type thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa Device Type:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};





// ➤ Lấy tất cả DeviceTypes
const getAllDeviceTypes = async (req, res) => {
  try {
    const deviceTypes = await Devicetype.findAll();
    if (!deviceTypes || deviceTypes.length === 0) {
      return res.status(404).json({ message: "No Device Types found" });
    }
    return res.status(200).json(deviceTypes);
  } catch (error) {
    console.error("Error retrieving Device Types:", error);
    return res.status(500).json({ message: "Error retrieving Device Types", error: error.message });
  }
};


// ➤ Tìm kiếm DeviceType
const searchDeviceTypes = async (req, res) => {
  const { device_type } = req.query;
  let conditions = {};

  if (device_type) {
    conditions.device_type = { [Op.like]: `%${device_type}%` };
  }

  try {
    const devicetypes = await Devicetype.findAll({ where: conditions });
    if (devicetypes.length === 0) {
      return res.status(404).json({ message: "No device types found" });
    }

    res.status(200).json(devicetypes);
  } catch (error) {
    console.error("Error searching device types:", error);
    res.status(500).json({ message: "Error searching device types", error: error.message });
  }
};

module.exports = {
  addDeviceType,
  updateDeviceType,
  deleteDeviceType,
  getAllDeviceTypes,
  searchDeviceTypes,
};
