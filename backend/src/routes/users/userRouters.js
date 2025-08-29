const express = require("express");
const router = express.Router();
const user = require("../../controllers/users/userController");
// const uploadavatar = require("../../middleware/Users/uploadAvatar"); // Import middleware
const upload = require("../../middleware/Users/uploadAvatar");

// Route thêm người dùng
// router.post("/add", uploadavatar.single("avatar"), user.addUser);
router.post("/add", upload.single("avatar"), user.addUser);
router.get("/all",user.getAllUser)
router.get('/search',user.searchUsers);
router.delete('/delete/:id_users',user.deleteUser);
router.put('/update/:id_users',user.updateUser)

module.exports = router;
