const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');


const Memory = sequelize.define('Memory', {
  id_memory: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  memory_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size_memory: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_memory',
  timestamps: false,
});

module.exports = Memory;
