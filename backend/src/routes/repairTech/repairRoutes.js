// backend/src/routes/repairTech/repairRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/repairTech/repairController");
const upload = require("../../middleware/Repair/uploadRepairfiles"); // multer

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

// Theo ID (đặt SAU cùng)
router.get("/:id", ctrl.getRepair);                      // chi tiết
router.patch("/:id/status", ctrl.updateStatus);          // cập nhật trạng thái (+history)
router.put("/:id/detail", ctrl.upsertDetail);            // upsert detail
router.post("/:id/parts", ctrl.addPart);                 // thêm phụ tùng
router.post("/:id/files", upload.array("files", 8), ctrl.uploadFiles); // upload files

module.exports = router;
