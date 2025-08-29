const express = require("express");
const router = express.Router();
const {login}= require ("../../controllers/authloginController/authloginController")

router.post("/login", login);

module.exports = router;
