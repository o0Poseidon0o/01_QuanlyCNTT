const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Devices = require("../../models/Techequipment/devices");
const Software = require("../../models/Software/software");

const DeviceSoftware = sequelize.define(
  "DeviceSoftware",
  {
    id_device_software:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_devices:        { type: DataTypes.INTEGER, allowNull: false, references: { model: Devices, key: "id_devices" } },
    id_software:       { type: DataTypes.INTEGER, allowNull: false, references: { model: Software, key: "id_software" } },
    install_date:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    installed_by:      { type: DataTypes.STRING(100) },
    status:            { type: DataTypes.STRING(20), allowNull: false, defaultValue: "installed" }, // installed|uninstalled
    uninstall_date:    { type: DataTypes.DATE },
    license_key_plain: { type: DataTypes.STRING(255) },   // nếu không muốn lưu, để null
    note:              { type: DataTypes.TEXT },
  },
  {
    tableName: "tb_device_software",
    timestamps: false,
    indexes: [
      { fields: ["id_devices"] },
      { fields: ["id_software"] },
      { fields: ["status"] },
    ],
  }
);

// Quan hệ many-to-many
Devices.belongsToMany(Software, { through: DeviceSoftware, foreignKey: "id_devices", otherKey: "id_software", as: "softwares" });
Software.belongsToMany(Devices, { through: DeviceSoftware, foreignKey: "id_software", otherKey: "id_devices", as: "devices" });

// Cho phép truy ngược
DeviceSoftware.belongsTo(Devices, { foreignKey: "id_devices" });
DeviceSoftware.belongsTo(Software,{ foreignKey: "id_software" });
Devices.hasMany(DeviceSoftware,   { foreignKey: "id_devices" });
Software.hasMany(DeviceSoftware,  { foreignKey: "id_software" });

module.exports = DeviceSoftware;
