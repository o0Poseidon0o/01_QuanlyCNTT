// backend/src/controllers/software/softwareController.js
const { Op } = require("sequelize");
const Software = require("../../models/Software/software");

const createSoftware = async (req, res) => {
  try {
    const { name_software, version, vendor, category, license_type, license_key_mask, license_notes, is_active } = req.body;

    if (!name_software || !version || !license_type) {
      return res.status(400).json({ message: "name_software, version, license_type là bắt buộc." });
    }

    const sw = await Software.create({
      name_software, version, vendor, category, license_type, license_key_mask, license_notes, is_active: is_active ?? true,
    });

    res.status(201).json(sw);
  } catch (err) {
    console.error("createSoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

const listSoftware = async (req, res) => {
  try {
    const { q, active } = req.query;
    const where = {};
    if (q) {
      where[Op.or] = [
        { name_software: { [Op.iLike]: `%${q}%` } },
        { vendor: { [Op.iLike]: `%${q}%` } },
        { category: { [Op.iLike]: `%${q}%` } },
        { version: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (active === "true") where.is_active = true;
    if (active === "false") where.is_active = false;

    const rows = await Software.findAll({ where, order: [["name_software", "ASC"], ["version", "ASC"]] });
    res.json(rows);
  } catch (err) {
    console.error("listSoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

const updateSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const [n] = await Software.update(req.body, { where: { id_software: id } });
    if (!n) return res.status(404).json({ message: "Không tìm thấy software." });
    const sw = await Software.findByPk(id);
    res.json(sw);
  } catch (err) {
    console.error("updateSoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

const deleteSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const n = await Software.destroy({ where: { id_software: id } });
    if (!n) return res.status(404).json({ message: "Không tìm thấy software." });
    res.json({ message: "Đã xóa phần mềm." });
  } catch (err) {
    console.error("deleteSoftware error:", err);
    res.status(500).json({ message: "Có lỗi xảy ra!", error: err.message });
  }
};

module.exports = {
  createSoftware,
  listSoftware,
  updateSoftware,
  deleteSoftware,
};
