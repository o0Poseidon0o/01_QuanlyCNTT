// backend/src/models/Techequipment/devices.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Cpu = require("../Techequipment/cpu");
const Ram = require("../Techequipment/ram");
const Memory = require("../Techequipment/memory");
const Screen = require("../Techequipment/screen");
const Devicetype = require("../Techequipment/devicestype");
const Operationsystem = require("../Techequipment/operationsystem");

const Devices = sequelize.define(
  "Devices",
  {
    id_devices: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_devicetype: { type: DataTypes.INTEGER, allowNull: true, references: { model: Devicetype, key: "id_devicetype" } },
    id_cpu:        { type: DataTypes.INTEGER, allowNull: true, references: { model: Cpu,        key: "id_cpu" } },
    id_ram:        { type: DataTypes.INTEGER, allowNull: true, references: { model: Ram,        key: "id_ram" } },
    id_memory:     { type: DataTypes.INTEGER, allowNull: true, references: { model: Memory,     key: "id_memory" } },
    id_screen:     { type: DataTypes.INTEGER, allowNull: true, references: { model: Screen,     key: "id_screen" } },
    id_operationsystem: { type: DataTypes.INTEGER, allowNull: true, references: { model: Operationsystem, key: "id_operationsystem" } },
    name_devices:  { type: DataTypes.STRING, allowNull: false },
    date_buydevices: { type: DataTypes.DATE, allowNull: false },
    date_warranty:  { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "tb_devices", timestamps: false }
);

// Quan hệ kỹ thuật
Devices.belongsTo(Devicetype,      { foreignKey: "id_devicetype" });
Devices.belongsTo(Cpu,             { foreignKey: "id_cpu" });
Devices.belongsTo(Ram,             { foreignKey: "id_ram" });
Devices.belongsTo(Memory,          { foreignKey: "id_memory" });
Devices.belongsTo(Screen,          { foreignKey: "id_screen" });
Devices.belongsTo(Operationsystem, { foreignKey: "id_operationsystem" });

module.exports = Devices;
