const Devices = require("../../../models/Techequipment/devices");
const Devicetype = require("../../../models/Techequipment/devicestype");
const User = require("../../../models/Users/User");
const Departments = require("../../../models/Departments/departments");
const { Sequelize } = require("sequelize");

// API: Thống kê số lượng thiết bị theo loại
const getDeviceCountByType = async (req, res) => {
  try {
    const rows = await Devices.findAll({
      attributes: [
        "id_devicetype",
        // ép về int cho Postgres
        [Sequelize.literal('COUNT(*)::int'), 'count'],
        // ĐỔI cột sau cho đúng tên thuộc tính ở model Devicetype của bạn:
        // nếu model dùng 'device_type' -> 'Devicetype.device_type'
        // nếu model dùng 'name_devicetype' -> 'Devicetype.name_devicetype'
        [Sequelize.col("Devicetype.device_type"), "device_type"],
      ],
      include: [{ model: Devicetype, attributes: [], required: false }],
      group: [
        "Devices.id_devicetype",
        "Devicetype.id_devicetype",
        "Devicetype.device_type", // nếu model là name_devicetype thì đổi dòng này cho khớp
      ],
      order: [[Sequelize.col("device_type"), "ASC"]],
      raw: true,
    });

    const data = rows.map(r => ({
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
// GET /api/stats/users-by-department
const getUserCountByDepartment = async (req, res) => {
  try {
    const rows = await User.findAll({
      attributes: [
        "id_departments",
        [Sequelize.fn("COUNT", Sequelize.col("User.id_users")), "count"],
        [Sequelize.col("Department.department_name"), "department_name"], // alias theo tên association
      ],
      include: [
        { model: Departments, as: "Department", attributes: [], required: false },
      ],
      group: [
        "User.id_departments",
        "Department.id_departments",
        "Department.department_name",
      ],
      order: [[Sequelize.col("department_name"), "ASC"]],
      raw: true,
    });

    const data = rows.map(r => ({
      department_name: r.department_name || "Chưa gán bộ phận",
      count: Number(r.count || 0),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching users-by-department:", error);
    res.status(500).json({ message: "Error fetching users-by-department" });
  }
};

module.exports = { getDeviceCountByType,getUserCountByDepartment };
