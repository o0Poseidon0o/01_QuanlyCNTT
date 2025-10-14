// src/middleware/Users/uploadSignature.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const SIGN_DIR = path.join(__dirname, "../../uploads/sign");
if (!fs.existsSync(SIGN_DIR)) fs.mkdirSync(SIGN_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SIGN_DIR),
  filename: (req, file, cb) => {
    // lưu tạm tên gốc, controller sẽ rename sang <id_users>.<ext>
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
