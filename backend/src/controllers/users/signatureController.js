// src/controllers/users/signatureController.js
const path = require("path");
const fs = require("fs");
const User = require("../../models/Users/User");

const SIGN_DIR = path.join(__dirname, "../../uploads/sign"); // backend/src/uploads/sign
const DEFAULT_PUBLIC = "/uploads/sign/ticket.png";

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensureDir(SIGN_DIR);

const basename = (p) => path.basename(String(p || ""));

// Chuẩn hoá mọi kiểu giá trị signature cũ -> /uploads/sign/<file>
const normalizePublicPath = (p) => {
  const b = basename(p);
  if (!b) return DEFAULT_PUBLIC;
  // Chỉ cho phép file trong thư mục sign
  return `/uploads/sign/${b}`;
};

const isDefaultSignature = (p) => String(p || "") === DEFAULT_PUBLIC;

const safeUnlinkPublic = (publicPath) => {
  try {
    if (!publicPath || isDefaultSignature(publicPath)) return;
    const file = basename(publicPath);
    const abs = path.join(SIGN_DIR, file);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn("safeUnlink warn:", e.message);
  }
};

/** === Upload chữ ký ảnh (multipart/form-data, field: "file") === */
const uploadSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "No signature file uploaded" });

    // Đổi tên file theo id_users.<ext> để thống nhất
    const ext = path.extname(req.file.originalname || req.file.filename || ".png") || ".png";
    const filename = `${id_users}${ext.toLowerCase()}`;
    const destAbs = path.join(SIGN_DIR, filename);

    // Xoá cũ (nếu có & không phải mặc định)
    if (user.signature_image) safeUnlinkPublic(user.signature_image);

    // Di chuyển/ghi file về tên mới
    fs.renameSync(req.file.path, destAbs);

    const publicPath = normalizePublicPath(filename);
    user.signature_image = publicPath;
    await user.save();

    res.status(200).json({ message: "Signature uploaded successfully", signature_image: publicPath });
  } catch (err) {
    console.error("uploadSignature error:", err);
    res.status(500).json({ message: "Error uploading signature", error: err.message });
  }
};

/** === Lấy chữ ký === */
const getSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Chuẩn hoá giá trị cũ trong DB (../../uploads/..., uploads\sign\...)
    let publicPath = user.signature_image ? normalizePublicPath(user.signature_image) : DEFAULT_PUBLIC;

    // Nếu DB đang lưu sai format -> sửa lại để lần sau khỏi phải chuẩn hoá nữa
    if (publicPath !== user.signature_image) {
      user.signature_image = publicPath;
      await user.save();
    }

    res.status(200).json({ signature_image: publicPath });
  } catch (err) {
    console.error("getSignature error:", err);
    res.status(500).json({ message: "Error fetching signature", error: err.message });
  }
};

/** === Lưu chữ ký vẽ tay (canvas dataURL) — nhận JSON hoặc text/plain === */
const saveDrawnSignature = async (req, res) => {
  try {
    const { id_users } = req.params;

    let raw = null;
    if (typeof req.body === "string") raw = req.body.trim();
    else if (req.body && typeof req.body === "object") {
      raw = (req.body.dataURL || req.body.dataUrl || req.body.signature || req.body.image || req.body.base64 || "").trim();
    }
    if (!raw) return res.status(400).json({ message: "Invalid signature dataURL" });

    if (!raw.startsWith("data:image/")) {
      const b64 = raw.includes(",") ? raw.split(",").pop() : raw;
      raw = `data:image/png;base64,${b64}`;
    }

    const parts = raw.split(",");
    if (parts.length < 2) return res.status(400).json({ message: "Invalid signature dataURL" });
    const buffer = Buffer.from(parts[1], "base64");
    if (!buffer?.length) return res.status(400).json({ message: "Invalid signature dataURL" });

    // Ghi file <id>.png
    const filename = `${id_users}.png`;
    const absPath = path.join(SIGN_DIR, filename);
    fs.writeFileSync(absPath, buffer);

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Xoá cũ nếu khác file vừa ghi và không phải mặc định
    if (user.signature_image) {
      const oldBase = basename(user.signature_image);
      if (!isDefaultSignature(user.signature_image) && oldBase !== filename) {
        safeUnlinkPublic(user.signature_image);
      }
    }

    const publicPath = normalizePublicPath(filename);
    user.signature_image = publicPath;
    await user.save();

    res.status(200).json({ message: "Drawn signature saved successfully", signature_image: publicPath });
  } catch (err) {
    console.error("saveDrawnSignature error:", err);
    res.status(500).json({ message: "Error saving drawn signature", error: err.message });
  }
};

/** === Xoá chữ ký -> reset mặc định === */
const deleteSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    safeUnlinkPublic(user.signature_image);

    user.signature_image = DEFAULT_PUBLIC;
    await user.save();

    res.status(200).json({ message: "Signature deleted and reset to default", signature_image: user.signature_image });
  } catch (err) {
    console.error("deleteSignature error:", err);
    res.status(500).json({ message: "Error deleting signature", error: err.message });
  }
};

module.exports = { uploadSignature, getSignature, saveDrawnSignature, deleteSignature };
