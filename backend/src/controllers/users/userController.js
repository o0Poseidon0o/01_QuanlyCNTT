const User = require("../../models/Users/User");
const Department = require("../../models/Departments/departments");
const Role = require("../../models/Roles/modelRoles");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const path = require('path'); // Import module path
const fs = require('fs'); // Import module fs để làm việc với file hệ thống


// Thêm người dùng
const addUser = async (req, res) => {
  const { id_users, username, email_user, password_user, id_departments, id_roles } = req.body;
   // Kiểm tra nếu có file ảnh, nếu có lưu đường dẫn vào CSDL
   const avatar = req.file ? `../../uploads/avatars/${req.file.filename}` : '../../uploads/avatars/default.jpg';

  try {
    // Kiểm tra các giá trị đầu vào
    if (!id_users || !username || !email_user || !password_user || !id_departments || !id_roles) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Kiểm tra giá trị của id_users
    if (!Number.isInteger(Number(id_users)) || Number(id_users) <= 0) {
      return res.status(400).json({ message: "Invalid user ID. ID must be a positive integer." });
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
    const departmentExists = await Department.findOne({ where: { id_departments } });
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
      username,
      email_user,
      password_user: hashedPassword,
      id_departments,
      id_roles,
    });

    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Error adding user", error: error.message });
  }
};

//Sửa người dùng
const updateUser = async (req, res) => {
  const { id_users } = req.params;
  const { username, email_user, password_user, id_departments, id_roles } = req.body;
  const avatar = req.file ? `../../uploads/avatars/${req.file.filename}` : null; // Đảm bảo đường dẫn avatar chính xác

  try {
    // Kiểm tra người dùng có tồn tại trong cơ sở dữ liệu không
    const user = await User.findByPk(id_users);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mã hóa mật khẩu nếu có thay đổi
    const hashedPassword = password_user ? await bcrypt.hash(password_user, 10) : user.password_user;

    // Cập nhật thông tin người dùng
    await user.update({
      avatar: avatar || user.avatar, // Nếu không có avatar mới thì giữ nguyên
      username: username || user.username, // Cập nhật tên người dùng nếu có thay đổi
      email_user: email_user || user.email_user, // Cập nhật email nếu có thay đổi
      password_user: hashedPassword, // Cập nhật mật khẩu nếu có thay đổi
      id_departments: id_departments || user.id_departments, // Cập nhật bộ phận nếu có thay đổi
      id_roles: id_roles || user.id_roles, // Cập nhật vai trò nếu có thay đổi
    });

    // Trả về thông báo thành công và thông tin người dùng đã được cập nhật
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};


// Xóa người dùng
const deleteUser = async (req, res) => {
  const { id_users } = req.params; // Lấy id_users từ tham số route

  try {
    // Kiểm tra xem id_users có hợp lệ không
    if (!id_users) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Kiểm tra nếu id_users không phải là số hợp lệ
    if (!Number.isInteger(Number(id_users)) || Number(id_users) <= 0) {
      return res.status(400).json({ message: "Invalid user ID. ID must be a positive integer." });
    }

    // Tìm người dùng theo id
    const user = await User.findByPk(id_users);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Xóa ảnh avatar nếu có
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', user.avatar); // Đảm bảo đường dẫn đúng
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath); // Xóa file avatar
      }
    }

    // Xóa người dùng
    await user.destroy();
    
    // Kiểm tra lại xem người dùng đã bị xóa chưa
    const deletedUser = await User.findByPk(id_users);
    if (!deletedUser) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};


// Tìm người dùng
const searchUsers = async (req, res) => {
  const { username, id_users } = req.query;

  // Khởi tạo một mảng điều kiện tìm kiếm rỗng
  let searchConditions = {};

  if (username) {
    // Tìm kiếm theo tên người dùng và họ tên, sử dụng ILIKE để không phân biệt chữ hoa chữ thường
    searchConditions[Op.or] = [
      { username: { [Op.iLike]: `%${username}%` } }, // Sử dụng ILIKE để không phân biệt chữ hoa chữ thường
    ];
  }

  if (id_users && !isNaN(id_users)) { // Kiểm tra nếu id_users là số
    // Tìm kiếm theo id_users nếu là số
    searchConditions[Op.or] = searchConditions[Op.or] || []; // Nếu chưa có Op.or, khởi tạo mảng
    searchConditions[Op.or].push({ id_users: parseInt(id_users) });
  }

  try {
    const users = await User.findAll({
      where: searchConditions
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Error searching users", error: error.message });
  }
};


// Lấy tất cả thông tin người dùng
const getAllUser = async (req, res) => {
  try {
    // Lấy tất cả người dùng cùng thông tin bộ phận và vai trò
    const users = await User.findAll({
      include: [
        { model: Department, attributes: ['department_name'], as: 'Department' }, // Alias cho Department
        { model: Role, attributes: ['name_role'], as: 'Role' } // Alias cho Role, sửa 'role_name' thành 'name_role'
      ]
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Trả về thông tin tất cả người dùng
    res.status(200).json({
      message: "Users information retrieved successfully",
      users: users.map(user => ({
        id_users: user.id_users,
        username: user.username,
        email_user: user.email_user,
        avatar: user.avatar,
        department_name: user.Department ? user.Department.department_name : "No department",
        role_name: user.Role ? user.Role.name_role : "No role" // Sử dụng 'name_role' để lấy tên vai trò
      }))
    });
  } catch (error) {
    console.error("Error retrieving user info:", error);
    res.status(500).json({ message: "Error retrieving user info", error: error.message });
  }
};





module.exports = {
  addUser,
  updateUser,
  deleteUser,
  searchUsers,
  getAllUser,
};
