const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Roles = require("../Roles/modelRoles");
const Departments = require("../Departments/departments");

const User = sequelize.define(
  "User",
  {
    id_users: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email_user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password_user: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // ✅ Giữ lại chữ ký ảnh
    signature_image: {
      type: DataTypes.STRING, // ví dụ: /static/signatures/123.png
      allowNull: true,
    },

    id_departments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Departments,
        key: "id_departments",
      },
    },
    id_roles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Roles,
        key: "id_roles",
      },
    },
  },
  {
    tableName: "tb_users",
    timestamps: false,
  }
);

User.belongsTo(Roles, { foreignKey: "id_roles" });
User.belongsTo(Departments, { foreignKey: "id_departments" });

module.exports = User;
