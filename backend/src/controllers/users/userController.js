const User = require("../../models/Users/User");
const Department = require("../../models/Departments/departments");
const Role = require("../../models/Roles/modelRoles");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/** ====== Cấu hình chữ ký mặc định ====== */
const DEFAULT_SIGNATURE_REL = "../../uploads/sign/tick.png"; // ảnh dấu tích mặc định
const isDefaultSignature = (storedPath) =>
  storedPath && storedPath.endsWith("/sign/tick.png");

/** ====== Helpers file path ====== */
// Chuyển storedPath (../../uploads/...) thành đường dẫn tuyệt đối để xoá file
const resolveAbs = (storedPath) => path.resolve(__dirname, storedPath);

// Xoá file an toàn nếu tồn tại
const safeUnlink = (storedPath) => {
  try {
    if (!storedPath) return;
    const abs = resolveAbs(storedPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn("safeUnlink warn:", e.message);
  }
};

// Thêm người dùng
const addUser = async (req, res) => {
  const {
    id_users,
    username,
    email_user,
    password_user,
    id_departments,
    id_roles,
  } = req.body;

  // Avatar: theo middleware hiện tại
  const avatar = req.file
    ? `../../uploads/avatars/${req.file.filename}`
    : "../../uploads/avatars/default.jpg";

  // ✅ Chữ ký ảnh mặc định (dấu tích)
  const signature_image = DEFAULT_SIGNATURE_REL;

  try {
    // Kiểm tra các giá trị đầu vào
    if (
      !id_users ||
      !username ||
      !email_user ||
      !password_user ||
      !id_departments ||
      !id_roles
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Kiểm tra giá trị của id_users
    if (!Number.isInteger(Number(id_users)) || Number(id_users) <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid user ID. ID must be a positive integer." });
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_user)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Kiểm tra xem ID đã tồn tại hay chưa
    const existingUser = await User.findOne({ where: { id_users } });
    if (existingUser) {
      return res.status(400).json({ message: "User ID already exists." });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password_user, 10);

    // Kiểm tra tồn tại bộ phận và vai trò
    const departmentExists = await Department.findOne({
      where: { id_departments },
    });
    const roleExists = await Role.findOne({ where: { id_roles } });

    if (!departmentExists) {
      return res.status(400).json({ message: "Invalid department ID." });
    }
    if (!roleExists) {
      return res.status(400).json({ message: "Invalid role ID." });
    }

    // Thêm người dùng
    const newUser = await User.create({
      id_users,
      avatar,
      signature_image, // ✅ gán mặc định
      username,
      email_user,
      password_user: hashedPassword,
      id_departments,
      id_roles,
    });

    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    res
      .status(500)
      .json({ message: "Error adding user", error: error.message });
  }
};

// Sửa người dùng (chưa mở tính năng đổi chữ ký ở đây)
const updateUser = async (req, res) => {
  const { id_users } = req.params;
  const { username, email_user, password_user, id_departments, id_roles } =
    req.body;

  // Avatar mới nếu có
  const avatar = req.file ? `../../uploads/avatars/${req.file.filename}` : null;

  try {
    // Kiểm tra người dùng
    const user = await User.findByPk(id_users);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mã hóa mật khẩu nếu có thay đổi
    const hashedPassword = password_user
      ? await bcrypt.hash(password_user, 10)
      : user.password_user;

    // Xoá avatar cũ nếu có avatar mới và avatar cũ không phải default
    if (avatar && user.avatar && !user.avatar.endsWith("default.jpg")) {
      safeUnlink(user.avatar);
    }

    // Cập nhật thông tin người dùng (không động vào signature_image lúc này)
    await user.update({
      avatar: avatar || user.avatar,
      signature_image: user.signature_image || DEFAULT_SIGNATURE_REL, // đảm bảo luôn có mặc định
      username: username || user.username,
      email_user: email_user || user.email_user,
      password_user: hashedPassword,
      id_departments: id_departments || user.id_departments,
      id_roles: id_roles || user.id_roles,
    });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
  const { id_users } = req.params;

  try {
    if (!id_users) {
      return res.status(400).json({ message: "User ID is required" });
    }
    if (!Number.isInteger(Number(id_users)) || Number(id_users) <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid user ID. ID must be a positive integer." });
    }

    const user = await User.findByPk(id_users);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Xóa avatar nếu không phải default
    if (user.avatar && !user.avatar.endsWith("default.jpg")) {
      safeUnlink(user.avatar);
    }

    // Xóa chữ ký nếu tồn tại và KHÔNG phải ảnh mặc định
    if (user.signature_image && !isDefaultSignature(user.signature_image)) {
      safeUnlink(user.signature_image);
    }

    await user.destroy();

    const deletedUser = await User.findByPk(id_users);
    if (!deletedUser) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

// Tìm người dùng
const searchUsers = async (req, res) => {
  const { username, id_users } = req.query;
  let searchConditions = {};

  if (username) {
    searchConditions[Op.or] = [{ username: { [Op.iLike]: `%${username}%` } }];
  }

  if (id_users && !isNaN(id_users)) {
    searchConditions[Op.or] = searchConditions[Op.or] || [];
    searchConditions[Op.or].push({ id_users: parseInt(id_users) });
  }

  try {
    const users = await User.findAll({ where: searchConditions });
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res
      .status(500)
      .json({ message: "Error searching users", error: error.message });
  }
};

// Lấy tất cả thông tin người dùng
const getAllUser = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Department,
          attributes: ["department_name"],
          as: "Department",
        },
        { model: Role, attributes: ["name_role"], as: "Role" },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      message: "Users information retrieved successfully",
      users: users.map((user) => ({
        id_users: user.id_users,
        username: user.username,
        email_user: user.email_user,
        avatar: user.avatar,
        signature_image: user.signature_image || DEFAULT_SIGNATURE_REL, // luôn có default
        hasSignature: true, // vì luôn có ảnh mặc định
        department_name: user.Department
          ? user.Department.department_name
          : "No department",
        role_name: user.Role ? user.Role.name_role : "No role",
      })),
    });
  } catch (error) {
    console.error("Error retrieving user info:", error);
    res
      .status(500)
      .json({ message: "Error retrieving user info", error: error.message });
  }
};

module.exports = {
  addUser,
  updateUser,
  deleteUser,
  searchUsers,
  getAllUser,
};
