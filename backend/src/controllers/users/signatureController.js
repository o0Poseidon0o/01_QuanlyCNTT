const path = require("path");
const fs = require("fs");
const User = require("../../models/Users/User");

const DEFAULT_SIGNATURE_REL = "../../uploads/sign/ticket.png";
const UPLOADS_DIR_ABS = path.resolve(__dirname, "../../uploads");
const SIGN_DIR_ABS = path.join(UPLOADS_DIR_ABS, "sign");

if (!fs.existsSync(SIGN_DIR_ABS)) fs.mkdirSync(SIGN_DIR_ABS, { recursive: true });

const ensureId = (id) => /^\d+$/.test(String(id || "").trim());
const resolveAbs = (storedPath) => path.resolve(__dirname, storedPath);

function safeUnlink(absPath) {
  try { if (absPath && fs.existsSync(absPath)) fs.unlinkSync(absPath); }
  catch (e) { console.warn("safeUnlink warn:", e.message); }
}

function removeAllVariants(id_users) {
  [".png", ".jpg", ".jpeg", ".svg"].forEach((ext) => {
    safeUnlink(path.join(SIGN_DIR_ABS, `${id_users}${ext}`));
  });
}

function findExistingSignaturePathAbs(id_users) {
  const exts = [".png", ".jpg", ".jpeg", ".svg"];
  for (const ext of exts) {
    const abs = path.join(SIGN_DIR_ABS, `${id_users}${ext}`);
    if (fs.existsSync(abs)) return abs;
  }
  return resolveAbs(DEFAULT_SIGNATURE_REL);
}

/** Chọn đuôi file hợp lệ từ mimetype/originalname (mặc định .png) */
function pickExt(file) {
  const m = (file?.mimetype || "").toLowerCase();
  if (m.includes("svg")) return ".svg";
  if (m.includes("jpeg")) return ".jpg";
  if (m.includes("jpg")) return ".jpg";
  if (m.includes("png")) return ".png";
  const extByName = path.extname((file?.originalname || "").toLowerCase());
  if ([".svg", ".jpg", ".jpeg", ".png"].includes(extByName)) return extByName;
  return ".png";
}

/** UPLOAD: luôn xoá biến thể cũ và ghi đè <id_users>.<ext> */
const uploadSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    if (!ensureId(id_users)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "No signature file uploaded" });

    // 1) Xoá mọi biến thể cũ
    removeAllVariants(id_users);

    // 2) Xác định đuôi cần lưu
    const ext = pickExt(req.file);
    const targetAbs = path.join(SIGN_DIR_ABS, `${id_users}${ext}`);

    // 3) Ghi đè: hỗ trợ cả diskStorage (req.file.path) và memoryStorage (req.file.buffer)
    if (req.file.path && fs.existsSync(req.file.path)) {
      if (!fs.existsSync(SIGN_DIR_ABS)) fs.mkdirSync(SIGN_DIR_ABS, { recursive: true });
      fs.renameSync(req.file.path, targetAbs);
    } else if (req.file.buffer) {
      fs.writeFileSync(targetAbs, req.file.buffer);
    } else {
      return res.status(400).json({ message: "Invalid uploaded file" });
    }

    // 4) Cập nhật DB theo format ../../uploads/...
    const dbPath = `../../uploads/sign/${id_users}${ext}`;
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

const getSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    if (!ensureId(id_users)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      signature_image: user.signature_image || DEFAULT_SIGNATURE_REL,
    });
  } catch (err) {
    console.error("getSignature error:", err);
    return res.status(500).json({ message: "Error fetching signature", error: err.message });
  }
};

const getSignatureFile = async (req, res) => {
  try {
    const { id_users } = req.params;
    if (!ensureId(id_users)) return res.status(400).send("Invalid user id");

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).send("User not found");

    let abs = null;

    // 1) Ưu tiên đường dẫn trong DB nếu tồn tại file
    if (user.signature_image) {
      const candidate = resolveAbs(user.signature_image);
      if (fs.existsSync(candidate)) abs = candidate;
    }

    // 2) Nếu không có/không tồn tại → tìm theo mẫu <id>.<ext>
    if (!abs) abs = findExistingSignaturePathAbs(id_users);

    // 3) Nếu vẫn không có → 404 (trường hợp file mặc định cũng không tồn tại)
    if (!fs.existsSync(abs)) return res.status(404).send("Signature not found");

    res.set("Cache-Control", "no-store");
    return res.sendFile(abs);
  } catch (err) {
    console.error("getSignatureFile error:", err);
    return res.status(500).send("Error reading signature");
  }
};

/** KÝ TAY: luôn ghi đè <id_users>.png và xoá mọi biến thể trước đó */
const saveDrawnSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    if (!ensureId(id_users)) return res.status(400).json({ message: "Invalid user id" });

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

    // 1) Xoá hết biến thể cũ
    removeAllVariants(id_users);

    // 2) Ghi đè PNG theo tên cố định
    const filename = `${id_users}.png`;
    const absPath = path.join(SIGN_DIR_ABS, filename);
    fs.writeFileSync(absPath, buffer);

    // 3) Cập nhật DB path
    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

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

/** XÓA: xóa file (mọi biến thể) + set default */
const deleteSignature = async (req, res) => {
  try {
    const { id_users } = req.params;
    if (!ensureId(id_users)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByPk(id_users);
    if (!user) return res.status(404).json({ message: "User not found" });

    removeAllVariants(id_users); // xóa file khỏi ổ đĩa
    user.signature_image = DEFAULT_SIGNATURE_REL;
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
