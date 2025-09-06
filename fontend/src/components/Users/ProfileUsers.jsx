import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const DEFAULT_AVT =
  "https://avatars.dicebear.com/api/adventurer-neutral/default.svg";

const UserProfile = () => {
  const [userId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("id_users") || "" : ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [devices, setDevices] = useState([]);

  // ---- Derived
  const avatarUrl = useMemo(() => {
    if (!user?.id_users) return DEFAULT_AVT;
    return `${API_BASE}/avatars/${user.id_users}?t=${user?.updated_at || ""}`;
  }, [user]);

  const deptMap = useMemo(() => {
    const m = {};
    (departments || []).forEach((d) => {
      m[String(d.id_departments)] = d.department_name;
    });
    return m;
  }, [departments]);

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

  // ---- Data fetching (giữ nguyên logic)
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
        let data = null;
        if (Array.isArray(res.data)) data = res.data[0] || null;
        else if (res.data?.user) data = res.data.user;
        else if (Array.isArray(res.data?.users)) data = res.data.users[0] || null;
        else data = res.data || null;

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

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_BASE}/departments/all-departments`);
        setDepartments(Array.isArray(res.data) ? res.data : res.data?.departments || []);
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API_BASE}/devices/all`);
        const allDevices = Array.isArray(res.data) ? res.data : [];
        const userDevices = allDevices.filter(
          (d) => String(d.id_users) === String(userId)
        );
        setDevices(userDevices);
      } catch (e) {
        console.warn("Không tải được thiết bị:", e.message);
        setDevices([]);
      }
    };
    fetchDevices();
  }, [userId]);

  // ---- ERP action tiles (tối giản, không dùng lib)
  const actions = [
    {
      key: "repair",
      label: "Yêu cầu sửa chữa",
      onClick: () => alert("Đi tới: Yêu cầu sửa chữa thiết bị"),
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M3 21l6-6m3-3l9-9M9 15l3 3m0-6l-3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "exam",
      label: "Bài kiểm tra nâng bậc",
      onClick: () => alert("Đi tới: Bài kiểm tra nâng bậc"),
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M4 19h16M6 17l6-10 6 10M12 7v10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "vote",
      label: "Bình chọn",
      onClick: () => alert("Đi tới: Bình chọn"),
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M4 7h16v10H4zM9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  // ---- Empty state khi chưa đăng nhập
  if (!userId) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-xl p-6 text-center">
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Hồ sơ người dùng</h1>
          <p className="text-neutral-600">Vui lòng đăng nhập để xem hồ sơ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 mt-10">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Thông tin cơ bản */}
        <section className="bg-white border border-neutral-200 rounded-xl">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900">Hồ sơ người dùng</h2>
          </div>

          {/* Loading skeleton for sidebar */}
          {loading ? (
            <div className="p-6 animate-pulse">
              <div className="mx-auto w-28 h-28 rounded-full bg-neutral-200" />
              <div className="mt-4 h-4 w-40 bg-neutral-200 rounded mx-auto" />
              <div className="mt-2 h-3 w-28 bg-neutral-200 rounded mx-auto" />
              <div className="mt-4 h-3 w-24 bg-neutral-200 rounded mx-auto" />
            </div>
          ) : (
            !error && user && (
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border border-neutral-200">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => (e.currentTarget.src = DEFAULT_AVT)}
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm font-medium text-neutral-900">{user.username || "—"}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">
                      {user.role_name || user?.Role?.name_role || "—"}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-2">ID: {user.id_users}</div>
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        {/* Main: Thông tin chi tiết + Thiết bị + Chức năng */}
        <section className="lg:col-span-2 space-y-6">
          {/* Card: Thông tin chi tiết */}
          <div className="bg-white border border-neutral-200 rounded-xl">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-900">Thông tin chi tiết</h3>
            </div>

            {loading ? (
              <div className="p-4 animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 h-3 bg-neutral-200 rounded" />
                    <div className="col-span-8 h-3 bg-neutral-200 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">{error}</div>
            ) : user ? (
              <div className="divide-y divide-neutral-200">
                <Row label="Email" value={user.email_user || "—"} />
                <Row label="Bộ phận" value={departmentName} />
                <Row label="Mã bộ phận" value={user.id_departments || "—"} />
                <Row label="Mã vai trò" value={user.id_roles || "—"} />
              </div>
            ) : null}
          </div>

          {/* Card: Thiết bị (bảng gọn) */}
          <div className="bg-white border border-neutral-200 rounded-xl">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Thiết bị đang sử dụng</h3>
              <div className="text-xs text-neutral-500">{devices.length} mục</div>
            </div>
            <div className="p-0">
              {devices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <Th>ID thiết bị</Th>
                        <Th>Tên thiết bị</Th>
                        <Th className="hidden md:table-cell">Ghi chú</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {devices.map((d) => (
                        <tr key={d.id_devices} className="hover:bg-neutral-50">
                          <Td className="font-medium text-neutral-800">{d.id_devices}</Td>
                          <Td>{d.name_devices || "—"}</Td>
                          <Td className="hidden md:table-cell text-neutral-500">
                            {/* chỗ này tuỳ backend của bạn */}
                            {d.DeviceNote || d.note || "—"}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-sm text-neutral-600">Không có thiết bị.</div>
              )}
            </div>
          </div>

          {/* Card: Chức năng (tiles ERP) */}
          <div className="bg-white border border-neutral-200 rounded-xl">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-900">Chức năng</h3>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {actions.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={a.onClick}
                  className="group border border-neutral-200 rounded-lg px-3 py-3 text-left hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 group-hover:text-neutral-800">{a.icon}</span>
                    <span className="text-sm font-medium text-neutral-800">{a.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ---------- Sub components (ERP style) ----------
const Row = ({ label, value }) => (
  <div className="grid grid-cols-12 gap-3 p-3">
    <div className="col-span-4 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
    <div className="col-span-8 text-sm text-neutral-900">{value}</div>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th className={`text-left text-xs font-medium uppercase tracking-wide px-3 py-2 ${className}`}>{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-2 text-sm text-neutral-800 ${className}`}>{children}</td>
);

export default UserProfile;
