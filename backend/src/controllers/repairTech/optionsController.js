// backend/src/controllers/repairTech/optionsController.js
const User = require("../../models/Users/User");
const RepairVendor = require("../../models/RepairTech/repairVendor");

const getAssigneeVendorOptions = async (req, res) => {
  try {
    const [users, vendors] = await Promise.all([
      User.findAll({ attributes: ["id_users", "username"], order: [["username", "ASC"]], limit: 500 }),
      RepairVendor.findAll({ attributes: ["id_vendor", "vendor_name"], order: [["vendor_name", "ASC"]], limit: 500 }),
    ]);
    res.json({
      users: users.map((u) => ({ id: u.id_users, name: u.username })),
      vendors: vendors.map((v) => ({ id: v.id_vendor, name: v.vendor_name })),
    });
  } catch (e) {
    console.error("getAssigneeVendorOptions error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAssigneeVendorOptions };
