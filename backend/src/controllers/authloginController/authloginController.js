// backend/src/controllers/auth/login.js (ví dụ đường dẫn bạn đang dùng)
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/Users/User");
const Roles = require("../../models/Roles/modelRoles");
const Permission = require("../../models/Permissions/Permission");

// NẠP association Role <-> Permission (qua RolePermission) để dùng include
require("../../models/Permissions/RolePermission");

exports.login = async (req, res) => {
  const { id_users, password_user } = req.body;

  try {
    // 1) Validate input
    if (id_users == null || !password_user?.toString().trim()) {
      return res.status(400).json({ message: "Missing id_users or password_user" });
    }

    // 2) Tìm user + role
    const user = await User.findOne({
      where: { id_users: Number(id_users) },
      include: [{ model: Roles, attributes: ["id_roles", "name_role"] }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3) Check password
    const valid = await bcrypt.compare(password_user, user.password_user);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // 4) Lấy danh sách permission theo role
    //    SELECT p.key FROM permissions p
    //    JOIN role_permissions rp ON rp.id_permission = p.id_permission
    //    WHERE rp.id_roles = user.id_roles
    const perms = await Permission.findAll({
      attributes: ["key"],
      include: [{
        model: Roles,
        attributes: [],
        where: { id_roles: user.id_roles },
        through: { attributes: [] },
      }],
      order: [["key", "ASC"]],
    });
    const permissionKeys = perms.map(p => p.key).filter(Boolean);

    // 5) Tạo token có kèm id_roles (để API khác sử dụng auth middleware)
    const payload = {
      id_users: user.id_users,
      id_roles: user.id_roles,
      name_role: user.Role?.name_role || null,
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    // 6) Trả về token + permissions cho FE
    return res.status(200).json({
      message: "Login successful",
      token,
      id_users: user.id_users,
      id_roles: user.id_roles,
      role: user.Role?.name_role || null,
      permissions: permissionKeys, // 👈 QUAN TRỌNG: FE sẽ lưu localStorage('perms')
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};
