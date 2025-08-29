const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/Users/User");
const Roles = require("../../models/Roles/modelRoles");

exports.login = async (req, res) => {
  const { id_users, password_user } = req.body;

  try {
    // Kiểm tra `id_users` và `password_user` có đầy đủ
    if (!id_users || !password_user) {
      return res
        .status(400)
        .json({ message: "Missing id_users or password_user" });
    }

    // Tìm người dùng và vai trò
    const user = await User.findOne({
      where: { id_users },
      include: [{ model: Roles, attributes: ["name_role"] }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(
      password_user,
      user.password_user
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Kiểm tra `JWT_SECRET`
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in the environment variables.");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        id_users: user.id_users,
        name_role: user.Role.name_role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // console.log("Request body:", req.body);
    // Trong authloginController.js, sau khi tạo token
    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.Role.name_role,
      id_users: user.id_users, // Trả về id_users để frontend có thể lấy avatar
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};
