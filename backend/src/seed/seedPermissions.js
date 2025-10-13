// backend/src/seeds/seedPermissions.js
const sequelize = require("../config/database");
const Permission = require("../models/Permissions/Permission");

/**
 * Bộ quyền tối giản – dùng chung toàn hệ thống:
 * - role.manage  : quản trị vai trò & phân quyền
 * - {module}.*   : toàn quyền trong 1 module
 * - (*)          : toàn quyền hệ thống (cân nhắc bật)
 */
const KEYS = [
  ["role.manage",  "Quản trị vai trò & phân quyền"],

  ["user.*",       "Toàn quyền người dùng"],
  ["hr.*",       "Toàn quyền nhân sự"],
  ["account.*",       "Toàn quyền kế toán"],
  ["department.*", "Toàn quyền phòng ban"],
  ["doc.*",        "Toàn quyền tài liệu"],
  ["device.*",     "Toàn quyền thiết bị"],
  ["ticket.*",     "Toàn quyền phiếu sửa chữa"],
  ["spare.*",      "Toàn quyền kho/vật tư"],
  ["production.*", "Toàn quyền sản xuất"],
  ["qc.*",         "Toàn quyền chất lượng"],
  ["report.*",     "Toàn quyền báo cáo"],
  ["settings.*",   "Toàn quyền cấu hình"],

  // Nếu thực sự cần Super Admin:
  // ["*", "Toàn quyền hệ thống"],
];

(async () => {
  try {
    await sequelize.authenticate();
    await Permission.bulkCreate(
      KEYS.map(([key, description]) => ({ key, description })),
      { ignoreDuplicates: true } // chạy lại không bị trùng
      // Nếu muốn luôn cập nhật description khi key đã tồn tại:
      // , { updateOnDuplicate: ["description"] }
    );
    console.log("✅ Seeded minimal tb_permissions");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
