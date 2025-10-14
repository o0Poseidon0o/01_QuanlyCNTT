// src/middleware/Users/uploadSignature.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const SIGN_DIR = path.resolve(__dirname, "../../uploads/sign"); // backend/src/uploads/sign
if (!fs.existsSync(SIGN_DIR)) fs.mkdirSync(SIGN_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SIGN_DIR),
  filename: (req, file, cb) => {
    const id = String(req.params.id_users || "unknown");
    let ext = ".png";
    if (file.mimetype === "image/jpeg") ext = ".jpg";
    else if (file.mimetype === "image/svg+xml") ext = ".svg";
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/svg+xml"].includes(file.mimetype);
  cb(ok ? null : new Error("Only PNG/JPG/SVG allowed"), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
