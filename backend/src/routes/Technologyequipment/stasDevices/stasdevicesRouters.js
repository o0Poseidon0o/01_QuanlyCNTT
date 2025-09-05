const express = require("express");
const router = express.Router();
const stasdevices = require("../../../controllers/TechnController/stasDevices/stasdevicesController");
const stasUser=require("../../../controllers/TechnController/stasDevices/stasdevicesController");

router.get("/devices",stasdevices.getDeviceCountByType);
router.get("/users",stasUser.getUserCountByDepartment);



module.exports = router;
