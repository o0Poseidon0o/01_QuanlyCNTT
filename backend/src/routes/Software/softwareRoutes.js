// backend/src/routes/softwareRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/Software/softwareController");

// CRUD danh mục phần mềm
router.post("/",  ctrl.createSoftware);
router.get("/",   ctrl.listSoftware);
router.put("/:id",ctrl.updateSoftware);
router.delete("/:id", ctrl.deleteSoftware);

module.exports = router;
