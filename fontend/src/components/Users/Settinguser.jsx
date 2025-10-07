import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../lib/httpClient";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

/**
 * SettingUser.jsx — tối ưu & thêm:
 *  - Live search + gợi ý ID/tên khi gõ
 *  - Sửa avatar trong modal
 *  - Cache-busting avatar
 *  - Sắp xếp tăng/giảm
 */

const SettingUser = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // cache toàn bộ để gợi ý
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  // Gợi ý tìm kiếm
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email_user: "",
    id_departments: "",
    id_roles: "",
    password_user: "",
  });

  // Sửa avatar
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [avatarBustKey, setAvatarBustKey] = useState(0);

  // Sắp xếp
  const [sortField, setSortField] = useState("id_users"); // id_users | username | email_user
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // Role hiện tại
  const currentRole = localStorage.getItem("role");

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/all`);
      const list = response.data.users || [];
      setUsers(list);
      setAllUsers(list); // lưu cache cho gợi ý
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy phòng ban & vai trò
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

  // Live search (debounce 300ms)
  useEffect(() => {
    const q = searchTerm.trim();
    const timer = setTimeout(async () => {
      try {
        if (q) {
          const response = await axios.get(`${API_BASE}/users/search`, {
            params: { username: q, id_users: q },
          });
          setUsers(Array.isArray(response.data) ? response.data : (response.data.users || []));
        } else {
          await fetchUsers();
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          setUsers([]);
        } else {
          console.error("Error searching users:", error);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Gợi ý khi gõ (từ allUsers)
  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    const isNumeric = /^\d+$/.test(q);

    const filtered = (allUsers || []).filter((u) => {
      const idStr = String(u.id_users || "").toLowerCase();
      const nameStr = String(u.username || "").toLowerCase();
      return idStr.includes(q) || nameStr.includes(q);
    });

    if (isNumeric) {
      // sắp theo ID tăng dần
      filtered.sort((a, b) => Number(a.id_users) - Number(b.id_users));
    } else {
      // sắp theo tên A→Z
      filtered.sort((a, b) => String(a.username || "").localeCompare(String(b.username || ""), "vi"));
    }

    return filtered.slice(0, 8); // giới hạn 8 gợi ý
  }, [searchTerm, allUsers]);

  // Đóng gợi ý khi click ra ngoài
  useEffect(() => {
    const onDoc = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Xử lý phím trong ô tìm kiếm (navigation gợi ý)
  const handleSearchKeyDown = (e) => {
    if (!suggestOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setSuggestOpen(true);
      return;
    }
    if (!suggestOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((idx) => Math.min(idx + 1, Math.max(0, suggestions.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = suggestions[activeIdx];
      if (item) {
        // đặt searchTerm = ID để lọc chính xác
        setSearchTerm(String(item.id_users));
        setSuggestOpen(false);
        // focus lại input
        searchInputRef.current?.blur();
        searchInputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
    }
  };

  // Xóa người dùng
  const deleteUser = async (id_users) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        const response = await axios.delete(`${API_BASE}/users/delete/${id_users}`);
        alert(response.data.message || "Đã xóa");
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (user) => {
    if (currentRole !== "admin") return;
    setEditingUser(user);
    setFormData({
      username: user.username,
      email_user: user.email_user,
      id_departments: user.id_departments,
      id_roles: user.id_roles,
      password_user: "",
    });
    setAvatarPreview(`${API_BASE}/avatars/${user.id_users}?v=${Date.now()}`);
    setNewAvatarFile(null);
    setErrorMsg("");
    setOkMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditModalOpen(true);
  };

  // Đóng modal chỉnh sửa
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setNewAvatarFile(null);
    setErrorMsg("");
    setOkMsg("");
  };

  // Xử lý thay đổi dữ liệu form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý chọn avatar mới
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Chỉ cho phép JPEG/PNG/JPG");
      return;
    }
    setErrorMsg("");
    setNewAvatarFile(file);
    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return blobUrl;
    });
  };

  // Sắp xếp (đặt trước mọi return để không vi phạm rules-of-hooks)
  const sortedUsers = useMemo(() => {
    const arr = [...(users || [])];
    const dir = sortDir === "desc" ? -1 : 1;
    arr.sort((a, b) => {
      const A = a?.[sortField];
      const B = b?.[sortField];
      const nA = Number(A);
      const nB = Number(B);
      if (Number.isFinite(nA) && Number.isFinite(nB)) {
        if (nA === nB) return 0;
        return nA < nB ? -1 * dir : 1 * dir;
      }
      const sA = String(A ?? "");
      const sB = String(B ?? "");
      return sA.localeCompare(sB, "vi") * dir;
    });
    return arr;
  }, [users, sortField, sortDir]);

  // Cập nhật người dùng (trường + avatar nếu có)
  const updateUser = async () => {
    if (!editingUser) return;
    setBusy(true);
    setErrorMsg("");
    setOkMsg("");

    try {
      if (newAvatarFile) {
        const fd = new FormData();
        const ext = (newAvatarFile.name.split(".").pop() || "jpg").toLowerCase();
        const avatarName = `${editingUser.id_users}.${ext}`;
        fd.append("avatar", newAvatarFile, avatarName);
        await axios.post(`${API_BASE}/avatars/${editingUser.id_users}`, fd);
      }

      const payload = { ...formData };
      if (!payload.password_user) delete payload.password_user;

      const response = await axios.put(
        `${API_BASE}/users/update/${editingUser.id_users}`,
        payload
      );

      setOkMsg(response.data?.message || "Cập nhật thành công");

      await fetchUsers();
      setAvatarBustKey((k) => k + 1);
      setAvatarPreview(`${API_BASE}/avatars/${editingUser.id_users}?v=${Date.now()}`);
      setNewAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMsg(error?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
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

      {/* Ô tìm kiếm (live + gợi ý) */}
      <div className="mb-4" ref={searchWrapRef}>
        <div className="relative flex w-full flex-wrap items-stretch">
          <span className="z-10 h-full leading-snug font-normal text-center text-blueGray-300 absolute bg-transparent rounded text-base items-center justify-center w-8 pl-3 py-3">
            <i className="fas fa-search"></i>
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Gõ ID hoặc tên để tìm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSuggestOpen(true);
              setActiveIdx(0);
            }}
            onFocus={() => {
              if (searchTerm.trim()) {
                setSuggestOpen(true);
                setActiveIdx(0);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white rounded text-sm shadow outline-none focus:outline-none focus:ring w-full pl-10"
          />

          {/* Dropdown gợi ý */}
          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded shadow z-50 max-h-72 overflow-auto">
              {suggestions.map((u, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={u.id_users}
                    className={`px-3 py-2 cursor-pointer ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchTerm(String(u.id_users)); // chọn ID để lọc chính xác
                      setSuggestOpen(false);
                    }}
                  >
                    <div className="font-medium">{u.id_users} — {u.username}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{u.email_user}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bộ điều khiển sắp xếp */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Sắp xếp theo:</label>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="id_users">Mã (ID)</option>
          <option value="username">Tên</option>
          <option value="email_user">Email</option>
        </select>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="px-3 py-2 border rounded"
          title={sortDir === "asc" ? "Đang: Tăng dần (nhỏ → lớn)" : "Đang: Giảm dần (lớn → nhỏ)"}
        >
          {sortDir === "asc" ? "↑ Nhỏ → Lớn" : "↓ Lớn → Nhỏ"}
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
            {sortedUsers.map((user) => (
              <tr key={user.id_users} className="hover:bg-grey-lighter">
                <td className="py-4 px-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 shrink-0">
                    <img
                      src={`${API_BASE}/avatars/${user.id_users}?v=${avatarBustKey}`}
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
                        currentRole !== "admin" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={currentRole !== "admin"}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteUser(user.id_users)}
                      className={`bg-red-500 w-14 rounded shadow-md text-white ${
                        currentRole !== "admin" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={currentRole !== "admin"}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 px-6 text-center text-gray-500">
                  Không có kết quả phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chỉnh sửa */}
      {isEditModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[520px] max-w-full">
            <h2 className="text-xl mb-4">Chỉnh sửa người dùng</h2>

            {/* Avatar */}
            <div className="mb-5 flex items-start gap-4">
              <div>
                <div className="w-24 h-24 rounded-full overflow-hidden border shadow">
                  <img
                    src={avatarPreview || "/default-avatar.jpg"}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.jpg";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-medium">Đổi avatar</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cho phép .jpg/.jpeg/.png, tên file sẽ tự đổi theo ID.
                </p>
              </div>
            </div>

            {/* Thông tin cơ bản */}
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
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-2">Bộ phận</label>
                <select
                  className="w-full px-4 py-2 border rounded"
                  name="id_departments"
                  value={formData.id_departments}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn bộ phận</option>
                  {departments.map((department) => (
                    <option key={department.id_departments} value={department.id_departments}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
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
            </div>
            <div className="mb-6">
              <label className="block mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password_user"
                value={formData.password_user}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="Để trống nếu không đổi"
              />
            </div>

            {/* Messages */}
            {errorMsg && <p className="text-red-600 text-sm mb-3">{errorMsg}</p>}
            {okMsg && <p className="text-green-600 text-sm mb-3">{okMsg}</p>}

            <div className="flex justify-between">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-500 text-white rounded"
                disabled={busy}
              >
                Đóng
              </button>
              <button
                onClick={updateUser}
                className={`px-4 py-2 text-white rounded ${
                  busy ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
                }`}
                disabled={busy}
              >
                {busy ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingUser;
