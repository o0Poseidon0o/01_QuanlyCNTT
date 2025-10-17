// controllers/TechnController/stasDevices/stasdevicesController.js
const { Sequelize } = require("sequelize");

const Devices          = require("../../../models/Techequipment/devices");
const Devicetype       = require("../../../models/Techequipment/devicestype");
const User             = require("../../../models/Users/User");
const Departments      = require("../../../models/Departments/departments");
const DeviceAssignment = require("../../../models/Techequipment/DeviceAssignment");

// Lấy tên bảng thực tế từ model (tránh lệ thuộc hard-code)
const getTbl = (Model) => {
  try {
    const t = Model.getTableName ? Model.getTableName() : Model.tableName;
    return typeof t === "string" ? t : t.tableName;
  } catch {
    return Model.tableName || "";
  }
};

const TBL = {
  devices:          getTbl(Devices),
  devicetype:       getTbl(Devicetype),
  users:            getTbl(User),
  departments:      getTbl(Departments),
  deviceAssignment: getTbl(DeviceAssignment),
};

/**
 * GET /api/stasdevices/devices
 * ?department_id=ID  (optional)
 *
 * - Không có department_id  -> đếm toàn hệ thống theo loại (mỗi device 1 dòng)
 * - Có department_id        -> đếm DISTINCT id_devices theo loại, dựa trên assignment MỚI NHẤT
 *                              (ưu tiên end_time IS NULL, sau đó lấy id_assignment lớn nhất).
 */
const getDeviceCountByType = async (req, res) => {
  const sequelize = Devices.sequelize;
  const deptId = req.query.department_id || req.query.id_departments || null;

  try {
    let sql, replacements;

    if (deptId) {
      sql = `
        WITH latest AS (
          SELECT DISTINCT ON (da.id_devices)
                 da.id_devices,
                 da.id_users,
                 u.id_departments
          FROM "${TBL.deviceAssignment}" AS da
          INNER JOIN "${TBL.users}" AS u
                  ON u.id_users = da.id_users
          /* Ưu tiên bản ghi đang active, sau đó mới tới id_assignment lớn nhất */
          ORDER BY da.id_devices,
                   (da.end_time IS NULL) DESC,
                   da.id_assignment DESC
        )
        SELECT
          d.id_devicetype,
          COALESCE(dt.device_type, 'Khác') AS device_type,
          COUNT(DISTINCT d.id_devices)::int AS count
        FROM "${TBL.devices}" AS d
        INNER JOIN latest la
                ON la.id_devices = d.id_devices
        LEFT JOIN "${TBL.devicetype}" AS dt
               ON dt.id_devicetype = d.id_devicetype
        WHERE la.id_departments = :deptId
        GROUP BY d.id_devicetype, dt.id_devicetype, dt.device_type
        ORDER BY device_type ASC;
      `;
      replacements = { deptId: Number(deptId) };
    } else {
      sql = `
        SELECT
          d.id_devicetype,
          COALESCE(dt.device_type, 'Khác') AS device_type,
          COUNT(d.id_devices)::int AS count
        FROM "${TBL.devices}" AS d
        LEFT JOIN "${TBL.devicetype}" AS dt
               ON dt.id_devicetype = d.id_devicetype
        GROUP BY d.id_devicetype, dt.id_devicetype, dt.device_type
        ORDER BY device_type ASC;
      `;
      replacements = {};
    }

    const rows = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      replacements,
    });

    const data = rows.map((r) => ({
      id_devicetype: r.id_devicetype,
      device_type: r.device_type || "Khác",
      count: Number(r.count || 0),
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching device statistics:", error);
    return res.status(500).json({ message: "Error fetching device statistics" });
  }
};

/**
 * GET /api/stasdevices/by-department
 * Thống kê theo từng phòng ban & loại thiết bị.
 * Mỗi thiết bị chỉ thuộc MỘT phòng ban theo assignment MỚI NHẤT
 * (ưu tiên end_time IS NULL, nếu không có thì lấy id_assignment lớn nhất).
 * Thiết bị chưa từng được gán -> "Chưa gán bộ phận".
 */
const getDeviceTypeByDepartment = async (_req, res) => {
  const sequelize = Devices.sequelize;

  try {
    const sql = `
      WITH latest AS (
        SELECT DISTINCT ON (da.id_devices)
               da.id_devices,
               da.id_users,
               u.id_departments
        FROM "${TBL.deviceAssignment}" AS da
        INNER JOIN "${TBL.users}" AS u
                ON u.id_users = da.id_users
        /* Ưu tiên bản ghi đang active, sau đó mới tới id_assignment lớn nhất */
        ORDER BY da.id_devices,
                 (da.end_time IS NULL) DESC,
                 da.id_assignment DESC
      )
      SELECT
        COALESCE(dep.department_name, 'Chưa gán bộ phận') AS department_name,
        COALESCE(dt.device_type, 'Khác')                   AS device_type,
        COUNT(DISTINCT d.id_devices)::int                  AS count
      FROM "${TBL.devices}" AS d
      LEFT JOIN latest la
             ON la.id_devices = d.id_devices
      LEFT JOIN "${TBL.departments}" AS dep
             ON dep.id_departments = la.id_departments
      LEFT JOIN "${TBL.devicetype}" AS dt
             ON dt.id_devicetype = d.id_devicetype
      GROUP BY dep.id_departments, dep.department_name, dt.id_devicetype, dt.device_type
      ORDER BY dep.department_name ASC NULLS LAST, dt.device_type ASC;
    `;

    const rows = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
    });

    const data = rows.map((r) => ({
      department_name: r.department_name || "Chưa gán bộ phận",
      device_type: r.device_type || "Khác",
      count: Number(r.count || 0),
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching device-by-department:", error);
    return res.status(500).json({ message: "Error fetching device-by-department" });
  }
};

module.exports = {
  getDeviceCountByType,
  getDeviceTypeByDepartment,
};
