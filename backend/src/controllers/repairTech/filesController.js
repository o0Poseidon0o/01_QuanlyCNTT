// backend/src/controllers/repairTech/filesController.js
const path = require("path");
const fs = require("fs/promises");
const RepairFiles = require("../../models/RepairTech/repairFiles");

const listFiles = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const files = await RepairFiles.findAll({
      where: { id_repair: id },
      order: [["uploaded_at", "ASC"]],
    });
    res.json(files);
  } catch (e) {
    console.error("listFiles error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload dùng middleware repairFilesUpload.js để có req.files
const upload = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const uploaded_by = Number(req.body.uploaded_by) || null;
    const files = (req.files || []).map((f) => ({
      id_repair: id,
      file_path: f.path.replace(/\\/g, "/"),
      file_name: f.filename,
      mime_type: f.mimetype,
      uploaded_by,
      uploaded_at: new Date(),
    }));
    const created = await RepairFiles.bulkCreate(files);
    res.status(201).json({ count: created.length, files: created });
  } catch (e) {
    console.error("upload files error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fileId = Number(req.params.fileId);
    const f = await RepairFiles.findOne({ where: { id_repair: id, id_file: fileId } });
    if (!f) return res.status(404).json({ message: "Not found" });

    // cố gắng xoá file vật lý nếu nằm trong thư mục uploads/repairs
    try {
      const p = f.file_path;
      if (p && p.includes("/uploads/repairs/")) {
        const abs = path.join(process.cwd(), p);
        await fs.unlink(abs).catch(() => {});
      }
    } catch (_) {}

    await f.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error("remove file error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listFiles,
  upload,
  remove,
};
