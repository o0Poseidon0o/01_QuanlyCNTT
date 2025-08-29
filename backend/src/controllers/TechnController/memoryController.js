const Memory = require("../../models/Techequipment/memory");
const Devices = require("../../models/Techequipment/devices");
const { Op } = require("sequelize");

// Lấy tất cả Memory
const getAllMemory = async (req, res) => {
  try {
    const memoryList = await Memory.findAll();
    if (!memoryList || memoryList.length === 0) {
      return res.status(404).json({ message: "Không có Memory nào." });
    }
    return res.status(200).json(memoryList);
  } catch (error) {
    console.error("Error in getAllMemory:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Thêm Memory
const addMemory = async (req, res) => {
  try {
    const { id_memory, memory_type, size_memory } = req.body;

    console.log("Body received:", req.body);

    if (!id_memory || !memory_type || !size_memory) {
      return res
        .status(400)
        .json({ message: "id_memory, memory_type và size_memory là bắt buộc" });
    }

    // Kiểm tra trùng ID
    const existing = await Memory.findByPk(id_memory);
    if (existing) {
      return res.status(400).json({ message: "Memory ID đã tồn tại" });
    }

    const newMemory = await Memory.create({ id_memory, memory_type, size_memory });
    return res.status(201).json(newMemory);
  } catch (error) {
    console.error("Error in addMemory:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Cập nhật Memory
const updateMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { memory_type, size_memory } = req.body;

    const memory = await Memory.findByPk(id);
    if (!memory) {
      return res.status(404).json({ message: "Không tìm thấy Memory" });
    }

    memory.memory_type = memory_type || memory.memory_type;
    memory.size_memory = size_memory || memory.size_memory;
    await memory.save();

    return res.json({ message: "Cập nhật Memory thành công", memory });
  } catch (error) {
    console.error("Error in updateMemory:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Xóa Memory
const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await Memory.findByPk(id);
    if (!memory) {
      return res.status(404).json({ message: "Không tìm thấy Memory" });
    }

    // Nếu Devices có liên kết với id_memory, kiểm tra ràng buộc
    await Devices.update({ id_memory: null }, { where: { id_memory: id }, hooks: false });

    await memory.destroy();
    return res.json({ message: "Xóa Memory thành công" });
  } catch (error) {
    console.error("Error in deleteMemory:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Tìm kiếm Memory
const searchMemory = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const isIdSearch = !isNaN(keyword.trim());

    const whereCondition = isIdSearch
      ? { id_memory: Number(keyword.trim()) }
      : {
          [Op.or]: [
            { memory_type: { [Op.like]: `%${keyword.trim()}%` } },
            { size_memory: { [Op.like]: `%${keyword.trim()}%` } }
          ]
        };

    const results = await Memory.findAll({ where: whereCondition });

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy Memory nào" });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchMemory:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  getAllMemory,
  addMemory,
  updateMemory,
  deleteMemory,
  searchMemory,
};
