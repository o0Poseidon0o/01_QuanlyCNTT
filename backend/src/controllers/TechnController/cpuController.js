const Cpu = require('../../models/Techequipment/cpu');
const Devices = require("../../models/Techequipment/devices");
const { Op } = require('sequelize');

// ➤ Thêm CPU
const addCpu = async (req, res) => {
  const { id_cpu, name_cpu } = req.body;

  try {
    if (!id_cpu || !name_cpu) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Cpu.findByPk(id_cpu);
    if (exists) {
      return res.status(400).json({ message: "CPU ID already exists" });
    }

    const newCpu = await Cpu.create({ id_cpu, name_cpu });
    res.status(201).json({ message: "CPU added successfully", cpu: newCpu });
  } catch (error) {
    console.error("Error adding CPU:", error);
    res.status(500).json({ message: "Error adding CPU", error: error.message });
  }
};

// ➤ Cập nhật CPU
const updateCpu = async (req, res) => {
  const { id } = req.params;
  const { name_cpu } = req.body;

  try {
    const cpu = await Cpu.findByPk(id);
    if (!cpu) {
      return res.status(404).json({ message: "CPU not found" });
    }

    await cpu.update({
      name_cpu: name_cpu || cpu.name_cpu,
    });

    res.status(200).json({ message: "CPU updated successfully", cpu });
  } catch (error) {
    console.error("Error updating CPU:", error);
    res.status(500).json({ message: "Error updating CPU", error: error.message });
  }
};

// ➤ Xóa CPU
const deleteCpu = async (req, res) => {
  const { id } = req.params;

  try {
    const cpu = await Cpu.findByPk(id);
    if (!cpu) {
      return res.status(404).json({ message: "CPU not found" });
    }

    await Devices.update(
      { id_cpu: null },
      { where: { id_cpu: id }, validate: false }
    );

    await cpu.destroy();
    res.status(200).json({ message: "CPU deleted successfully" });
  } catch (error) {
    console.error("Error deleting CPU:", error);
    res.status(500).json({ message: "Error deleting CPU", error: error.message });
  }
};



// ➤ Lấy tất cả CPU
const getAllCpus = async (req, res) => {
  try {
    const cpus = await Cpu.findAll();
    if (!cpus || cpus.length === 0) {
      return res.status(404).json({ message: "No CPUs found" });
    }
    return res.status(200).json(cpus); // ✅ Trả về array như RAM
  } catch (error) {
    console.error("Error retrieving CPUs:", error);
    return res.status(500).json({ message: "Error retrieving CPUs", error: error.message });
  }
};


// ➤ Tìm kiếm CPU
const searchCpus = async (req, res) => {
  const { name_cpu } = req.query;
  let conditions = {};

  if (name_cpu) {
    conditions.name_cpu = { [Op.like]: `%${name_cpu}%` };
  }

  try {
    const cpus = await Cpu.findAll({ where: conditions });
    if (cpus.length === 0) {
      return res.status(404).json({ message: "No CPUs found" });
    }

    res.status(200).json(cpus);
  } catch (error) {
    console.error("Error searching CPUs:", error);
    res.status(500).json({ message: "Error searching CPUs", error: error.message });
  }
};

module.exports = {
  addCpu,
  updateCpu,
  deleteCpu,
  getAllCpus,
  searchCpus,
};
