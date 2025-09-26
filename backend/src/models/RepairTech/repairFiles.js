const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const RepairRequest = require("./repairRequest");
const User = require("../Users/User");

const RepairFiles = sequelize.define(
  "RepairFiles",
  {
    id_file: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: RepairRequest, key: "id_repair" },
    },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(100) },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id_users" },
    },
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "tb_repair_files",
    timestamps: false,
    indexes: [{ fields: ["id_repair"] }, { fields: ["uploaded_by"] }],
  }
);

RepairFiles.belongsTo(RepairRequest, { foreignKey: "id_repair", onDelete: "CASCADE", onUpdate: "CASCADE" });
RepairFiles.belongsTo(User, { foreignKey: "uploaded_by", onDelete: "RESTRICT", onUpdate: "CASCADE" });

// Quan hệ ngược (đặt ở index.js): RepairRequest.hasMany(RepairFiles, { foreignKey: "id_repair", as: "Files" });

module.exports = RepairFiles;
