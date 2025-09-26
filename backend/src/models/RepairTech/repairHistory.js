const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const RepairRequest = require("./repairRequest");
const User = require("../Users/User");

const RepairHistory = sequelize.define(
  "RepairHistory",
  {
    id_history: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: RepairRequest, key: "id_repair" },
    },
    actor_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id_users" },
    },
    old_status: { type: DataTypes.STRING(20) },
    new_status: { type: DataTypes.STRING(20) },
    note: { type: DataTypes.TEXT },
    cost_delta: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0, validate: { min: 0 } },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "tb_repair_history",
    timestamps: false,
    indexes: [{ fields: ["id_repair"] }, { fields: ["actor_user"] }, { fields: ["created_at"] }],
  }
);

RepairHistory.belongsTo(RepairRequest, { foreignKey: "id_repair", onDelete: "CASCADE", onUpdate: "CASCADE" });
RepairHistory.belongsTo(User, { foreignKey: "actor_user", onDelete: "RESTRICT", onUpdate: "CASCADE" });

// Ngược (ở index.js): RepairRequest.hasMany(RepairHistory, { foreignKey: "id_repair", as: "History" });

module.exports = RepairHistory;
