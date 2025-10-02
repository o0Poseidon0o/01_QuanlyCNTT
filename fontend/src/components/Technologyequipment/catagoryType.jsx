import React, { useState, useEffect, useCallback } from "react";
import axios from "../../lib/httpClient";

const API_BASE = "http://localhost:5000/api";

const CategoryModal = ({ type, onClose }) => {
  const [items, setItems] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});

  // Chuẩn hoá form trống theo type
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

  // Lấy khóa ID theo type
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

  // Chuẩn hoá dữ liệu trả về theo type (đề phòng API trả nhiều dạng)
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

  // Lấy danh sách
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/${type}/all`);
      setItems(pickList(res.data));
    } catch (error) {
      // Nếu 404 coi như rỗng để không crash UI
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

  // Form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Thêm / Sửa
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

  // Chọn để sửa
  const handleEdit = (item) => {
    setFormData(item);
    setIsEdit(true);
  };

  // Xoá (bắt lỗi FK)
  const handleDelete = async (item) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await axios.delete(`${API_BASE}/${type}/delete/${item[getIdKey()]}`);
      await fetchData();
    } catch (error) {
      // Bắt lỗi FK từ server hoặc message chứa constraint
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

  // Lấy headers để render bảng
  const getTableHeaders = () => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return Object.keys(items[0]);
  };

  const idKey = getIdKey();
  const headers = getTableHeaders();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-4/5 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Quản lý {String(type).toUpperCase()}</h2>

        {/* Bảng danh sách */}
        <table className="w-full border mb-4">
          <thead>
            <tr>
              {headers.map((key) => (
                <th key={key} className="border px-2 py-1">
                  {key}
                </th>
              ))}
              <th className="border px-2 py-1">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item) => (
                <tr key={item[idKey]}>
                  {headers.map((key) => (
                    <td key={key} className="border px-2 py-1">
                      {item[key]}
                    </td>
                  ))}
                  <td className="border px-2 py-1 space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length + 1} className="text-center py-2">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Form thêm/chỉnh sửa */}
        <div className="border-t pt-4">
          <h3 className="text-lg mb-2">
            {isEdit ? "Chỉnh sửa" : "Thêm mới"} {String(type).toUpperCase()}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                placeholder={`Nhập ${key}`}
                value={formData[key] ?? ""}
                onChange={handleInputChange}
                className="border p-2 rounded"
                disabled={isEdit && key === idKey}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {isEdit ? "Cập nhật" : "Thêm"}
            </button>
            {isEdit && (
              <button
                onClick={() => {
                  setFormData(getEmptyForm());
                  setIsEdit(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Hủy
              </button>
            )}
            <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
