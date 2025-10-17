// src/components/Techequipment/catagoryType.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "../../lib/httpClient";

const API_BASE = "http://localhost:5000/api";

const CategoryModal = ({ type, onClose }) => {
  const [items, setItems] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});

  // Chuẩn hoá form trống theo type (GIỮ NGUYÊN LOGIC)
  const getEmptyForm = useCallback(() => {
    switch (type) {
      case "cpu":
        return { id_cpu: "", name_cpu: "" };
      case "ram":
        return { id_ram: "", name_ram: "" };
      case "screen":
        return { id_screen: "", name_screen: "", size_screen: "" };
      case "memory":
        return { id_memory: "", memory_type: "", size_memory: "" };
      case "operations":
        return { id_operationsystem: "", name_operationsystem: "" };
      case "devicestype":
        return { id_devicetype: "", device_type: "" };
      default:
        return {};
    }
  }, [type]);

  // Lấy khóa ID theo type (GIỮ NGUYÊN LOGIC)
  const getIdKey = useCallback(() => {
    switch (type) {
      case "cpu":
        return "id_cpu";
      case "ram":
        return "id_ram";
      case "screen":
        return "id_screen";
      case "memory":
        return "id_memory";
      case "operations":
        return "id_operationsystem";
      case "devicestype":
        return "id_devicetype";
      default:
        return "";
    }
  }, [type]);

  // Chuẩn hoá dữ liệu trả về theo type (GIỮ NGUYÊN LOGIC)
  const pickList = useCallback(
    (data) => {
      switch (type) {
        case "cpu":
          return Array.isArray(data?.cpus) ? data.cpus : Array.isArray(data) ? data : [];
        case "ram":
          return Array.isArray(data?.rams) ? data.rams : Array.isArray(data) ? data : [];
        case "screen":
          return Array.isArray(data?.screens) ? data.screens : Array.isArray(data) ? data : [];
        case "memory":
          return Array.isArray(data?.memories) ? data.memories : Array.isArray(data) ? data : [];
        case "operations":
          return Array.isArray(data?.operationsystems)
            ? data.operationsystems
            : Array.isArray(data)
            ? data
            : [];
        case "devicestype":
          return Array.isArray(data?.devicetypes) ? data.devicetypes : Array.isArray(data) ? data : [];
        default:
          return [];
      }
    },
    [type]
  );

  // Lấy danh sách (GIỮ NGUYÊN LOGIC)
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/${type}/all`);
      setItems(pickList(res.data));
    } catch (error) {
      if (error?.response?.status === 404) {
        setItems([]);
      } else {
        console.error("Lỗi khi lấy dữ liệu:", error?.response?.data || error.message);
      }
    }
  }, [type, pickList]);

  useEffect(() => {
    setFormData(getEmptyForm());
    fetchData();
  }, [fetchData, getEmptyForm]);

  // Form change (GIỮ NGUYÊN LOGIC)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Thêm / Sửa (GIỮ NGUYÊN LOGIC)
  const handleSubmit = async () => {
    try {
      const idKey = getIdKey();
      if (isEdit) {
        await axios.put(`${API_BASE}/${type}/update/${formData[idKey]}`, formData);
      } else {
        await axios.post(`${API_BASE}/${type}/add`, formData);
      }
      await fetchData();
      setFormData(getEmptyForm());
      setIsEdit(false);
    } catch (error) {
      const msg = error?.response?.data?.message || "Có lỗi xảy ra!";
      console.error("Lỗi khi gửi dữ liệu:", error?.response?.data || error.message);
      alert(msg);
    }
  };

  // Chọn để sửa (GIỮ NGUYÊN LOGIC)
  const handleEdit = (item) => {
    setFormData(item);
    setIsEdit(true);
  };

  // Xoá (GIỮ NGUYÊN LOGIC)
  const handleDelete = async (item) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await axios.delete(`${API_BASE}/${type}/delete/${item[getIdKey()]}`);
      await fetchData();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error.message || "";
      const isFK =
        status === 409 ||
        /foreign key|constraint/i.test(message) ||
        /tham chiếu/i.test(message);

      if (isFK) {
        alert("Không thể xoá vì mục này đang được tham chiếu bởi thiết bị.");
      } else if (status === 404) {
        alert("Bản ghi không tồn tại (đã bị xoá trước đó).");
      } else {
        alert("Xoá thất bại. Vui lòng thử lại.");
      }

      console.error("Lỗi khi xóa:", error?.response?.data || error.message);
    }
  };

  // Headers của bảng (GIỮ NGUYÊN LOGIC)
  const getTableHeaders = () => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return Object.keys(items[0]);
  };

  const idKey = getIdKey();
  const headers = getTableHeaders();

  // ------- UI: dịu mắt + dark/light + bảng cuộn ngang + header dính -------
  const cardBg = "bg-white dark:bg-slate-800";
  const cardBorder = "border border-slate-200 dark:border-slate-700";
  const inputCls =
    "h-10 rounded-lg px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition";

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-3">
      <div className={`${cardBg} ${cardBorder} rounded-2xl shadow-xl w-[960px] max-w-[96vw] max-h-[92vh] flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
              Quản lý {String(type).toUpperCase()}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Light/Dark thân thiện mắt • Bảng full cột + cuộn ngang
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="h-9 px-3 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/70 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
              title="Tải lại"
            >
              <i className="fas fa-rotate" /> <span className="hidden sm:inline">Tải lại</span>
            </button>
            <button
              onClick={onClose}
              className="h-9 px-3 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/70 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 pt-4 overflow-auto">
          {/* Bảng danh sách */}
          <div className={`${cardBorder} rounded-xl overflow-hidden`}>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/70">
                  <tr>
                    {headers.map((key) => (
                      <th
                        key={key}
                        className="py-3.5 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700"
                      >
                        {key}
                      </th>
                    ))}
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 min-w-[160px]">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(items) && items.length > 0 ? (
                    items.map((item, i) => {
                      const zebra =
                        i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/80";
                      return (
                        <tr key={item[idKey]} className={`${zebra} border-t border-slate-100 dark:border-slate-700/60`}>
                          {headers.map((key) => (
                            <td key={key} className="py-3 px-3 align-top text-sm">
                              <span className="break-words">{item[key]}</span>
                            </td>
                          ))}
                          <td className="py-3 px-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="h-9 px-3 rounded-md border border-emerald-700/40 text-emerald-900 dark:text-emerald-100 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 transition"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="h-9 px-3 rounded-md border border-rose-700/40 text-rose-50 bg-rose-700 hover:bg-rose-600 transition"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={headers.length + 1}
                        className="text-center py-6 text-slate-500 dark:text-slate-400"
                      >
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form thêm/chỉnh sửa */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-3">
              {isEdit ? "Chỉnh sửa" : "Thêm mới"} {String(type).toUpperCase()}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {Object.keys(formData).map((key) => (
                <input
                  key={key}
                  type="text"
                  name={key}
                  placeholder={`Nhập ${key}`}
                  value={formData[key] ?? ""}
                  onChange={handleInputChange}
                  className={`${inputCls} ${isEdit && key === idKey ? "bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed" : ""}`}
                  disabled={isEdit && key === idKey}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSubmit}
                className="h-10 px-4 rounded-md border border-slate-500/50 text-slate-100 bg-slate-700 hover:bg-slate-600 transition"
              >
                {isEdit ? "Cập nhật" : "Thêm"}
              </button>
              {isEdit && (
                <button
                  onClick={() => {
                    setFormData(getEmptyForm());
                    setIsEdit(false);
                  }}
                  className="h-10 px-4 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/70 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
                >
                  Hủy
                </button>
              )}
              <button
                onClick={onClose}
                className="h-10 px-4 rounded-md border border-slate-400/60 text-slate-800 dark:text-slate-100 bg-white/70 hover:bg-white/90 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
