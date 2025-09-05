const express = require("express");
const router = express.Router();
const devicestypes = require("../../controllers/TechnController/devicestypesController");

router.get("/all", devicestypes.getAllDeviceTypes);
router.post("/add", devicestypes.addDeviceType);
router.delete("/delete/:id", devicestypes.deleteDeviceType);
router.put("/update/:id", devicestypes.updateDeviceType);
router.get("/search", devicestypes.searchDeviceTypes);

module.exports = router;
