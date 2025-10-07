import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/**
 * AddUser.jsx — bản tối ưu
 *
 * Điểm chính:
 * - Tách logic, thêm validate cơ bản (email, mật khẩu, id bắt buộc)
 * - Ngăn double-submit, hiển thị lỗi/ok rõ ràng
 * - Xem trước avatar, revoke URL, reset input file sau khi submit
 * - Combo Bộ phận gõ–tìm mượt hơn, có ARIA + điều hướng bàn phím ổn định
 * - Xử lý lỗi fetch an toàn (try/catch, fallback JSON)
 */

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

/** ========= Utils ========= */
const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

const classNames = (...xs) => xs.filter(Boolean).join(" ");

/** ========= Combo gõ–tìm cho Bộ phận ========= */
const DepartmentCombo = ({
  departments,
  value, // id_departments hiện tại
  onChange, // (id) => void
  placeholder = "Gõ mã hoặc tên bộ phận...",
  maxItems = 12,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
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
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((idx) => Math.min(idx + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) {
        onChange(item.id_departments);
        setOpen(false);
        setQuery(`${item.id_departments} — ${item.department_name}`); // hiển thị lại label
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
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
          ref={inputRef}
          type="text"
          className={classNames(
            "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          placeholder={placeholder}
          value={open ? query : query || currentLabel}
          onFocus={() => {
            if (disabled) return;
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
          role="combobox"
          aria-expanded={open}
          aria-controls="dept-listbox"
          aria-autocomplete="list"
          aria-activedescendant={open ? `dept-opt-${activeIdx}` : undefined}
          disabled={disabled}
        />
        {/* Nút xóa chọn */}
        {value && !disabled && (
          <button
            type="button"
            className="px-3 bg-gray-300 rounded hover:bg-gray-400"
            title="Xóa chọn"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute mt-1 w-full bg-white border rounded shadow z-50">
          <div
            id="dept-listbox"
            role="listbox"
            ref={listRef}
            className="max-h-60 overflow-auto divide-y divide-gray-100"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Không có kết quả</div>
            ) : (
              filtered.map((d, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div
                    id={`dept-opt-${idx}`}
                    key={d.id_departments}
                    data-idx={idx}
                    role="option"
                    aria-selected={isActive}
                    className={classNames(
                      "px-3 py-2 cursor-pointer",
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    )}
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

/** =============== AddUser =============== */
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
  });
  const [message, setMessage] = useState(""); // Thông báo phản hồi từ server
  const [isLoading, setIsLoading] = useState(false); // Loading indicator
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  /** ===== Validate ===== */
  const validate = useCallback(() => {
    const e = {};
    if (!userData.id_users) e.id_users = "Bắt buộc";
    if (!userData.username) e.username = "Bắt buộc";
    if (!userData.email_user) e.email_user = "Bắt buộc";
    else if (!emailRegex.test(userData.email_user)) e.email_user = "Email không hợp lệ";
    if (!userData.password_user) e.password_user = "Bắt buộc";
    else if (userData.password_user.length < 6) e.password_user = "Mật khẩu ≥ 6 ký tự";
    if (!userData.id_departments) e.id_departments = "Chọn bộ phận";
    if (!userData.id_roles) e.id_roles = "Chọn vai trò";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [userData]);

  // Kiểm tra khi thay đổi file avatar
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Chỉ cho phép tải lên ảnh định dạng JPEG, PNG, hoặc JPG.");
      return;
    }

    setSelectedFile(file);

    // Hiển thị ảnh tạm thời trước khi upload
    const imageUrl = URL.createObjectURL(file);
    setAvatarUrl((old) => {
      // thu hồi URL cũ nếu là blob
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return imageUrl;
    });
  };

  // Dọn URL blob khi unmount
  useEffect(() => {
    return () => {
      if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  // Hàm xử lý khi người dùng submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // chặn double-submit

    if (!validate()) {
      setMessage("Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    setIsLoading(true); // Bắt đầu loading
    setMessage("");

    // Tạo FormData để gửi dữ liệu
    const formData = new FormData();
    if (selectedFile) {
      const fileExtension = (selectedFile.name.split(".").pop() || "jpg").toLowerCase();
      const newFileName = `${userData.id_users}.${fileExtension}`;
      formData.append("avatar", selectedFile, newFileName);
    }
    formData.append("id_users", String(userData.id_users).trim());
    formData.append("username", userData.username.trim());
    formData.append("email_user", userData.email_user.trim());
    formData.append("password_user", userData.password_user);
    formData.append("id_departments", String(userData.id_departments));
    formData.append("id_roles", String(userData.id_roles));

    try {
      const response = await fetch(`${API_BASE}/users/add`, {
        method: "POST",
        body: formData, // KHÔNG set Content-Type để trình duyệt tự thêm boundary
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        // no-op (có thể server không trả JSON chuẩn ở lỗi bất ngờ)
      }

      if (!response.ok) {
        setMessage(`Lỗi: ${data?.message || response.statusText || "Không xác định"}`);
        return;
      }

      // Thành công:
      setMessage("Người dùng đã được thêm thành công!");
      // Reset form
      setUserData({
        id_users: "",
        id_departments: "",
        id_roles: "",
        username: "",
        email_user: "",
        password_user: "",
      });
      setErrors({});
      setSelectedFile(null);
      setAvatarUrl("https://avatars.dicebear.com/api/adventurer-neutral/default.svg");
      // reset file input UI
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage("Đã xảy ra lỗi trong quá trình thêm người dùng.");
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  // Hàm fetch dữ liệu phòng ban và vai trò
  const fetchDepartmentsAndRoles = useCallback(async () => {
    try {
      const [depRes, roleRes] = await Promise.all([
        fetch(`${API_BASE}/departments/all-departments`),
        fetch(`${API_BASE}/roles/all-roles`),
      ]);

      const [departmentsData, rolesData] = await Promise.all([
        depRes.ok ? depRes.json() : Promise.resolve([]),
        roleRes.ok ? roleRes.json() : Promise.resolve([]),
      ]);

      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentsAndRoles();
  }, [fetchDepartmentsAndRoles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const [showPw, setShowPw] = useState(false);

  return (
    <div className="flex flex-wrap mt-10">
      <div className="w-full lg:w-1/2 my-6 pr-0 lg:pr-2">
        <p className="text-xl pb-6 flex items-center">
          <i className="fas fa-list mr-3" /> Hình ảnh
        </p>
        <div className="leading-loose">
          <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
            <img
              src={avatarUrl}
              alt="avatar"
              className="mb-4 w-40 h-40 object-cover rounded-md border"
            />
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-4"
                aria-label="Tải ảnh đại diện"
              />
              <p className="text-xs text-gray-500">(Cho phép .jpg, .jpeg, .png)</p>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-1/2 mt-6 pl-0 lg:pl-2">
        <p className="text-xl pb-6 flex items-center">
          <i className="fas fa-list mr-3" /> Form User
        </p>
        <div className="leading-loose">
          <form className="p-10 bg-white rounded shadow-xl" onSubmit={handleSubmit}>
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="id_users">
                ID Người dùng
              </label>
              <input
                className={classNames(
                  "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded",
                  errors.id_users && "ring-2 ring-red-400"
                )}
                id="id_users"
                name="id_users"
                type="text"
                inputMode="numeric"
                required
                placeholder="ID Người dùng"
                value={userData.id_users}
                onChange={handleChange}
              />
              {errors.id_users && (
                <p className="text-xs text-red-500 mt-1">{errors.id_users}</p>
              )}
            </div>

            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="username">
                Tên người dùng
              </label>
              <input
                className={classNames(
                  "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded",
                  errors.username && "ring-2 ring-red-400"
                )}
                id="username"
                name="username"
                type="text"
                required
                placeholder="Tên người dùng"
                value={userData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="email_user">
                Email
              </label>
              <input
                className={classNames(
                  "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded",
                  errors.email_user && "ring-2 ring-red-400"
                )}
                id="email_user"
                name="email_user"
                type="email"
                required
                placeholder="Email"
                value={userData.email_user}
                onChange={handleChange}
                onBlur={() => {
                  if (userData.email_user && !emailRegex.test(userData.email_user)) {
                    setErrors((p) => ({ ...p, email_user: "Email không hợp lệ" }));
                  } else {
                    setErrors((p) => ({ ...p, email_user: undefined }));
                  }
                }}
              />
              {errors.email_user && (
                <p className="text-xs text-red-500 mt-1">{errors.email_user}</p>
              )}
            </div>

            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="password_user">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  className={classNames(
                    "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded pr-10",
                    errors.password_user && "ring-2 ring-red-400"
                  )}
                  id="password_user"
                  name="password_user"
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="Mật khẩu"
                  value={userData.password_user}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.password_user && (
                <p className="text-xs text-red-500 mt-1">{errors.password_user}</p>
              )}
              {/* Gợi ý độ mạnh đơn giản */}
              {userData.password_user && (
                <p className="text-xs text-gray-500 mt-1">
                  Độ dài: {userData.password_user.length} — nên ≥ 8 và có chữ HOA/thường/số.
                </p>
              )}
            </div>

            {/* ===== Bộ phận: gõ–tìm ===== */}
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
                disabled={isLoading}
              />
              {errors.id_departments && (
                <p className="text-xs text-red-500 mt-1">{errors.id_departments}</p>
              )}
            </div>

            {/* Vai trò */}
            <div className="mt-2">
              <label className="block text-sm text-gray-600" htmlFor="id_roles">
                Vai trò
              </label>
              <select
                className={classNames(
                  "w-full px-5 py-1 text-gray-700 bg-gray-200 rounded",
                  errors.id_roles && "ring-2 ring-red-400"
                )}
                id="id_roles"
                name="id_roles"
                required
                value={userData.id_roles}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">Chọn vai trò</option>
                {roles.map((role) => (
                  <option key={role.id_roles} value={role.id_roles}>
                    {role.name_role}
                  </option>
                ))}
              </select>
              {errors.id_roles && (
                <p className="text-xs text-red-500 mt-1">{errors.id_roles}</p>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                className={classNames(
                  "px-4 py-1 text-white font-light tracking-wider bg-gray-900 rounded",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Đang thêm..." : "Thêm Người Dùng"}
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-gray-100 rounded border"
                disabled={isLoading}
                onClick={() => {
                  setUserData({
                    id_users: "",
                    id_departments: "",
                    id_roles: "",
                    username: "",
                    email_user: "",
                    password_user: "",
                  });
                  setErrors({});
                  setSelectedFile(null);
                  setAvatarUrl("https://avatars.dicebear.com/api/adventurer-neutral/default.svg");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Làm mới
              </button>
            </div>

            {message && (
              <p
                className={classNames(
                  "mt-4",
                  message.startsWith("Người dùng đã được thêm")
                    ? "text-green-600"
                    : "text-red-500"
                )}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
