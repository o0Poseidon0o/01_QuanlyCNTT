const express = require("express");
const path = require("path");
const router = express.Router();

// API lấy avatar theo id_users
router.get("/:id", (req, res) => {
  const userId = req.params.id;
  const avatarPath = path.join(__dirname, "../../uploads/avatars", `${userId}.jpg`);

  // Kiểm tra file có tồn tại không
  res.sendFile(avatarPath, (err) => {
    if (err) {
      // Nếu file không tồn tại, trả về avatar mặc định
      const defaultAvatarPath = path.join(__dirname, "../../uploads/avatars/default.jpg");
      res.sendFile(defaultAvatarPath);
    }
  });
});

module.exports = router;
