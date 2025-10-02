const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/repairTech/repairController");
const upload = require("../../middleware/Repair/uploadRepairfiles"); // multer

// STATS SUMMARY đặt trước tuyến động
router.get("/summary", ctrl.getSummaryStatsSafe);
// LIST + FILTER
router.get("/", ctrl.listRepairs);
// STATS SUMMARY đặt trước tuyến động
router.get("/summary", ctrl.getSummaryStatsSafe);
// DETAIL
router.get("/:id", ctrl.getRepair);
// CREATE TICKET
router.post("/", ctrl.createRequest);
// UPDATE STATUS (+history)
router.patch("/:id/status", ctrl.updateStatus);
// UPSERT DETAIL
router.put("/:id/detail", ctrl.upsertDetail);
// ADD PART
router.post("/:id/parts", ctrl.addPart);
// UPLOAD FILES
router.post("/:id/files", upload.array("files", 8), ctrl.uploadFiles);

module.exports = router;
