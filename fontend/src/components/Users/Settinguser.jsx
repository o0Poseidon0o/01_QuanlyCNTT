// src/components/Users/SettingUser.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../lib/httpClient";

/* ================== CONFIG ================== */
const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

/* ================== THEME (tự theo hệ thống) ==================
   - Không lưu localStorage -> nếu người dùng đổi Chrome light/dark là áp dụng ngay
   - Gắn class "dark" vào <html> để Tailwind dark: hoạt động
*/
function useSystemTheme() {
  useEffect(() => {
    const mm = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (mm.matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    apply(); // áp dụng ngay
    mm.addEventListener?.("change", apply);
    return () => mm.removeEventListener?.("change", apply);
  }, []);
}

/* ================== COMPONENT ================== */
const SettingUser = () => {
  useSystemTheme();

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
          setUsers(
            Array.isArray(response.data)
              ? response.data
              : response.data.users || []
          );
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
      filtered.sort((a, b) => Number(a.id_users) - Number(b.id_users));
    } else {
      filtered.sort((a, b) =>
        String(a.username || "").localeCompare(
          String(b.username || ""),
          "vi",
        )
      );
    }

    return filtered.slice(0, 8);
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
        setSearchTerm(String(item.id_users));
        setSuggestOpen(false);
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

  // Sắp xếp
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

  // Cập nhật người dùng
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

  /* ================== RENDER ================== */
  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-64 w-full rounded bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 text-gray-800 dark:text-gray-100">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl font-semibold">Danh sách nhân viên</span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
          {sortedUsers.length} User
        </span>
      </div>

      {/* Ô tìm kiếm (live + gợi ý) */}
      <div className="mb-4" ref={searchWrapRef}>
        <div className="relative flex w-full items-stretch">
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
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 pr-10 outline-none ring-2 ring-transparent focus:ring-blue-500/30"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
            <i className="fas fa-search" />
          </div>

          {/* Dropdown gợi ý */}
          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-50 max-h-72 overflow-auto">
              {suggestions.map((u, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    type="button"
                    key={u.id_users}
                    className={`w-full text-left px-3 py-2 ${isActive ? "bg-blue-50 dark:bg-slate-700/60" : "hover:bg-gray-50 dark:hover:bg-slate-700/40"}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchTerm(String(u.id_users));
                      setSuggestOpen(false);
                    }}
                  >
                    <div className="font-medium">
                      {u.id_users} — {u.username}
                    </div>
                    <div className="text-xs opacity-70 line-clamp-1">
                      {u.email_user}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bộ điều khiển sắp xếp */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm opacity-80">Sắp xếp theo:</label>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        >
          <option value="id_users">Mã (ID)</option>
          <option value="username">Tên</option>
          <option value="email_user">Email</option>
        </select>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
          title={sortDir === "asc" ? "Đang: Tăng dần (nhỏ → lớn)" : "Đang: Giảm dần (lớn → nhỏ)"}
        >
          {sortDir === "asc" ? "↑ Nhỏ → Lớn" : "↓ Lớn → Nhỏ"}
        </button>
      </div>

      {/* Bảng danh sách */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800 text-sm">
              <tr className="[&>th]:py-3 [&>th]:px-4 [&>th]:font-semibold">
                <th>Hình ảnh</th>
                <th>Số hiệu</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Bộ phận</th>
                <th>Chức danh</th>
                <th>Chức năng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {sortedUsers.map((user) => (
                <tr key={user.id_users} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0">
                      <img
                        src={`${API_BASE}/avatars/${user.id_users}?v=${avatarBustKey}`}
                        alt="Avatar"
                        loading="lazy"
                        className="w-full h-full rounded-full object-cover object-center border border-gray-200 dark:border-slate-700 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = "/default-avatar.jpg";
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">{user.id_users}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">{user.email_user}</td>
                  <td className="py-3 px-4">{user.department_name}</td>
                  <td className="py-3 px-4">{user.role_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className={`px-3 py-1.5 rounded-lg text-sm text-white shadow-sm transition ${
                          currentRole !== "admin"
                            ? "bg-green-400/60 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                        disabled={currentRole !== "admin"}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteUser(user.id_users)}
                        className={`px-3 py-1.5 rounded-lg text-sm text-white shadow-sm transition ${
                          currentRole !== "admin"
                            ? "bg-red-400/60 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
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
                  <td colSpan={7} className="py-6 px-6 text-center opacity-70">
                    Không có kết quả phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chỉnh sửa */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-[560px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chỉnh sửa người dùng</h2>
              <button
                onClick={closeEditModal}
                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                disabled={busy}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow">
                  <img
                    src={avatarPreview || "/default-avatar.jpg"}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.jpg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-2 font-medium">Đổi avatar</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 dark:file:border-slate-700 file:px-3 file:py-1.5 file:bg-white dark:file:bg-slate-800 file:text-sm file:hover:bg-gray-50 dark:file:hover:bg-slate-700"
                  />
                  <p className="text-xs opacity-70 mt-1">
                    Cho phép .jpg/.jpeg/.png, tên file sẽ tự đổi theo ID.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div>
                <label className="block mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 outline-none ring-2 ring-transparent focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block mb-1.5">Email</label>
                <input
                  type="email"
                  name="email_user"
                  value={formData.email_user}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 outline-none ring-2 ring-transparent focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5">Bộ phận</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2"
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
                  <label className="block mb-1.5">Chức danh</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2"
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

              <div>
                <label className="block mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  name="password_user"
                  value={formData.password_user}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 outline-none ring-2 ring-transparent focus:ring-blue-500/30"
                  placeholder="Để trống nếu không đổi"
                />
              </div>

              {/* Messages */}
              {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
              {okMsg && <p className="text-green-500 text-sm">{okMsg}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-between">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                disabled={busy}
              >
                Đóng
              </button>
              <button
                onClick={updateUser}
                className={`px-4 py-2 rounded-lg text-white ${
                  busy ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
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
