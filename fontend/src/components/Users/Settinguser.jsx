import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const SettingUser = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email_user: "",
    id_departments: "",
    id_roles: "",
    password_user: "",
  });

  // Lấy role hiện tại từ localStorage
  const currentRole = localStorage.getItem("role");

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/all`);
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách phòng ban và chức danh
  const fetchDepartmentsAndRoles = async () => {
    try {
      const [departmentsResponse, rolesResponse] = await Promise.all([
        axios.get(`${API_BASE}/departments/all-departments`),
        axios.get(`${API_BASE}/roles/all-roles`),
      ]);
      setDepartments(departmentsResponse.data || []);
      setRoles(rolesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartmentsAndRoles();
  }, []);

  // Tìm kiếm người dùng
  const searchUsers = async (e) => {
    if (e.key === "Enter") {
      try {
        const response = await axios.get(`${API_BASE}/users/search`, {
          params: { username: searchTerm, id_users: searchTerm },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    }
  };

  // Làm mới danh sách người dùng
  const refreshUsers = async () => {
    setLoading(true);
    await fetchUsers();
  };

  // Xóa người dùng
  const deleteUser = async (id_users) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        const response = await axios.delete(
          `${API_BASE}/users/delete/${id_users}`
        );
        alert(response.data.message);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (user) => {
    if (currentRole !== "admin") return; // Chặn mở modal nếu không phải admin
    setEditingUser(user);
    setFormData({
      username: user.username,
      email_user: user.email_user,
      id_departments: user.id_departments,
      id_roles: user.id_roles,
      password_user: "",
    });
    setEditModalOpen(true);
  };

  // Đóng modal chỉnh sửa
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
  };

  // Xử lý thay đổi dữ liệu form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cập nhật người dùng
  const updateUser = async () => {
    try {
      const response = await axios.put(
        `${API_BASE}/users/update/${editingUser.id_users}`,
        formData
      );
      alert(response.data.message);
      fetchUsers();
      closeEditModal();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full mt-8">
      <p className="text-xl pb-3 flex items-center">
        <i className="fas fa-list mr-3"></i> Danh sách nhân viên
      </p>

      <div className="mb-4">
        <div className="relative flex w-full flex-wrap items-stretch">
          <span className="z-10 h-full leading-snug font-normal text-center text-blueGray-300 absolute bg-transparent rounded text-base items-center justify-center w-8 pl-3 py-3">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, họ hoặc ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={searchUsers}
            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:ring w-full pl-10"
          />
        </div>
      </div>
      <div className="mb-4">
        <button
          onClick={refreshUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow-md hover:bg-blue-600"
        >
          Load lại danh sách
        </button>
      </div>
      <div className="bg-white overflow-auto">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr>
              <th className="py-4 px-6">Hình ảnh</th>
              <th className="py-4 px-6">Số hiệu</th>
              <th className="py-4 px-6">Họ và tên</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Bộ phận</th>
              <th className="py-4 px-6">Chức danh</th>
              <th className="py-4 px-6">Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id_users} className="hover:bg-grey-lighter">
                <td className="py-4 px-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 shrink-0">
                    <img
                      src={`${API_BASE}/avatars/${user.id_users}`}
                      alt="Avatar"
                      loading="lazy"
                      className="w-full h-full rounded-full object-cover object-center transition-transform duration-300 md:hover:scale-150 border shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.jpg";
                      }}
                    />
                  </div>
                </td>
                <td className="py-4 px-6">{user.id_users}</td>
                <td className="py-4 px-6">{user.username}</td>
                <td className="py-4 px-6">{user.email_user}</td>
                <td className="py-4 px-6">{user.department_name}</td>
                <td className="py-4 px-6">{user.role_name}</td>
                <td className="py-4 px-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className={`bg-green-500 w-14 rounded shadow-md text-white ${
                        currentRole !== "admin"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={currentRole !== "admin"}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteUser(user.id_users)}
                      className={`bg-red-500 w-14 rounded shadow-md text-white ${
                        currentRole !== "admin"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={currentRole !== "admin"}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal chỉnh sửa */}
      {isEditModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-xl mb-4">Chỉnh sửa người dùng</h2>
            <div className="mb-4">
              <label className="block mb-2">Họ và tên</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input
                type="email"
                name="email_user"
                value={formData.email_user}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Bộ phận</label>
              <select
                className="w-full px-4 py-2 border rounded"
                name="id_departments"
                value={formData.id_departments}
                onChange={handleInputChange}
              >
                <option value="">Chọn bộ phận</option>
                {departments.map((department) => (
                  <option
                    key={department.id_departments}
                    value={department.id_departments}
                  >
                    {department.department_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Chức danh</label>
              <select
                className="w-full px-4 py-2 border rounded"
                name="id_roles"
                value={formData.id_roles}
                onChange={handleInputChange}
              >
                <option value="">Chọn chức danh</option>
                {roles.map((role) => (
                  <option key={role.id_roles} value={role.id_roles}>
                    {role.name_role}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password_user"
                value={formData.password_user}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Đóng
              </button>
              <button
                onClick={updateUser}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingUser;
