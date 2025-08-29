const express = require("express");
const path = require("path");
const cors = require("cors");
const sequelize = require("./src/config/database");
const departmentRouters=require('./src/routes/department/departmentRoutes');
const rolesRoles=require('./src/routes/Roles/rolesrouters');
const users=require('./src/routes/users/userRouters')
const authlogin =require('./src/routes/authloginRoutes/authloginRoutes')
const avatarRoutes = require('./src/middleware/Users/avatarRoutes')
const ramRouters = require('./src/routes/Technologyequipment/ramRouters')
const memoryRouters = require('./src/routes/Technologyequipment/memoryRouters')

require('dotenv').config();
const app = express();
app.use(cors());
// Middleware để xử lý dữ liệu JSON
app.use(express.json());


// sử dụng route của phòng ban
app.use('/api/departments',departmentRouters);
app.use('/api/roles',rolesRoles);
// sử dụng route của Users
app.use('/api/users',users)
//route đến phần đăng nhập phân quyền roles
app.use('/api/auth',authlogin)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/avatars",avatarRoutes);
app.use("/api/ram",ramRouters)
app.use("/api/memory",memoryRouters)
sequelize
  .sync()
  .then(() => {
    app.listen(process.env.DB_PORTSERVER, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((error) => console.log("Database connection error:", error));
