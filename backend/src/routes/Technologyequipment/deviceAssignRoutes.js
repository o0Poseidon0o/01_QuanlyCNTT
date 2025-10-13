const router = require("express").Router();
// CHÚ Ý: thư mục controllers là "Techequipment" (không phải "Technologyequipment")
const c = require("../../controllers/TechnController/deviceAssignController");

router.post("/checkin", c.checkin);
router.post("/checkout", c.checkout);

router.get("/active-count", c.activeCountMap);
router.get("/active-map", c.activeMap);         // <-- THÊM DÒNG NÀY

router.get("/active/:id_devices", c.activeUsersOfDevice);
router.get("/history/device/:id_devices", c.historyOfDevice);
router.get("/active-by-user/:id_users", c.activeDevicesOfUser);

module.exports = router;
