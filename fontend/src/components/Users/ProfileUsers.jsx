// src/components/Users/ProfileUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/httpClient";
import { createRepair } from "../../services/repairsApi";

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

// DiceBear v7 (đã bỏ domain cũ)
const DEFAULT_AVT = "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=default";


const PAGE_SIZE_DEFAULT = 8;

const ProfileUsers = () => {
  const [userId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("id_users") || "" : ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]); // NEW: map id_roles -> tên
  const [devices, setDevices] = useState([]);

  // ===== Tickets state =====
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPageSize, setTicketPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Tabs trạng thái
  const STATUS_TABS = useMemo(
    () => [
      { key: "all", label: "Tất cả" },
      { key: "requested", label: "Requested" },
      { key: "open", label: "Open" },
      { key: "in_progress", label: "In progress" },
      { key: "pending", label: "Pending" },
      { key: "completed", label: "Completed" },
      { key: "resolved", label: "Resolved" },
      { key: "closed", label: "Closed" },
    ],
    []
  );
  const [ticketTab, setTicketTab] = useState("all");

  // ===== Modal đổi mật khẩu =====
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState(""); // <-- ĐÃ SỬA
  const [cpShow, setCpShow] = useState({ nw: false, cf: false });
  const [cpMsg, setCpMsg] = useState({ type: "", text: "" });
  const [cpLoading, setCpLoading] = useState(false);

  const validatePassword = (v) => typeof v === "string" && v.trim().length >= 6;

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    setCpMsg({ type: "", text: "" });

    if (!userId || !/^\d+$/.test(String(userId))) {
      setCpMsg({ type: "error", text: "Thiếu hoặc sai ID người dùng." });
      return;
    }
    if (!validatePassword(cpNew)) {
      setCpMsg({ type: "error", text: "Mật khẩu mới tối thiểu 6 ký tự." });
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpMsg({ type: "error", text: "Xác nhận mật khẩu không khớp." });
      return;
    }

    setCpLoading(true);
    try {
      await axios.put(`${API_BASE}/users/update/${userId}`, {
        password_user: cpNew,
      });
      setCpMsg({ type: "success", text: "Cập nhật mật khẩu thành công." });
      setCpNew("");
      setCpConfirm("");
      setTimeout(() => setShowPwdModal(false), 600);
    } catch (err) {
      setCpMsg({
        type: "error",
        text: err?.response?.data?.message || "Cập nhật mật khẩu thất bại.",
      });
    } finally {
      setCpLoading(false);
    }
  };

  // ===== Modal tạo ticket sửa chữa =====
  const NEW_TICKET_DEFAULT = {
    id_devices: "",
    title: "",
    issue_description: "",
    severity: "medium",
    priority: "normal",
    sla_hours: 24,
  };
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ntForm, setNtForm] = useState(NEW_TICKET_DEFAULT);
  const [ntMsg, setNtMsg] = useState({ type: "", text: "" });
  const [ntLoading, setNtLoading] = useState(false);

  const openCreateTicket = (prefillDeviceId) => {
    setNtMsg({ type: "", text: "" });
    setNtForm((f) => ({
      ...f,
      id_devices: prefillDeviceId || devices[0]?.id_devices || "",
    }));
    setShowCreateTicket(true);
  };

  const submitCreateTicket = async (e) => {
    e?.preventDefault?.();
    setNtMsg({ type: "", text: "" });

    if (!userId) {
      setNtMsg({ type: "error", text: "Thiếu ID người dùng." });
      return;
    }
    if (!ntForm.id_devices) {
      setNtMsg({ type: "error", text: "Vui lòng chọn thiết bị." });
      return;
    }
    if (!String(ntForm.title || "").trim()) {
      setNtMsg({ type: "error", text: "Vui lòng nhập tiêu đề." });
      return;
    }

    setNtLoading(true);
    try {
      const payload = { ...ntForm, reported_by: Number(userId) };
      const res = await createRepair(payload);
      const idNew = res?.id_repair;

      setNtMsg({
        type: "success",
        text: `Tạo ticket thành công${idNew ? ` (#${idNew})` : ""}.`,
      });

      setTimeout(() => {
        setNtForm(NEW_TICKET_DEFAULT);
        setShowCreateTicket(false);
        refreshMyTickets();
      }, 800);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Tạo ticket thất bại. Vui lòng kiểm tra quyền & dữ liệu.";
      setNtMsg({ type: "error", text: msg });
    } finally {
      setNtLoading(false);
    }
  };

  // ---- Derived
  const avatarUrl = useMemo(() => {
    if (!user?.id_users) return DEFAULT_AVT;
    return `${API_BASE}/avatars/${user.id_users}?t=${user?.updated_at || ""}`;
  }, [user]);

  // ===== Helpers =====
  const canonical = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // Map phòng ban + vai trò
  const deptMap = useMemo(() => {
    const m = {};
    (departments || []).forEach((d) => {
      m[String(d.id_departments)] = d.department_name || d.name || d.title;
    });
    return m;
  }, [departments]);

  const roleMap = useMemo(() => {
    const m = {};
    (roles || []).forEach((r) => {
      m[String(r.id_roles || r.id_role || r.id)] =
        r.role_name || r.name_role || r.name || r.title;
    });
    return m;
  }, [roles]);

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

  const roleName = useMemo(() => {
    if (!user) return "—";
    return (
      user.role_name ||
      user?.Role?.name_role ||
      user?.Roles?.name_role ||
      roleMap[String(user.id_roles)] ||
      "—"
    );
  }, [user, roleMap]);

  const VI_SEVERITY = { critical: "Khẩn", high: "Cao", medium: "Trung Bình", low: "Thấp" };
  const VI_PRIORITY = { urgent: "Khẩn", high: "Cao", normal: "Bình Thường", low: "Thấp" };

  const statusPill = (st) => {
    const v = String(st || "").toLowerCase();
    const map = {
      requested: "text-neutral-700 bg-neutral-100 border-neutral-200",
      open: "text-indigo-700 bg-indigo-50 border-indigo-200",
      in_progress: "text-blue-700 bg-blue-50 border-blue-200",
      pending: "text-amber-700 bg-amber-50 border-amber-200",
      completed: "text-emerald-700 bg-emerald-50 border-emerald-200",
      resolved: "text-emerald-700 bg-emerald-50 border-emerald-200",
      closed: "text-neutral-700 bg-neutral-50 border-neutral-200",
      canceled: "text-red-700 bg-red-50 border-red-200",
      rejected: "text-rose-700 bg-rose-50 border-rose-200",
    };
    const cls = map[v] || "text-neutral-700 bg-neutral-50 border-neutral-200";
    const label = st || "—";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
        {label}
      </span>
    );
  };

  const formatTimeShort = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatVND = (n) => `${(Number(n) || 0).toLocaleString("vi-VN")} đ`;

  // ---- Data fetching: user
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
        setError(e?.response?.data?.message || "Lỗi khi tải thông tin người dùng");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser(userId);
  }, [userId]);

  // ---- Data fetching: departments
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

  // ---- Data fetching: roles
  useEffect(() => {
    const fetchRoles = async () => {
      const tryEndpoints = [
        `${API_BASE}/roles/all-roles`,
        `${API_BASE}/roles/all`,
        `${API_BASE}/roles/list`,
        `${API_BASE}/roles`,
      ];
      for (const url of tryEndpoints) {
        try {
          const r = await axios.get(url);
          const list = Array.isArray(r.data) ? r.data : r.data?.roles || [];
          if (list.length) {
            setRoles(list);
            return;
          }
        } catch {}
      }
      setRoles([]);
    };
    fetchRoles();
  }, []);

  // ---- Data fetching: devices
