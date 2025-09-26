const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const RepairVendor = sequelize.define(
  "RepairVendor",
  {
    id_vendor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vendor_name: { type: DataTypes.STRING(200), allowNull: false },
    contact_name: { type: DataTypes.STRING(150) },
    phone: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(150) },
    address: { type: DataTypes.TEXT },
    tax_code: { type: DataTypes.STRING(50) },
    rating: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  },
  {
    tableName: "tb_repair_vendor",
    timestamps: false,
    indexes: [{ fields: ["vendor_name"] }, { fields: ["tax_code"] }],
  }
);

module.exports = RepairVendor;
