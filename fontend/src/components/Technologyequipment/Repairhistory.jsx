// src/components/RepairTech/Repairhistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "../../lib/httpClient";

/* ================== CONFIG ================== */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api");

const getId = (r) => r?.id ?? r?.id_maintenance ?? r?.maintenance_id;

/* ================== COMPONENT ================== */
const Repairhistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    device_code: "",
    device_name: "",
    maintenance_date: "",
    details: "",
    technician: "",
    note: "",
  });

  // --- Optional: Đồng bộ dark-mode nếu Tailwind đang để `darkMode: 'class'`
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      if (mql?.matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    apply();
    mql?.addEventListener?.("change", apply);
    return () => mql?.removeEventListener?.("change", apply);
  }, []);

  // Fetch danh sách lịch sử bảo trì
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/maintenance`, {
        headers: { "Cache-Control": "no-cache" },
        params: { _ts: Date.now() },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setHistory(list);
    } catch (error) {
      console.error("Error fetching maintenance history:", error);
      alert(
        error?.response?.data?.message ||
          "Không thể tải lịch sử bảo trì. Vui lòng thử lại."
      );
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Tìm kiếm lịch sử (Enter)
  const searchHistory = async (e) => {
    if (e.key !== "Enter") return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/maintenance/search`, {
        params: { keyword: searchTerm, _ts: Date.now() },
        headers: { "Cache-Control": "no-cache" },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setHistory(list);
    } catch (error) {
      console.error("Error searching maintenance:", error);
      alert(error?.response?.data?.message || "Tìm kiếm thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Mở modal thêm
  const openAddModal = () => {
    setFormData({
      device_code: "",
      device_name: "",
      maintenance_date: "",
      details: "",
      technician: "",
      note: "",
    });
    setAddModalOpen(true);
  };
  const closeAddModal = () => setAddModalOpen(false);

  // Mở modal chỉnh sửa
  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      device_code: record.device_code || "",
      device_name: record.device_name || "",
      maintenance_date: record.maintenance_date
        ? String(record.maintenance_date).slice(0, 10)
        : "",
      details: record.details || "",
      technician: record.technician || "",
      note: record.note || "",
    });
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
  };

  // Validate form tối thiểu
  const validateForm = () => {
    if (!String(formData.device_code).trim()) {
      alert("Vui lòng nhập Mã thiết bị.");
      return false;
    }
    if (!String(formData.device_name).trim()) {
      alert("Vui lòng nhập Tên thiết bị.");
      return false;
    }
    if (!String(formData.maintenance_date).trim()) {
      alert("Vui lòng chọn Ngày bảo trì.");
      return false;
    }
    return true;
  };

  // Thêm bảo trì
  const addRecord = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}/maintenance`, formData, {
        headers: { "Cache-Control": "no-cache" },
      });
      alert(res?.data?.message || "Thêm lịch sử bảo trì thành công");
      closeAddModal();
      fetchHistory();
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      alert(error?.response?.data?.message || "Không thể thêm lịch sử bảo trì");
    } finally {
      setSubmitting(false);
    }
  };

  // Cập nhật bảo trì
  const updateRecord = async () => {
    if (!validateForm()) return;
    try {
      const id = getId(editingRecord);
      if (!id) {
        alert("Thiếu ID bản ghi để cập nhật.");
        return;
      }
      setSubmitting(true);
      const res = await axios.put(`${API_BASE}/maintenance/${id}`, formData, {
        headers: { "Cache-Control": "no-cache" },
      });
      alert(res?.data?.message || "Cập nhật thành công");
      closeEditModal();
      fetchHistory();
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      alert(error?.response?.data?.message || "Không thể cập nhật lịch sử bảo trì");
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa bảo trì
  const deleteRecord = async (idRaw) => {
    const id = getId({ id: idRaw }) || idRaw;
    if (!id) {
      alert("Thiếu ID bản ghi để xoá.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử này?")) {
      try {
        setSubmitting(true);
        const res = await axios.delete(`${API_BASE}/maintenance/${id}`, {
          headers: { "Cache-Control": "no-cache" },
        });
        alert(res?.data?.message || "Xóa thành công");
        fetchHistory();
      } catch (error) {
        console.error("Error deleting maintenance record:", error);
        alert(error?.response?.data?.message || "Không thể xóa lịch sử bảo trì");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const skeleton = useMemo(
    () => (
      <div className="w-full mt-8">
        <div className="animate-pulse rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-6">
          <div className="h-6 w-56 rounded bg-neutral-200 dark:bg-neutral-800 mb-4"></div>
          <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-800 mb-4"></div>
          <div className="h-72 w-full rounded bg-neutral-200 dark:bg-neutral-800"></div>
        </div>
      </div>
    ),
    []
  );

  if (loading) return skeleton;

  return (
    <div className="w-full mt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800">
            🛠️
          </span>
          Lịch sử bảo trì thiết bị
        </h1>

        <button
          onClick={openAddModal}
          disabled={submitting}
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium
                     bg-blue-600 hover:bg-blue-700 text-white shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
        >
          + Thêm bảo trì
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="mb-4">
        <div className="relative max-w-xl">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã thiết bị… (nhấn Enter)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={searchHistory}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900
                       text-neutral-800 dark:text-neutral-100
                       placeholder-neutral-400 dark:placeholder-neutral-500
                       px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            ⌕
          </div>
        </div>
      </div>

      {/* Bảng danh sách lịch sử */}
      <div
        className="overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800
                   bg-white dark:bg-neutral-900 shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300
                           text-sm"
              >
                <Th>Mã thiết bị</Th>
                <Th className="min-w-[180px]">Tên thiết bị</Th>
                <Th>Ngày bảo trì</Th>
                <Th className="min-w-[240px]">Nội dung</Th>
                <Th>Người thực hiện</Th>
                <Th className="min-w-[160px]">Ghi chú</Th>
                <Th className="text-right pr-4">Hành động</Th>
              </tr>
            </thead>
            <tbody className="text-sm text-neutral-800 dark:text-neutral-100">
              {history.map((record) => {
                const id = getId(record);
                return (
                  <tr
                    key={id}
                    className="border-t border-neutral-200/70 dark:border-neutral-800
                               hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <Td>{record.device_code}</Td>
                    <Td className="font-medium">{record.device_name}</Td>
                    <Td>
                      {record.maintenance_date
                        ? String(record.maintenance_date).slice(0, 10)
                        : ""}
                    </Td>
                    <Td className="align-top">
                      <span className="line-clamp-2">{record.details}</span>
                    </Td>
                    <Td>{record.technician}</Td>
                    <Td className="align-top">
                      <span className="line-clamp-2">{record.note}</span>
                    </Td>
                    <Td className="!py-2">
                      <div className="flex items-center justify-end gap-2 pr-2">
                        <button
                          onClick={() => openEditModal(record)}
                          disabled={submitting}
                          className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium
                                     bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm
                                     focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteRecord(id)}
                          disabled={submitting}
                          className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium
                                     bg-rose-600 hover:bg-rose-700 text-white shadow-sm
                                     focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-60"
                        >
                          Xóa
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm */}
      {isAddModalOpen && (
        <Modal
          title="Thêm lịch sử bảo trì"
          onClose={closeAddModal}
          onSave={addRecord}
          formData={formData}
          onChange={handleInputChange}
          submitting={submitting}
        />
      )}

      {/* Modal Sửa */}
      {isEditModalOpen && (
        <Modal
          title="Chỉnh sửa lịch sử bảo trì"
          onClose={closeEditModal}
          onSave={updateRecord}
          formData={formData}
          onChange={handleInputChange}
          submitting={submitting}
        />
      )}
    </div>
  );

  /* ----------------- Sub components ----------------- */

  function Th({ children, className = "" }) {
    return (
      <th
        className={
          "py-3 px-4 font-semibold tracking-wide border-b border-neutral-200/80 dark:border-neutral-800 " +
          className
        }
      >
        {children}
      </th>
    );
  }

  function Td({ children, className = "" }) {
    return <td className={"py-3 px-4 align-middle " + className}>{children}</td>;
  }

  function Modal({ title, onClose, onSave, formData, onChange, submitting }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
        {/* panel */}
        <div
          className="relative w-full max-w-2xl rounded-2xl border border-neutral-200/70 dark:border-neutral-800
                     bg-white dark:bg-neutral-900 p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              name="device_code"
              placeholder="Mã thiết bị"
              value={formData.device_code}
              onChange={onChange}
              disabled={submitting}
            />
            <Input
              name="device_name"
              placeholder="Tên thiết bị"
              value={formData.device_name}
              onChange={onChange}
              disabled={submitting}
            />
            <Input
              type="date"
              name="maintenance_date"
              placeholder="Ngày bảo trì"
              value={formData.maintenance_date}
              onChange={onChange}
              disabled={submitting}
            />
            <Input
              name="technician"
              placeholder="Người thực hiện"
              value={formData.technician}
              onChange={onChange}
              disabled={submitting}
            />
            <Textarea
              name="details"
              placeholder="Nội dung bảo trì"
              value={formData.details}
              onChange={onChange}
              disabled={submitting}
            />
            <Textarea
              name="note"
              placeholder="Ghi chú"
              value={formData.note}
              onChange={onChange}
              disabled={submitting}
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
                         border border-neutral-200/80 dark:border-neutral-800
                         text-neutral-700 dark:text-neutral-200
                         hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              disabled={submitting}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
                         bg-blue-600 hover:bg-blue-700 text-white shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function Input({ name, value, onChange, placeholder, type = "text", disabled }) {
    return (
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800
                   bg-white dark:bg-neutral-900
                   text-neutral-800 dark:text-neutral-100
                   placeholder-neutral-400 dark:placeholder-neutral-500
                   px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
      />
    );
  }

  function Textarea({ name, value, onChange, placeholder, disabled }) {
    return (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        rows={3}
        disabled={disabled}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800
                   bg-white dark:bg-neutral-900
                   text-neutral-800 dark:text-neutral-100
                   placeholder-neutral-400 dark:placeholder-neutral-500
                   px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
      />
    );
  }
};

export default Repairhistory;
