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
// ==============================Signature======================================
const signatureRoutes = require('./src/routes/users/signatureRoutes');
//===============================Software======================================
const softwareRoutes = require("./src/routes/Software/softwareRoutes");
const deviceSoftwareRoutes = require("./src/routes/Software/deviceSoftwareRoutes");
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

// ==============================Signature======================================

// Body parsers (đủ lớn cho dataURL)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.text({ type: "text/plain", limit: "5mb" })); // chỉ cho text/plain

app.use("/api/signatures", signatureRoutes);

app.use((err, _req, res, _next) => {
  console.error("UNCAUGHT ERROR:", err.stack || err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
})
//===============================Software======================================
app.use("/api/software", softwareRoutes);
app.use("/api/device-software", deviceSoftwareRoutes);






// (tuỳ chọn) middleware bắt lỗi cuối cùng để log 500 rõ ràng
sequelize
  .sync()
  .then(() => {
    app.listen(process.env.DB_PORTSERVER, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((error) => console.log("Database connection error:", error));
