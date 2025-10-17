// src/components/Techequipment/TechEquipment.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../../lib/httpClient";
import CategoryModal from "./catagoryType";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://localhost:5000/api";

/** ================= Helpers chung ================= */
const formatDateDisplay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const parts = String(iso).split("T")[0].split("-");
    if (parts.length === 3) {
      const [y, m, dd] = parts;
      return `${dd.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    return iso;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
const isAfter = (a, b) => (a && b ? a > b : false);
const toNullIfEmpty = (v) => (v === "" ? null : v);

/** ================= SearchableSelect ================= */
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  displayKey = "label",
  valueKey = "value",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selectedLabel = useMemo(() => {
    const found = (options || []).find(
      (o) => String(o[valueKey]) === String(value)
    );
    return found ? found[displayKey] : "";
  }, [options, value, displayKey, valueKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options || [];
    return (options || []).filter((o) =>
      String(o[displayKey]).toLowerCase().includes(q)
    );
  }, [options, query, displayKey]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const baseBorder =
    "border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 transition";
  const baseBg = "bg-white dark:bg-slate-900";
  const baseText = "text-slate-800 dark:text-slate-100";

  return (
    <div
      className={`relative ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      ref={wrapperRef}
    >
      <div
        className={`${baseBorder} ${baseBg} ${baseText} rounded-lg px-3 py-2 min-h-10 flex items-center ${
          disabled ? "" : "cursor-text"
        }`}
        onClick={() => !disabled && setOpen((s) => !s)}
        title={selectedLabel || placeholder}
      >
        {selectedLabel || (
          <span className="text-slate-400 dark:text-slate-400">
            {placeholder}
          </span>
        )}
      </div>
      {open && !disabled && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-lg shadow-lg ${baseBorder} ${baseBg}`}
        >
          <input
            autoFocus
            className={`w-full px-3 py-2 outline-none border-b rounded-t-lg ${baseBg} ${baseText} border-slate-200 dark:border-slate-700 placeholder-slate-400`}
            placeholder="Gõ để tìm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-56 overflow-auto">
            {(filtered || []).length === 0 && (
              <div className="p-2 text-sm text-slate-500">Không có kết quả</div>
            )}
            {(filtered || []).map((opt) => (
              <div
                key={opt[valueKey]}
                className="px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-100"
                onClick={() => {
                  onChange(opt[valueKey]);
                  setOpen(false);
                  setQuery("");
                }}
                title={opt[displayKey]}
              >
                {opt[displayKey]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** ================== Tải font & logo cho PDF (Roboto-only) ================== */
const _assetCache = { family: null, regularB64: null, boldB64: null, logo: null };

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function registerCachedFont(doc) {
  if (!_assetCache.family || !_assetCache.regularB64) return false;
  const fam = _assetCache.family;
  doc.addFileToVFS(`${fam}-Regular.ttf`, _assetCache.regularB64);
  doc.addFont(`${fam}-Regular.ttf`, fam, "normal");
  if (_assetCache.boldB64) {
    doc.addFileToVFS(`${fam}-Bold.ttf`, _assetCache.boldB64);
    doc.addFont(`${fam}-Bold.ttf`, fam, "bold");
  } else {
    doc.addFont(`${fam}-Regular.ttf`, fam, "bold");
  }
  return true;
}
async function loadVietnameseFontToDoc(doc) {
  if (registerCachedFont(doc)) {
    return { ok: _assetCache.family !== "helvetica", family: _assetCache.family };
  }
  try {
    const regRes = await fetch("/fonts/Roboto-Regular.ttf");
    if (!regRes.ok) throw new Error("Roboto-Regular.ttf not found");
    const regularB64 = arrayBufferToBase64(await regRes.arrayBuffer());
    let boldB64 = null;
    try {
      const boldRes = await fetch("/fonts/Roboto-Bold.ttf");
      if (boldRes.ok) boldB64 = arrayBufferToBase64(await boldRes.arrayBuffer());
    } catch {}
    _assetCache.family = "Roboto";
    _assetCache.regularB64 = regularB64;
    _assetCache.boldB64 = boldB64;
    registerCachedFont(doc);
    return { ok: true, family: "Roboto" };
  } catch (e) {
    console.warn("Không nạp được Roboto, fallback helvetica:", e?.message || e);
    _assetCache.family = "helvetica";
    _assetCache.regularB64 = null;
    _assetCache.boldB64 = null;
    return { ok: false, family: "helvetica" };
  }
}
async function loadLogoDataURL(url = "/images/logo/logo_towa.png") {
  if (_assetCache.logo) return _assetCache.logo;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Logo HTTP ${res.status}`);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
    _assetCache.logo = dataUrl;
    return dataUrl;
  } catch (e) {
    console.warn("Không tải được logo:", e);
    return null;
  }
}

