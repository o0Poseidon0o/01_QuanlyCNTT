const express = require('express');
const router = express.Router();
const departmentController=require('../../controllers/departmentController/adddepartmentController');


// router thêm phòng ban cái này để đưa đến server.js để RestAPI được lấy ở controller
router.post('/add',departmentController.addDepartment);
router.get('/search',departmentController.searchDepartments)// tim kiem
router.delete('/delete/:id',departmentController.deleteDepartment);// xoa
router.put('/update/:id',departmentController.updateDepartment);
router.get('/all-departments',departmentController.getAllDepartments)// Hiển thị tất cả phòng ban






module.exports=router;