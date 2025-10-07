const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// ⚠️ THÊM: import middleware upload
const upload = require("../../middleware/Users/uploadAvatar");

// Thư mục avatar
const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");

// Helper: tìm file theo id với các đuôi phổ biến
function resolveAvatarPath(id) {
  const exts = [".jpg", ".jpeg", ".png"];
  for (const ext of exts) {
    const p = path.join(AVATAR_DIR, `${id}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// API lấy avatar theo id_users (giữ + nâng nhẹ để hỗ trợ .png/.jpeg)
router.get("/:id", (req, res) => {
  const userId = req.params.id;
  const found = resolveAvatarPath(userId);

  if (found) {
    return res.sendFile(found);
  }
  const fallback = path.join(AVATAR_DIR, "default.jpg");
  return res.sendFile(fallback);
});

// ⚠️ THÊM: API cập nhật/tải lên avatar theo id_users
router.post("/:id", upload.single("avatar"), (req, res) => {
  // Với middleware hiện tại, file đã được lưu vào AVATAR_DIR
  // và tên file được lấy theo originalname (FE đã đặt {id}.{ext})
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // Có thể kiểm tra id khớp tên file, nhưng không bắt buộc (giữ nguyên logic)
  return res.json({ message: "Cập nhật avatar thành công" });
});

module.exports = router;
