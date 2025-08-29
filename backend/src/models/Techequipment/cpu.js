const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Cpu = sequelize.define('Cpu', {
  id_cpu: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name_cpu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_cpu',
  timestamps: false,
});

module.exports = Cpu;