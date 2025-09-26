const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/repairTech/repairController");
const upload = require("../../middleware/Repair/uploadRepairfiles"); // multer

// LIST + FILTER
router.get("/", ctrl.listRepairs);
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
// STATS SUMMARY
router.get("/summary", ctrl.getSummaryStatsSafe);

module.exports = router;
