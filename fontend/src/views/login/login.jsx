// src/views/login/login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../lib/httpClient";
import logo from "../../images/logo/logo_towa.png";

const API_BASE = "http://localhost:5000/api";

const LoginPage = () => {
  const [formData, setFormData] = useState({ id_users: "", password_user: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // 1) Đăng nhập
      const payload = {
        id_users: Number(formData.id_users),
        password_user: formData.password_user,
      };
      const res = await axios.post(`${API_BASE}/auth/login`, payload);
      const { token, role, id_users, id_roles, permissions } = res.data || {};
      if (!token) throw new Error("Missing token in response");

      // 2) Lưu thông tin cơ bản
      localStorage.setItem("token", token);
      localStorage.setItem("id_users", String(id_users ?? ""));
      localStorage.setItem("id_roles", String(id_roles ?? ""));
      localStorage.setItem("role", role ?? ""); // để tương thích code cũ

      // 3) Lấy quyền (nếu login trả về luôn thì dùng luôn; nếu không có thì gọi /me)
      let perms = Array.isArray(permissions) ? [...permissions] : null;
      if (!perms) {
        try {
          const meRes = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { _t: Date.now() },
          });
          perms = Array.isArray(meRes.data?.permissions) ? meRes.data.permissions : [];
        } catch {
          perms = [];
        }
      }

      // 3.1) Chuẩn hoá quyền để đồng bộ với PermissionRoute/Sidebar
      const norm = new Set(perms.map(String));
      // alias role.manage -> role.manager
      if (norm.has("role.manage")) { norm.delete("role.manage"); norm.add("role.manager"); }
      // nếu role là admin/manager, coi như manager
      if (role === "admin" || role === "manager") norm.add("role.manager");
      // nếu id_roles === 100, coi như manager (tuỳ hệ thống của bạn)
      if (String(id_roles) === "100") norm.add("role.manager");

      perms = Array.from(norm);
      localStorage.setItem("permissions", JSON.stringify(perms));

      // 4) TÍNH SẴN TRANG GỢI Ý (KHÔNG điều hướng thẳng)
      const has = (r) => perms.includes(r);
      const hasPrefix = (prefix) => perms.some((p) => p.startsWith(prefix));

      // ⚠️ Ưu tiên device.static TRƯỚC device.* để đúng yêu cầu
      function suggestLanding() {
        if (has("role.manager")) return "/dashboard";           // gợi ý cho manager
        if (has("device.static")) return "/Staticsequipment";   // chỉ thống kê
        if (hasPrefix("device.")) return "/Techequipment";      // device.* đầy đủ
        if (has("user.hr")) return "/RoleDepartment";           // nhân sự
        if (hasPrefix("user.")) return "/userprofile";          // người dùng thường
        return "/userprofile"; // fallback thân thiện
      }

      localStorage.setItem("post_login_landing", suggestLanding());

      // 5) LUÔN vào trang Welcome trước
      navigate("/Welcome", { replace: true });

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-sky-100 flex justify-center items-center h-screen">
      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block relative">
        <img
          src="https://banghieuviet.org/wp-content/uploads/2024/02/background-cong-nghe-trang-02.jpg"
          alt="Background"
          className="object-cover w-full h-full"
        />
        <img src={logo} alt="Logo" className="z-10 absolute w-1/2 top-0 left-0 m-4" />
      </div>

      {/* Right: Login Form */}
      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2 relative">
        {/* Logo for mobile */}
        <img src={logo} alt="Logo" className="block lg:hidden w-24 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Login</h1>

        <form onSubmit={handleSubmit}>
          {/* User ID */}
          <div className="mb-4">
            <label htmlFor="id_users" className="block text-gray-600">
              User ID
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="id_users"
              name="id_users"
              value={formData.id_users}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password_user" className="block text-gray-800">
              Password
            </label>
            <input
              type="password"
              id="password_user"
              name="password_user"
              value={formData.password_user}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Remember Me */}
          <div className="mb-4 flex items-center">
            <input type="checkbox" id="remember" name="remember" className="text-blue-600" />
            <label htmlFor="remember" className="text-gray-800 ml-2">
              Remember me
            </label>
          </div>

          {/* Forgot Password */}
          <div className="mb-6">
            <Link to="" className="text-blue-600 hover:underline">
              Bạn quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`${
              submitting ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold rounded-md py-2 px-4 w-full transition`}
          >
            {submitting ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
