const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth/auth"); // 👈 cần guard cho /me
const { login } = require("../../controllers/authloginController/authloginController");
// Tên biến đúng chính tả
const me = require("../../controllers/authloginController/me"); // xuất 1 handler function

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me  (bắt buộc kèm Bearer token)
router.get("/me", auth, me);

module.exports = router;
