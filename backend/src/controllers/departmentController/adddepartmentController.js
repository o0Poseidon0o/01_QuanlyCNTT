// controllers/departmentController.js
const Departments = require('../../models/Departments/departments');
const Users = require("../../models/Users/User")
const {Op} = require('sequelize');



//hàm hiển thị phòng ban
const getAllDepartments = async (req, res) => {
    try {
        const departments = await Departments.findAll();

        // Kiểm tra xem có phòng ban nào không
        if (departments.length === 0) {
            return res.status(404).json({ message: "Không có phòng ban nào." });
        }

       // Trả về dữ liệu dưới dạng JSON với danh sách phòng ban trực tiếp
       res.status(200).json(departments);

    } catch (error) {
        console.error("Lỗi khi lấy danh sách phòng ban:", error);
        res.status(500).json({ message: "Có lỗi xảy ra!", error: error.message });
    }
};

//Hàm add phòng ban
const addDepartment = async (req, res) => {
    const { id_departments, department_name, department_content } = req.body;

    try {
        // Kiểm tra nếu thiếu các giá trị cần thiết
        if (!id_departments || !department_name || !department_content) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Tạo phòng ban mới
        const newDepartment = await Departments.create({
            id_departments,
            department_name,
            department_content
        });

        // Trả về phản hồi thành công
        return res.status(201).json({ message: 'Department created successfully', department: newDepartment });
    } catch (error) {
        return res.status(500).json({ message: 'Có lỗi xảy ra khi tạo phòng ban.', error });
    }
};



// Hàm xử lý tìm kiếm
const searchDepartments = async (req, res) => {
    try {
        const { name } = req.query; // Lấy tham số tìm kiếm từ query string

        // Kiểm tra nếu tham số name không tồn tại hoặc là chuỗi rỗng
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: "Vui lòng cung cấp tên phòng ban hoặc ID." });
        }

        // Kiểm tra xem `name` có phải là một số hay không
        const isIdSearch = !isNaN(name);
        const searchCriteria = isIdSearch ? { id_departments: Number(name) } : { department_name: { [Op.like]: `%${name}%` } };

        // Tìm kiếm trong cơ sở dữ liệu
        const departments = await Departments.findAll({
            where: {
                [Op.or]: [
                    searchCriteria
                ]
            }
        });

        // Nếu không tìm thấy phòng ban nào
        if (departments.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy phòng ban nào." });
        }

        // Trả về danh sách các phòng ban tìm được
        res.status(200).json(departments);

    } catch (error) {
        console.error(error); // Ghi log lỗi để dễ dàng kiểm tra
        res.status(500).json({ message: "Có lỗi xảy ra!", error });
    }
};



//Xóa phòng ban
const deleteDepartment = async (req, res) => {
    try {
      const { id } = req.params; // Nhận ID từ URL
  
      const department = await Departments.findByPk(id);
  
      if (!department) {
        return res.status(404).json({ message: "Không tìm thấy phòng ban!" });
      }
  
      // Cập nhật người dùng liên quan để bỏ phòng ban
      await Users.update(
        { id_departments: null }, 
        { where: { id_departments: id } }
      );
  
      // Xóa phòng ban
      await department.destroy();
  
      res.json({
        message: "Xóa phòng ban thành công! Các người dùng liên quan đã được cập nhật.",
      });
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      res.status(500).json({
        message: "Có lỗi xảy ra!",
        error: error.message,
        details: error,
      });
    }
  };
  
  

// Sửa phòng ban
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params; // Nhận ID từ URL
        const { department_name, department_content } = req.body; // Nhận thông tin cần sửa từ body

        const department = await Departments.findByPk(id);

        if (!department) {
            return res.status(404).json({ message: "Không tìm thấy phòng ban!" });
        }

        // Cập nhật thông tin phòng ban
        department.department_name = department_name || department.department_name;
        department.department_content = department_content || department.department_content;

        await department.save();

        res.json({ message: "Cập nhật phòng ban thành công!", department });
    } catch (error) {
        res.status(500).json({ message: "Có lỗi xảy ra!", error });
    }
};



module.exports = { addDepartment,
    
    searchDepartments,
    deleteDepartment,
    updateDepartment,
    getAllDepartments }; 
