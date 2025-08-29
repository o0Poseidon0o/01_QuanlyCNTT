import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SettingRoleDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedDepartment, setEditedDepartment] = useState({
    department_name: "",
    department_content: "",
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hàm lấy danh sách phòng ban
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/departments/all-departments"
      );
      const sortedDepartments = response.data.sort(
        (a, b) => a.id_departments - b.id_departments
      ); // Sắp xếp ID từ nhỏ đến lớn
      setDepartments(sortedDepartments);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng ban:", error);
      setError("Lỗi khi lấy danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    const intervalId = autoRefresh ? setInterval(fetchDepartments, 5000) : null;
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  // Hàm tìm kiếm phòng ban
  const handleSearch = async () => {
    setLoading(true);
    try {
      const url = searchTerm.trim()
        ? `http://localhost:5000/api/departments/search?name=${searchTerm}`
        : "http://localhost:5000/api/departments/all-departments";

      const response = await axios.get(url);
      const sortedDepartments = response.data.sort(
        (a, b) => a.id_departments - b.id_departments
      ); // Sắp xếp ID từ nhỏ đến lớn
      setDepartments(sortedDepartments);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm phòng ban:", error);
      setError("Lỗi khi tìm kiếm phòng ban");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý chỉnh sửa phòng ban
  const toggleEdit = async (department) => {
    if (editingId === department.id_departments) {
      if (
        !editedDepartment.department_name.trim() ||
        !editedDepartment.department_content.trim()
      ) {
        toast.error("Tên phòng ban và ghi chú không được để trống!");
        return;
      }
      try {
        const response = await axios.put(
          `http://localhost:5000/api/departments/update/${department.id_departments}`,
          {
            department_name: editedDepartment.department_name,
            department_content: editedDepartment.department_content,
          }
        );

        if (
          response.data &&
          response.data.message === "Cập nhật phòng ban thành công!"
        ) {
          setDepartments((prev) =>
            prev.map((d) =>
              d.id_departments === department.id_departments
                ? {
                    ...d,
                    department_name: editedDepartment.department_name,
                    department_content: editedDepartment.department_content,
                  }
                : d
            )
          );
          toast.success("Cập nhật thành công!");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật phòng ban:", error);
        toast.error("Cập nhật thất bại!");
      }
      setEditingId(null);
    } else {
      setEditingId(department.id_departments);
      setEditedDepartment({
        department_name: department.department_name,
        department_content: department.department_content,
      });
    }
  };

  // Hàm xử lý thay đổi giá trị trong input chỉnh sửa
  const handleEdit = (field, value) => {
    setEditedDepartment((prev) => ({ ...prev, [field]: value }));
  };

  // Hàm xử lý xóa phòng ban
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/departments/delete/${id}`
        );
        setDepartments((prev) =>
          prev.filter((department) => department.id_departments !== id)
        );
        toast.success("Xóa thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa phòng ban:", error);
        toast.error("Xóa thất bại!");
      }
    }
  };

  return (
    <div className="w-full mt-8">
      <p className="text-xl pb-3 flex items-center">
        <i className="fas fa-list mr-3"></i> Danh sách Phòng Ban
      </p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm phòng ban..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Tìm kiếm khi nhấn Enter
          className="border border-gray-300 rounded-md px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white overflow-auto">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">
                Id Phòng Ban
              </th>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">
                Tên Phòng Ban
              </th>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">
                Ghi chú
              </th>
              <th className="py-4 px-6 bg-gray-100 font-bold uppercase text-sm text-gray-600 border-b border-gray-300">
                Chức năng
              </th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id_departments} className="hover:bg-gray-50">
                <td className="py-4 px-6 border-b border-gray-300">
                  {department.id_departments}
                </td>
                <td className="py-4 px-6 border-b border-gray-300">
                  {editingId === department.id_departments ? (
                    <input
                      type="text"
                      value={editedDepartment.department_name}
                      onChange={(e) =>
                        setEditedDepartment({
                          ...editedDepartment,
                          department_name: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span>{department.department_name}</span>
                  )}
                </td>

                <td className="py-4 px-6 border-b border-gray-300">
                  {editingId === department.id_departments ? (
                    <input
                      type="text"
                      value={editedDepartment.department_content}
                      onChange={(e) =>
                        setEditedDepartment({
                          ...editedDepartment,
                          department_content: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span>{department.department_content}</span>
                  )}
                </td>

                <td className="py-4 px-6 border-b border-gray-300">
                  <button
                    onClick={() => toggleEdit(department)}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    {editingId === department.id_departments
                      ? "Lưu"
                      : "Chỉnh sửa"}
                  </button>
                  <button
                    onClick={() => handleDelete(department.id_departments)}
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

export default SettingRoleDepartment;
