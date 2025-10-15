import React, { useState, useEffect, useMemo, useRef } from "react";
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

  return (
    <div
      className={`relative ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      ref={wrapperRef}
    >
      <div
        className={`border rounded p-2 bg-white ${
          disabled ? "" : "cursor-text"
        }`}
        onClick={() => !disabled && setOpen((s) => !s)}
      >
        {selectedLabel || <span className="text-gray-400">{placeholder}</span>}
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow">
          <input
            autoFocus
            className="w-full p-2 border-b outline-none"
            placeholder="Gõ để tìm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-56 overflow-auto">
            {(filtered || []).length === 0 && (
              <div className="p-2 text-sm text-gray-500">Không có kết quả</div>
            )}
            {(filtered || []).map((opt) => (
              <div
                key={opt[valueKey]}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  onChange(opt[valueKey]);
                  setOpen(false);
                  setQuery("");
                }}
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
const _assetCache = {
  family: null,        // "Roboto" | "helvetica"
  regularB64: null,
  boldB64: null,
  logo: null,
};

// ArrayBuffer -> base64 (chunked) để tránh tràn stack
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Đăng ký font trong cache vào tài liệu jsPDF
function registerCachedFont(doc) {
  if (!_assetCache.family || !_assetCache.regularB64) return false;
  const fam = _assetCache.family;

  doc.addFileToVFS(`${fam}-Regular.ttf`, _assetCache.regularB64);
  doc.addFont(`${fam}-Regular.ttf`, fam, "normal");

  if (_assetCache.boldB64) {
    doc.addFileToVFS(`${fam}-Bold.ttf`, _assetCache.boldB64);
    doc.addFont(`${fam}-Bold.ttf`, fam, "bold");
  } else {
    doc.addFont(`${fam}-Regular.ttf`, fam, "bold"); // giả lập bold
  }
  return true;
}

/**
 * Chỉ nạp Roboto từ /public/fonts.
 * Nếu lỗi => dùng helvetica (font phổ biến có sẵn của jsPDF).
 */
async function loadVietnameseFontToDoc(doc) {
  // Nếu đã có cache, chỉ cần đăng ký lại vào doc mới
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

// Logo: đặt tại /public/images/logo/logo_towa.png
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
  const [categoryModal, setCategoryModal] = useState({
    open: false,
    type: null,
  });

  const [assignModal, setAssignModal] = useState({ open: false, device: null });
  const [activeUsersModal, setActiveUsersModal] = useState({
    open: false,
    device: null,
    users: [],
    loading: false,
  });

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role === "admin";

  const [dropdownData, setDropdownData] = useState({
    devicetypes: [],
    cpus: [],
    rams: [],
    memories: [],
    screens: [],
    operationsystems: [],
    users: [],
  });

  const [formData, setFormData] = useState({
    id_devices: "",
    id_devicetype: "",
    id_cpu: "",
    id_ram: "",
    id_memory: "",
    id_screen: "",
    id_operationsystem: "",
    name_devices: "",
    date_buydevices: "",
    date_warranty: "",
  });

  const [idSortDir, setIdSortDir] = useState("desc");

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/devices/all`, {
        headers: { "Cache-Control": "no-cache" },
        params: { t: Date.now() },
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
  };

  const fetchActiveCountMap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignments/active-count`, {
        headers: { "Cache-Control": "no-cache" },
        params: { t: Date.now() },
      });
      setActiveCountMap(res.data || {});
    } catch (e) {
      console.warn("Không lấy được active-count:", e?.message || e);
      setActiveCountMap({});
    }
  };

  const fetchDropdownData = async () => {
    const common = {
      headers: { "Cache-Control": "no-cache" },
      params: { t: Date.now() },
    };
    const endpoints = [
      {
        key: "devicetypes",
        url: `${API_BASE}/devicestype/all`,
        pick: (r) => r.data?.devicetypes ?? r.data ?? [],
      },
      {
        key: "cpus",
        url: `${API_BASE}/cpu/all`,
        pick: (r) => r.data?.cpus ?? r.data ?? [],
      },
      {
        key: "rams",
        url: `${API_BASE}/ram/all`,
        pick: (r) => r.data?.rams ?? r.data ?? [],
      },
      {
        key: "memories",
        url: `${API_BASE}/memory/all`,
        pick: (r) => r.data?.memories ?? r.data ?? [],
      },
      {
        key: "screens",
        url: `${API_BASE}/screen/all`,
        pick: (r) => r.data?.screens ?? r.data ?? [],
      },
      {
        key: "operationsystems",
        url: `${API_BASE}/operations/all`,
        pick: (r) => r.data?.operationsystems ?? r.data ?? [],
      },
      {
        key: "users",
        url: `${API_BASE}/users/all`,
        pick: (r) =>
          Array.isArray(r.data?.users) ? r.data.users : r.data ?? [],
      },
    ];

    try {
      const settled = await Promise.allSettled(
        endpoints.map((e) => axios.get(e.url, common))
      );
      const next = {
        devicetypes: [],
        cpus: [],
        rams: [],
        memories: [],
        screens: [],
        operationsystems: [],
        users: [],
      };
      settled.forEach((res, idx) => {
        const { key, pick } = endpoints[idx];
        if (res.status === "fulfilled") {
          try {
            const val = pick(res.value);
            next[key] = Array.isArray(val) ? val : [];
          } catch {
            next[key] = [];
          }
        } else {
          next[key] = [];
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[Dropdown] ${key} failed:`,
              res.reason?.message || res.reason
            );
          }
        }
      });
      setDropdownData(next);
    } catch (e) {
      console.error("Lỗi khi tải dropdown:", e);
      setDropdownData({
        devicetypes: [],
        cpus: [],
        rams: [],
        memories: [],
        screens: [],
        operationsystems: [],
        users: [],
      });
    }
  };

  const fetchActiveUsersMap = async (listArg) => {
    const list = Array.isArray(listArg) && listArg.length ? listArg : devices;
    try {
      const res = await axios.get(`${API_BASE}/assignments/active-map`, {
        headers: { "Cache-Control": "no-cache" },
        params: { t: Date.now() },
      });
      if (res?.data && typeof res.data === "object") {
        setActiveUsersMap(res.data);
        return;
      }
      throw new Error("No active-map data");
    } catch (_) {
      try {
        const pairs = await Promise.allSettled(
          list.map((d) =>
            axios
              .get(`${API_BASE}/assignments/active/${d.id_devices}`, {
                headers: { "Cache-Control": "no-cache" },
                params: { t: Date.now() },
              })
              .then((r) => ({
                id: d.id_devices,
                rows: Array.isArray(r.data) ? r.data : [],
              }))
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
  };

  useEffect(() => {
    (async () => {
      const list = await fetchDevices();
      await Promise.all([fetchDropdownData(), fetchActiveCountMap()]);
      await fetchActiveUsersMap(list);
    })();
  }, []);

  const filteredDevices = devices.filter((d) => {
    const q = (searchTerm || "").toLowerCase();
    if (!q) return true;
    const nameOk = (d.name_devices || "").toLowerCase().includes(q);
    const users = activeUsersMap[String(d.id_devices)] || [];
    const userOk = users.some((u) =>
      (u?.username || "").toLowerCase().includes(q)
    );
    return nameOk || userOk;
  });

  const sortedFilteredDevices = useMemo(() => {
    const parseMaybeNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : v ?? "";
    };
    const dir = idSortDir === "asc" ? 1 : -1;
    return [...filteredDevices].sort((a, b) => {
      const A = parseMaybeNumber(a.id_devices);
      const B = parseMaybeNumber(b.id_devices);
      if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
      return String(A).localeCompare(String(B), "vi") * dir;
    });
  }, [filteredDevices, idSortDir]);

  /** ================== Export Excel ================== */
  const exportToExcel = () => {
    const rows = sortedFilteredDevices.length ? sortedFilteredDevices : devices;
    if (!rows.length) {
      alert("Không có dữ liệu để xuất Excel.");
      return;
    }
    const data = rows.map((d) => ({
      "ID Thiết bị": d.id_devices,
      "Loại thiết bị": d?.Devicetype?.device_type || "",
      "Tên thiết bị": d.name_devices,
      CPU: d?.Cpu?.name_cpu || "",
      RAM: d?.Ram?.name_ram || "",
      "Ổ cứng": d?.Memory
        ? `${d.Memory.memory_type} ${d.Memory.size_memory}`
        : "",
      "Màn hình": d?.Screen
        ? `${d.Screen.name_screen} ${d.Screen.size_screen}`
        : "",
      "Hệ điều hành": d?.Operationsystem?.name_operationsystem || "",
      "Ngày mua": formatDateDisplay(d.date_buydevices),
      "Ngày bảo hành": formatDateDisplay(d.date_warranty),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thông tin thiết bị");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    XLSX.writeFile(wb, `ThongTinThietBi_${yyyy}${mm}${dd}.xlsx`);
  };

  /** ================== Export PDF (A3 ngang + Logo + Unicode) ================== */
  const exportToPDF = async () => {
    const rows = sortedFilteredDevices.length ? sortedFilteredDevices : devices;
    if (!rows.length) {
      alert("Không có dữ liệu để xuất PDF.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a3");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const marginY = 12;

    // Nạp font Roboto (fallback helvetica)
    const { family } = await loadVietnameseFontToDoc(doc);
    doc.setFont(family, "bold");

    // Header: Logo trái + Tiêu đề giữa + Ngày phải
    const logo = await loadLogoDataURL("/images/logo/logo_towa.png");
    const LOGO_W = 70, LOGO_H = 22;
    const topY = marginY;

    if (logo) {
      try {
        doc.addImage(logo, "PNG", marginX, topY, LOGO_W, LOGO_H);
      } catch (e) {
        console.warn("Không chèn được logo:", e);
      }
    }

    const title = "THÔNG TIN THIẾT BỊ";
    doc.setFontSize(26);
    const titleW = doc.getTextWidth(title);
    doc.text(title, (pageW - titleW) / 2, topY + 14);

    doc.setFont(family, "normal");
    doc.setFontSize(11);
    const now = new Date();
    const dateStr = `Ngày xuất: ${String(now.getDate()).padStart(
      2,
      "0"
    )}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const dateW = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageW - marginX - dateW, topY + 18);

    const columns = [
      { header: "ID", dataKey: "id" },
      { header: "Loại thiết bị", dataKey: "devicetype" },
      { header: "Tên thiết bị", dataKey: "name" },
      { header: "CPU", dataKey: "cpu" },
      { header: "RAM", dataKey: "ram" },
      { header: "Ổ cứng", dataKey: "memory" },
      { header: "Màn hình", dataKey: "screen" },
      { header: "Hệ điều hành", dataKey: "os" },
      { header: "Ngày mua", dataKey: "buy" },
      { header: "Ngày bảo hành", dataKey: "warranty" },
    ];

    const data = rows.map((d) => ({
      id: d.id_devices ?? "",
      devicetype: d?.Devicetype?.device_type ?? "",
      name: d?.name_devices ?? "",
      cpu: d?.Cpu?.name_cpu ?? "",
      ram: d?.Ram?.name_ram ?? "",
      memory: d?.Memory
        ? `${d.Memory.memory_type} ${d.Memory.size_memory}`
        : "",
      screen: d?.Screen
        ? `${d.Screen.name_screen} ${d.Screen.size_screen}`
        : "",
      os: d?.Operationsystem?.name_operationsystem ?? "",
      buy: formatDateDisplay(d.date_buydevices),
      warranty: formatDateDisplay(d.date_warranty),
    }));

    autoTable(doc, {
      startY: topY + LOGO_H + 6,
      margin: { left: marginX, right: marginX },
      columns,
      body: data,
      styles: {
        font: family,
        fontSize: 9,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        font: family,
        fontStyle: "bold",
        fillColor: [52, 152, 219],
        textColor: 255,
      },
      columnStyles: {
        id: { cellWidth: 18 },
        devicetype: { cellWidth: 40 },
        name: { cellWidth: 70 },
        cpu: { cellWidth: 35 },
        ram: { cellWidth: 28 },
        memory: { cellWidth: 40 },
        screen: { cellWidth: 38 },
        os: { cellWidth: 40 },
        buy: { cellWidth: 28 },
        warranty: { cellWidth: 30 },
      },
      didDrawPage: () => {
        doc.setFont(family, "normal");
        doc.setFontSize(10);
        const str = `Trang ${doc.internal.getNumberOfPages()}`;
        const strW = doc.getTextWidth(str);
        doc.text(str, pageW - marginX - strW, pageH - 6);
      },
      pageBreak: "auto",
      tableWidth: "auto",
    });

    doc.save(
      `ThongTinThietBi_${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.pdf`
    );
  };

  /** ================== CRUD & UI ================== */
  const openAddModal = async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData();
    setFormData({
      id_devices: "",
      id_devicetype: "",
      id_cpu: "",
      id_ram: "",
      id_memory: "",
      id_screen: "",
      id_operationsystem: "",
      name_devices: "",
      date_buydevices: "",
      date_warranty: "",
    });
    setAddModalOpen(true);
  };
  const openEditModal = async (device) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData();
    setFormData({
      ...device,
      id_devicetype:
        device.id_devicetype ?? device.Devicetype?.id_devicetype ?? "",
      id_cpu: device.id_cpu ?? device.Cpu?.id_cpu ?? "",
      id_ram: device.id_ram ?? device.Ram?.id_ram ?? "",
      id_memory: device.id_memory ?? device.Memory?.id_memory ?? "",
      id_screen: device.id_screen ?? device.Screen?.id_screen ?? "",
      id_operationsystem:
        device.id_operationsystem ??
        device.Operationsystem?.id_operationsystem ??
        "",
    });
    setEditModalOpen(true);
  };
  const closeAddModal = () => setAddModalOpen(false);
  const closeEditModal = () => setEditModalOpen(false);

  const validateDates = () => {
    const { date_buydevices, date_warranty } = formData;
    if (!date_buydevices || !date_warranty) return true;
    if (!isAfter(date_warranty, date_buydevices)) {
      alert("Ngày bảo hành phải lớn hơn Ngày mua.");
      return false;
    }
    return true;
  };

  const normalizePayload = (payload) => ({
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
  });

  const addDevice = async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!validateDates()) return;
    if (
      !formData.id_devices ||
      !formData.name_devices ||
      !formData.date_buydevices ||
      !formData.date_warranty
    ) {
      return alert(
        "Vui lòng nhập đủ: ID thiết bị, Tên thiết bị, Ngày mua, Ngày bảo hành."
      );
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
  };

  const updateDevice = async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!validateDates()) return;
    try {
      await axios.put(
        `${API_BASE}/devices/update/${formData.id_devices}`,
        normalizePayload(formData)
      );
      const list = await fetchDevices();
      await Promise.all([fetchActiveCountMap(), fetchDropdownData()]);
      await fetchActiveUsersMap(list);
      closeEditModal();
    } catch (error) {
      console.error("Lỗi khi cập nhật thiết bị:", error);
      alert(error.response?.data?.message || "Không cập nhật được thiết bị");
    }
  };

  const deleteDevice = async (id) => {
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
  };

  const openActiveUsersModal = async (device) => {
    setActiveUsersModal((prev) => ({
      ...prev,
      open: true,
      device,
      loading: true,
      users: [],
    }));
    try {
      const res = await axios.get(
        `${API_BASE}/assignments/active/${device.id_devices}`,
        {
          headers: { "Cache-Control": "no-cache" },
          params: { t: Date.now() },
        }
      );
      setActiveUsersModal({
        open: true,
        device,
        users: Array.isArray(res.data) ? res.data : [],
        loading: false,
      });
    } catch (e) {
      console.error("Lỗi lấy active users:", e);
      setActiveUsersModal({ open: true, device, users: [], loading: false });
    }
  };
  const closeActiveUsersModal = () =>
    setActiveUsersModal({
      open: false,
      device: null,
      users: [],
      loading: false,
    });

  const checkoutUserFromDevice = async (id_users, id_devices) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    try {
      await axios.post(`${API_BASE}/assignments/checkout`, {
        id_users,
        id_devices,
      });
      await openActiveUsersModal({
        id_devices,
        name_devices: activeUsersModal.device?.name_devices || "",
      });
      await fetchActiveCountMap();
      await fetchActiveUsersMap();
    } catch (e) {
      alert(e?.response?.data?.message || "Không trả được thiết bị");
    }
  };

  const openAssignModal = (device) => setAssignModal({ open: true, device });
  const closeAssignModal = () => setAssignModal({ open: false, device: null });
  const doAssignUser = async (userId, deviceId) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!userId) return alert("Chọn người dùng trước khi gán.");
    try {
      await axios.post(`${API_BASE}/assignments/checkin`, {
        id_users: userId,
        id_devices: deviceId,
      });
      await fetchActiveCountMap();
      await fetchActiveUsersMap();
      if (
        activeUsersModal.open &&
        activeUsersModal.device?.id_devices === deviceId
      ) {
        await openActiveUsersModal({
          id_devices: deviceId,
          name_devices: activeUsersModal.device?.name_devices || "",
        });
      }
      closeAssignModal();
    } catch (e) {
      alert(
        e?.response?.data?.message || "Không thể thêm người dùng vào thiết bị"
      );
    }
  };

  const openCategoryModal = (type) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    setCategoryModal({ open: true, type });
  };
  const closeCategoryModal = async () => {
    setCategoryModal({ open: false, type: null });
    await fetchDropdownData();
  };

  if (loading) return <p className="text-center">Đang tải dữ liệu...</p>;

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl pb-3 flex items-center">
        <i className="fas fa-laptop mr-3"></i> Quản lý thiết bị CNTT
      </h2>

      {/* Thanh tìm kiếm + Export + Thêm */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thiết bị hoặc người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-80"
          />
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ⬇️ Xuất Excel
          </button>
          <button
            onClick={exportToPDF}
            className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700"
          >
            ⏺️ Xuất PDF
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Thêm thiết bị
          </button>
        )}
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white overflow-auto shadow rounded">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">
                <button
                  type="button"
                  className="flex items-center gap-1 select-none"
                  onClick={() =>
                    setIdSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  title="Sắp xếp theo ID"
                >
                  ID{" "}
                  <span className="text-xs">
                    {idSortDir === "asc" ? "▲" : "▼"}
                  </span>
                </button>
              </th>
              <th className="py-2 px-3">
                Loại thiết bị
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("devicestype")}
                    className="ml-2 text-blue-600"
                    title="Quản lý loại thiết bị"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">Tên thiết bị</th>
              <th className="py-2 px-3">
                Người dùng{" "}
                <span className="text-xs text-gray-500">(từ assignments)</span>
              </th>
              <th className="py-2 px-3">Đang dùng</th>
              <th className="py-2 px-3">Ngày mua</th>
              <th className="py-2 px-3">Ngày bảo hành</th>
              <th className="py-2 px-3">
                CPU
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("cpu")}
                    className="ml-2 text-blue-600"
                    title="Quản lý CPU"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">
                RAM
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("ram")}
                    className="ml-2 text-blue-600"
                    title="Quản lý RAM"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">
                Màn hình
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("screen")}
                    className="ml-2 text-blue-600"
                    title="Quản lý màn hình"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">
                Ổ cứng
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("memory")}
                    className="ml-2 text-blue-600"
                    title="Quản lý ổ cứng"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">
                HĐH
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("operations")}
                    className="ml-2 text-blue-600"
                    title="Quản lý hệ điều hành"
                  >
                    +
                  </button>
                )}
              </th>
              {isAdmin && <th className="py-2 px-3">Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {sortedFilteredDevices.map((device) => {
              const activeCnt =
                activeCountMap?.[String(device.id_devices)] ?? 0;
              const users = activeUsersMap?.[String(device.id_devices)] || [];
              const names = users.map((u) => u.username).filter(Boolean);
              const preview = names.slice(0, 2);
              const extra = names.length > 2 ? names.length - 2 : 0;

              return (
                <tr key={device.id_devices} className="border-t">
                  <td className="py-2 px-3">{device.id_devices}</td>
                  <td className="py-2 px-3">
                    {device?.Devicetype?.device_type || "—"}
                  </td>
                  <td className="py-2 px-3">{device.name_devices}</td>
                  <td className="py-2 px-3">
                    {names.length ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {preview.map((n, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                            title={n}
                          >
                            {n}
                          </span>
                        ))}
                        {extra > 0 && (
                          <span
                            className="text-gray-500 text-sm"
                            title={names.join(", ")}
                          >
                            +{extra}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>Chưa gán</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-sm min-w-[28px]"
                        title="Số người đang sử dụng"
                      >
                        {activeCnt}
                      </span>
                      <button
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition"
                        onClick={() => openActiveUsersModal(device)}
                        title="Xem ai đang dùng"
                        aria-label="Xem ai đang dùng"
                      >
                        <i className="fas fa-users" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {formatDateDisplay(device.date_buydevices)}
                  </td>
                  <td className="py-2 px-3">
                    {formatDateDisplay(device.date_warranty)}
                  </td>
                  <td className="py-2 px-3">{device?.Cpu?.name_cpu || "—"}</td>
                  <td className="py-2 px-3">{device?.Ram?.name_ram || "—"}</td>
                  <td className="py-2 px-3">
                    {device?.Screen
                      ? `${device.Screen.name_screen} (${device.Screen.size_screen})`
                      : "—"}
                  </td>
                  <td className="py-2 px-3">
                    {device?.Memory
                      ? `${device.Memory.memory_type} ${device.Memory.size_memory}`
                      : "—"}
                  </td>
                  <td className="py-2 px-3">
                    {device?.Operationsystem?.name_operationsystem || "—"}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-3 flex space-x-2">
                      <button
                        onClick={() => openEditModal(device)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteDevice(device.id_devices)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {sortedFilteredDevices.length === 0 && (
              <tr>
                <td
                  className="py-4 px-3 text-center text-gray-500"
                  colSpan={isAdmin ? 13 : 12}
                >
                  Không có thiết bị
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
          usersOptions={(dropdownData.users || []).map((x) => ({
            value: x.id_users,
            label: x.username,
          }))}
          onClose={closeAssignModal}
          onAssign={doAssignUser}
          isAdmin={isAdmin}
        />
      )}

      {categoryModal.open && (
        <CategoryModal type={categoryModal.type} onClose={closeCategoryModal} />
      )}
    </div>
  );
};

/** ================== Modals ================== */
const DeviceModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  dropdownData,
  isAdmin,
  isEdit,
}) => {
  const makeOptions = (arr, mapFn) =>
    Array.isArray(arr) ? arr.map(mapFn) : [];
  const devicetypeOptions = useMemo(
    () =>
      makeOptions(dropdownData.devicetypes, (x) => ({
        value: x.id_devicetype,
        label: x.device_type,
      })),
    [dropdownData.devicetypes]
  );
  const cpuOptions = useMemo(
    () =>
      makeOptions(dropdownData.cpus, (x) => ({
        value: x.id_cpu,
        label: x.name_cpu,
      })),
    [dropdownData.cpus]
  );
  const ramOptions = useMemo(
    () =>
      makeOptions(dropdownData.rams, (x) => ({
        value: x.id_ram,
        label: x.name_ram,
      })),
    [dropdownData.rams]
  );
  const memoryOptions = useMemo(
    () =>
      makeOptions(dropdownData.memories, (x) => ({
        value: x.id_memory,
        label: `${x.memory_type} - ${x.size_memory}`,
      })),
    [dropdownData.memories]
  );
  const screenOptions = useMemo(
    () =>
      makeOptions(dropdownData.screens, (x) => ({
        value: x.id_screen,
        label: `${x.name_screen} - ${x.size_screen}`,
      })),
    [dropdownData.screens]
  );
  const osOptions = useMemo(
    () =>
      makeOptions(dropdownData.operationsystems, (x) => ({
        value: x.id_operationsystem,
        label: x.name_operationsystem,
      })),
    [dropdownData.operationsystems]
  );

  const inputCls = `border p-2 rounded ${!isAdmin ? "bg-gray-100" : ""}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-[760px] max-w-[95vw]">
        <h2 className="text-xl mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            name="id_devices"
            value={formData.id_devices}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, id_devices: e.target.value }))
            }
            placeholder="ID thiết bị"
            className={`border p-2 rounded ${isEdit ? "bg-gray-100" : ""}`}
            readOnly={!isAdmin || isEdit}
            title={isEdit ? "ID thiết bị (không thể sửa)" : "Nhập ID thiết bị"}
          />
          <input
            name="name_devices"
            value={formData.name_devices}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name_devices: e.target.value }))
            }
            placeholder="Tên thiết bị"
            className={inputCls}
            readOnly={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_devicetype}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_devicetype: val }))
            }
            options={devicetypeOptions}
            placeholder="Chọn loại thiết bị"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_cpu}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_cpu: val }))
            }
            options={cpuOptions}
            placeholder="Chọn CPU"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_ram}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_ram: val }))
            }
            options={ramOptions}
            placeholder="Chọn RAM"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_memory}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_memory: val }))
            }
            options={memoryOptions}
            placeholder="Chọn bộ nhớ"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_screen}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_screen: val }))
            }
            options={screenOptions}
            placeholder="Chọn màn hình"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_operationsystem}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, id_operationsystem: val }))
            }
            options={osOptions}
            placeholder="Chọn hệ điều hành"
            disabled={!isAdmin}
          />
          <input
            type="date"
            name="date_buydevices"
            value={formData.date_buydevices}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                date_buydevices: e.target.value,
                date_warranty:
                  prev.date_warranty && prev.date_warranty < e.target.value
                    ? e.target.value
                    : prev.date_warranty,
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
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                date_warranty: e.target.value,
              }))
            }
            className={inputCls}
            readOnly={!isAdmin}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Đóng
          </button>
          {isAdmin && (
            <button
              onClick={onSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Lưu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveUsersModal = ({
  device,
  users,
  loading,
  onClose,
  onCheckout,
  onOpenAssign,
  isAdmin,
}) => {
  const total = users?.length || 0;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[680px] max-w-[95vw]">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Thiết bị #{device?.id_devices} – {device?.name_devices || ""}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Đang được sử dụng bởi{" "}
              <span className="font-medium text-gray-700">{total}</span> người
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenAssign}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                + Gán người dùng
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-10 text-center text-gray-600">Đang tải...</div>
          ) : total === 0 ? (
            <div className="py-10 text-center">
              <div className="text-gray-500 mb-4">
                Chưa có ai đang dùng thiết bị này.
              </div>
              {isAdmin && (
                <button
                  onClick={onOpenAssign}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
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
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {row.User?.username || row.username}{" "}
                      <span className="text-gray-500">
                        ({row.User?.email_user || row.email_user})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Bắt đầu: {formatDateDisplay(row.start_time)}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
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
    </div>
  );
};

const AssignUserModal = ({
  device,
  usersOptions,
  onClose,
  onAssign,
  isAdmin,
}) => {
  const [userId, setUserId] = useState("");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[520px] max-w-[95vw] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Thêm người dùng vào thiết bị #{device?.id_devices} –{" "}
            {device?.name_devices}
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-600 text-white"
          >
            Đóng
          </button>
        </div>
        <div className="space-y-3">
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
              className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={() => onAssign(userId, device.id_devices)}
              disabled={!isAdmin || !userId}
              className={`px-4 py-2 rounded text-white ${
                !isAdmin || !userId
                  ? "bg-green-300"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Gán người dùng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechEquipment;
