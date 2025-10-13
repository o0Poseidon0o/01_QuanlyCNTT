// backend/src/models/Techequipment/DeviceAssignment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const User = require("../Users/User");
const Devices = require("./devices");

/**
 * Ghi nhận ai đang dùng thiết bị:
 * - end_time: NULL = còn đang dùng; có giá trị = đã trả
 */
const DeviceAssignment = sequelize.define(
  "DeviceAssignment",
  {
    id_assignment: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id_users" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    id_devices: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Devices, key: "id_devices" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    start_time: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    end_time: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tb_device_assignments",
    timestamps: false,
    indexes: [
      { fields: ["id_devices"] },
      { fields: ["id_users"] },
    ],
  }
);

// Associations (đủ dùng cho include)
DeviceAssignment.belongsTo(User,    { foreignKey: "id_users" });
DeviceAssignment.belongsTo(Devices, { foreignKey: "id_devices" });
User.hasMany(DeviceAssignment,      { foreignKey: "id_users", as: "deviceAssignments" });
Devices.hasMany(DeviceAssignment,   { foreignKey: "id_devices", as: "deviceAssignments" });

/** Tạo partial index (PostgreSQL) — gọi sau khi sync */
DeviceAssignment.ensurePartialIndexes = async function ensurePartialIndexes() {
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_user_device
    ON tb_device_assignments (id_users, id_devices)
    WHERE end_time IS NULL;
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_assign_active_by_device
    ON tb_device_assignments (id_devices)
    WHERE end_time IS NULL;
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_assign_active_by_user
    ON tb_device_assignments (id_users)
    WHERE end_time IS NULL;
  `);
};

module.exports = DeviceAssignment;
