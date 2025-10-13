const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

// ⚠️ ĐỔI đường dẫn cho đúng file Roles của bạn
const Roles = require("../../models/Roles/modelRoles"); 
const Permission = require("./Permission");

const RolePermission = sequelize.define("RolePermission", {
  id_roles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Roles, key: "id_roles" },
    primaryKey: true,
  },
  id_permission: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Permission, key: "id_permission" },
    primaryKey: true,
  },
}, {
  tableName: "tb_role_permissions",
  timestamps: false,
  indexes: [{ unique: true, fields: ["id_roles", "id_permission"] }],
});

// Associations
Roles.belongsToMany(Permission, { through: RolePermission, foreignKey: "id_roles", otherKey: "id_permission" });
Permission.belongsToMany(Roles, { through: RolePermission, foreignKey: "id_permission", otherKey: "id_roles" });

module.exports = RolePermission;
