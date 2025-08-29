const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Devicetype = sequelize.define('Devicetype', {
  id_devicetype: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  device_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_devicetype',
  timestamps: false,
});

module.exports = Devicetype;
