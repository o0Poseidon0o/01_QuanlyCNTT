const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Roles = sequelize.define('Roles', {
  id_roles: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name_role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_roles',
  timestamps: false,
});

module.exports = Roles;
