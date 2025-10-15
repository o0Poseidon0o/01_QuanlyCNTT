// backend/src/controllers/repairTech/vendorsController.js
const RepairVendor = require("../../models/RepairTech/repairVendor");
const { Op } = require("sequelize");

const listVendors = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const where = q
      ? { [Op.or]: [{ vendor_name: { [Op.iLike]: `%${q}%` } }, { tax_code: { [Op.iLike]: `%${q}%` } }] }
      : {};
    const rows = await RepairVendor.findAll({
      where,
      order: [["vendor_name", "ASC"]],
      limit: Math.max(1, Math.min(1000, parseInt(req.query.limit || "500", 10))),
    });
    res.json(rows);
  } catch (e) {
    console.error("listVendors error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const getVendor = async (req, res) => {
  try {
    const v = await RepairVendor.findByPk(Number(req.params.id));
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json(v);
  } catch (e) {
    console.error("getVendor error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const createVendor = async (req, res) => {
  try {
    const v = await RepairVendor.create(req.body);
    res.status(201).json({ id_vendor: v.id_vendor });
  } catch (e) {
    console.error("createVendor error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const updateVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const v = await RepairVendor.findByPk(id);
    if (!v) return res.status(404).json({ message: "Not found" });
    await v.update(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error("updateVendor error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const removeVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const v = await RepairVendor.findByPk(id);
    if (!v) return res.status(404).json({ message: "Not found" });
    await v.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error("removeVendor error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  removeVendor,
};
