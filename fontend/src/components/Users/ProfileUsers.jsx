import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const DEFAULT_AVT =
  "https://avatars.dicebear.com/api/adventurer-neutral/default.svg";

const UserProfile = () => {
  // Lấy id người dùng đã đăng nhập
  const [userId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("id_users") || "" : ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  // Danh sách bộ phận để map id -> tên (fallback)
  const [departments, setDepartments] = useState([]);

  // Ảnh avatar (cache-busting nhẹ)
  const avatarUrl = useMemo(() => {
    if (!user?.id_users) return DEFAULT_AVT;
    return `${API_BASE}/avatars/${user.id_users}?t=${user?.updated_at || ""}`;
  }, [user]);

  // Map id_departments -> department_name
  const deptMap = useMemo(() => {
    const m = {};
    (departments || []).forEach((d) => {
      m[String(d.id_departments)] = d.department_name;
    });
    return m;
  }, [departments]);

  // Lấy tên bộ phận (ưu tiên các field nếu backend đã join)
  const departmentName = useMemo(() => {
    if (!user) return "—";
    return (
      user.department_name ||
      user?.Department?.department_name ||
      user?.Departments?.department_name ||
      deptMap[String(user.id_departments)] ||
      "—"
    );
  }, [user, deptMap]);

  // Gọi API lấy chính user đang đăng nhập
  useEffect(() => {
    const fetchUser = async (id) => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/users/search`, {
          params: { id_users: id },
          headers: { "Cache-Control": "no-cache" },
        });

        // Chuẩn hoá payload
        let data = null;
        if (Array.isArray(res.data)) {
          data = res.data[0] || null;
        } else if (res.data?.user) {
          data = res.data.user;
        } else if (Array.isArray(res.data?.users)) {
          data = res.data.users[0] || null;
        } else {
          data = res.data || null;
        }

        if (!data) {
          setError("Không tìm thấy người dùng.");
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || "Lỗi khi tải thông tin người dùng");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser(userId);
  }, [userId]);

  // Lấy danh sách bộ phận để fallback tên
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_BASE}/departments/all-departments`, {
          headers: { "Cache-Control": "no-cache" },
        });
        setDepartments(Array.isArray(res.data) ? res.data : res.data?.departments || []);
      } catch (e) {
        console.warn("Không tải được danh sách bộ phận (fallback vẫn OK).", e?.message);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // Trường hợp chưa đăng nhập
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white shadow rounded-2xl w-full max-w-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Hồ sơ người dùng</h1>
          <p className="text-gray-600">
            Chưa xác định người dùng. Vui lòng đăng nhập để xem hồ sơ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 mt-10">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ người dùng</h1>

        {/* Loading / Error */}
        {loading && <div className="text-gray-500">Đang tải dữ liệu...</div>}
        {!loading && error && (
          <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Nội dung (Read-only) */}
        {!loading && !error && user && (
          <div className="grid grid-cols-1 md:grid-cols-[180px,1fr] gap-6">
            {/* Avatar + tên */}
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-blue-500 shadow">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVT;
                  }}
                  loading="lazy"
                />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-800 text-center">
                {user.username || "—"}
              </h2>
              <p className="text-gray-500 text-center">
                {user.role_name || user?.Role?.name_role || "—"}
              </p>
              <div className="mt-3 text-xs text-gray-500">
                ID: <span className="font-mono">{user.id_users}</span>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 text-gray-600 font-medium">Email</div>
                <div className="col-span-8 text-gray-800 break-words">
                  {user.email_user || "—"}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 text-gray-600 font-medium">Bộ phận</div>
                <div className="col-span-8 text-gray-800">
                  {departmentName}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 text-gray-600 font-medium">Mã bộ phận</div>
                <div className="col-span-8 text-gray-800">
                  {user.id_departments || "—"}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 text-gray-600 font-medium">Mã vai trò</div>
                <div className="col-span-8 text-gray-800">
                  {user.id_roles || "—"}
                </div>
              </div>

              {/* Sau này bật chức năng gửi yêu cầu sửa chữa thiết bị */}
              {/*
              <div className="pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600"
                  onClick={() => {
                    // navigate(`/ticket/new?user=${user.id_users}`)
                  }}
                >
                  Gửi yêu cầu sửa chữa thiết bị
                </button>
              </div>
              */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
