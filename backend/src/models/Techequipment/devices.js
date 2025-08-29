const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database"); // Sửa thành sequelize
const Cpu = require("../Techequipment/cpu"); // Không thay đổi
const Ram = require("../Techequipment/ram"); // Không thay đổi
const Memory = require("../Techequipment/memory"); // Không thay đổi
const Screen = require("../Techequipment/screen"); // Không thay đổi
const Devicetype = require("../Techequipment/devicestype"); // Không thay đổi
const User = require("../Users/User"); // Không thay đổi
const Operationsystem = require("../Techequipment/operationsystem");

const Devices = sequelize.define(
  "Devices",
  {
    id_devices: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    id_devicestype: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Devicetype,
        key: "id_devicestype",
      },
    },
    id_cpu: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Cpu,
        key: "id_cpu",
      },
    },
    id_ram: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Ram,
        key: "id_ram",
      },
    },
    id_memory: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Memory,
        key: "id_memory",
      },
    },
    id_screen: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Screen,
        key: "id_screen",
      },
    },
    id_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id_users",
      },
    },
    id_operationsystem: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Operationsystem,
        key: "id_operationsystem",
      },
    },
    device_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    device_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    device_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "tb_devices",
    timestamps: false,
  }
);

User.belongsTo(Cpu, { foreignKey: "id_cpu" });
User.belongsTo(Ram, { foreignKey: "id_ram" });
User.belongsTo(Memory, { foreignKey: "id_memory" });
User.belongsTo(Screen, { foreignKey: "id_screen" });
User.belongsTo(Devicetype, { foreignKey: "id_devicestype" });
User.belongsTo(User, { foreignKey: "id_users" });
User.belongsTo(Operationsystem, { foreignKey: "id_operationsystem" });

module.exports = Devices;
