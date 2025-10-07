const express = require("express");
const router = express.Router();
const stasdevices = require("../../../controllers/TechnController/stasDevices/stasdevicesController");

router.get("/devices", stasdevices.getDeviceCountByType);
router.get("/by-department", stasdevices.getDeviceTypeByDepartment);

module.exports = router;
