const express = require("express");
const router = express.Router();

const signature = require("../../controllers/users/signatureController");
const upload = require("../../middleware/Users/uploadSignature");

// Upload ảnh chữ ký (multipart)
router.post("/upload/:id_users", upload.single("file"), signature.uploadSignature);

// Lưu chữ ký vẽ tay (canvas dataURL)
router.post("/draw/:id_users", signature.saveDrawnSignature);

// Lấy đường dẫn chữ ký (JSON)
router.get("/:id_users", signature.getSignature);

// Xoá chữ ký (reset về mặc định)
router.delete("/:id_users", signature.deleteSignature);

module.exports = router;
