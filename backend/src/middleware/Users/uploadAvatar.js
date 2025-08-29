const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/avatars");

    // Kiểm tra và tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Chỉ định nơi lưu trữ
  },
  filename: (req, file, cb) => {
    const userId = file?.originalname?.split(".")?.[0] ?? "default";
    // console.log("Received id_users:", userId); // Kiểm tra giá trị của id_users
    const fileExtension = path.extname(file.originalname); // Lấy phần mở rộng của file
    const filename = `${userId}${fileExtension}`; // Đổi tên file theo id_users
    // console.log("Saving file as:", filename); // Kiểm tra tên file lưu
    cb(null, filename); // Gửi tên file mới
  },
});

// Kiểm tra loại file (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Giới hạn dung lượng file tải lên (ví dụ 5MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
