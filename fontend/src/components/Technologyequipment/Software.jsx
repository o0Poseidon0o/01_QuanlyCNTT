// src/components/Technologyequipment/Software.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  
  TrashIcon,
  PencilSquareIcon,
  CloudArrowDownIcon,
  Squares2X2Icon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import axios from "../../lib/httpClient";

/**
 * Software Manager — hiện đại, có typeahead chọn thiết bị
 * Phụ thuộc API backend:
 *  - GET    /api/software?q=&active=true|false
 *  - POST   /api/software
 *  - PUT    /api/software/:id
 *  - DELETE /api/software/:id
 *  - GET    /api/device-software/by-device/:id?onlyActive=true
 *  - POST   /api/device-software/install
 *  - POST   /api/device-software/uninstall
 *  - GET    /api/devices/all
 */

const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

// ======= UI cơ bản =======
const Button = ({ as: As = "button", className = "", children, ...props }) => (
  <As
    className={
      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm " +
      "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition " +
      className
    }
    {...props}
  >
    {children}
  </As>
);

const GhostButton = ({ className = "", children, ...props }) => (
  <button
    className={
      "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium " +
      "bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 " +
      "hover:bg-white dark:hover:bg-white/10 transition disabled:opacity-50 " +
      className
    }
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ color = "gray", children }) => {
  const map = {
    gray: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    green:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    yellow:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[color] || map.gray
      }`}
    >
      {children}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, maxW = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxW} mx-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-2xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Input = (props) => (
  <input
    {...props}
    className={
      "w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 " +
      "px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
    }
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className={
      "w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/40"
    }
  >
    {children}
  </select>
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={
      "w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/40"
    }
  />
);

// ======= Confirm Modal (Cách 2) =======
const ConfirmModal = ({ open, title, message, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title={title || "Xác nhận"}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <GhostButton onClick={onCancel}>Hủy</GhostButton>
        <Button onClick={onConfirm}>
          <CheckCircleIcon className="h-5 w-5" />
          Đồng ý
        </Button>
      </div>
    </Modal>
  );
};

const useConfirm = () => {
  const [state, setState] = useState({
    open: false,
    message: "",
    title: "",
    onConfirm: null,
  });

  // ✅ Sửa cú pháp useCallback (đặt => ngay sau danh sách tham số)
  const askConfirm = useCallback((msg, onOk, ttl = "Xác nhận") => {
    setState({ open: true, message: msg, title: ttl, onConfirm: onOk });
  }, []);

  const onCancel = useCallback(() => {
    setState((s) => ({ ...s, open: false, onConfirm: null }));
  }, []);

  const onOk = useCallback(() => {
    const fn = state.onConfirm;
    setState((s) => ({ ...s, open: false, onConfirm: null }));
    if (typeof fn === "function") fn();
  }, [state.onConfirm]);

  const ConfirmUI = (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      onCancel={onCancel}
      onConfirm={onOk}
    />
  );

  return { askConfirm, ConfirmUI };
};


// ======= Tiện ích =======
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};
// bỏ dấu để tìm tiếng Việt
const stripAccents = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ======= Typeahead chọn thiết bị =======
const DeviceTypeahead = ({
  open,
  value,
  onChange,
  fetchUrl = `${API_BASE}/devices/all`,
  placeholder = "Nhập tên/ID thiết bị để tìm...",
}) => {
  const [q, setQ] = useState("");
  const [allDevices, setAllDevices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(fetchUrl);
        const arr = Array.isArray(data) ? data : [];
        setAllDevices(arr);
        setFiltered(arr.slice(0, 8));
      } catch (e) {
        console.error("load devices", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, fetchUrl]);

  useEffect(() => {
    if (!q) {
      setFiltered(allDevices.slice(0, 8));
      return;
    }
    const k = stripAccents(q.toLowerCase());
    const next = allDevices.filter((d) => {
      const idMatch = String(d.id_devices).includes(k);
      const nameMatch = stripAccents(
        (d.name_devices || "").toLowerCase()
      ).includes(k);
      return idMatch || nameMatch;
    });
    setFiltered(next.slice(0, 12));
    setHighlight(0);
  }, [q, allDevices]);

  const pick = (dev) => {
    onChange(dev?.id_devices);
    setQ(`${dev?.name_devices} (#${dev?.id_devices})`);
    setShow(false);
  };

  const onKeyDown = (e) => {
    if (!show || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(filtered[highlight]);
    } else if (e.key === "Escape") {
      setShow(false);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onKeyDown={onKeyDown}
      />
      {loading && (
        <div className="absolute right-2 top-2.5 text-xs text-slate-400">
          Đang tải...
        </div>
      )}
      {show && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950 shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Không tìm thấy thiết bị
            </div>
          ) : (
            filtered.map((d, idx) => (
              <button
                key={d.id_devices}
                type="button"
                onClick={() => pick(d)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 ${
                  idx === highlight ? "bg-slate-50 dark:bg-white/10" : ""
                }`}
              >
                <div className="font-medium">{d.name_devices}</div>
                <div className="text-xs text-slate-500">
                  ID: {d.id_devices} • OS:{" "}
                  {d.Operationsystem?.name_operationsystem || "N/A"} • CPU:{" "}
                  {d.Cpu?.name_cpu || "N/A"} • RAM: {d.Ram?.name_ram || "N/A"}
                </div>
              </button>
            ))
          )}
        </div>
      )}
      {value && (
        <p className="mt-1 text-xs text-slate-500">Đang chọn: #{value}</p>
      )}
    </div>
  );
};

// ======= Trang chính =======
const SoftwareManager = () => {
  const [tab, setTab] = useState("catalog"); // catalog | installs

  // Catalog state
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all"); // all|true|false
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paged = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page]
  );

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openInstall, setOpenInstall] = useState(false);

  // Confirm (Cách 2)
  const { askConfirm, ConfirmUI } = useConfirm();

  // Forms
  const [form, setForm] = useState({
    name_software: "",
    version: "",
    vendor: "",
    category: "",
    license_type: "per-device",
    license_key_mask: "",
    license_notes: "",
    is_active: true,
  });
  const blank = { ...form };

  const [editing, setEditing] = useState(null); // software row

  // Installations tab state
  const [deviceId, setDeviceId] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [installs, setInstalls] = useState([]);

  const [softwareOptions, setSoftwareOptions] = useState([]); // for install select
  const [installForm, setInstallForm] = useState({
    id_devices: "",
    id_software: "",
    installed_by: "",
    note: "",
    license_key_plain: "",
  });

  // Load catalog
  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (query) params.q = query;
      if (active !== "all") params.active = active;
      const { data } = await axios.get(`${API_BASE}/software`, { params });
      setRows(data || []);
    } catch (e) {
      console.error("loadCatalog", e);
    } finally {
      setLoading(false);
    }
  }, [query, active]);

  // Load software options for install form
  const loadSoftwareOptions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/software`, {
        params: { active: true },
      });
      setSoftwareOptions(data || []);
    } catch (e) {
      console.error("loadSoftwareOptions", e);
    }
  }, []);

  const loadInstalls = useCallback(async () => {
    if (!deviceId) {
      setInstalls([]);
      return;
    }
    try {
      const { data } = await axios.get(
        `${API_BASE}/device-software/by-device/${deviceId}`,
        { params: { onlyActive } }
      );
      setInstalls(data || []);
    } catch (e) {
      console.error("loadInstalls", e);
    }
  }, [deviceId, onlyActive]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadSoftwareOptions();
  }, [loadSoftwareOptions]);

  // Actions – create, update, delete
  const handleCreate = async () => {
    try {
      const payload = { ...form };
      if (!payload.name_software || !payload.version)
        return alert("Vui lòng nhập tên & version");
      await axios.post(`${API_BASE}/software`, payload);
      setOpenCreate(false);
      setForm(blank);
      await loadCatalog();
    } catch (e) {
      console.error("handleCreate", e);
      alert(e?.response?.data?.message || "Lỗi tạo phần mềm");
    }
  };

  const openEditRow = (row) => {
    setEditing(row);
    setForm({
      name_software: row.name_software,
      version: row.version,
      vendor: row.vendor || "",
      category: row.category || "",
      license_type: row.license_type || "per-device",
      license_key_mask: row.license_key_mask || "",
      license_notes: row.license_notes || "",
      is_active: !!row.is_active,
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE}/software/${editing.id_software}`, form);
      setOpenEdit(false);
      setEditing(null);
      await loadCatalog();
    } catch (e) {
      console.error("handleUpdate", e);
      alert(e?.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const handleDelete = (row) => {
    askConfirm(
      `Xóa phần mềm "${row.name_software} ${row.version}"?`,
      async () => {
        try {
          await axios.delete(`${API_BASE}/software/${row.id_software}`);
          await loadCatalog();
        } catch (e) {
          console.error("handleDelete", e);
          alert(e?.response?.data?.message || "Không thể xóa");
        }
      }
    );
  };

  // Search
  const doSearch = async () => {
    setPage(1);
    await loadCatalog();
  };

  // Install actions
  const openInstallModal = () => {
    setInstallForm({
      id_devices: deviceId || "",
      id_software: "",
      installed_by: "",
      note: "",
      license_key_plain: "",
    });
    setOpenInstall(true);
  };

  const handleInstall = async () => {
    try {
      const { id_devices, id_software } = installForm;
      if (!id_devices || !id_software) return alert("Chọn thiết bị & phần mềm");
      await axios.post(`${API_BASE}/device-software/install`, installForm);
      setOpenInstall(false);
      await loadInstalls();
    } catch (e) {
      console.error("handleInstall", e);
      alert(e?.response?.data?.message || "Cài đặt thất bại");
    }
  };

  const handleUninstall = (row) => {
    askConfirm(
      `Gỡ phần mềm ${row.Software?.name_software} ${row.Software?.version} khỏi thiết bị #${row.id_devices}?`,
      async () => {
        try {
          await axios.post(`${API_BASE}/device-software/uninstall`, {
            id_devices: row.id_devices,
            id_software: row.id_software,
          });
          await loadInstalls();
        } catch (e) {
          console.error("handleUninstall", e);
          alert(e?.response?.data?.message || "Gỡ thất bại");
        }
      }
    );
  };

  // ======= UI =======
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
  <CpuChipIcon className="h-8 w-8 text-indigo-600" />
  <Squares2X2Icon className="h-6 w-6 text-indigo-400" />
  <span>Quản lý phần mềm</span>
</div>

            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Theo dõi danh mục phần mềm và cài đặt trên từng thiết bị.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              onClick={() => setTab("catalog")}
              className={tab === "catalog" ? "ring-1 ring-indigo-300" : ""}
            >
              Danh mục
            </GhostButton>
            <GhostButton
              onClick={() => setTab("installs")}
              className={tab === "installs" ? "ring-1 ring-indigo-300" : ""}
            >
              Cài đặt trên thiết bị
            </GhostButton>
          </div>
        </div>

        {/* CARD */}
        <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
          {tab === "catalog" ? (
            <div className="p-5">
              {/* Controls */}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên, vendor, category, version..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <Select
                  value={active}
                  onChange={(e) => setActive(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Ngừng sử dụng</option>
                </Select>
                <GhostButton onClick={doSearch}>
                  <ArrowPathIcon className="h-5 w-5" />
                  Lọc
                </GhostButton>
                <Button
                  onClick={() => {
                    setForm(blank);
                    setOpenCreate(true);
                  }}
                >
                  <PlusCircleIcon className="h-5 w-5" /> Thêm phần mềm
                </Button>
              </div>

              {/* Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 dark:text-slate-300">
                      <th className="px-4 py-2">Tên phần mềm</th>
                      <th className="px-4 py-2">Version</th>
                      <th className="px-4 py-2">Vendor</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">License</th>
                      <th className="px-4 py-2">Trạng thái</th>
                      <th className="px-4 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Đang tải...
                        </td>
                      </tr>
                    ) : paged.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      paged.map((r) => (
                        <tr
                          key={r.id_software}
                          className="hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-2 font-medium">
                            {r.name_software}
                          </td>
                          <td className="px-4 py-2">{r.version}</td>
                          <td className="px-4 py-2">{r.vendor || "—"}</td>
                          <td className="px-4 py-2">{r.category || "—"}</td>
                          <td className="px-4 py-2">{r.license_type}</td>
                          <td className="px-4 py-2">
                            {r.is_active ? (
                              <Badge color="green">Active</Badge>
                            ) : (
                              <Badge color="red">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2 justify-end">
                              <GhostButton onClick={() => openEditRow(r)}>
                                <PencilSquareIcon className="h-5 w-5" />
                                Sửa
                              </GhostButton>
                              <GhostButton onClick={() => handleDelete(r)}>
                                <TrashIcon className="h-5 w-5" />
                                Xóa
                              </GhostButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Trang {page} / {totalPages} • Tổng {rows.length}
                </p>
                <div className="flex items-center gap-2">
                  <GhostButton onClick={() => setPage(1)} disabled={page === 1}>
                    Đầu
                  </GhostButton>
                  <GhostButton
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </GhostButton>
                  <GhostButton
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                  >
                    Sau
                  </GhostButton>
                  <GhostButton
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >
                    Cuối
                  </GhostButton>
                </div>
              </div>
            </div>
          ) : (
            // ===== TAB INSTALLS =====
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 flex items-center gap-3">
                  <div className="flex-1 relative">
                    <ComputerDesktopIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Nhập ID thiết bị (id_devices)"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadInstalls()}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                    Chỉ đang cài
                  </label>
                  <GhostButton onClick={loadInstalls}>
                    <ArrowPathIcon className="h-5 w-5" />
                    Tải
                  </GhostButton>
                </div>
                <div className="flex justify-end">
                  <Button onClick={openInstallModal}>
                    <PlusCircleIcon className="h-5 w-5" />
                    Cài phần mềm
                  </Button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 dark:text-slate-300">
                      <th className="px-4 py-2">Phần mềm</th>
                      <th className="px-4 py-2">Version</th>
                      <th className="px-4 py-2">Trạng thái</th>
                      <th className="px-4 py-2">Cài bởi</th>
                      <th className="px-4 py-2">Ngày cài</th>
                      <th className="px-4 py-2">Ghi chú</th>
                      <th className="px-4 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {!deviceId ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Nhập ID thiết bị để xem
                        </td>
                      </tr>
                    ) : installs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      installs.map((r) => (
                        <tr
                          key={r.id_device_software}
                          className="hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-2 font-medium">
                            {r.Software?.name_software}
                          </td>
                          <td className="px-4 py-2">
                            {r.Software?.version}
                          </td>
                          <td className="px-4 py-2">
                            {r.status === "installed" ? (
                              <Badge color="green">Installed</Badge>
                            ) : (
                              <Badge color="red">Uninstalled</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {r.installed_by || "—"}
                          </td>
                          <td className="px-4 py-2">{fmtDate(r.install_date)}</td>
                          <td className="px-4 py-2">{r.note || "—"}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2 justify-end">
                              {r.status === "installed" ? (
                                <GhostButton
                                  onClick={() => handleUninstall(r)}
                                >
                                  <CloudArrowDownIcon className="h-5 w-5" />
                                  Gỡ
                                </GhostButton>
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  Đã gỡ {fmtDate(r.uninstall_date) || ""}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Thêm phần mềm"
      >
        <SoftwareForm form={form} setForm={setForm} />
        <div className="mt-4 flex items-center justify-end gap-2">
          <GhostButton onClick={() => setOpenCreate(false)}>Hủy</GhostButton>
          <Button onClick={handleCreate}>
            <CheckCircleIcon className="h-5 w-5" />
            Lưu
          </Button>
        </div>
      </Modal>

      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Cập nhật phần mềm"
      >
        <SoftwareForm form={form} setForm={setForm} />
        <div className="mt-4 flex items-center justify-end gap-2">
          <GhostButton onClick={() => setOpenEdit(false)}>Hủy</GhostButton>
          <Button onClick={handleUpdate}>
            <CheckCircleIcon className="h-5 w-5" />
            Cập nhật
          </Button>
        </div>
      </Modal>

      <Modal
        open={openInstall}
        onClose={() => setOpenInstall(false)}
        title="Cài phần mềm cho thiết bị"
        maxW="max-w-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Chọn thiết bị</label>
            <DeviceTypeahead
              open={openInstall}
              value={installForm.id_devices}
              onChange={(id) =>
                setInstallForm((s) => ({ ...s, id_devices: id }))
              }
              // fetchUrl mặc định = `${API_BASE}/devices/all`
            />
          </div>

          <div>
            <label className="text-sm font-medium">Chọn phần mềm</label>
            <Select
              value={installForm.id_software}
              onChange={(e) =>
                setInstallForm((s) => ({
                  ...s,
                  id_software: e.target.value,
                }))
              }
            >
              <option value="">— Chọn —</option>
              {softwareOptions.map((s) => (
                <option key={s.id_software} value={s.id_software}>
                  {s.name_software} {s.version}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Cài bởi</label>
            <Input
              value={installForm.installed_by}
              onChange={(e) =>
                setInstallForm((s) => ({
                  ...s,
                  installed_by: e.target.value,
                }))
              }
              placeholder="admin"
            />
          </div>

          <div>
            <label className="text-sm font-medium">License key (tùy chọn)</label>
            <Input
              value={installForm.license_key_plain}
              onChange={(e) =>
                setInstallForm((s) => ({
                  ...s,
                  license_key_plain: e.target.value,
                }))
              }
              placeholder="XXXXX-XXXXX-..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Ghi chú</label>
            <Textarea
              rows={3}
              value={installForm.note}
              onChange={(e) =>
                setInstallForm((s) => ({ ...s, note: e.target.value }))
              }
              placeholder="Mục đích cài đặt, phòng ban, ..."
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <GhostButton onClick={() => setOpenInstall(false)}>Đóng</GhostButton>
          <Button onClick={handleInstall}>
            <CheckCircleIcon className="h-5 w-5" />
            Cài đặt
          </Button>
        </div>
      </Modal>

      {/* Confirm modal (Cách 2) */}
      {ConfirmUI}
    </div>
  );
};

const SoftwareForm = ({ form, setForm }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium">Tên phần mềm *</label>
        <Input
          value={form.name_software}
          onChange={(e) =>
            setForm((s) => ({ ...s, name_software: e.target.value }))
          }
          placeholder="Microsoft Office"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Version *</label>
        <Input
          value={form.version}
          onChange={(e) =>
            setForm((s) => ({ ...s, version: e.target.value }))
          }
          placeholder="2021"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Vendor</label>
        <Input
          value={form.vendor}
          onChange={(e) => setForm((s) => ({ ...s, vendor: e.target.value }))}
          placeholder="Microsoft"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <Input
          value={form.category}
          onChange={(e) =>
            setForm((s) => ({ ...s, category: e.target.value }))
          }
          placeholder="Office, Dev, Design..."
        />
      </div>
      <div>
        <label className="text-sm font-medium">License type</label>
        <Select
          value={form.license_type}
          onChange={(e) =>
            setForm((s) => ({ ...s, license_type: e.target.value }))
          }
        >
          <option value="per-device">per-device</option>
          <option value="per-user">per-user</option>
          <option value="subscription">subscription</option>
          <option value="trial">trial</option>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">License key (mask)</label>
        <Input
          value={form.license_key_mask}
          onChange={(e) =>
            setForm((s) => ({ ...s, license_key_mask: e.target.value }))
          }
          placeholder="XXXXX-XXXXX-XXXXX"
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Ghi chú license</label>
        <Textarea
          rows={3}
          value={form.license_notes}
          onChange={(e) =>
            setForm((s) => ({ ...s, license_notes: e.target.value }))
          }
          placeholder="URL portal quản trị, số hợp đồng, ..."
        />
      </div>
      <div className="md:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((s) => ({ ...s, is_active: e.target.checked }))
            }
          />
          Đang hoạt động
        </label>
      </div>
    </div>
  );
};

export default SoftwareManager;
