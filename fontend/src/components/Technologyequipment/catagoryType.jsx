import React, { useState } from "react";

const CategoryModal = ({ type, onClose, data }) => {
  const [items, setItems] = data[type];
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState(getEmptyForm());

  function getEmptyForm() {
    switch (type) {
      case "cpu":
        return { id_cpu: null, name_cpu: "" };
      case "ram":
        return { id_ram: null, name_ram: "" };
      case "screen":
        return { id_screen: null, name_screen: "", size_screen: "" };
      case "memory":
        return { id_memory: null, memory_type: "", size_memory: "" };
      case "os":
        return { id_operationsystem: null, name_operationsystem: "" };
      case "device_type":
        return { id_devicetype: null, device_type: "" };
      default:
        return {};
    }
  }

  const getIdKey = () => {
    return type === "cpu"
      ? "id_cpu"
      : type === "ram"
      ? "id_ram"
      : type === "screen"
      ? "id_screen"
      : type === "memory"
      ? "id_memory"
      : type === "os"
      ? "id_operationsystem"
      : "id_devicetype";
  };

  const getDisplayName = (item) => {
    switch (type) {
      case "cpu":
        return item.name_cpu;
      case "ram":
        return item.name_ram;
      case "screen":
        return `${item.name_screen} (${item.size_screen})`;
      case "memory":
        return `${item.memory_type} ${item.size_memory}`;
      case "os":
        return item.name_operationsystem;
      case "device_type":
        return item.device_type;
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (isEdit) {
      // Cập nhật
      setItems(
        items.map((i) => (i[getIdKey()] === formData[getIdKey()] ? formData : i))
      );
    } else {
      // Thêm mới
      const newItem = {
        ...formData,
        [getIdKey()]: Date.now(),
      };
      setItems([...items, newItem]);
    }
    setFormData(getEmptyForm());
    setIsEdit(false);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setIsEdit(true);
  };

  const handleDelete = (item) => {
    if (window.confirm("Bạn có chắc muốn xóa?")) {
      setItems(items.filter((i) => i[getIdKey()] !== item[getIdKey()]));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-2/3 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Quản lý {type.toUpperCase()}</h2>

        {/* Danh sách */}
        <table className="w-full border mb-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">Tên</th>
              <th className="border px-2 py-1">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item[getIdKey()]}>
                  <td className="border px-2 py-1">{getDisplayName(item)}</td>
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
                <td colSpan="2" className="text-center py-2">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Form */}
        <div className="border-t pt-4">
          <h3 className="text-lg mb-2">
            {isEdit ? "Chỉnh sửa" : "Thêm mới"} {type.toUpperCase()}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {type === "cpu" && (
              <input
                type="text"
                name="name_cpu"
                placeholder="Tên CPU"
                value={formData.name_cpu}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
            )}
            {type === "ram" && (
              <input
                type="text"
                name="name_ram"
                placeholder="Tên RAM"
                value={formData.name_ram}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
            )}
            {type === "screen" && (
              <>
                <input
                  type="text"
                  name="name_screen"
                  placeholder="Tên màn hình"
                  value={formData.name_screen}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="size_screen"
                  placeholder="Kích thước"
                  value={formData.size_screen}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                />
              </>
            )}
            {type === "memory" && (
              <>
                <input
                  type="text"
                  name="memory_type"
                  placeholder="Loại ổ cứng"
                  value={formData.memory_type}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="size_memory"
                  placeholder="Dung lượng"
                  value={formData.size_memory}
                  onChange={handleInputChange}
                  className="border p-2 rounded"
                />
              </>
            )}
            {type === "os" && (
              <input
                type="text"
                name="name_operationsystem"
                placeholder="Tên hệ điều hành"
                value={formData.name_operationsystem}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
            )}
            {type === "device_type" && (
              <input
                type="text"
                name="device_type"
                placeholder="Loại thiết bị"
                value={formData.device_type}
                onChange={handleInputChange}
                className="border p-2 rounded"
              />
            )}
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
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
