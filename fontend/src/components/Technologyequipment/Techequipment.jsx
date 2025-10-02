import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "../../lib/httpClient";
import CategoryModal from "./catagoryType";

const API_BASE = "http://localhost:5000/api";

/** ====== Helpers ====== */
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

/** ====== SearchableSelect ====== */
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
    const found = (options || []).find((o) => String(o[valueKey]) === String(value));
    return found ? found[displayKey] : "";
  }, [options, value, displayKey, valueKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options || [];
    return (options || []).filter((o) => String(o[displayKey]).toLowerCase().includes(q));
  }, [options, query, displayKey]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative ${disabled ? "opacity-60 cursor-not-allowed" : ""}`} ref={wrapperRef}>
      <div
        className={`border rounded p-2 bg-white ${disabled ? "" : "cursor-text"}`}
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

const TechEquipment = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState({ open: false, type: null });

  // Quyền
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
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
    id_users: "",
    id_operationsystem: "",
    name_devices: "",
    date_buydevices: "",
    date_warranty: "",
  });

  // --- Sort theo ID ---
  const [idSortDir, setIdSortDir] = useState("desc"); // "asc" | "desc"

  // Lấy danh sách thiết bị (chống cache)
  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/devices/all`, {
        headers: { "Cache-Control": "no-cache" },
        params: { t: Date.now() },
      });
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thiết bị:", error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh mục dropdown (chịu lỗi từng endpoint, trả [] nếu lỗi/404) + CHỐNG CACHE
  const fetchDropdownData = async () => {
    const common = {
      headers: { "Cache-Control": "no-cache" },
      params: { t: Date.now() },
    };
    const endpoints = [
      { key: "devicetypes", url: `${API_BASE}/devicestype/all`, pick: (r) => r.data?.devicetypes ?? r.data ?? [] },
      { key: "cpus",        url: `${API_BASE}/cpu/all`,         pick: (r) => r.data?.cpus        ?? r.data ?? [] },
      { key: "rams",        url: `${API_BASE}/ram/all`,         pick: (r) => r.data?.rams        ?? r.data ?? [] },
      { key: "memories",    url: `${API_BASE}/memory/all`,      pick: (r) => r.data?.memories    ?? r.data ?? [] },
      { key: "screens",     url: `${API_BASE}/screen/all`,      pick: (r) => r.data?.screens     ?? r.data ?? [] },
      { key: "operationsystems", url: `${API_BASE}/operations/all`, pick: (r) => r.data?.operationsystems ?? r.data ?? [] },
      { key: "users",       url: `${API_BASE}/users/all`,       pick: (r) => Array.isArray(r.data?.users) ? r.data.users : (r.data ?? []) },
    ];

    try {
      const settled = await Promise.allSettled(endpoints.map(e => axios.get(e.url, common)));
      const next = {
        devicetypes: [], cpus: [], rams: [], memories: [],
        screens: [], operationsystems: [], users: [],
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
            console.warn(`[Dropdown] ${key} failed:`, res.reason?.message || res.reason);
          }
        }
      });
      setDropdownData(next);
    } catch (e) {
      console.error("Lỗi khi tải dropdown:", e);
      setDropdownData({
        devicetypes: [], cpus: [], rams: [], memories: [],
        screens: [], operationsystems: [], users: [],
      });
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchDropdownData();
  }, []);

  // Filter
  const filteredDevices = devices.filter((d) => {
    const nameOk = (d.name_devices || "").toLowerCase().includes(searchTerm.toLowerCase());
    const userOk = (d.User?.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    return nameOk || userOk;
  });

  // Sort theo ID (numeric ưu tiên; nếu không phải số thì so sánh chuỗi)
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

  // MỞ modal thêm/sửa (reload dropdown TRƯỚC khi mở)
  const openAddModal = async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData(); // <--- quan trọng
    setFormData({
      id_devices: "",
      id_devicetype: "",
      id_cpu: "",
      id_ram: "",
      id_memory: "",
      id_screen: "",
      id_users: "",
      id_operationsystem: "",
      name_devices: "",
      date_buydevices: "",
      date_warranty: "",
    });
    setAddModalOpen(true);
  };
  const openEditModal = async (device) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    await fetchDropdownData(); // <--- quan trọng
    setFormData({
      ...device,
      id_devicetype: device.id_devicetype ?? device.Devicetype?.id_devicetype ?? "",
      id_cpu: device.id_cpu ?? device.Cpu?.id_cpu ?? "",
      id_ram: device.id_ram ?? device.Ram?.id_ram ?? "",
      id_memory: device.id_memory ?? device.Memory?.id_memory ?? "",
      id_screen: device.id_screen ?? device.Screen?.id_screen ?? "",
      id_users: device.id_users ?? device.User?.id_users ?? "",
      id_operationsystem: device.id_operationsystem ?? device.Operationsystem?.id_operationsystem ?? "",
    });
    setEditModalOpen(true);
  };

  const closeAddModal = () => setAddModalOpen(false);
  const closeEditModal = () => setEditModalOpen(false);

  // Validate ngày
  const validateDates = () => {
    const { date_buydevices, date_warranty } = formData;
    if (!date_buydevices || !date_warranty) return true;
    if (!isAfter(date_warranty, date_buydevices)) {
      alert("Ngày bảo hành phải lớn hơn Ngày mua.");
      return false;
    }
    return true;
  };

  // Chuẩn hóa payload gửi backend
  const normalizePayload = (payload) => ({
    ...payload,
    id_devicetype: toNullIfEmpty(payload.id_devicetype),
    id_cpu: toNullIfEmpty(payload.id_cpu),
    id_ram: toNullIfEmpty(payload.id_ram),
    id_memory: toNullIfEmpty(payload.id_memory),
    id_screen: toNullIfEmpty(payload.id_screen),
    id_users: toNullIfEmpty(payload.id_users),
    id_operationsystem: toNullIfEmpty(payload.id_operationsystem),
  });

  // CRUD API (chỉ admin)
  const addDevice = async () => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    if (!validateDates()) return;
    try {
      await axios.post(`${API_BASE}/devices/add`, normalizePayload(formData));
      await fetchDevices();           // đảm bảo danh sách mới nhất
      await fetchDropdownData();      // đồng bộ dropdown (phòng khi backend map lại data)
      closeAddModal();
    } catch (error) {
      console.error("Lỗi khi thêm thiết bị:", error);
      alert(error.response?.data?.message || "Không thêm được thiết bị");
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
      await fetchDevices();
      await fetchDropdownData();
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
        await fetchDevices();
      } catch (error) {
        console.error("Lỗi khi xóa thiết bị:", error);
        alert(error.response?.data?.message || "Không xóa được thiết bị");
      }
    }
  };

  // CategoryModal (chỉ admin)
  const openCategoryModal = (type) => {
    if (!isAdmin) return alert("Bạn không có quyền thực hiện thao tác này.");
    setCategoryModal({ open: true, type });
  };
  const closeCategoryModal = async () => {
    setCategoryModal({ open: false, type: null });
    // Sau khi đóng modal danh mục -> reload dropdown để form đang mở có options mới
    await fetchDropdownData();
  };

  if (loading) return <p className="text-center">Đang tải dữ liệu...</p>;

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl pb-3 flex items-center">
        <i className="fas fa-laptop mr-3"></i> Quản lý thiết bị CNTT
      </h2>

      {/* Thanh tìm kiếm + nút thêm */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
                  onClick={() => setIdSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  title="Sắp xếp theo ID"
                >
                  ID
                  <span className="text-xs">{idSortDir === "asc" ? "▲" : "▼"}</span>
                </button>
              </th>
              <th className="py-2 px-3">
                Loại thiết bị
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("devicestype")}
                    className="ml-2 text-blue-500"
                    title="Quản lý loại thiết bị"
                  >
                    +
                  </button>
                )}
              </th>
              <th className="py-2 px-3">Tên thiết bị</th>
              <th className="py-2 px-3">Người dùng</th>
              <th className="py-2 px-3">Ngày mua</th>
              <th className="py-2 px-3">Ngày bảo hành</th>
              <th className="py-2 px-3">
                CPU
                {isAdmin && (
                  <button
                    onClick={() => openCategoryModal("cpu")}
                    className="ml-2 text-blue-500"
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
                    className="ml-2 text-blue-500"
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
                    className="ml-2 text-blue-500"
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
                    className="ml-2 text-blue-500"
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
                    className="ml-2 text-blue-500"
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
            {sortedFilteredDevices.map((device) => (
              <tr key={device.id_devices} className="border-t">
                <td className="py-2 px-3">{device.id_devices}</td>
                <td className="py-2 px-3">{device?.Devicetype?.device_type || "—"}</td>
                <td className="py-2 px-3">{device.name_devices}</td>
                <td className="py-2 px-3">{device?.User?.username || "—"}</td>
                <td className="py-2 px-3">{formatDateDisplay(device.date_buydevices)}</td>
                <td className="py-2 px-3">{formatDateDisplay(device.date_warranty)}</td>
                <td className="py-2 px-3">{device?.Cpu?.name_cpu || "—"}</td>
                <td className="py-2 px-3">{device?.Ram?.name_ram || "—"}</td>
                <td className="py-2 px-3">
                  {device?.Screen ? `${device.Screen.name_screen} (${device.Screen.size_screen})` : "—"}
                </td>
                <td className="py-2 px-3">
                  {device?.Memory ? `${device.Memory.memory_type} ${device.Memory.size_memory}` : "—"}
                </td>
                <td className="py-2 px-3">{device?.Operationsystem?.name_operationsystem || "—"}</td>
                {isAdmin && (
                  <td className="py-2 px-3 flex space-x-2">
                    <button
                      onClick={() => openEditModal(device)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteDevice(device.id_devices)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {sortedFilteredDevices.length === 0 && (
              <tr>
                <td className="py-4 px-3 text-center text-gray-500" colSpan={isAdmin ? 12 : 11}>
                  Không có thiết bị
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm / sửa */}
      {(isAddModalOpen || isEditModalOpen) && (
        <DeviceModal
          title={isAddModalOpen ? "Thêm thiết bị" : "Sửa thiết bị"}
          formData={formData}
          setFormData={setFormData}
          onSubmit={isAddModalOpen ? addDevice : updateDevice}
          onClose={isAddModalOpen ? closeAddModal : closeEditModal}
          dropdownData={dropdownData}
          isAdmin={isAdmin}
        />
      )}

      {/* Category Modal */}
      {categoryModal.open && (
        <CategoryModal
          type={categoryModal.type}
          onClose={closeCategoryModal}
          // Nếu bạn có sửa CategoryModal để gọi onChanged() sau khi Add/Update/Delete:
          // onChanged={fetchDropdownData}
        />
      )}
    </div>
  );
};

// Modal Thêm/Sửa thiết bị
const DeviceModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  dropdownData,
  isAdmin,
}) => {
  const makeOptions = (arr, mapFn) => (Array.isArray(arr) ? arr.map(mapFn) : []);

  const devicetypeOptions = useMemo(
    () => makeOptions(dropdownData.devicetypes, (x) => ({ value: x.id_devicetype, label: x.device_type })),
    [dropdownData.devicetypes]
  );
  const cpuOptions = useMemo(
    () => makeOptions(dropdownData.cpus, (x) => ({ value: x.id_cpu, label: x.name_cpu })),
    [dropdownData.cpus]
  );
  const ramOptions = useMemo(
    () => makeOptions(dropdownData.rams, (x) => ({ value: x.id_ram, label: x.name_ram })),
    [dropdownData.rams]
  );
  const memoryOptions = useMemo(
    () => makeOptions(dropdownData.memories, (x) => ({ value: x.id_memory, label: `${x.memory_type} - ${x.size_memory}` })),
    [dropdownData.memories]
  );
  const screenOptions = useMemo(
    () => makeOptions(dropdownData.screens, (x) => ({ value: x.id_screen, label: `${x.name_screen} - ${x.size_screen}` })),
    [dropdownData.screens]
  );
  const osOptions = useMemo(
    () => makeOptions(dropdownData.operationsystems, (x) => ({ value: x.id_operationsystem, label: x.name_operationsystem })),
    [dropdownData.operationsystems]
  );
  const userOptions = useMemo(
    () => makeOptions(dropdownData.users, (x) => ({ value: x.id_users, label: x.username })),
    [dropdownData.users]
  );

  const inputCls = `border p-2 rounded ${!isAdmin ? "bg-gray-100" : ""}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-[720px] max-w-[95vw]">
        <h2 className="text-xl mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            name="id_devices"
            value={formData.id_devices}
            onChange={(e) => setFormData((p) => ({ ...p, id_devices: e.target.value }))}
            placeholder="ID thiết bị"
            className={inputCls}
            readOnly={!isAdmin}
          />
          <input
            name="name_devices"
            value={formData.name_devices}
            onChange={(e) => setFormData((p) => ({ ...p, name_devices: e.target.value }))}
            placeholder="Tên thiết bị"
            className={inputCls}
            readOnly={!isAdmin}
          />

          <SearchableSelect
            value={formData.id_devicetype}
            onChange={(val) => setFormData((p) => ({ ...p, id_devicetype: val }))}
            options={devicetypeOptions}
            placeholder="Chọn loại thiết bị"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_cpu}
            onChange={(val) => setFormData((p) => ({ ...p, id_cpu: val }))}
            options={cpuOptions}
            placeholder="Chọn CPU"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_ram}
            onChange={(val) => setFormData((p) => ({ ...p, id_ram: val }))}
            options={ramOptions}
            placeholder="Chọn RAM"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_memory}
            onChange={(val) => setFormData((p) => ({ ...p, id_memory: val }))}
            options={memoryOptions}
            placeholder="Chọn bộ nhớ"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_screen}
            onChange={(val) => setFormData((p) => ({ ...p, id_screen: val }))}
            options={screenOptions}
            placeholder="Chọn màn hình"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_operationsystem}
            onChange={(val) => setFormData((p) => ({ ...p, id_operationsystem: val }))}
            options={osOptions}
            placeholder="Chọn hệ điều hành"
            disabled={!isAdmin}
          />
          <SearchableSelect
            value={formData.id_users}
            onChange={(val) => setFormData((p) => ({ ...p, id_users: val }))}
            options={userOptions}
            placeholder="Chọn người dùng"
            disabled={!isAdmin}
          />

          <input
            type="date"
            name="date_buydevices"
            value={formData.date_buydevices}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                date_buydevices: e.target.value,
                date_warranty:
                  p.date_warranty && p.date_warranty < e.target.value ? e.target.value : p.date_warranty,
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
            onChange={(e) => setFormData((p) => ({ ...p, date_warranty: e.target.value }))}
            className={inputCls}
            readOnly={!isAdmin}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">
            Đóng
          </button>
          {isAdmin && (
            <button onClick={onSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
              Lưu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechEquipment;