/** ================== Component chính ================== */
const TechEquipment = () => {
  const [devices, setDevices] = useState([]);
  const [activeCountMap, setActiveCountMap] = useState({});
  const [activeUsersMap, setActiveUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState({ open: false, type: null });

  const [assignModal, setAssignModal] = useState({ open: false, device: null });
  const [activeUsersModal, setActiveUsersModal] = useState({
    open: false, device: null, users: [], loading: false,
  });

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role === "admin";

  const [dropdownData, setDropdownData] = useState({
    devicetypes: [], cpus: [], rams: [], memories: [], screens: [], operationsystems: [], users: [],
  });

  const [formData, setFormData] = useState({
    id_devices: "", id_devicetype: "", id_cpu: "", id_ram: "", id_memory: "",
    id_screen: "", id_operationsystem: "", name_devices: "", date_buydevices: "", date_warranty: "",
  });

  const [idSortDir, setIdSortDir] = useState("desc");

  /** === Kéo ngang bằng chuột (grab-to-scroll) cho khung bảng === */
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startRef = useRef({ x: 0, scrollLeft: 0 });

  const onGrabMouseDown = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startRef.current = {
      x: e.pageX - el.getBoundingClientRect().left,
      scrollLeft: el.scrollLeft,
    };
    document.body.style.userSelect = "none";
    el.style.cursor = "grabbing";
  }, []);
  const endGrab = useCallback(() => {
    const el = scrollRef.current;
    isDraggingRef.current = false;
    document.body.style.userSelect = "";
    if (el) el.style.cursor = "grab";
  }, []);
  const onGrabMouseMove = useCallback((e) => {
    const el = scrollRef.current;
    if (!el || !isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - el.getBoundingClientRect().left;
    const walk = x - startRef.current.x;
    el.scrollLeft = startRef.current.scrollLeft - walk;
  }, []);
  const onWheelToHorizontal = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    if (e.shiftKey) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, []);

  /** ================== API fetchers (ổn định deps) ================== */
  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/devices/all`, {
        headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setDevices(list);
      return list;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thiết bị:", error);
      setDevices([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveCountMap = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignments/active-count`, {
        headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() },
      });
      setActiveCountMap(res.data || {});
    } catch (e) {
      console.warn("Không lấy được active-count:", e?.message || e);
      setActiveCountMap({});
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    const common = { headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() } };
    const endpoints = [
      { key: "devicetypes", url: `${API_BASE}/devicestype/all`, pick: (r) => r.data?.devicetypes ?? r.data ?? [] },
      { key: "cpus", url: `${API_BASE}/cpu/all`, pick: (r) => r.data?.cpus ?? r.data ?? [] },
      { key: "rams", url: `${API_BASE}/ram/all`, pick: (r) => r.data?.rams ?? r.data ?? [] },
      { key: "memories", url: `${API_BASE}/memory/all`, pick: (r) => r.data?.memories ?? r.data ?? [] },
      { key: "screens", url: `${API_BASE}/screen/all`, pick: (r) => r.data?.screens ?? r.data ?? [] },
      { key: "operationsystems", url: `${API_BASE}/operations/all`, pick: (r) => r.data?.operationsystems ?? r.data ?? [] },
      { key: "users", url: `${API_BASE}/users/all`, pick: (r) => Array.isArray(r.data?.users) ? r.data.users : r.data ?? [] },
    ];
    try {
      const settled = await Promise.allSettled(endpoints.map((e) => axios.get(e.url, common)));
      const next = { devicetypes: [], cpus: [], rams: [], memories: [], screens: [], operationsystems: [], users: [] };
      settled.forEach((res, idx) => {
        const { key, pick } = endpoints[idx];
        if (res.status === "fulfilled") {
          try { const val = pick(res.value); next[key] = Array.isArray(val) ? val : []; } catch { next[key] = []; }
        } else {
          next[key] = [];
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[Dropdown] ${key} failed:`, res.reason?.message || res.reason);
          }
        }
      });
      setDropdownData(next);
    } catch (e) {
      console.error("Lỗi khi tải dropdown:", e);
      setDropdownData({ devicetypes: [], cpus: [], rams: [], memories: [], screens: [], operationsystems: [], users: [] });
    }
  }, []);

  /** Quan trọng: KHÔNG phụ thuộc state ở trong callback này.
   * Luôn nhận 'list' từ nơi gọi để tránh thêm 'devices' vào deps. */
  const fetchActiveUsersMap = useCallback(async (list) => {
    try {
      const res = await axios.get(`${API_BASE}/assignments/active-map`, {
        headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() },
      });
      if (res?.data && typeof res.data === "object") {
        setActiveUsersMap(res.data);
        return;
      }
      throw new Error("No active-map data");
    } catch (_) {
      try {
        const pairs = await Promise.allSettled(
          (list || []).map((d) =>
            axios
              .get(`${API_BASE}/assignments/active/${d.id_devices}`, {
                headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() },
              })
              .then((r) => ({ id: d.id_devices, rows: Array.isArray(r.data) ? r.data : [] }))
          )
        );
        const map = {};
        for (const item of pairs) {
          if (item.status === "fulfilled") {
            map[String(item.value.id)] = (item.value.rows || []).map((row) => ({
              id_users: row.id_users ?? row.User?.id_users,
              username: row.User?.username ?? row.username ?? "",
              email_user: row.User?.email_user ?? row.email_user ?? "",
            }));
          }
        }
        setActiveUsersMap(map);
      } catch (e) {
        console.warn("Không thể build activeUsersMap:", e?.message || e);
        setActiveUsersMap({});
      }
    }
  }, []);

  /** Tải dữ liệu ban đầu — đủ deps để không cảnh báo */
  useEffect(() => {
    (async () => {
      const list = await fetchDevices();
      await Promise.all([fetchDropdownData(), fetchActiveCountMap()]);
      await fetchActiveUsersMap(list);
    })();
  }, [fetchDevices, fetchDropdownData, fetchActiveCountMap, fetchActiveUsersMap]);

  /** ================== Export ================== */
  const filteredDevices = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const nameOk = (d.name_devices || "").toLowerCase().includes(q);
      const users = activeUsersMap[String(d.id_devices)] || [];
      const userOk = users.some((u) => (u?.username || "").toLowerCase().includes(q));
      return nameOk || userOk;
    });
  }, [devices, searchTerm, activeUsersMap]);

  const sortedFilteredDevices = useMemo(() => {
    const parseMaybeNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : v ?? ""; };
    const dir = idSortDir === "asc" ? 1 : -1;
    return [...filteredDevices].sort((a, b) => {
      const A = parseMaybeNumber(a.id_devices);
      const B = parseMaybeNumber(b.id_devices);
      if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
      return String(A).localeCompare(String(B), "vi") * dir;
    });
  }, [filteredDevices, idSortDir]);

  const exportToExcel = useCallback(() => {
    const rows = sortedFilteredDevices.length ? sortedFilteredDevices : devices;
    if (!rows.length) return alert("Không có dữ liệu để xuất Excel.");
    const data = rows.map((d) => {
      const users = activeUsersMap[String(d.id_devices)] || [];
      const names = users.map((u) => u?.username).filter(Boolean);
      return {
        "ID Thiết bị": d.id_devices,
        "Loại thiết bị": d?.Devicetype?.device_type || "",
        "Tên thiết bị": d.name_devices,
        "Người dùng (đang dùng)": names.join(", "),
        "Số người dùng": names.length,
        CPU: d?.Cpu?.name_cpu || "",
        RAM: d?.Ram?.name_ram || "",
        "Ổ cứng": d?.Memory ? `${d.Memory.memory_type} ${d.Memory.size_memory}` : "",
        "Màn hình": d?.Screen ? `${d.Screen.name_screen} ${d.Screen.size_screen}` : "",
        "Hệ điều hành": d?.Operationsystem?.name_operationsystem || "",
        "Ngày mua": formatDateDisplay(d.date_buydevices),
        "Ngày bảo hành": formatDateDisplay(d.date_warranty),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thông tin thiết bị");
    const now = new Date();
    XLSX.writeFile(
      wb,
      `ThongTinThietBi_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}.xlsx`
    );
  }, [sortedFilteredDevices, devices, activeUsersMap]);

  const exportToPDF = useCallback(async () => {
    const rows = sortedFilteredDevices.length ? sortedFilteredDevices : devices;
    if (!rows.length) return alert("Không có dữ liệu để xuất PDF.");

    const doc = new jsPDF("l", "mm", "a3");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 14, marginY = 12;

    const { family } = await loadVietnameseFontToDoc(doc);
    doc.setFont(family, "bold");

    const logo = await loadLogoDataURL("/images/logo/logo_towa.png");
    const LOGO_W = 70, LOGO_H = 22, topY = marginY;

    if (logo) {
      try { doc.addImage(logo, "PNG", marginX, topY, LOGO_W, LOGO_H); }
      catch (e) { console.warn("Không chèn được logo:", e); }
    }

    const title = "THÔNG TIN THIẾT BỊ";
    doc.setFontSize(26);
    const titleW = doc.getTextWidth(title);
    doc.text(title, (pageW - titleW) / 2, topY + 14);

    doc.setFont(family, "normal");
    doc.setFontSize(11);
    const now = new Date();
    const dateStr = `Ngày xuất: ${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
    const dateW = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageW - marginX - dateW, topY + 18);

    const columns = [
      { header: "ID", dataKey: "id" },
      { header: "Loại thiết bị", dataKey: "devicetype" },
      { header: "Tên thiết bị", dataKey: "name" },
      { header: "Người dùng (đang dùng)", dataKey: "users" },
      { header: "SL", dataKey: "userCount" },
      { header: "CPU", dataKey: "cpu" },
      { header: "RAM", dataKey: "ram" },
      { header: "Ổ cứng", dataKey: "memory" },
      { header: "Màn hình", dataKey: "screen" },
      { header: "Hệ điều hành", dataKey: "os" },
      { header: "Ngày mua", dataKey: "buy" },
      { header: "Ngày bảo hành", dataKey: "warranty" },
    ];

    const data = rows.map((d) => {
      const users = activeUsersMap[String(d.id_devices)] || [];
      const names = users.map((u) => u?.username).filter(Boolean);
      return {
        id: d.id_devices ?? "",
        devicetype: d?.Devicetype?.device_type ?? "",
        name: d?.name_devices ?? "",
        users: names.join(", "),
        userCount: names.length,
        cpu: d?.Cpu?.name_cpu ?? "",
        ram: d?.Ram?.name_ram ?? "",
        memory: d?.Memory ? `${d.Memory.memory_type} ${d.Memory.size_memory}` : "",
        screen: d?.Screen ? `${d.Screen.name_screen} ${d.Screen.size_screen}` : "",
        os: d?.Operationsystem?.name_operationsystem ?? "",
        buy: formatDateDisplay(d.date_buydevices),
        warranty: formatDateDisplay(d.date_warranty),
      };
    });

    autoTable(doc, {
      startY: topY + LOGO_H + 6,
      margin: { left: marginX, right: marginX },
      columns, body: data,
      styles: { font: family, fontSize: 9, cellPadding: 2, overflow: "linebreak", valign: "middle" },
      headStyles: { font: family, fontStyle: "bold", fillColor: [30, 41, 59], textColor: 255 },
      columnStyles: {
        id: { cellWidth: 18 }, devicetype: { cellWidth: 38 }, name: { cellWidth: 40 },
        users: { cellWidth: 60 }, userCount: { cellWidth: 12, halign: "center" },
        cpu: { cellWidth: 32 }, ram: { cellWidth: 26 }, memory: { cellWidth: 40 },
        screen: { cellWidth: 38 }, os: { cellWidth: 40 }, buy: { cellWidth: 28 }, warranty: { cellWidth: 30 },
      },
      didDrawPage: () => {
        doc.setFont(family, "normal");
        doc.setFontSize(10);
        const str = `Trang ${doc.internal.getNumberOfPages()}`;
        const strW = doc.getTextWidth(str);
        doc.text(str, pageH - 6 <= 0 ? marginX : pageW - marginX - strW, pageH - 6);
      },
      pageBreak: "auto", tableWidth: "auto",
    });

    doc.save(`ThongTinThietBi_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}.pdf`);
  }, [sortedFilteredDevices, devices, activeUsersMap]);

  /** ================== CRUD & UI ================== */
  const openAddModal = useCallback(async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData();
    setFormData({
      id_devices: "", id_devicetype: "", id_cpu: "", id_ram: "", id_memory: "",
      id_screen: "", id_operationsystem: "", name_devices: "",
      date_buydevices: "", date_warranty: "",
    });
    setAddModalOpen(true);
  }, [isAdmin, fetchDropdownData]);

  const openEditModal = useCallback(async (device) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData();
    setFormData({
      ...device,
      id_devicetype: device.id_devicetype ?? device.Devicetype?.id_devicetype ?? "",
      id_cpu: device.id_cpu ?? device.Cpu?.id_cpu ?? "",
      id_ram: device.id_ram ?? device.Ram?.id_ram ?? "",
      id_memory: device.id_memory ?? device.Memory?.id_memory ?? "",
      id_screen: device.id_screen ?? device.Screen?.id_screen ?? "",
      id_operationsystem: device.id_operationsystem ?? device.Operationsystem?.id_operationsystem ?? "",
    });
    setEditModalOpen(true);
  }, [isAdmin, fetchDropdownData]);

  const closeAddModal = useCallback(() => setAddModalOpen(false), []);
  const closeEditModal = useCallback(() => setEditModalOpen(false), []);

  const validateDates = useCallback(() => {
    const { date_buydevices, date_warranty } = formData;
    if (!date_buydevices || !date_warranty) return true;
    if (!isAfter(date_warranty, date_buydevices)) {
      alert("Ngày bảo hành phải lớn hơn Ngày mua.");
      return false;
    }
    return true;
  }, [formData]);

  const normalizePayload = useCallback((payload) => ({
    id_devices: payload.id_devices,
    id_devicetype: toNullIfEmpty(payload.id_devicetype),
    id_cpu: toNullIfEmpty(payload.id_cpu),
    id_ram: toNullIfEmpty(payload.id_ram),
    id_memory: toNullIfEmpty(payload.id_memory),
    id_screen: toNullIfEmpty(payload.id_screen),
    id_operationsystem: toNullIfEmpty(payload.id_operationsystem),
    name_devices: payload.name_devices,
    date_buydevices: payload.date_buydevices,
    date_warranty: payload.date_warranty,
  }), []);

  const addDevice = useCallback(async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!validateDates()) return;
    if (!formData.id_devices || !formData.name_devices || !formData.date_buydevices || !formData.date_warranty) {
      return alert("Vui lòng nhập đủ: ID thiết bị, Tên thiết bị, Ngày mua, Ngày bảo hành.");
    }
    try {
      const payload = normalizePayload(formData);
      await axios.post(`${API_BASE}/devices/add`, payload);
      const list = await fetchDevices();
      await Promise.all([fetchActiveCountMap(), fetchDropdownData()]);
      await fetchActiveUsersMap(list);
      closeAddModal();
    } catch (error) {
      console.error("Lỗi khi thêm thiết bị:", error);
      const msg =
        error?.response?.status === 409
          ? "ID thiết bị đã tồn tại. Vui lòng chọn ID khác."
          : error?.response?.data?.message || "Không thêm được thiết bị";
      alert(msg);
    }
  }, [
    isAdmin,
    validateDates,
    formData,
    normalizePayload,
    fetchDevices,
    fetchActiveCountMap,
    fetchDropdownData,
    fetchActiveUsersMap,
    closeAddModal,
  ]);

  const updateDevice = useCallback(async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!validateDates()) return;
    try {
      await axios.put(`${API_BASE}/devices/update/${formData.id_devices}`, normalizePayload(formData));
      const list = await fetchDevices();
      await Promise.all([fetchActiveCountMap(), fetchDropdownData()]);
      await fetchActiveUsersMap(list);
      closeEditModal();
    } catch (error) {
      console.error("Lỗi khi cập nhật thiết bị:", error);
      alert(error.response?.data?.message || "Không cập nhật được thiết bị");
    }
  }, [
    isAdmin,
    validateDates,
    formData,
    normalizePayload,
    fetchDevices,
    fetchActiveCountMap,
    fetchDropdownData,
    fetchActiveUsersMap,
    closeEditModal,
  ]);

  const deleteDevice = useCallback(async (id) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (window.confirm("Bạn có chắc muốn xóa thiết bị này?")) {
      try {
        await axios.delete(`${API_BASE}/devices/delete/${id}`);
        const list = await fetchDevices();
        await fetchActiveCountMap();
        await fetchActiveUsersMap(list);
      } catch (error) {
        console.error("Lỗi khi xóa thiết bị:", error);
        alert(error.response?.data?.message || "Không xóa được thiết bị");
      }
    }
  }, [isAdmin, fetchDevices, fetchActiveCountMap, fetchActiveUsersMap]);

  const openActiveUsersModal = useCallback(async (device) => {
    setActiveUsersModal((prev) => ({ ...prev, open: true, device, loading: true, users: [] }));
    try {
      const res = await axios.get(`${API_BASE}/assignments/active/${device.id_devices}`, {
        headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() },
      });
      setActiveUsersModal({ open: true, device, users: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch (e) {
      console.error("Lỗi lấy active users:", e);
      setActiveUsersModal({ open: true, device, users: [], loading: false });
    }
  }, []);

  const closeActiveUsersModal = useCallback(
    () => setActiveUsersModal({ open: false, device: null, users: [], loading: false }),
    []
  );

  const checkoutUserFromDevice = useCallback(async (id_users, id_devices) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    try {
      await axios.post(`${API_BASE}/assignments/checkout`, { id_users, id_devices });
      await openActiveUsersModal({ id_devices, name_devices: activeUsersModal.device?.name_devices || "" });
      await fetchActiveCountMap();
      await fetchActiveUsersMap(devices);
    } catch (e) {
      alert(e?.response?.data?.message || "Không trả được thiết bị");
    }
  }, [isAdmin, openActiveUsersModal, activeUsersModal.device, fetchActiveCountMap, fetchActiveUsersMap, devices]);

  const openAssignModal = useCallback((device) => setAssignModal({ open: true, device }), []);
  const closeAssignModal = useCallback(() => setAssignModal({ open: false, device: null }), []);

  const doAssignUser = useCallback(async (userId, deviceId) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!userId) return alert("Chọn người dùng trước khi gán.");
    try {
      await axios.post(`${API_BASE}/assignments/checkin`, { id_users: userId, id_devices: deviceId });
      await fetchActiveCountMap();
      await fetchActiveUsersMap(devices);
      if (activeUsersModal.open && activeUsersModal.device?.id_devices === deviceId) {
        await openActiveUsersModal({ id_devices: deviceId, name_devices: activeUsersModal.device?.name_devices || "" });
      }
      closeAssignModal();
    } catch (e) {
      alert(e?.response?.data?.message || "Không thể thêm người dùng vào thiết bị");
    }
  }, [
    isAdmin,
    fetchActiveCountMap,
    fetchActiveUsersMap,
    devices,
    activeUsersModal.open,
    activeUsersModal.device,
    openActiveUsersModal,
    closeAssignModal,
  ]);

  const openCategoryModal = useCallback((type) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    setCategoryModal({ open: true, type });
  }, [isAdmin]);

  const closeCategoryModal = useCallback(async () => {
    setCategoryModal({ open: false, type: null });
    await fetchDropdownData();
  }, [fetchDropdownData]);

  /** ======= ESC để đóng các modal (không còn warning deps) ======= */
  const escHandler = useCallback((e) => {
    if (e.key === "Escape") {
      closeAddModal();
      closeEditModal();
      closeActiveUsersModal();
      closeAssignModal();
      closeCategoryModal();
    }
  }, [closeAddModal, closeEditModal, closeActiveUsersModal, closeAssignModal, closeCategoryModal]);

  useEffect(() => {
    document.addEventListener("keydown", escHandler);
    return () => document.removeEventListener("keydown", escHandler);
  }, [escHandler]);

  if (loading)
    return (
      <p className="text-center py-12 text-slate-600 dark:text-slate-300">
        Đang tải dữ liệu...
      </p>
    );

  const cardBg = "bg-white dark:bg-slate-800";
  const cardBorder = "border border-slate-200 dark:border-slate-700";

  return (
    <div className="w-full mt-6 px-3 md:px-6 text-slate-800 dark:text-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/10 text-slate-700 dark:text-slate-200">
          <i className="fas fa-laptop" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Quản lý thiết bị CNTT</h2>
      </div>

      {/* Thanh tìm kiếm + Export + Thêm */}
      <div className={`${cardBg} ${cardBorder} rounded-xl p-3 md:p-4 mb-4 flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between`}>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full">
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị hoặc người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-96 h-10 rounded-lg px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="h-10 inline-flex items-center gap-2 rounded-lg px-3 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 transition"
              title="Xuất Excel"
            >
              <i className="fas fa-file-excel" />
              <span className="font-medium">Xuất Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="h-10 inline-flex items-center gap-2 rounded-lg px-3 border border-slate-500/40 text-slate-800 dark:text-slate-200 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
              title="Xuất PDF"
            >
              <i className="fas fa-file-pdf" />
              <span className="font-medium">Xuất PDF</span>
            </button>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg px-3 border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
          >
            <i className="fas fa-plus" />
            Thêm thiết bị
          </button>
        )}
      </div>

      {/* BẢNG + CUỘN NGANG (kéo chuột) */}
      <div className={`${cardBg} ${cardBorder} rounded-xl overflow-hidden`}>
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent cursor-grab select-none"
          onMouseDown={onGrabMouseDown}
          onMouseUp={endGrab}
          onMouseLeave={endGrab}
          onMouseMove={onGrabMouseMove}
          onWheel={onWheelToHorizontal}
        >
          <table className="w-full text-left border-collapse min-w-[1220px] table-auto">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-900/70">
                <Th>
                  <button
                    type="button"
                    className="flex items-center gap-1 select-none"
                    onClick={() => setIdSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    title="Sắp xếp theo ID"
                  >
                    ID <span className="text-xs">{idSortDir === "asc" ? "▲" : "▼"}</span>
                  </button>
                </Th>
                <Th>
                  <div className="flex items-center gap-2">
                    <span>Loại thiết bị</span>
                    {isAdmin && (
                      <GhostIconButton
                        icon="plus"
                        label="Quản lý loại thiết bị"
                        onClick={() => openCategoryModal("devicestype")}
                      />
                    )}
                  </div>
                </Th>
                <Th className="min-w-[260px]">Tên thiết bị</Th>
                <Th className="min-w-[260px]">
                  Người dùng <span className="text-xs text-slate-500">(từ assignments)</span>
                </Th>
                <Th className="min-w-[120px]">Đang dùng</Th>
                <Th className="whitespace-nowrap">Ngày mua</Th>
                <Th className="whitespace-nowrap">Ngày bảo hành</Th>
                <Th><HeaderWithAdd label="CPU" onAdd={() => openCategoryModal("cpu")} show={isAdmin} /></Th>
                <Th><HeaderWithAdd label="RAM" onAdd={() => openCategoryModal("ram")} show={isAdmin} /></Th>
                <Th><HeaderWithAdd label="Màn hình" onAdd={() => openCategoryModal("screen")} show={isAdmin} /></Th>
                <Th><HeaderWithAdd label="Ổ cứng" onAdd={() => openCategoryModal("memory")} show={isAdmin} /></Th>
                <Th><HeaderWithAdd label="HĐH" onAdd={() => openCategoryModal("operations")} show={isAdmin} /></Th>
                {isAdmin && <Th className="min-w-[140px]">Hành động</Th>}
              </tr>
            </thead>
            <tbody>
              {sortedFilteredDevices.map((device, i) => {
                const activeCnt = activeCountMap?.[String(device.id_devices)] ?? 0;
                const users = activeUsersMap?.[String(device.id_devices)] || [];
                const names = users.map((u) => u.username).filter(Boolean);
                const preview = names.slice(0, 2);
                const extra = names.length > 2 ? names.length - 2 : 0;
                const zebra = i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/80";
                return (
                  <tr key={device.id_devices} className={`${zebra} border-t border-slate-100 dark:border-slate-700/60`}>
                    <Td className="whitespace-nowrap">{device.id_devices}</Td>
                    <Td className="whitespace-nowrap">{device?.Devicetype?.device_type || "—"}</Td>
                    <Td className="min-w-[260px]">
                      <span className="break-words">{device.name_devices}</span>
                    </Td>
                    <Td className="min-w-[260px]">
                      {names.length ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {preview.map((n, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-xs"
                              title={n}
                            >
                              {n}
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="text-slate-500 dark:text-slate-400 text-sm" title={names.join(", ")}>
                              +{extra}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-500 dark:text-slate-400">Chưa gán</div>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 px-2.5 py-0.5 text-sm min-w-[28px]"
                          title="Số người đang sử dụng"
                        >
                          {activeCnt}
                        </span>
                        <button
                          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                          onClick={() => openActiveUsersModal(device)}
                          title="Xem ai đang dùng"
                          aria-label="Xem ai đang dùng"
                        >
                          <i className="fas fa-users" />
                        </button>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">{formatDateDisplay(device.date_buydevices)}</Td>
                    <Td className="whitespace-nowrap">{formatDateDisplay(device.date_warranty)}</Td>
                    <Td className="whitespace-nowrap">{device?.Cpu?.name_cpu || "—"}</Td>
                    <Td className="whitespace-nowrap">{device?.Ram?.name_ram || "—"}</Td>
                    <Td className="whitespace-nowrap">
                      {device?.Screen ? `${device.Screen.name_screen} (${device.Screen.size_screen})` : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {device?.Memory ? `${device.Memory.memory_type} ${device.Memory.size_memory}` : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {device?.Operationsystem?.name_operationsystem || "—"}
                    </Td>
                    {isAdmin && (
                      <Td className="min-w-[140px]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(device)}
                            className="px-2.5 h-9 rounded-md border border-emerald-700/40 text-emerald-800 dark:text-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 transition"
                            title="Sửa"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteDevice(device.id_devices)}
                            className="px-2.5 h-9 rounded-md border border-rose-700/30 text-rose-800 dark:text-rose-200 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-900/20 dark:hoverbg-rose-900/30 transition"
                            title="Xóa"
                          >
                            Xóa
                          </button>
                        </div>
                      </Td>
                    )}
                  </tr>
                );
              })}
              {sortedFilteredDevices.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-center text-slate-500 dark:text-slate-400" colSpan={isAdmin ? 13 : 12}>
                    Không có thiết bị
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <DeviceModal
          title={isAddModalOpen ? "Thêm thiết bị" : "Sửa thiết bị"}
          formData={formData}
          setFormData={setFormData}
          onSubmit={isAddModalOpen ? addDevice : updateDevice}
          onClose={isAddModalOpen ? closeAddModal : closeEditModal}
          dropdownData={dropdownData}
          isAdmin={isAdmin}
          isEdit={isEditModalOpen}
        />
      )}

      {activeUsersModal.open && (
        <ActiveUsersModal
          device={activeUsersModal.device}
          users={activeUsersModal.users}
          loading={activeUsersModal.loading}
          onClose={closeActiveUsersModal}
          onCheckout={checkoutUserFromDevice}
          onOpenAssign={() => openAssignModal(activeUsersModal.device)}
          isAdmin={isAdmin}
        />
      )}

      {assignModal.open && (
        <AssignUserModal
          device={assignModal.device}
          usersOptions={(dropdownData.users || []).map((x) => ({ value: x.id_users, label: x.username }))}
          onClose={closeAssignModal}
          onAssign={doAssignUser}
          isAdmin={isAdmin}
        />
      )}

      {categoryModal.open && <CategoryModal type={categoryModal.type} onClose={closeCategoryModal} />}
    </div>
  );
};

/** ================== Sub components ================== */
const Th = ({ className = "", children }) => (
  <th className={`py-3.5 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </th>
);
const Td = ({ className = "", children }) => (
  <td className={`py-3 px-3 align-top text-sm ${className}`}>{children}</td>
);

/** Nút dấu cộng dịu mắt */
const GhostIconButton = ({ icon = "plus", label, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-400/60 text-slate-700 dark:text-slate-200 bg-white/40 hover:bg-white/80 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
    aria-label={label}
  >
    <i className={`fas fa-${icon}`} />
  </button>
);

const HeaderWithAdd = ({ label, onAdd, show }) => (
  <div className="flex items-center gap-2">
    <span>{label}</span>
    {show && <GhostIconButton icon="plus" label={`Quản lý ${label}`} onClick={onAdd} />}
  </div>
);

/** ================== Modals ================== */
const DeviceModal = ({
  title, formData, setFormData, onSubmit, onClose, dropdownData, isAdmin, isEdit,
}) => {
  const makeOptions = (arr, mapFn) => (Array.isArray(arr) ? arr.map(mapFn) : []);
  const devicetypeOptions = useMemo(
    () => makeOptions(dropdownData.devicetypes, (x) => ({ value: x.id_devicetype, label: x.device_type })), [dropdownData.devicetypes]
  );
  const cpuOptions = useMemo(
    () => makeOptions(dropdownData.cpus, (x) => ({ value: x.id_cpu, label: x.name_cpu })), [dropdownData.cpus]
  );
  const ramOptions = useMemo(
    () => makeOptions(dropdownData.rams, (x) => ({ value: x.id_ram, label: x.name_ram })), [dropdownData.rams]
  );
  const memoryOptions = useMemo(
    () => makeOptions(dropdownData.memories, (x) => ({ value: x.id_memory, label: `${x.memory_type} - ${x.size_memory}` })), [dropdownData.memories]
  );
  const screenOptions = useMemo(
    () => makeOptions(dropdownData.screens, (x) => ({ value: x.id_screen, label: `${x.name_screen} - ${x.size_screen}` })), [dropdownData.screens]
  );
  const osOptions = useMemo(
    () => makeOptions(dropdownData.operationsystems, (x) => ({ value: x.id_operationsystem, label: x.name_operationsystem })), [dropdownData.operationsystems]
  );

  const inputBase =
    "h-10 rounded-lg px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition";
  const inputCls = `${inputBase} ${!isAdmin ? "bg-slate-100 dark:bg-slate-800/60" : ""}`;

  return (
    <ModalShell onClose={onClose}>
      <div className="rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-[760px] max-w-[95vw]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
          >
            Đóng
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              name="id_devices"
              value={formData.id_devices}
              onChange={(e) => setFormData((prev) => ({ ...prev, id_devices: e.target.value }))}
              placeholder="ID thiết bị"
              className={`${inputBase} ${isEdit ? "bg-slate-100 dark:bg-slate-800/60" : ""}`}
              readOnly={!isAdmin || isEdit}
              title={isEdit ? "ID thiết bị (không thể sửa)" : "Nhập ID thiết bị"}
            />
            <input
              name="name_devices"
              value={formData.name_devices}
              onChange={(e) => setFormData((prev) => ({ ...prev, name_devices: e.target.value }))}
              placeholder="Tên thiết bị"
              className={inputCls}
              readOnly={!isAdmin}
            />
            <SearchableSelect value={formData.id_devicetype} onChange={(val) => setFormData((prev) => ({ ...prev, id_devicetype: val }))} options={devicetypeOptions} placeholder="Chọn loại thiết bị" disabled={!isAdmin} />
            <SearchableSelect value={formData.id_cpu} onChange={(val) => setFormData((prev) => ({ ...prev, id_cpu: val }))} options={cpuOptions} placeholder="Chọn CPU" disabled={!isAdmin} />
            <SearchableSelect value={formData.id_ram} onChange={(val) => setFormData((prev) => ({ ...prev, id_ram: val }))} options={ramOptions} placeholder="Chọn RAM" disabled={!isAdmin} />
            <SearchableSelect value={formData.id_memory} onChange={(val) => setFormData((prev) => ({ ...prev, id_memory: val }))} options={memoryOptions} placeholder="Chọn bộ nhớ" disabled={!isAdmin} />
            <SearchableSelect value={formData.id_screen} onChange={(val) => setFormData((prev) => ({ ...prev, id_screen: val }))} options={screenOptions} placeholder="Chọn màn hình" disabled={!isAdmin} />
            <SearchableSelect value={formData.id_operationsystem} onChange={(val) => setFormData((prev) => ({ ...prev, id_operationsystem: val }))} options={osOptions} placeholder="Chọn hệ điều hành" disabled={!isAdmin} />
            <input
              type="date"
              name="date_buydevices"
              value={formData.date_buydevices}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_buydevices: e.target.value,
                  date_warranty: prev.date_warranty && prev.date_warranty < e.target.value ? e.target.value : prev.date_warranty,
                }))
              }
              className={inputCls}
              readOnly={!isAdmin}
            />
            <input
              type="date"
              name="date_warranty"
              value={formData.date_warranty}
              min={formData.date_buydevices || undefined}
              onChange={(e) => setFormData((prev) => ({ ...prev, date_warranty: e.target.value }))}
              className={inputCls}
              readOnly={!isAdmin}
            />
          </div>
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <button
                onClick={onSubmit}
                className="h-10 px-4 rounded-md border border-slate-500/50 text-slate-100 bg-slate-700 hover:bg-slate-600 transition"
              >
                Lưu
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const ActiveUsersModal = ({
  device, users, loading, onClose, onCheckout, onOpenAssign, isAdmin,
}) => {
  const total = users?.length || 0;
  return (
    <ModalShell onClose={onClose}>
      <div className="rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-[680px] max-w-[95vw]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Thiết bị #{device?.id_devices} – {device?.name_devices || ""}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Đang được sử dụng bởi <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> người
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenAssign}
                className="h-9 px-3 rounded-md border border-slate-500/50 text-slate-100 bg-slate-700 hover:bg-slate-600 transition"
              >
                + Gán người dùng
              </button>
            )}
            <button
              onClick={onClose}
              className="h-9 px-3 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
            >
              Đóng
            </button>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-10 text-center text-slate-600 dark:text-slate-300">Đang tải...</div>
          ) : total === 0 ? (
            <div className="py-10 text-center">
              <div className="text-slate-500 dark:text-slate-400 mb-4">Chưa có ai đang dùng thiết bị này.</div>
              {isAdmin && (
                <button
                  onClick={onOpenAssign}
                  className="inline-flex items-center h-10 px-4 rounded-md border border-slate-500/50 text-slate-100 bg-slate-700 hover:bg-slate-600 transition"
                >
                  + Gán người dùng
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {users.map((row) => (
                <li
                  key={row.id_assignment || `${row.id_users}-${row.id_devices}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {row.User?.username || row.username}{" "}
                      <span className="text-slate-500 dark:text-slate-400">
                        ({row.User?.email_user || row.email_user})
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Bắt đầu: {formatDateDisplay(row.start_time)}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className="h-9 px-3 rounded-md border border-rose-700/40 text-rose-50 bg-rose-700 hover:bg-rose-600 transition"
                      onClick={() => onCheckout(row.id_users, row.id_devices)}
                      title="Trả thiết bị"
                    >
                      Trả
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

const AssignUserModal = ({ device, usersOptions, onClose, onAssign, isAdmin }) => {
  const [userId, setUserId] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <div className="rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-[520px] max-w-[95vw]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold">
            Thêm người dùng vào thiết bị #{device?.id_devices} – {device?.name_devices}
          </h3>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
          >
            Đóng
          </button>
        </div>
        <div className="p-5 space-y-3">
          <SearchableSelect
            value={userId}
            onChange={setUserId}
            options={usersOptions}
            placeholder="Chọn người dùng để gán"
            disabled={!isAdmin}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/60 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => onAssign(userId, device.id_devices)}
              disabled={!isAdmin || !userId}
              className={`h-10 px-4 rounded-md text-slate-100 transition ${
                !isAdmin || !userId
                  ? "bg-slate-500/40 cursor-not-allowed"
                  : "border border-slate-500/50 bg-slate-700 hover:bg-slate-600"
              }`}
            >
              Gán người dùng
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

/** Modal shell */
const ModalShell = ({ children, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div ref={ref}>{children}</div>
    </div>
  );
};

export default TechEquipment;
