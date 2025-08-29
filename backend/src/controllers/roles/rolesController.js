const Roles = require("../../models/Roles/modelRoles");
const Users =require("../../models/Users/User")
const { Op } = require("sequelize");

// Hiển thị tất cả Roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Roles.findAll(); // Lấy tất cả các Roles từ cơ sở dữ liệu

    if (roles.length === 0) {
      return res.status(404).json({ message: "Không có Role nào." });
    }

    res.status(200).json(roles); // Trả về danh sách Roles
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra!", error });
  }
};
// Thêm Role
const addRoles = async (req, res) => {
  const { id_roles, name_role } = req.body;
  try {
    if (!id_roles || !name_role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newRoles = await Roles.create({
      id_roles,
      name_role,
    });

    return res
      .status(201)
      .json({ message: "Roles created successfully", roles: newRoles });
  } catch (error) {
    return res.status(500).json({ message: "Error creating roles", error });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params; // Nhận ID từ URL
    const role = await Roles.findByPk(id);

    if (!role) {
      return res.status(404).json({ message: "Không tìm thấy Role!" });
    }

    // Cập nhật người dùng liên quan để bỏ vai trò
    await Users.update({ id_roles: null }, { where: { id_roles: id } });

    // Xóa vai trò
    await role.destroy();

    res.json({ message: "Xóa Role thành công! Các người dùng liên quan đã được cập nhật." });
  } catch (error) {
    // Chuyển đổi lỗi thành dạng chuỗi hoặc trả về cụ thể hơn
    console.error("Lỗi khi xóa Role:", error); // Log chi tiết trong console
    res.status(500).json({ 
      message: "Có lỗi xảy ra!", 
      error: error.message || "Không thể xác định lỗi", 
      details: error 
    });
  }
};


// Sửa Role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params; // Nhận ID từ URL
    const { name_role } = req.body; // Nhận thông tin cần sửa từ body

    const role = await Roles.findByPk(id);

    if (!role) {
      return res.status(404).json({ message: "Không tìm thấy Role!" });
    }

    // Cập nhật thông tin role
    role.name_role = name_role || role.name_role;
    await role.save();

    res.json({ message: "Cập nhật Role thành công!", role });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra!", error });
  }
};

// Tìm kiếm Role
const searchRole = async (req, res) => {
  try {
      const { name } = req.query; // Lấy tham số tìm kiếm từ query string

      // Kiểm tra nếu tham số name không tồn tại hoặc là chuỗi rỗng
      if (!name || name.trim() === '') {
          return res.status(400).json({ message: "Vui lòng cung cấp tên Role hoặc ID." });
      }

      // Kiểm tra xem `name` có phải là một số hay không
      const isIdSearch = !isNaN(name.trim());

      // Thiết lập tiêu chí tìm kiếm
      const searchCriteria = isIdSearch
          ? { id_roles: Number(name.trim()) } // Tìm theo id_roles
          : { name_role: { [Op.like]: `%${name.trim()}%` } }; // Tìm theo name_role

      // Tìm kiếm trong cơ sở dữ liệu
      const roles = await Roles.findAll({
          where: searchCriteria,
      });

      // Nếu không tìm thấy Role nào
      if (roles.length === 0) {
          return res.status(404).json({ message: "Không tìm thấy Role nào." });
      }

      // Trả về danh sách các Role tìm được
      res.status(200).json(roles);

  } catch (error) {
      console.error(error); // Ghi log lỗi để dễ dàng kiểm tra
      res.status(500).json({ message: "Có lỗi xảy ra!", error });
  }
};


module.exports = { addRoles, deleteRole, updateRole, searchRole, getAllRoles };
