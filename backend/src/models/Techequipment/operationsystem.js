const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Operationsystem = sequelize.define('Operationsystem', {
  id_operationsystem: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name_operationsystem: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_operationsystem',
  timestamps: false,
});

module.exports = Operationsystem;