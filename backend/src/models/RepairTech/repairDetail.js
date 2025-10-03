const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const RepairRequest = require("./repairRequest");
const RepairVendor = require("./repairVendor");
const User = require("../Users/User");

const RepairDetail = sequelize.define(
  "RepairDetail",
  {
    id_repair_detail: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // nếu muốn 1–1; nếu muốn nhiều detail/1 request => xoá dòng này
      references: { model: RepairRequest, key: "id_repair" },
    },
    repair_type: {
      type: DataTypes.ENUM("Nội bộ", "Bên ngoài"),
      defaultValue: "Nội bộ",
    },
    technician_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: "id_users" },
    },
    id_vendor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: RepairVendor, key: "id_vendor" },
    },
    start_time: { type: DataTypes.DATE },
    end_time: { type: DataTypes.DATE },
    total_labor_hours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: { min: 0 },
    },
    labor_cost: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
      validate: { min: 0 },
    },
    parts_cost: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
      validate: { min: 0 },
    },
    other_cost: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
      validate: { min: 0 },
    },
    outcome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      
    },
    warranty_extend_mon: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    next_maintenance_date: { type: DataTypes.DATE },
  },
  {
    tableName: "tb_repair_detail",
    timestamps: false,
    indexes: [{ fields: ["id_repair"] }, { fields: ["id_vendor"] }, { fields: ["technician_user"] }],
  }
);

RepairDetail.belongsTo(RepairRequest, { foreignKey: "id_repair", onDelete: "CASCADE", onUpdate: "CASCADE" });
RepairDetail.belongsTo(RepairVendor, { foreignKey: "id_vendor", onDelete: "SET NULL", onUpdate: "CASCADE" });
RepairDetail.belongsTo(User, { as: "Technician", foreignKey: "technician_user", onDelete: "SET NULL", onUpdate: "CASCADE" });

// Gợi ý quan hệ ngược (thêm ở index.js): RepairRequest.hasOne(RepairDetail, { foreignKey: "id_repair", as: "Detail" });

module.exports = RepairDetail;
