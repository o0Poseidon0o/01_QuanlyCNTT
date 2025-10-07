const Devices = require("../../../models/Techequipment/devices");
const Devicetype = require("../../../models/Techequipment/devicestype");
const User = require("../../../models/Users/User");
const Departments = require("../../../models/Departments/departments");
const { Sequelize } = require("sequelize");

/**
 * GET /api/stasdevices/devices
 * Thống kê số lượng thiết bị theo LOẠI
 */
const getDeviceCountByType = async (req, res) => {
  try {
    const rows = await Devices.findAll({
      attributes: [
        "id_devicetype",
        [Sequelize.literal("COUNT(*)::int"), "count"],
        // Dùng alias theo model Devicetype (bạn không đặt `as`, nên alias là tên model: "Devicetype")
        [Sequelize.col("Devicetype.device_type"), "device_type"],
      ],
      include: [
        { model: Devicetype, attributes: [], required: false },
      ],
      group: [
        "Devices.id_devicetype",
        "Devicetype.id_devicetype",
        "Devicetype.device_type",
      ],
      order: [[Sequelize.col("device_type"), "ASC"]],
      raw: true,
    });

    const data = rows.map((r) => ({
      id_devicetype: r.id_devicetype,
      device_type: r.device_type || "Khác",
      count: Number(r.count || 0),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching device statistics:", error);
    res.status(500).json({ message: "Error fetching device statistics" });
  }
};

/**
 * GET /api/stasdevices/by-department
 * Thống kê số lượng thiết bị theo TỪNG BỘ PHẬN & THEO LOẠI
 * Trả về: [{ department_name, device_type, count }]
 *
 * Chuỗi associations sử dụng:
 *   Devices --belongsTo--> User --belongsTo(as: 'Department')--> Departments
 *   Devices --belongsTo--> Devicetype
 *
 * Lưu ý Sequelize.col khi include lồng:
 *   - Dùng "User->Department.department_name" cho nested include
 */
const getDeviceTypeByDepartment = async (req, res) => {
  try {
    const rows = await Devices.findAll({
      attributes: [
        [Sequelize.literal("COUNT(*)::int"), "count"],
        [Sequelize.col("User->Department.department_name"), "department_name"],
        [Sequelize.col("Devicetype.device_type"), "device_type"],
      ],
      include: [
        {
          model: User,
          attributes: [],
          required: false,
          include: [
            { model: Departments, as: "Department", attributes: [], required: false },
          ],
        },
        { model: Devicetype, attributes: [], required: false },
      ],
      group: [
        "User->Department.id_departments",
        "User->Department.department_name",
        "Devicetype.id_devicetype",
        "Devicetype.device_type",
      ],
      order: [
        [Sequelize.col("User->Department.department_name"), "ASC"],
        [Sequelize.col("Devicetype.device_type"), "ASC"],
      ],
      raw: true,
    });

    const data = rows.map((r) => ({
      department_name: r.department_name || "Chưa gán bộ phận",
      device_type: r.device_type || "Khác",
      count: Number(r.count || 0),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching device-by-department:", error);
    res.status(500).json({ message: "Error fetching device-by-department" });
  }
};

module.exports = {
  getDeviceCountByType,
  getDeviceTypeByDepartment,
};
