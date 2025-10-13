const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Permission = sequelize.define("Permission", {
  id_permission: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255) },
}, {
  tableName: "tb_permissions",
  timestamps: false,
});

module.exports = Permission;
