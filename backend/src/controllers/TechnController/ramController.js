const Ram = require("../../models/Techequipment/ram");
const Devices = require("../../models/Techequipment/devices");
const { Op } = require("sequelize");

/**
 * Lấy tất cả RAM
 */
const getAllRam = async (req, res) => {
  try {
    const rams = await Ram.findAll();
    if (rams.length === 0) {
      return res.status(404).json({ message: "Không có RAM nào" });
    }
    return res.status(200).json(rams);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách RAM:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Thêm RAM
 */
const addRam = async (req, res) => {
  try {
    const { id_ram, name_ram } = req.body;

    // Kiểm tra input
    if (!id_ram || !name_ram) {
      return res
        .status(400)
        .json({ message: "id_ram và name_ram là bắt buộc" });
    }

    // Kiểm tra trùng ID
    const existing = await Ram.findByPk(id_ram);
    if (existing) {
      return res.status(400).json({ message: "ID RAM đã tồn tại" });
    }

    const newRam = await Ram.create({ id_ram, name_ram });
    return res
      .status(201)
      .json({ message: "Thêm RAM thành công", ram: newRam });
  } catch (error) {
    console.error("Lỗi khi thêm RAM:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Cập nhật RAM
 */
const updateRam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ram } = req.body;

    const ram = await Ram.findByPk(id);
    if (!ram) {
      return res.status(404).json({ message: "Không tìm thấy RAM" });
    }

    if (!name_ram || name_ram.trim() === "") {
      return res.status(400).json({ message: "name_ram là bắt buộc" });
    }

    ram.name_ram = name_ram;
    await ram.save();

    return res.status(200).json({ message: "Cập nhật RAM thành công", ram });
  } catch (error) {
    console.error("Lỗi khi cập nhật RAM:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Xóa RAM
 */
const deleteRam = async (req, res) => {
  try {
    const { id } = req.params;

    const ram = await Ram.findByPk(id);
    if (!ram) {
      return res.status(404).json({ message: "Không tìm thấy RAM" });
    }

    // Kiểm tra Devices có bắt buộc id_ram không
    await Devices.update(
      { id_ram: null },
      { where: { id_ram: id }, validate: false }
    );

    await ram.destroy();

    return res.status(200).json({ message: "Xóa RAM thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa RAM:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Tìm kiếm RAM theo ID hoặc tên
 */
const searchRam = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp từ khóa tìm kiếm" });
    }

    const trimmed = keyword.trim();
    const isNumeric = !isNaN(trimmed);

    const whereCondition = isNumeric
      ? { id_ram: Number(trimmed) }
      : { name_ram: { [Op.like]: `%${trimmed}%` } };

    const rams = await Ram.findAll({ where: whereCondition });

    if (rams.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy RAM phù hợp" });
    }

    return res.status(200).json(rams);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm RAM:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getAllRam,
  addRam,
  updateRam,
  deleteRam,
  searchRam,
};
