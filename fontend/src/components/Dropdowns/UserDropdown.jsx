import React, { useState, createRef, useEffect } from "react";
import { createPopper } from "@popperjs/core";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";

const UserDropdown = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(""); // State để lưu avatar
  const btnDropdownRef = createRef();
  const popoverDropdownRef = createRef();
  const navigate = useNavigate(); // Khởi tạo useNavigate để chuyển trang

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const userId = localStorage.getItem("id_users"); // Lấy id_users từ localStorage
    if (userId) {
      // Gọi API để lấy avatar
      axios
        .get(`http://localhost:5000/api/avatars/${userId}`) // Sử dụng đúng API với id_users
        .then((response) => {
          setAvatarUrl(response.config.url); // Cập nhật URL avatar
        })
        .catch(() => {
          setAvatarUrl("http://localhost:5000/api/avatars/default"); // Nếu không tìm thấy avatar, dùng avatar mặc định
        });
    }
  }, []);

  useEffect(() => {
    if (isDropdownOpen && btnDropdownRef.current && popoverDropdownRef.current) {
      createPopper(btnDropdownRef.current, popoverDropdownRef.current, {
        placement: "bottom-start",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 10],
            },
          },
        ],
      });
    }
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = () => {
    // Xóa thông tin người dùng khỏi localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("id_users");

    // Chuyển hướng về trang login (route "/")
    navigate("/"); // Sử dụng route "/" cho trang đăng nhập
  };

  return (
    <>
      <a
        href="#"
        ref={btnDropdownRef}
        onClick={(e) => {
          e.preventDefault();
          toggleDropdown();
        }}
        className="text-blueGray-500 block"
      >
        <div className="avatar online">
          <div className="w-24 rounded-full">
            <img
              src={avatarUrl || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"} // Hiển thị avatar lấy được từ API hoặc avatar mặc định
              alt="avatar"
            />
          </div>
        </div>
      </a>

      <div
        ref={popoverDropdownRef}
        className={`${
          isDropdownOpen ? "block" : "hidden"
        } bg-white z-50 py-2 list-none rounded shadow-lg min-w-48`}
        style={{ position: "absolute" }}
      >
        {["Profile", "Sign out"].map((item, index) => (
          <a
            key={index}
            href="#"
            className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700"
            onClick={(e) => {
              e.preventDefault();
              if (item === "Sign out") {
                handleSignOut(); // Gọi handleSignOut khi người dùng nhấn sign out
              }
            }}
          >
            {item}
          </a>
        ))}
        <div className="h-0 my-2 border border-solid border-blueGray-100" />
      </div>
    </>
  );
};

export default UserDropdown;
