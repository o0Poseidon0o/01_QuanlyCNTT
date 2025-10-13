const express = require("express");
const path = require("path");
const cors = require("cors");
const sequelize = require("./src/config/database");
const departmentRouters=require('./src/routes/department/departmentRoutes');
const rolesRoles=require('./src/routes/Roles/rolesrouters');
const users=require('./src/routes/users/userRouters')
// phần đăng nhập
const authlogin =require('./src/routes/authloginRoutes/authloginRoutes')

const avatarRoutes = require('./src/middleware/Users/avatarRoutes')
const ramRouters = require('./src/routes/Technologyequipment/ramRouters')
const memoryRouters = require('./src/routes/Technologyequipment/memoryRouters')
const cpuRouters = require('./src/routes/Technologyequipment/cpuRouters')
const operationsRouter=require('./src/routes/Technologyequipment/operationRouter')
const devicestype=require('./src/routes/Technologyequipment/devicestypesRouters')
const screen=require('./src/routes/Technologyequipment/screenrouters')
const devices=require('./src/routes/Technologyequipment/devicesRouters')
// ============================Stastic=======================================
const stasdevicesRouters = require('./src/routes/Technologyequipment/stasDevices/stasdevicesRouters');
const stasusersRouters = require('./src/routes/Technologyequipment/stasDevices/stasdevicesRouters');
// =============================Repair======================================
const repairRoutes = require('./src/routes/repairTech/repairRoutes');
// ==============================Technology======================================
const AssignTech = require('./src/routes/Technologyequipment/deviceAssignRoutes');
// ==============================RolesAdmin======================================
const roleAdminRoutes = require('./src/routes/RolesAdmin/roleAdminRoutes');

require('dotenv').config();
const app = express();
app.use(cors());
// Middleware để xử lý dữ liệu JSON
app.use(express.json());
app.use("/api/admin",roleAdminRoutes)

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
app.use('/api/cpu',cpuRouters)
app.use('/api/operations',operationsRouter)
app.use('/api/devicestype',devicestype)
app.use('/api/screen',screen)
app.use('/api/devices',devices)
//==============================Stastic=======================================
app.use('/api/stasdevices',stasdevicesRouters)
app.use('/api/stasusers',stasusersRouters)
// ==============================Repair======================================
app.use('/api/repairs',repairRoutes)
// ==============================Technology======================================
app.use('/api/assignments',AssignTech)
sequelize
  .sync()
  .then(() => {
    app.listen(process.env.DB_PORTSERVER, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((error) => console.log("Database connection error:", error));
