
const express = require("express");
const router = express.Router();
const operations = require("../../controllers/TechnController/operationsystemController");

router.get("/all", operations.getAllOperationsystems);
router.post("/add", operations.addOperationsystem);
router.delete("/delete/:id", operations.deleteOperationsystem);
router.put("/update/:id", operations.updateOperationsystem);
router.get("/search", operations.getOperationsystemById);

module.exports = router;
