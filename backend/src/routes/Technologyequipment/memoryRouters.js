const express = require("express");
const router = express.Router();
const memory = require("../../controllers/TechnController/memoryController");

router.get("/all", memory.getAllMemory);
router.post("/add", memory.addMemory);
router.delete("/delete/:id", memory.deleteMemory);
router.put("/update/:id", memory.updateMemory);
router.get("/search", memory.searchMemory);

module.exports = router;
