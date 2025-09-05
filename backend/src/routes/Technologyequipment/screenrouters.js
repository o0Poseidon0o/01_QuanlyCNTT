const express = require("express");
const router = express.Router();
const screen = require("../../controllers/TechnController/screenController");

router.get("/all", screen.getAllScreens);
router.post("/add", screen.addScreen);
router.delete("/delete/:id", screen.deleteScreen);
router.put("/update/:id", screen.updateScreen);
router.get("/search", screen.searchScreens);

module.exports = router;
