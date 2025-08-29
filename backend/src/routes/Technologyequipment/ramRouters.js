const express = require("express");
const router = express.Router();
const ram = require("../../controllers/TechnController/ramController");

router.get("/all", ram.getAllRam);
router.post("/add", ram.addRam);
router.delete("/delete/:id", ram.deleteRam);
router.put("/update/:id", ram.updateRam);
router.get("/search", ram.searchRam);

module.exports = router;
