const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Devices = require("../Techequipment/devices");
const User = require("../Users/User");

const RepairRequest = sequelize.define(
  "RepairRequest",
  {
    id_repair: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_devices: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Devices, key: "id_devices" },
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id_users" },
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: "id_users" },
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    issue_description: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.ENUM("Thấp", "Trung bình", "Cao", "Khẩn"),
      defaultValue: "Trung bình",
    },
    priority: {
      type: DataTypes.ENUM("Thấp", "Bình thường", "Cao"),
      defaultValue: "Bình thường",
    },
    status: {
      type: DataTypes.ENUM(
        "Được yêu cầu",
        "Đã duyệt",
        "Đang xử lý",
        "Chờ linh kiện",
        "Hoàn tất",
        "Huỷ"
      ),
      defaultValue: "Được yêu cầu",
    },
    date_reported: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    date_down: { type: DataTypes.DATE },
    expected_date: { type: DataTypes.DATE },
    sla_hours: { type: DataTypes.INTEGER },
    last_updated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "tb_repair_request",
    timestamps: false,
    indexes: [
      { fields: ["id_devices"] },
      { fields: ["reported_by"] },
      { fields: ["approved_by"] },
      { fields: ["status"] },
      { fields: ["priority"] },
    ],
  }
);

RepairRequest.belongsTo(Devices, { foreignKey: "id_devices", onUpdate: "CASCADE", onDelete: "RESTRICT" });
RepairRequest.belongsTo(User, { as: "Reporter", foreignKey: "reported_by", onUpdate: "CASCADE", onDelete: "RESTRICT" });
RepairRequest.belongsTo(User, { as: "Approver", foreignKey: "approved_by", onUpdate: "SET NULL", onDelete: "SET NULL" });

module.exports = RepairRequest;
