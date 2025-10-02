// Chỉ import 1 lần ở entry (index.js/main.jsx)
import axios from "axios";

/** ====== Cấu hình chung (có lợi cho toàn app) ====== */
axios.defaults.timeout = 20000; // 20s, tránh treo request
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

/** ====== Tự động đổi prefix khi build Production ====== */
if (process.env.NODE_ENV === "production") {
  // Tất cả URL dev cứng (localhost:5000/api) sẽ được thay thành "/api"
  const DEV_PREFIXES = [
    "http://localhost:5000/api",
    "http://127.0.0.1:5000/api",
  ];
  const PROD_PREFIX = "/api";

  axios.interceptors.request.use((config) => {
    if (typeof config.url === "string") {
      for (const p of DEV_PREFIXES) {
        if (config.url.startsWith(p)) {
          config.url = config.url.replace(p, PROD_PREFIX);
          break;
        }
      }
    }
    return config;
  });

  // (tuỳ chọn) tự thêm baseURL nếu dev code đang dùng đường dẫn tương đối "stasusers/users"
  // axios.defaults.baseURL = "/api";
}

/** ====== (Tuỳ chọn) Log lỗi gọn gàng ====== */
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    // Bạn có thể thay thành toast/notification của UI framework
    if (process.env.NODE_ENV !== "production") {
      console.error("[API ERROR]", err?.config?.url, err?.response?.status, err?.message);
    }
    return Promise.reject(err);
  }
);
