import React, { useEffect, useState } from "react";
import axios from "axios";

const Repairhistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    device_code: "",
    device_name: "",
    maintenance_date: "",
    details: "",
    technician: "",
    note: "",
  });

  // Fetch danh sách lịch sử bảo trì
  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/maintenance");
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching maintenance history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Tìm kiếm lịch sử
  const searchHistory = async (e) => {
    if (e.key === "Enter") {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/maintenance/search",
          { params: { keyword: searchTerm } }
        );
        setHistory(response.data || []);
      } catch (error) {
        console.error("Error searching maintenance:", error);
      }
    }
  };

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    setFormData({ ...record });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
  };

  // Thêm bảo trì
  const addRecord = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/maintenance", formData);
      alert(response.data.message || "Thêm lịch sử bảo trì thành công");
      fetchHistory();
      closeAddModal();
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      alert("Không thể thêm lịch sử bảo trì");
    }
  };

  // Cập nhật bảo trì
  const updateRecord = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/maintenance/${editingRecord.id}`,
        formData
      );
      alert(response.data.message || "Cập nhật thành công");
      fetchHistory();
      closeEditModal();
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      alert("Không thể cập nhật lịch sử bảo trì");
    }
  };

  // Xóa bảo trì
  const deleteRecord = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử này?")) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/maintenance/${id}`);
        alert(response.data.message || "Xóa thành công");
        fetchHistory();
      } catch (error) {
        console.error("Error deleting maintenance record:", error);
        alert("Không thể xóa lịch sử bảo trì");
      }
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="w-full mt-8">
      <p className="text-xl pb-3 flex items-center">
        <i className="fas fa-tools mr-3"></i> Lịch sử bảo trì thiết bị
      </p>

      {/* Thanh tìm kiếm */}
      <div className="mb-4 flex justify-between">
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã thiết bị"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={searchHistory}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Thêm bảo trì
        </button>
      </div>

      {/* Bảng danh sách lịch sử */}
      <div className="bg-white overflow-auto shadow rounded">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4">Mã thiết bị</th>
              <th className="py-3 px-4">Tên thiết bị</th>
              <th className="py-3 px-4">Ngày bảo trì</th>
              <th className="py-3 px-4">Nội dung</th>
              <th className="py-3 px-4">Người thực hiện</th>
              <th className="py-3 px-4">Ghi chú</th>
              <th className="py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id} className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">{record.device_code}</td>
                <td className="py-2 px-4">{record.device_name}</td>
                <td className="py-2 px-4">{record.maintenance_date}</td>
                <td className="py-2 px-4">{record.details}</td>
                <td className="py-2 px-4">{record.technician}</td>
                <td className="py-2 px-4">{record.note}</td>
                <td className="py-2 px-4 flex space-x-2">
                  <button
                    onClick={() => openEditModal(record)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm */}
      {isAddModalOpen && (
        <Modal title="Thêm lịch sử bảo trì" onClose={closeAddModal} onSave={addRecord} />
      )}

      {/* Modal Sửa */}
      {isEditModalOpen && (
        <Modal title="Chỉnh sửa lịch sử bảo trì" onClose={closeEditModal} onSave={updateRecord} />
      )}
    </div>
  );

  function Modal({ title, onClose, onSave }) {
    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded shadow-md w-1/3">
          <h2 className="text-xl mb-4">{title}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="device_code"
              placeholder="Mã thiết bị"
              value={formData.device_code}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="device_name"
              placeholder="Tên thiết bị"
              value={formData.device_name}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="date"
              name="maintenance_date"
              placeholder="Ngày bảo trì"
              value={formData.maintenance_date}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="details"
              placeholder="Nội dung bảo trì"
              value={formData.details}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="technician"
              placeholder="Người thực hiện"
              value={formData.technician}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="note"
              placeholder="Ghi chú"
              value={formData.note}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default Repairhistory;
