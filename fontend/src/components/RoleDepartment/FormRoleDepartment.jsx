import React, { useState } from "react";

const FormRoleDepartment = () => {
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentContent, setDepartmentContent] = useState("");
  const [message, setMessage] = useState(""); // State để lưu thông báo
  const [error, setError] = useState(""); // State để lưu thông báo lỗi

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của form

    // Kiểm tra dữ liệu nhập vào
    if (!departmentId) {
      return setError("ID phòng ban không được để trống."); // Hiển thị thông báo lỗi
    }
    if (!departmentName) {
      return setError("Tên phòng ban không được để trống."); // Hiển thị thông báo lỗi
    }

    const newDepartment = {
      id_departments: departmentId,
      department_name: departmentName,
      department_content: departmentContent,
    };

    try {
      const response = await fetch("http://localhost:5000/api/departments/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDepartment),
      });

      if (response.ok) {
        // Xử lý khi thêm thành công
        const result = await response.json(); // Nhận kết quả từ server nếu có
        setMessage("Thêm phòng ban thành công!"); // Thông báo thành công
        setError(""); // Xóa thông báo lỗi
        resetForm(); // Đặt lại giá trị các trường nhập liệu
      } else {
        // Xử lý lỗi từ server
        const errorData = await response.json(); // Nhận thông tin lỗi từ server
        setError(errorData.message || "Đã xảy ra lỗi khi thêm phòng ban. Vui lòng thử lại."); // Thông báo lỗi cụ thể
        setMessage(""); // Xóa thông báo thành công
      }
    } catch (error) {
      setError("Đã xảy ra lỗi khi kết nối. Vui lòng thử lại."); // Thông báo lỗi khi có lỗi kết nối
      setMessage(""); // Xóa thông báo thành công
    }
  };

  // Hàm đặt lại các trường nhập liệu
  const resetForm = () => {
    setDepartmentId("");
    setDepartmentName("");
    setDepartmentContent("");
  };

  return (
    <div className="flex flex-wrap mt-10">
      <div className="w-full lg:w-1/2 mt-6 pl-0 lg:pl-2">
        <p className="text-xl pb-6 flex items-center">
          <i className="fas fa-list mr-3"></i> Phòng ban
        </p>
        <div className="leading-loose">
          <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
            {error && <p className="text-red-500 mb-4">{error}</p>} {/* Hiển thị thông báo lỗi nếu có */}
            {message && <p className="text-green-500 mb-4">{message}</p>} {/* Hiển thị thông báo thành công nếu có */}
            <div>
              <label className="block text-sm text-gray-600" htmlFor="department_id">
                ID phòng ban
              </label>
              <input
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="department_id"
                type="text"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                placeholder="ID Phòng ban"
                aria-label="Department ID"
              />
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="department_name">
                Tên phòng ban
              </label>
              <input
                className="w-full px-5 py-4 text-gray-700 bg-gray-200 rounded"
                id="department_name"
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
                placeholder="Tên phòng ban"
                aria-label="Department Name"
              />
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="department_content">
                Ghi chú về phòng ban
              </label>
              <textarea
                className="w-full px-5 py-2 text-gray-700 bg-gray-200 rounded"
                id="department_content"
                rows="2"
                value={departmentContent}
                onChange={(e) => setDepartmentContent(e.target.value)}
                required
                placeholder="Ghi chú ở đây"
                aria-label="Department Content"
              ></textarea>
            </div>
            <div className="mt-6">
              <button
                className="px-4 py-1 text-white font-light tracking-wider bg-gray-900 rounded"
                type="submit"
              >
                Thêm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormRoleDepartment;
