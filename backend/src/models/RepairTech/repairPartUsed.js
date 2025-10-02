const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const RepairRequest = require("./repairRequest");

const RepairPartUsed = sequelize.define(
  "RepairPartUsed",
  {
    id_part_used: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: RepairRequest, key: "id_repair" },
    },
    part_name: { type: DataTypes.STRING(200), allowNull: false },
    part_code: { type: DataTypes.STRING(100) },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
    unit_cost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
    supplier_name: { type: DataTypes.STRING(200) },
    note: { type: DataTypes.TEXT },
  },
  {
    tableName: "tb_repair_part_used",
    timestamps: false,
    indexes: [
      { fields: ["id_repair"] },
      { fields: ["part_name"] },
    ],
  }
);

RepairPartUsed.belongsTo(RepairRequest, {
  foreignKey: "id_repair",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Nếu cần quan hệ ngược, khai báo trong file khởi tạo chung:
// RepairRequest.hasMany(RepairPartUsed, { foreignKey: "id_repair", as: "Parts" });

module.exports = RepairPartUsed;
