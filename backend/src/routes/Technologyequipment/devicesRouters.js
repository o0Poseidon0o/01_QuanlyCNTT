const express = require("express");
const router = express.Router();
const devices = require("../../controllers/TechnController/devicesController");

router.get("/all", devices.getAllDevices);
router.post("/add", devices.addDevice);
router.delete("/delete/:id", devices.deleteDevice);
router.put("/update/:id", devices.updateDevice);
router.get("/search", devices.getDeviceById);

module.exports = router;
