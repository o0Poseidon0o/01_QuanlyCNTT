// src/routes/signatureRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadSignature,
  getSignature,
  getSignatureFile,
  saveDrawnSignature,
  deleteSignature,
} = require("../../controllers/users/signatureController");

// THƯ MỤC LƯU FILE cho Multer (phải đảm bảo tồn tại tại đây)
const SIGN_DIR_ABS = path.resolve(__dirname, "../uploads/sign");
if (!fs.existsSync(SIGN_DIR_ABS)) fs.mkdirSync(SIGN_DIR_ABS, { recursive: true });

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SIGN_DIR_ABS),
  filename: (req, file, cb) => {
    const id = req.params.id_users || Date.now();
    const ext = (path.extname(file.originalname || "") || ".png").toLowerCase();
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only PNG/JPG/SVG allowed"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

const router = express.Router();

// JSON đường dẫn đang lưu
router.get("/:id_users", getSignature);

// Trả file ảnh (FE dùng cái này để hiển thị)
router.get("/file/:id_users", getSignatureFile);

// Upload ảnh chữ ký (multipart/form-data; field name: "file")
router.post(
  "/upload/:id_users",
  (req, res, next) => upload.single("file")(req, res, (err) => {
    if (err) {
      // BẮT LỖI MULTER RÕ RÀNG -> tránh 500 trắng
      const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(code).json({ message: err.message || "Upload error" });
    }
    next();
  }),
  uploadSignature
);

// Vẽ chữ ký (JSON {dataUrl} hoặc text/plain)
router.post("/draw/:id_users", saveDrawnSignature);

// Xoá -> reset mặc định
router.delete("/:id_users", deleteSignature);

module.exports = router;
