import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const userRole = localStorage.getItem("role"); // Lấy role từ localStorage

  if (!userRole) {
    return <Navigate to="/" replace />; // Chưa đăng nhập -> về trang Login
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />; // Không có quyền -> chặn truy cập
  }

  return children; // Nếu role hợp lệ -> render children
};

export default ProtectedRoute;
