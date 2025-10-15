// backend/src/routes/repairTech/repairRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/repairTech/repairController");
const upload = require("../../middleware/Repair/repairFilesUpload"); // multer

// ⚠️ Đặt các route CỤ THỂ trước route động `/:id`
router.get("/options", ctrl.getAssigneeVendorOptions);   // users & vendors cho dropdown
router.get("/summary", ctrl.getSummaryStatsSafe);        // thống kê

// ==== MỚI: phục vụ FE ====
// Trả toàn bộ (có thể kèm phân trang / filter nhẹ, mặc định ẩn "Huỷ")
router.get("/all", ctrl.listAllRepairs);
// Tìm kiếm linh hoạt: reported_by, id_devices, status, severity, priority, q, from, to...
router.get("/search", ctrl.searchRepairs);
// Theo người báo cáo
router.get("/user/:id", ctrl.listRepairsByUser);

// Danh sách + filter đơn giản (giữ nguyên cho các màn hình khác nếu đang dùng)
router.get("/", ctrl.listRepairs);

// Tạo ticket
router.post("/", ctrl.createRequest);

// ==== Các hành động quản lý ticket (đặt TRƯỚC `/:id`) ====
router.patch("/:id/approve", ctrl.approveRequest);          // duyệt
router.patch("/:id/assign-tech", ctrl.assignTechnician);    // gán kỹ thuật viên (nội bộ)
router.patch("/:id/assign-vendor", ctrl.assignVendor);      // gán vendor (bên ngoài)
router.patch("/:id/cancel", ctrl.cancelRequest);            // huỷ
router.post("/:id/confirm", ctrl.confirmComplete);          // người dùng xác nhận hoàn thành
router.delete("/:id", ctrl.removeRequest);                  // xoá ticket

// Theo ID (đặt SAU cùng các route cụ thể)
router.get("/:id", ctrl.getRepair);                         // chi tiết
router.patch("/:id/status", ctrl.updateStatus);             // cập nhật trạng thái (+history)
router.put("/:id/detail", ctrl.upsertDetail);               // upsert detail
router.post("/:id/parts", ctrl.addPart);                    // thêm phụ tùng
router.post("/:id/files", upload.array("files", 8), ctrl.uploadFiles); // upload files

module.exports = router;
