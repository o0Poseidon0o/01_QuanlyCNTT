const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); 

const Departments = sequelize.define('Departments', {
  id_departments: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  department_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department_content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_departments',
  timestamps: false,
});

module.exports = Departments;
