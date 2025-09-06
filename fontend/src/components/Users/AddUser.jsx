import React, { useState, useEffect, useMemo, useRef } from "react";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

/** ========= Combo gõ–tìm cho Bộ phận ========= */
const DepartmentCombo = ({
  departments,
  value,                 // id_departments hiện tại
  onChange,              // (id) => void
  placeholder = "Gõ mã hoặc tên bộ phận...",
  maxItems = 12,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Sắp xếp: theo mã (ưu tiên numeric), sau đó theo tên
  const sorted = useMemo(() => {
    const parseMaybeNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : String(v ?? "");
    };
    return [...(departments || [])].sort((a, b) => {
      const A = parseMaybeNumber(a.id_departments);
      const B = parseMaybeNumber(b.id_departments);
      if (typeof A === "number" && typeof B === "number") {
        if (A !== B) return A - B;
      } else {
        const cmpCode = String(A).localeCompare(String(B), "vi");
        if (cmpCode !== 0) return cmpCode;
      }
      return String(a.department_name || "").localeCompare(
        String(b.department_name || ""),
        "vi"
      );
    });
  }, [departments]);

  // Tìm label hiển thị cho value hiện tại
  const currentLabel = useMemo(() => {
    const found = (sorted || []).find(
      (d) => String(d.id_departments) === String(value)
    );
    if (!found) return "";
    return `${found.id_departments} — ${found.department_name}`;
  }, [sorted, value]);

  // Lọc theo query (mã hoặc tên)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, maxItems);
    const out = sorted.filter((d) => {
      const code = String(d.id_departments ?? "").toLowerCase();
      const name = String(d.department_name ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
    return out.slice(0, maxItems);
  }, [sorted, query, maxItems]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Điều khiển bàn phím
  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((idx) =>
        Math.min(idx + 1, Math.max(0, filtered.length - 1))
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) {
        onChange(item.id_departments);
        setOpen(false);
        setQuery(
          `${item.id_departments} — ${item.department_name}` // hiển thị lại label
        );
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    // cuộn active item vào view
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, filtered.length]);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex gap-2">
        <input
          type="text"
          className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
          placeholder={placeholder}
          value={open ? query : (query || currentLabel)}
          onFocus={() => {
            setOpen(true);
            // nếu chưa từng gõ, hiển thị danh sách luôn nhưng giữ label hiện tại
            setQuery(query || "");
            setActiveIdx(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {/* Nút xóa chọn */}
        {value && (
          <button
            type="button"
            className="px-3 bg-gray-300 rounded hover:bg-gray-400"
            title="Xóa chọn"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute mt-1 w-full bg-white border rounded shadow z-50">
          <div
            ref={listRef}
            className="max-h-60 overflow-auto divide-y divide-gray-100"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Không có kết quả
              </div>
            ) : (
              filtered.map((d, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={d.id_departments}
                    data-idx={idx}
                    className={`px-3 py-2 cursor-pointer ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      // dùng onMouseDown để không mất focus input trước khi onClick
                      e.preventDefault();
                      onChange(d.id_departments);
                      setQuery(`${d.id_departments} — ${d.department_name}`);
                      setOpen(false);
                    }}
                  >
                    <div className="font-medium">
                      {d.id_departments} — {d.department_name}
                    </div>
                    {d.department_content ? (
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {d.department_content}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** =============== AddUser gốc (giữ nguyên, chỉ thay phần Bộ phận) =============== */
const AddUser = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://avatars.dicebear.com/api/adventurer-neutral/default.svg"
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
      const fileExtension = selectedFile.name.split(".").pop();
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
      const response = await fetch(`${API_BASE}/users/add`, {
        method: "POST",
        body: formData, // KHÔNG set Content-Type để trình duyệt tự thêm boundary
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
        fetch(`${API_BASE}/departments/all-departments`),
        fetch(`${API_BASE}/roles/all-roles`),
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
          <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
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
              <label className="block text-sm text-gray-600" htmlFor="id_users">
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
              <label className="block text-sm text-gray-600" htmlFor="username">
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
              <label className="block text-sm text-gray-600" htmlFor="email_user">
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
              <label className="block text-sm text-gray-600" htmlFor="password_user">
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

            {/* ===== Bộ phận: gõ–tìm (thay cho <select>) ===== */}
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="id_departments">
                Bộ phận
              </label>
              <DepartmentCombo
                departments={departments}
                value={userData.id_departments}
                onChange={(val) =>
                  setUserData((p) => ({ ...p, id_departments: String(val || "") }))
                }
                placeholder="Gõ mã hoặc tên bộ phận..."
              />
              {/* Nếu bạn vẫn muốn cho xem value hiện tại (ẩn đi cũng được) */}
              {/* <div className="text-xs text-gray-500 mt-1">id_departments: {userData.id_departments || "—"}</div> */}
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
