const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Software = sequelize.define(
  "Software",
  {
    id_software:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name_software:   { type: DataTypes.STRING(255), allowNull: false },
    version:         { type: DataTypes.STRING(100), allowNull: false },
    vendor:          { type: DataTypes.STRING(255) },
    category:        { type: DataTypes.STRING(100) },
    license_type:    { type: DataTypes.STRING(50), allowNull: false },
    license_key_mask:{ type: DataTypes.STRING(255) },
    license_notes:   { type: DataTypes.TEXT },
    is_active:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "tb_software",
    timestamps: false,
  }
);

module.exports = Software;
