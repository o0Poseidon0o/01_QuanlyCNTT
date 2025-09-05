const Operationsystem = require("../../models/Techequipment/operationsystem");
const Devices = require("../../models/Techequipment/devices");
const { Op } = require('sequelize');

// Thêm mới OS
const addOperationsystem = async (req, res) => {
  try {
    const { id_operationsystem, name_operationsystem } = req.body;

    if (!name_operationsystem) {
      return res.status(400).json({ message: "name_operationsystem is required" });
    }

    // Kiểm tra nếu có gửi id và id đó đã tồn tại
    if (id_operationsystem) {
      const exists = await Operationsystem.findByPk(id_operationsystem);
      if (exists) {
        return res.status(400).json({ message: "Operationsystem ID already exists" });
      }
    }

    const newOS = await Operationsystem.create({ id_operationsystem, name_operationsystem });
    return res.status(201).json({ message: "Operationsystem added successfully", operationsystem: newOS });
  } catch (error) {
    console.error("Error adding operationsystem:", error);
    return res.status(500).json({ message: "Error adding operationsystem", error: error.message });
  }
};

// Lấy tất cả OS
const getAllOperationsystems = async (req, res) => {
  try {
    const operationsystems = await Operationsystem.findAll();
    return res.status(200).json(operationsystems);
  } catch (error) {
    console.error("Error fetching operationsystems:", error);
    return res.status(500).json({ message: "Error fetching operationsystems", error: error.message });
  }
};

// Lấy OS theo ID
const getOperationsystemById = async (req, res) => {
  try {
    const { id } = req.params;
    const operationsystem = await Operationsystem.findByPk(id);

    if (!operationsystem) {
      return res.status(404).json({ message: "Operationsystem not found" });
    }

    return res.status(200).json(operationsystem);
  } catch (error) {
    console.error("Error fetching operationsystem:", error);
    return res.status(500).json({ message: "Error fetching operationsystem", error: error.message });
  }
};

// Cập nhật OS
const updateOperationsystem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_operationsystem } = req.body;

    const operationsystem = await Operationsystem.findByPk(id);
    if (!operationsystem) {
      return res.status(404).json({ message: "Operationsystem not found" });
    }

    await operationsystem.update({
      name_operationsystem: name_operationsystem || operationsystem.name_operationsystem
    });

    return res.status(200).json({ message: "Operationsystem updated successfully", operationsystem });
  } catch (error) {
    console.error("Error updating operationsystem:", error);
    return res.status(500).json({ message: "Error updating operationsystem", error: error.message });
  }
};

// Xóa OS
const deleteOperationsystem = async (req, res) => {
  try {
    const { id } = req.params;
    const operationsystem = await Operationsystem.findByPk(id);

    if (!operationsystem) {
      return res.status(404).json({ message: "Operationsystem not found" });
    }
    await Devices.update(
      { id_operationsystem: null },
      { where: { id_operationsystem: id }, validate: false }
    );
    await operationsystem.destroy();
    return res.status(200).json({ message: "Operationsystem deleted successfully" });
  } catch (error) {
    console.error("Error deleting operationsystem:", error);
    return res.status(500).json({ message: "Error deleting operationsystem", error: error.message });
  }
};

module.exports = {
  addOperationsystem,
  getAllOperationsystems,
  getOperationsystemById,
  updateOperationsystem,
  deleteOperationsystem
};
