const express = require("express");
const router = express.Router();
const cpu = require("../../controllers/TechnController/cpuController");

router.get("/all",cpu.getAllCpus);
router.post("/add", cpu.addCpu);
router.delete("/delete/:id", cpu.deleteCpu);
router.put("/update/:id", cpu.updateCpu);
router.get("/search", cpu.searchCpus);


module.exports = router;
