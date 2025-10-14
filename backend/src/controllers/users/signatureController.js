// src/controllers/users/signatureController.js
const path = require("path");
const fs = require("fs");
const User = require("../../models/Users/User");

// Thư mục thật chứa uploads
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
const SIGN_DIR = path.join(UPLOADS_DIR, "sign");

// Đường dẫn mặc định LƯU TRONG DB (giống avatar: ../../uploads/...)
const DEFAULT_DB_PATH = "../../uploads/sign/ticket.png";

// đảm bảo thư mục tồn tại
if (!fs.existsSync(SIGN_DIR)) fs.mkdirSync(SIGN_DIR, { recursive: true });

// Convert DB path -> absolute path
function dbPathToAbs(dbPath) {
  if (!dbPath) return path.join(SIGN_DIR, "ticket.png");
  const norm = String(dbPath).replace(/\\/g, "/");
  const cleaned = norm.includes("uploads/") ? norm.slice(norm.indexOf("uploads/")) : norm;
  return path.join(UPLOADS_DIR, cleaned.replace(/^(\.\/|\.\.\/)+/, ""));
}

const isDefault = (p) =>
  String(p || "").endsWith("/uploads/sign/ticket.png") ||
  String(p || "").endsWith("../../uploads/sign/ticket.png");

function safeUnlinkDbPath(dbPath) {
  try {
    if (!dbPath || isDefault(dbPath)) return;
    const abs = dbPathToAbs(dbPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn("safeUnlink warn:", e.message);
  }
}

/** Upload ảnh (multer đã lưu xong) */
const uploadSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "No signature file uploaded" });

    const dbPath = `../../uploads/sign/${req.file.filename}`; // giống avatar
    safeUnlinkDbPath(user.signature_image);
    user.signature_image = dbPath;
    await user.save();

    return res.status(200).json({
      message: "Signature uploaded successfully",
      signature_image: dbPath,
    });
  } catch (err) {
    console.error("uploadSignature error:", err);
    return res.status(500).json({ message: "Error uploading signature", error: err.message });
  }
};

/** JSON: đường dẫn hiện tại */
const getSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ signature_image: user.signature_image || DEFAULT_DB_PATH });
  } catch (err) {
    console.error("getSignature error:", err);
    return res.status(500).json({ message: "Error fetching signature", error: err.message });
  }
};

/** Trả file ảnh chữ ký (dùng cho FE) */
const getSignatureFile = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).send("User not found");

    const candidate = user.signature_image || DEFAULT_DB_PATH;
    let abs = dbPathToAbs(candidate);

    if (!fs.existsSync(abs)) {
      abs = path.join(SIGN_DIR, "ticket.png");
      if (!fs.existsSync(abs)) return res.status(404).send("Signature not found");
    }

    res.set("Cache-Control", "no-store");
    return res.sendFile(abs);
  } catch (err) {
    console.error("getSignatureFile error:", err);
    return res.status(500).send("Error reading signature");
  }
};

/** Lưu chữ ký vẽ tay (dataURL) – nhận JSON hoặc text/plain */
const saveDrawnSignature = async (req, res) => {
  try {
    const { id_users } = req.params;

    let raw = null;
    if (typeof req.body === "string") raw = req.body.trim();
    else if (req.body && typeof req.body === "object") {
      raw =
        req.body.dataURL ||
        req.body.dataUrl ||
        req.body.signature ||
        req.body.image ||
        req.body.base64 ||
        null;
      if (typeof raw === "string") raw = raw.trim();
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

    const filename = `${id_users}.png`;
    const absPath = path.join(SIGN_DIR, filename);
    fs.writeFileSync(absPath, buffer);

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.signature_image &&
      !isDefault(user.signature_image) &&
      !user.signature_image.endsWith(`/${filename}`)
    ) {
      safeUnlinkDbPath(user.signature_image);
    }

    const dbPath = `../../uploads/sign/${filename}`;
    user.signature_image = dbPath;
    await user.save();

    return res.status(200).json({
      message: "Drawn signature saved successfully",
      signature_image: dbPath,
    });
  } catch (err) {
    console.error("saveDrawnSignature error:", err);
    return res.status(500).json({ message: "Error saving drawn signature", error: err.message });
  }
};

/** Xoá chữ ký -> reset mặc định */
const deleteSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    safeUnlinkDbPath(user.signature_image);
    user.signature_image = DEFAULT_DB_PATH;
    await user.save();

    return res.status(200).json({
      message: "Signature deleted and reset to default",
      signature_image: user.signature_image,
    });
  } catch (err) {
    console.error("deleteSignature error:", err);
    return res.status(500).json({ message: "Error deleting signature", error: err.message });
  }
};

module.exports = {
  uploadSignature,
  getSignature,
  getSignatureFile,
  saveDrawnSignature,
  deleteSignature,
};
