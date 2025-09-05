const Screen = require('../../models/Techequipment/screen');
const Devices = require("../../models/Techequipment/devices");
const { Op } = require('sequelize');

// ➤ Thêm màn hình
const addScreen = async (req, res) => {
  const { id_screen, name_screen, size_screen } = req.body;

  try {
    if (!id_screen || !name_screen || !size_screen) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Screen.findByPk(id_screen);
    if (exists) {
      return res.status(400).json({ message: "Screen ID already exists" });
    }

    const newScreen = await Screen.create({ id_screen, name_screen, size_screen });
    res.status(201).json({ message: "Screen added successfully", screen: newScreen });
  } catch (error) {
    console.error("Error adding screen:", error);
    res.status(500).json({ message: "Error adding screen", error: error.message });
  }
};

// ➤ Cập nhật màn hình
const updateScreen = async (req, res) => {
  const { id_screen } = req.params;
  const { name_screen, size_screen } = req.body;

  try {
    const screen = await Screen.findByPk(id_screen);
    if (!screen) {
      return res.status(404).json({ message: "Screen not found" });
    }

    await screen.update({
      name_screen: name_screen || screen.name_screen,
      size_screen: size_screen || screen.size_screen,
    });

    res.status(200).json({ message: "Screen updated successfully", screen });
  } catch (error) {
    console.error("Error updating screen:", error);
    res.status(500).json({ message: "Error updating screen", error: error.message });
  }
};

// ➤ Xóa màn hình
const deleteScreen = async (req, res) => {
  const { id} = req.params;

  try {
    const screen = await Screen.findByPk(id);
    if (!screen) {
      return res.status(404).json({ message: "Screen not found" });
    }
    await Devices.update(
      { id_screen: null },
      { where: { id_screen: id }, validate: false }
    );
    await screen.destroy();
    res.status(200).json({ message: "Screen deleted successfully" });
  } catch (error) {
    console.error("Error deleting screen:", error);
    res.status(500).json({ message: "Error deleting screen", error: error.message });
  }
};

// ➤ Lấy tất cả màn hình
const getAllScreens = async (req, res) => {
  try {
    const screens = await Screen.findAll();
    if (!screens || screens.length === 0) {
      return res.status(404).json({ message: "No Screens found" });
    }
    return res.status(200).json(screens);
  } catch (error) {
    console.error("Error retrieving Screens:", error);
    return res.status(500).json({ message: "Error retrieving Screens", error: error.message });
  }
};


// ➤ Tìm kiếm màn hình
const searchScreens = async (req, res) => {
  const { name_screen, size_screen } = req.query;
  let conditions = {};

  if (name_screen) {
    conditions.name_screen = { [Op.like]: `%${name_screen}%` };
  }
  if (size_screen) {
    conditions.size_screen = { [Op.like]: `%${size_screen}%` };
  }

  try {
    const screens = await Screen.findAll({ where: conditions });
    if (screens.length === 0) {
      return res.status(404).json({ message: "No screens found" });
    }

    res.status(200).json(screens);
  } catch (error) {
    console.error("Error searching screens:", error);
    res.status(500).json({ message: "Error searching screens", error: error.message });
  }
};

module.exports = {
  addScreen,
  updateScreen,
  deleteScreen,
  getAllScreens,
  searchScreens,
};
