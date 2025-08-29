import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../../images/logo/logo_towa.png";

const LoginPage = () => {
  const [formData, setFormData] = useState({ id_users: "", password_user: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      const { token, role,id_users } = res.data;

      // Lưu thông tin đăng nhập vào localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("id_users", id_users); // Lưu id_users

      if (role === "admin") {
        navigate("/Welcome");
      } else {
        navigate("/Welcome");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="bg-sky-100 flex justify-center items-center h-screen">
      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block relative">
        <img
          src="https://banghieuviet.org/wp-content/uploads/2024/02/background-cong-nghe-trang-02.jpg"
          alt="Placeholder Image"
          className="object-cover w-full h-full"
        />
        <img src={logo} alt="" className="z-10 absolute w-1/2 top-0 left-0 m-4 " />
      </div>

      {/* Right: Login Form */}
      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2 relative">
        {/* Logo for mobile / responsive view */}
        <img
          src={logo}
          alt="Logo"
          className="block lg:hidden w-24 mx-auto mb-4"
        />
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={handleSubmit}>
          {/* ID Users Input */}
          <div className="mb-4">
            <label htmlFor="id_users" className="block text-gray-600">User ID</label>
            <input
              type="text"
              id="id_users"
              name="id_users"
              value={formData.id_users}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password_user" className="block text-gray-800">Password</label>
            <input
              type="password"
              id="password_user"
              name="password_user"
              value={formData.password_user}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Remember Me Checkbox */}
          <div className="mb-4 flex items-center">
            <input type="checkbox" id="remember" name="remember" className="text-red-500" />
            <label htmlFor="remember" className="text-green-900 ml-2">Remember me</label>
          </div>

          {/* Forgot Password Link */}
          <div className="mb-6 text-blue-500">
            <a href="#" className="hover:underline">Bạn quên mật khẩu?</a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