useEffect(() => {
  const fetchDevices = async () => {
    if (!userId) return;

    // 1) LOGIC CŨ: lấy toàn bộ devices rồi lọc theo id_users
    let baseDevices = [];
    try {
      const rAll = await axios.get(`${API_BASE}/devices/all`, {
        headers: { "Cache-Control": "no-cache" },
        params: { t: Date.now() },
      });
      const allDevices = Array.isArray(rAll.data) ? rAll.data : [];
      baseDevices = allDevices
        .filter((d) => String(d.id_users) === String(userId))
        .map((d) => ({
          id_devices: d.id_devices,
          name_devices: d.name_devices,
          note: d.DeviceNote || d.note || null,
          start_time: null, // sẽ được update nếu có trong bảng cấp phát
        }));
    } catch {
      baseDevices = [];
    }

    // 2) UPDATE LÊN: lấy thêm danh sách thiết bị đang dùng từ cấp phát (không thay thế, chỉ merge)
    try {
      const rAssign = await axios.get(
        `${API_BASE}/assignments/active-by-user/${userId}`,
        { headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() } }
      );
      const assigns = Array.isArray(rAssign.data) ? rAssign.data : [];

      // map assignment -> thiết bị
      const assignDevices = assigns
        .map((r) => ({
          id_devices:
            r.id_devices ??
            r.Device?.id_devices ??
            r.device?.id_devices ??
            r.device_id,
          name_devices:
            r.Device?.name_devices ??
            r.device?.name_devices ??
            r.name_devices ??
            "",
          start_time: r.start_time || null,
          note:
            r.Device?.DeviceNote ??
            r.Device?.note ??
            r.device?.note ??
            r.note ??
            null,
        }))
        .filter((d) => d.id_devices);

      // merge: ưu tiên giữ base (logic cũ), nhưng nếu trùng ID có start_time thì cập nhật
      const map = new Map();
      baseDevices.forEach((d) => map.set(String(d.id_devices), d));
      assignDevices.forEach((d) => {
        const key = String(d.id_devices);
        if (map.has(key)) {
          // cập nhật start_time nếu có
          const curr = map.get(key);
          map.set(key, { ...curr, start_time: d.start_time ?? curr.start_time });
        } else {
          // thêm mới từ bảng cấp phát
          map.set(key, d);
        }
      });

      setDevices(Array.from(map.values()));
    } catch {
      // nếu API cấp phát lỗi, vẫn dùng danh sách gốc
      setDevices(baseDevices);
    }
  };

  fetchDevices();
}, [userId]);


  // ---- Data fetching: my tickets
  const fetchMyTickets = async () => {
    if (!userId) return;
    setTicketsLoading(true);
    setTicketsError("");
    try {
      let data = [];

      try {
        const r1 = await axios.get(`${API_BASE}/repairs/search`, { params: { reported_by: userId } });
        if (Array.isArray(r1.data)) data = r1.data;
        else if (Array.isArray(r1.data?.repairs)) data = r1.data.repairs;
      } catch {}

      if (!data.length) {
        try {
          const r2 = await axios.get(`${API_BASE}/repairs/user/${userId}`);
          if (Array.isArray(r2.data)) data = r2.data;
          else if (Array.isArray(r2.data?.repairs)) data = r2.data.repairs;
        } catch {}
      }

      if (!data.length) {
        try {
          const r3 = await axios.get(`${API_BASE}/repairs/all`);
          const all = Array.isArray(r3.data) ? r3.data : r3.data?.repairs || [];
          data = all.filter((t) => String(t.reported_by) === String(userId));
        } catch {}
      }

      const normalized = (data || []).map((t) => ({
        id_repair: t.id_repair ?? t.id ?? t.ticket_id,
        device_code: t.device_code ?? t.id_devices ?? t.Device?.id_devices ?? t.device?.id_devices ?? "",
        device_name: t.device_name ?? t.Device?.name_devices ?? t.device?.name_devices ?? "",
        title: t.title ?? t.issue_title ?? "—",
        issue_description: t.issue_description ?? t.description ?? "",
        result: t.outcome ?? t.result ?? t.repair_result ?? "-",
        severity: (t.severity || t.level || "").toString().toLowerCase(),
        priority: (t.priority || "").toString().toLowerCase(),
        status: t.status ?? t.state ?? t.current_status ?? "requested",
        created_at: t.date_reported ?? t.created_at ?? t.createdAt ?? t.created_time,
        sla_hours: t.sla_hours ?? t.sla ?? null,
        reporter_name: t.reporter_name ?? t.Reporter?.username ?? t.created_by_name ?? "",
        assignee_name: t.assignee ?? t.assignee_name ?? t.technician_name ?? t.Technician?.username ?? "",
        vendor_name: t.vendor_name ?? t.RepairVendor?.vendor_name ?? "",
        repair_type: t.repair_type ?? "",
        total_cost:
          t.total_cost ??
          (Number(t.labor_cost || 0) + Number(t.parts_cost || 0) + Number(t.other_cost || 0)),
      }));

      normalized.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setMyTickets(normalized);
    } catch (e) {
      setTicketsError(e?.response?.data?.message || "Không tải được danh sách ticket của bạn.");
      setMyTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const refreshMyTickets = () => fetchMyTickets();

  useEffect(() => {
    fetchMyTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ---- Filter + phân trang
  const filteredByTab = useMemo(() => {
    if (ticketTab === "all") return myTickets;
    return myTickets.filter((t) => String(t.status || "").toLowerCase() === ticketTab);
  }, [myTickets, ticketTab]);

  const filteredTickets = useMemo(() => {
    const q = canonical(ticketQuery);
    if (!q) return filteredByTab;
    return filteredByTab.filter((t) => {
      const haystack = [
        t.id_repair,
        t.title,
        t.result,
        t.severity,
        t.priority,
        t.status,
        t.device_code,
        t.device_name,
        t.reporter_name,
        t.assignee_name,
        t.vendor_name,
      ]
        .map((x) => canonical(x))
        .join(" ");
      return haystack.includes(q);
    });
  }, [filteredByTab, ticketQuery]);

  const totalTicketPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));
  const pageTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(start, start + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

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
      {/* FULL-WIDTH + ĐẢO THỨ TỰ: ticket trái, avatar phải */}
      <div className="w-full max-w-none flex flex-col lg:flex-row-reverse gap-6">
        {/* Sidebar */}
        <section className="bg-white border border-neutral-200 rounded-xl w-full lg:w-52 flex-shrink-0 lg:sticky lg:top-6 h-fit">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Hồ sơ</h2>
            <button
              type="button"
              onClick={() => {
                setCpMsg({ type: "", text: "" });
                setCpNew("");
                setCpConfirm("");
                setShowPwdModal(true);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Đổi MK
            </button>
          </div>

          {loading ? (
            <div className="p-4 animate-pulse">
              <div className="mx-auto w-20 h-20 rounded-full bg-neutral-200" />
              <div className="mt-3 h-3 w-28 bg-neutral-200 rounded mx-auto" />
              <div className="mt-2 h-3 w-20 bg-neutral-200 rounded mx-auto" />
            </div>
          ) : (
            !error &&
            user && (
              <div className="p-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-neutral-200">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => (e.currentTarget.src = DEFAULT_AVT)}
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-medium text-neutral-900">
                      {user.username || "—"}
                    </div>
                    <div className="text-[12px] text-neutral-600 mt-0.5">
                      {roleName}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      ID: {user.id_users}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        {/* Main */}
        <section className="flex-1 space-y-6">
          {/* Thông tin chi tiết */}
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
                <Row label="Vai trò" value={roleName} />
              </div>
            ) : null}
          </div>

          {/* Thiết bị */}
          <div className="bg-white border border-neutral-200 rounded-xl">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Thiết bị đang sử dụng</h3>
              <div className="text-xs text-neutral-500">{devices.length} mục</div>
            </div>
            <div className="p-0">
              {devices.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                          <Th>ID thiết bị</Th>
                          <Th>Tên thiết bị</Th>
                          <Th className="hidden md:table-cell">Ghi chú</Th>
                          <Th className="w-1">Tạo ticket</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {devices.map((d) => (
                          <tr key={d.id_devices} className="hover:bg-neutral-50">
                            <Td className="font-medium text-neutral-800">{d.id_devices}</Td>
                            <Td>{d.name_devices || "—"}</Td>
                            <Td className="hidden md:table-cell text-neutral-500">
                              {d.DeviceNote || d.note || "—"}
                            </Td>
                            <Td>
                              <button
                                type="button"
                                onClick={() => openCreateTicket(d.id_devices)}
                                className="text-xs px-2 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              >
                                + Ticket
                              </button>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => openCreateTicket()}
                      className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
                    >
                      Tạo ticket sửa chữa (chọn thiết bị)
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-sm text-neutral-600">Không có thiết bị.</div>
              )}
            </div>
          </div>

          {/* ===== Ticket của tôi ===== */}
          <div className="bg-white border border-neutral-200 rounded-xl">
            <div className="p-4 border-b border-neutral-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Danh sách ticket</h3>

                <div className="flex items-center gap-2">
                  <input
                    value={ticketQuery}
                    onChange={(e) => {
                      setTicketQuery(e.target.value);
                      setTicketPage(1);
                    }}
                    placeholder="Tìm theo tiêu đề / thiết bị / người báo cáo…"
                    className="text-sm px-3 py-2 border rounded-lg border-neutral-300 w-56"
                  />
                  <select
                    className="text-sm px-2 py-2 border rounded-lg border-neutral-300"
                    value={ticketPageSize}
                    onChange={(e) => {
                      setTicketPageSize(Number(e.target.value));
                      setTicketPage(1);
                    }}
                  >
                    {[5, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}/trang
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refreshMyTickets}
                    className="text-sm px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                  >
                    Làm mới
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS_TABS.map((t) => {
                  const active = ticketTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTicketTab(t.key);
                        setTicketPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                        active
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            {ticketsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-9 bg-neutral-100 rounded animate-pulse" />
                ))}
              </div>
            ) : ticketsError ? (
              <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">
                {ticketsError}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">Không có ticket.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <Th className="w-16">#</Th>
                        <Th>Thiết bị</Th>
                        <Th>Tiêu đề</Th>
                        <Th className="hidden md:table-cell">Kết quả</Th>
                        <Th className="hidden md:table-cell">Mức độ</Th>
                        <Th className="hidden md:table-cell">Ưu tiên</Th>
                        <Th>Trạng thái</Th>
                        <Th className="hidden lg:table-cell">Người báo cáo</Th>
                        <Th>Báo lúc</Th>
                        <Th className="hidden md:table-cell">SLA (h)</Th>
                        <Th className="hidden lg:table-cell">Người xử lý / NCC</Th>
                        <Th className="hidden md:table-cell">Chi phí</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {pageTickets.map((t) => {
                        const devTop = t.device_code || "—";
                        const devSub = t.device_name || "—";
                        const title = t.title || "—";
                        const titleSub = (t.issue_description || "").trim() || null;

                        const sev = VI_SEVERITY[String(t.severity || "").toLowerCase()] || t.severity || "—";
                        const pri = VI_PRIORITY[String(t.priority || "").toLowerCase()] || t.priority || "—";
                        const reporter = t.reporter_name || user?.username || "—";
                        const handler = t.assignee_name || (t.vendor_name ? t.vendor_name : "-");
                        const handlerSub = t.vendor_name ? "NCC" : t.assignee_name ? "Nội bộ" : "";

                        return (
                          <tr key={t.id_repair} className="hover:bg-neutral-50">
                            <Td className="font-semibold">#{t.id_repair}</Td>

                            <Td className="whitespace-nowrap">
                              <div className="font-medium text-neutral-800">{devTop}</div>
                              <div className="text-[11px] text-neutral-500">{devSub}</div>
                            </Td>

                            <Td className="max-w-[720px]">
                              <div className="flex items-center gap-1">
                                <a
                                  href={`/repairs/${t.id_repair}`}
                                  className="text-neutral-900 hover:underline font-medium truncate"
                                  title={title}
                                >
                                  {title}
                                </a>
                              </div>
                              {titleSub ? (
                                <div className="text-[11px] text-neutral-500 truncate">{titleSub}</div>
                              ) : null}
                            </Td>

                            <Td className="hidden md:table-cell">{t.result || "-"}</Td>
                            <Td className="hidden md:table-cell">{sev}</Td>
                            <Td className="hidden md:table-cell">{pri}</Td>
                            <Td>{statusPill(t.status)}</Td>
                            <Td className="hidden lg:table-cell">{reporter}</Td>
                            <Td className="whitespace-nowrap">{formatTimeShort(t.created_at)}</Td>
                            <Td className="hidden md:table-cell">{t.sla_hours ?? "-"}</Td>
                            <Td className="hidden lg:table-cell">
                              <div className="font-medium text-neutral-800">{handler}</div>
                              <div className="text-[11px] text-neutral-500">{handlerSub}</div>
                            </Td>
                            <Td className="hidden md:table-cell">{formatVND(t.total_cost)}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 flex items-center justify-between text-sm">
                  <div className="text-neutral-600">Tổng: {filteredTickets.length} ticket</div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={ticketPage <= 1}
                      onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                      className={`px-3 py-1.5 rounded-lg border ${
                        ticketPage <= 1
                          ? "text-neutral-400 border-neutral-200"
                          : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      Trước
                    </button>
                    <div>
                      Trang <span className="font-medium">{ticketPage}</span> / <span>{totalTicketPages}</span>
                    </div>
                    <button
                      disabled={ticketPage >= totalTicketPages}
                      onClick={() => setTicketPage((p) => Math.min(totalTicketPages, p + 1))}
                      className={`px-3 py-1.5 rounded-lg border ${
                        ticketPage >= totalTicketPages
                          ? "text-neutral-400 border-neutral-200"
                          : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Modal đổi mật khẩu */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => !cpLoading && setShowPwdModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-900">Đổi mật khẩu</h4>
                <button type="button" className="text-neutral-500 hover:text-neutral-800" onClick={() => !cpLoading && setShowPwdModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitChangePassword} className="p-4 space-y-3">
                <div className="text-xs text-neutral-600">
                  ID người dùng: <span className="font-medium text-neutral-900">{userId}</span>
                </div>

                <div className="flex items-center border-2 py-2 px-3 rounded-xl">
                  <input
                    className="pl-2 w-full outline-none border-none"
                    type={cpShow.nw ? "text" : "password"}
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    placeholder="Mật khẩu mới (≥ 6 ký tự)"
                    disabled={cpLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="text-xs text-indigo-600 ml-2" onClick={() => setCpShow((s) => ({ ...s, nw: !s.nw }))}>
                    {cpShow.nw ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                <PasswordStrength value={cpNew} />

                <div className="flex items-center border-2 py-2 px-3 rounded-xl">
                  <input
                    className="pl-2 w-full outline-none border-none"
                    type={cpShow.cf ? "text" : "password"}
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    disabled={cpLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="text-xs text-indigo-600 ml-2" onClick={() => setCpShow((s) => ({ ...s, cf: !s.cf }))}>
                    {cpShow.cf ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                {cpMsg.text && (
                  <div className={`text-sm rounded px-3 py-2 border ${cpMsg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {cpMsg.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" disabled={cpLoading} onClick={() => setShowPwdModal(false)} className="px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={cpLoading} className={`px-4 py-2 rounded-lg text-white font-semibold ${cpLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                    {cpLoading ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo ticket */}
      {showCreateTicket && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => !ntLoading && setShowCreateTicket(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <form onSubmit={submitCreateTicket} className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-900">Tạo yêu cầu sửa chữa</h4>
                <button type="button" className="text-neutral-500 hover:text-neutral-800" onClick={() => !ntLoading && setShowCreateTicket(false)}>
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-neutral-600 mb-1">Thiết bị</div>
                  <select
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={ntForm.id_devices}
                    onChange={(e) => setNtForm({ ...ntForm, id_devices: e.target.value })}
                    disabled={ntLoading}
                    required
                  >
                    <option value="">-- Chọn thiết bị --</option>
                    {devices.map((d) => (
                      <option key={d.id_devices} value={d.id_devices}>
                        {d.id_devices} — {d.name_devices || "Thiết bị"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 mb-1">Tiêu đề</div>
                  <input
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="VD: Laptop không khởi động"
                    value={ntForm.title}
                    onChange={(e) => setNtForm({ ...ntForm, title: e.target.value })}
                    disabled={ntLoading}
                    required
                  />
                </div>

                <div>
                  <div className="text-xs text-neutral-600 mb-1">Mô tả</div>
                  <textarea
                    rows={4}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Triệu chứng, khi nào xảy ra, đã thử gì…"
                    value={ntForm.issue_description}
                    onChange={(e) => setNtForm({ ...ntForm, issue_description: e.target.value })}
                    disabled={ntLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-neutral-600 mb-1">Mức độ</div>
                    <select
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                      value={ntForm.severity}
                      onChange={(e) => setNtForm({ ...ntForm, severity: e.target.value })}
                      disabled={ntLoading}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600 mb-1">Priority</div>
                    <select
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                      value={ntForm.priority}
                      onChange={(e) => setNtForm({ ...ntForm, priority: e.target.value })}
                      disabled={ntLoading}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 mb-1">SLA (giờ)</div>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={ntForm.sla_hours}
                    onChange={(e) => setNtForm({ ...ntForm, sla_hours: Number(e.target.value) })}
                    disabled={ntLoading}
                  />
                </div>

                {ntMsg.text && (
                  <div className={`text-sm rounded px-3 py-2 border ${ntMsg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {ntMsg.text}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button type="button" disabled={ntLoading} onClick={() => setShowCreateTicket(false)} className="px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
                  Hủy
                </button>
                <button type="submit" disabled={ntLoading} className={`px-4 py-2 rounded-lg text-white font-semibold ${ntLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {ntLoading ? "Đang tạo..." : "Tạo ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Sub components ----------
const Row = ({ label, value }) => (
  <div className="grid grid-cols-12 gap-3 p-3">
    <div className="col-span-4 text-xs uppercase tracking-wide text-neutral-500">
      {label}
    </div>
    <div className="col-span-8 text-sm text-neutral-900">{value}</div>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th className={`text-left text-xs font-medium uppercase tracking-wide px-3 py-2 ${className}`}>{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-2 text-sm text-neutral-800 ${className}`}>{children}</td>
);

function PasswordStrength({ value }) {
  const score = [
    value.length >= 6,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  const label = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh", "Rất mạnh"][score] || "";
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a", "#15803d"];

  return (
    <div className="mb-1">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: colors[score] || "#e5e7eb" }}
        />
      </div>
      <div className="text-[11px] text-gray-500 mt-1">Độ mạnh: {label}</div>
    </div>
  );
}

export default ProfileUsers;
