const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Screen = sequelize.define('Screen', {
  id_screen: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name_screen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size_screen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tb_screen',
  timestamps: false,
});

module.exports = Screen;