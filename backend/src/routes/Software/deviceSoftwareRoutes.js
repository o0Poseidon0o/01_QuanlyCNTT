// backend/src/routes/deviceSoftwareRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/Software/deviceSoftwareController");

// Cài / gỡ
router.post("/install", ctrl.installSoftware);
router.post("/uninstall", ctrl.uninstallSoftware);

// Truy vấn
router.get("/by-device/:id",   ctrl.listSoftwareByDevice);   // ?onlyActive=true
router.get("/by-software/:id", ctrl.listDevicesBySoftware);  // ?onlyActive=true

module.exports = router;
