// backend/src/controllers/repairTech/partsController.js
const RepairPartUsed = require("../../models/RepairTech/repairPartUsed");

const listParts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const parts = await RepairPartUsed.findAll({
      where: { id_repair: id },
      order: [["id_part_used", "ASC"]],
    });
    res.json(parts);
  } catch (e) {
    console.error("listParts error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const addParts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = Array.isArray(req.body) ? req.body : [req.body];
    const created = await RepairPartUsed.bulkCreate(
      body.map((p) => ({
        id_repair: id,
        part_name: p.part_name,
        part_code: p.part_code,
        qty: p.qty || 1,
        unit_cost: p.unit_cost || 0,
        supplier_name: p.supplier_name || null,
        note: p.note || null,
      }))
    );
    res.status(201).json({ count: created.length });
  } catch (e) {
    console.error("addParts error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePart = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const partId = Number(req.params.partId);
    const part = await RepairPartUsed.findOne({ where: { id_repair: id, id_part_used: partId } });
    if (!part) return res.status(404).json({ message: "Not found" });
    await part.update(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error("updatePart error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

const removePart = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const partId = Number(req.params.partId);
    const part = await RepairPartUsed.findOne({ where: { id_repair: id, id_part_used: partId } });
    if (!part) return res.status(404).json({ message: "Not found" });
    await part.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error("removePart error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listParts,
  addParts,
  updatePart,
  removePart,
};
