import React, { useState } from "react";
import axios from "axios";

const RolesApplication = () => {
  // State để lưu thông tin role
  const [role, setRole] = useState({
    id_roles: '',
    name_role: ''
  });

  // Hàm xử lý khi người dùng thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRole({
      ...role,
      [name]: value
    });
  };

  // Hàm xử lý khi submit form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn không cho form reload lại trang
    try {
      // Gửi dữ liệu tới API
      const response = await axios.post("http://localhost:5000/api/roles/add", role);
      alert("Role added successfully!");
      // console.log("Response:", response.data);

      // Reset form sau khi thêm role thành công
      setRole({ id_roles: '', name_role: '' });
    } catch (error) {
      console.error("Error adding role:", error);
      alert("Error adding role, please try again.");
    }
  };

  return (
    <div className="w-full lg:w-full mt-12 pl-0 lg:pl-2">
      <p className="text-xl pb-6 flex items-center">
        <i className="fas fa-list mr-3"></i> Roles User
      </p>
      <div className="leading-loose">
        <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
          <div className="">
            <label className="block text-sm text-gray-600" htmlFor="id_roles">
              ID của Roles
            </label>
            <input
              className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
              id="id_roles"
              name="id_roles"
              type="text"
              required
              placeholder="Id Role"
              value={role.id_roles}
              onChange={handleInputChange}
              aria-label="Role ID"
            />
          </div>
          <div className="mt-2">
            <label className="block text-sm text-gray-600" htmlFor="name_role">
              Tên Role
            </label>
            <input
              className="w-full px-5 py-4 text-gray-700 bg-gray-200 rounded"
              id="name_role"
              name="name_role"
              type="text"
              required
              placeholder="Tên Role"
              value={role.name_role}
              onChange={handleInputChange}
              aria-label="Role Name"
            />
          </div>

          <div className="mt-6">
            <button
              className="px-4 py-1 text-white font-light tracking-wider bg-gray-900 rounded"
              type="submit"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesApplication;
