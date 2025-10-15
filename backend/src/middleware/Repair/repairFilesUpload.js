// backend/src/middleware/Repair/uploadRepairfiles.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ✅ Thư mục đích: ../../uploads/PDF (từ thư mục hiện tại)
const UPLOAD_DIR = path.join(__dirname, "../../uploads/PDF");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = req.params?.id || "ticket";
    const ext = path.extname(file.originalname) || "";
    const safe = `${id}_${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok =
    /image|pdf|text|csv|zip|rar|7z|msword|officedocument|excel|spreadsheet|powerpoint/.test(
      file.mimetype
    );
  cb(null, ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = upload;
