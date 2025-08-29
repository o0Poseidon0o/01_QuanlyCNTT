import React, { useState, useEffect } from "react";

const AddUser = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://ilarge.lisimg.com/image/21867558/1118full-hyakujuu-sentai-gaoranger-photo.jpg"
  ); // Ảnh mặc định
  const [departments, setDepartments] = useState([]); // Danh sách bộ phận
  const [roles, setRoles] = useState([]); // Danh sách vai trò
  const [userData, setUserData] = useState({
    id_users: "",
    id_departments: "",
    id_roles: "",
    username: "",
    email_user: "",
    password_user: "",
    avatar: "",
  });
  const [message, setMessage] = useState(""); // Thông báo phản hồi từ server
  const [isLoading, setIsLoading] = useState(false); // Loading indicator

  // Kiểm tra khi thay đổi file avatar
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Chỉ cho phép tải lên ảnh định dạng JPEG, PNG, hoặc JPG.");
      return;
    }

    setSelectedFile(file);

    // Hiển thị ảnh tạm thời trước khi upload
    const imageUrl = URL.createObjectURL(file);
    setAvatarUrl(imageUrl);
    setUserData({ ...userData, avatar: imageUrl });
  };

  // Hàm xử lý khi người dùng submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Bắt đầu loading

    // Kiểm tra nếu có trường nào còn trống
    if (
      !userData.username ||
      !userData.email_user ||
      !userData.password_user ||
      !userData.id_departments ||
      !userData.id_roles ||
      !userData.id_users
    ) {
      setMessage("Vui lòng điền đầy đủ thông tin!");
      setIsLoading(false); // Kết thúc loading
      return;
    }

    // Tạo FormData để gửi dữ liệu
    const formData = new FormData();
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const newFileName = `${userData.id_users}.${fileExtension}`;
      formData.append("avatar", selectedFile, newFileName);
    }
    formData.append("id_users", userData.id_users);
    formData.append("username", userData.username);
    formData.append("email_user", userData.email_user);
    formData.append("password_user", userData.password_user);
    formData.append("id_departments", userData.id_departments);
    formData.append("id_roles", userData.id_roles);

    try {
      const response = await fetch(`http://localhost:5000/api/users/add`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setMessage("Người dùng đã được thêm thành công!");
        // Reset form
        setUserData({
          id_users: "",
          id_departments: "",
          id_roles: "",
          username: "",
          email_user: "",
          password_user: "",
          avatar: "",
        });
        setSelectedFile(null);
        setAvatarUrl(
          "https://ilarge.lisimg.com/image/21867558/1118full-hyakujuu-sentai-gaoranger-photo.jpg"
        );
      } else {
        setMessage(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage("Đã xảy ra lỗi trong quá trình thêm người dùng.");
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  // Hàm fetch dữ liệu phòng ban và vai trò
  const fetchDepartmentsAndRoles = async () => {
    try {
      const responses = await Promise.all([
        fetch("http://localhost:5000/api/departments/all-departments"),
        fetch("http://localhost:5000/api/roles/all-roles"),
      ]);
      const [departmentsData, rolesData] = await Promise.all(
        responses.map((res) => res.json())
      );
      setDepartments(departmentsData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchDepartmentsAndRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };
  
  return (
    <div className="flex flex-wrap mt-10">
      <div className="w-full lg:w-1/2 my-6 pr-0 lg:pr-2">
        <p className="text-xl pb-6 flex items-center">
          <i className="fas fa-list mr-3"></i> Hình ảnh
        </p>
        <div className="leading-loose">
          <form
            className="p-10 bg-white rounded shadow-xl"
            onSubmit={handleSubmit}
          >
            <img
              src={avatarUrl}
              alt="avatar"
              className="mb-4 w-40 h-full object-cover rounded-md"
            />
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-4"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-1/2 mt-6 pl-0 lg:pl-2">
        <p className="text-xl pb-6 flex items-center">
          <i className="fas fa-list mr-3"></i> Form User
        </p>
        <div className="leading-loose">
          <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
            <div className="mt-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="id_users"
              >
                ID Người dùng
              </label>
              <input
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="id_users"
                name="id_users"
                type="text"
                required
                placeholder="ID Người dùng"
                value={userData.id_users}
                onChange={handleChange}
              />
            </div>
            <div className="mt-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="username"
              >
                Tên người dùng
              </label>
              <input
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="username"
                name="username"
                type="text"
                required
                placeholder="Tên người dùng"
                value={userData.username}
                onChange={handleChange}
              />
            </div>
            <div className="mt-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="email_user"
              >
                Email
              </label>
              <input
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="email_user"
                name="email_user"
                type="email"
                required
                placeholder="Email"
                value={userData.email_user}
                onChange={handleChange}
              />
            </div>
            <div className="mt-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="password_user"
              >
                Mật khẩu
              </label>
              <input
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="password_user"
                name="password_user"
                type="password"
                required
                placeholder="Mật khẩu"
                value={userData.password_user}
                onChange={handleChange}
              />
            </div>
            <div className="mt-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="id_departments"
              >
                Bộ phận
              </label>
              <select
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="id_departments"
                name="id_departments"
                required
                value={userData.id_departments}
                onChange={handleChange}
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
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="id_roles">
                Vai trò
              </label>
              <select
                className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
                id="id_roles"
                name="id_roles"
                required
                value={userData.id_roles}
                onChange={handleChange}
              >
                <option value="">Chọn vai trò</option>
                {roles.map((role) => (
                  <option key={role.id_roles} value={role.id_roles}>
                    {role.name_role}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <button
                className="px-4 py-1 text-white font-light tracking-wider bg-gray-900 rounded"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Đang thêm..." : "Thêm Người Dùng"}
              </button>
            </div>
            {message && <p className="mt-4 text-red-500">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
