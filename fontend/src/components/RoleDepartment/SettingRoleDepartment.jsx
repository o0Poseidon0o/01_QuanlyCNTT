import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SettingRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedRole, setEditedRole] = useState({ id_roles: "", name_role: "" });
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/roles/all-roles");
      const sortedRoles = response.data.sort((a, b) => a.id_roles - b.id_roles); // Sắp xếp ID từ nhỏ đến lớn
      setRoles(sortedRoles);
      setError(null);
    } catch (error) {
      setError("Lỗi khi lấy danh sách vai trò.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    const intervalId = autoRefresh ? setInterval(fetchRoles, 5000) : null;
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  const handleEdit = (role) => {
    setEditingId(role.id_roles);
    setEditedRole({ ...role });
  };

  const handleSave = async (id) => {
    if (!editedRole.name_role) {
      toast.error("Tên vai trò không được để trống!");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/roles/update/${id}`, editedRole);
      setEditingId(null);
      toast.success("Cập nhật vai trò thành công!");
      fetchRoles();
    } catch (error) {
      console.error("Lỗi khi cập nhật vai trò:", error);
      toast.error("Có lỗi xảy ra khi cập nhật vai trò.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa vai trò này?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/roles/delete/${id}`);
      toast.success("Xóa vai trò thành công!");
      fetchRoles();
    } catch (error) {
      console.error("Lỗi khi xóa vai trò:", error);
      toast.error("Có lỗi xảy ra khi xóa vai trò.");
    }
  };

  const handleSearch = async () => {
    if (searchTerm) {
      try {
        const response = await axios.get(`http://localhost:5000/api/roles/search?name=${searchTerm}`);
        const sortedRoles = response.data.sort((a, b) => a.id_roles - b.id_roles); // Sắp xếp ID từ nhỏ đến lớn
        setRoles(sortedRoles);
      } catch (error) {
        setError("Lỗi khi tìm kiếm vai trò.");
      }
    } else {
      fetchRoles();
    }
  };

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="w-full mt-8">
      <p className="text-xl pb-3 flex items-center">
        <i className="fas fa-list mr-3"></i> Danh sách Roles
      </p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên vai trò..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 px-4 py-2 text-white rounded shadow-md"
        >
          Tìm kiếm
        </button>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
            className="form-checkbox"
          />
          <span className="ml-2">Tự động làm mới dữ liệu</span>
        </label>
      </div>

      <div className="bg-white overflow-auto">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">Id Role</th>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">Tên Role</th>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id_roles} className="hover:bg-gray-50">
                <td className="py-4 px-6 border-b border-gray-300">
                  {editingId === role.id_roles ? (
                    <input
                      type="text"
                      value={editedRole.id_roles}
                      readOnly
                      className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none"
                    />
                  ) : (
                    <span>{role.id_roles}</span>
                  )}
                </td>
                <td className="py-4 px-6 border-b border-gray-300">
                  {editingId === role.id_roles ? (
                    <input
                      type="text"
                      value={editedRole.name_role}
                      onChange={(e) =>
                        setEditedRole({
                          ...editedRole,
                          name_role: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span>{role.name_role}</span>
                  )}
                </td>
                <td className="py-4 px-6 border-b border-gray-300">
                  <button
                    onClick={() => handleEdit(role)}
                    className={`bg-green-500 text-white px-4 py-2 rounded ${editingId === role.id_roles ? "hidden" : ""}`}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleSave(role.id_roles)}
                    className={`bg-yellow-500 text-white px-4 py-2 rounded ${editingId === role.id_roles ? "" : "hidden"}`}
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => handleDelete(role.id_roles)}
                    className="bg-red-500 text-white px-4 py-2 rounded ml-2"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingRoles;
