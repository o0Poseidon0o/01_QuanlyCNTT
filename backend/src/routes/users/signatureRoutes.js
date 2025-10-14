const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const {
  uploadSignature,
  getSignature,
  getSignatureFile,
  saveDrawnSignature,
  deleteSignature,
} = require("../../controllers/users/signatureController");

const UPLOADS_DIR_ABS = path.resolve(__dirname, "../uploads");
const SIGN_DIR_ABS = path.join(UPLOADS_DIR_ABS, "sign");
if (!fs.existsSync(SIGN_DIR_ABS)) fs.mkdirSync(SIGN_DIR_ABS, { recursive: true });

const allowed = ["image/png", "image/jpeg", "image/svg+xml"];
const fileFilter = (_req, file, cb) => cb(null, allowed.includes(file.mimetype));

function removeAllVariants(id) {
  [".png", ".jpg", ".jpeg", ".svg"].forEach((ext) => {
    const p = path.join(SIGN_DIR_ABS, `${id}${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SIGN_DIR_ABS),
  filename: (req, file, cb) => {
    const id = String(req.params.id_users || "").trim();
    let ext = path.extname(file.originalname || "").toLowerCase();

    if (![".png", ".jpg", ".jpeg", ".svg"].includes(ext)) {
      if (file.mimetype === "image/png") ext = ".png";
      else if (file.mimetype === "image/jpeg") ext = ".jpg";
      else if (file.mimetype === "image/svg+xml") ext = ".svg";
      else ext = ".png";
    }

    try { removeAllVariants(id); } catch {}
    cb(null, `${id}${ext}`); // đè theo id
  },
});

const upload = multer({ storage, fileFilter });
const router = express.Router();

router.get("/file/:id_users", getSignatureFile);
router.post("/upload/:id_users", upload.single("file"), uploadSignature);
router.post("/draw/:id_users", saveDrawnSignature);
router.delete("/:id_users", deleteSignature);
router.get("/:id_users", getSignature);

module.exports = router;
