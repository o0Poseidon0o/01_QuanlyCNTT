const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Ram = sequelize.define(
  "Ram",
  {
    id_ram: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false, // Không cho phép bỏ trống
    },
    name_ram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "tb_ram",
    timestamps: false,
  }
);

module.exports = Ram;
