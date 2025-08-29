import React, { useState } from "react";
import CategoryModal from "../Technologyequipment/catagoryType";

const TechEquipment = () => {
  // Mock danh mục
  const [deviceTypes, setDeviceTypes] = useState([
    { id_devicetype: 1, device_type: "Laptop" },
    { id_devicetype: 2, device_type: "Desktop" }
  ]);

  const [cpus, setCpus] = useState([
    { id_cpu: 1, name_cpu: "Intel i5" },
    { id_cpu: 2, name_cpu: "Intel i7" }
  ]);

  const [rams, setRams] = useState([
    { id_ram: 1, name_ram: "8GB" },
    { id_ram: 2, name_ram: "16GB" }
  ]);

  const [screens, setScreens] = useState([
    { id_screen: 1, name_screen: "Dell", size_screen: "24 inch" }
  ]);

  const [memories, setMemories] = useState([
    { id_memory: 1, memory_type: "SSD", size_memory: "512GB" }
  ]);

  const [osList, setOsList] = useState([
    { id_os: 1, name_os: "Windows 10" }
  ]);

  // Danh sách thiết bị
  const [devices, setDevices] = useState([
    {
      id: 1,
      device_name: "Laptop Dell",
      user: "Nguyễn Văn A",
      device_type: 1,
      buy_date: "2024-01-10",
      warranty_date: "2026-01-10",
      cpu: 1,
      ram: 1,
      screen: 1,
      memory: 1,
      os: 1,
      size: "15 inch"
    }
  ]);

  // Modal state
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Modal danh mục
  const [categoryModal, setCategoryModal] = useState({
    open: false,
    type: null
  });

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    device_name: "",
    user: "",
    device_type: "",
    buy_date: "",
    warranty_date: "",
    cpu: "",
    ram: "",
    screen: "",
    memory: "",
    os: "",
    size: ""
  });

  const openAddModal = () => {
    setFormData({
      id: null,
      device_name: "",
      user: "",
      device_type: "",
      buy_date: "",
      warranty_date: "",
      cpu: "",
      ram: "",
      screen: "",
      memory: "",
      os: "",
      size: ""
    });
    setAddModalOpen(true);
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    setFormData({ ...device });
    setEditModalOpen(true);
  };

  const closeAddModal = () => setAddModalOpen(false);
  const closeEditModal = () => setEditModalOpen(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addDevice = () => {
    const newDevice = { ...formData, id: Date.now() };
    setDevices([...devices, newDevice]);
    closeAddModal();
  };

  const updateDevice = () => {
    setDevices(
      devices.map((d) => (d.id === formData.id ? formData : d))
    );
    closeEditModal();
  };

  const deleteDevice = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa thiết bị này?")) {
      setDevices(devices.filter((d) => d.id !== id));
    }
  };

  const openCategoryModal = (type) => {
    setCategoryModal({ open: true, type });
  };

  const closeCategoryModal = () => {
    setCategoryModal({ open: false, type: null });
  };

  const getCategoryName = (id, type) => {
    const map = {
      cpu: cpus,
      ram: rams,
      screen: screens,
      memory: memories,
      os: osList,
      device_type: deviceTypes
    };
    const found = map[type].find((item) =>
      type === "device_type" ? item.id_devicetype === id :
      type === "cpu" ? item.id_cpu === id :
      type === "ram" ? item.id_ram === id :
      type === "screen" ? item.id_screen === id :
      type === "memory" ? item.id_memory === id :
      type === "os" ? item.id_os === id : false
    );
    if (!found) return "";
    return (
      type === "device_type" ? found.device_type :
      type === "cpu" ? found.name_cpu :
      type === "ram" ? found.name_ram :
      type === "screen" ? `${found.name_screen} (${found.size_screen})` :
      type === "memory" ? `${found.memory_type} ${found.size_memory}` :
      type === "os" ? found.name_os : ""
    );
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl pb-3 flex items-center">
        <i className="fas fa-laptop mr-3"></i> Quản lý thiết bị CNTT
      </h2>

      {/* Nút thêm thiết bị */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Thêm thiết bị
        </button>
      </div>

      {/* Bảng danh sách thiết bị */}
      <div className="bg-white overflow-auto shadow rounded">
        <table className="text-left w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">
                Loại thiết bị
                <button
                  onClick={() => openCategoryModal("device_type")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">Tên thiết bị</th>
              <th className="py-2 px-3">Người dùng</th>
              <th className="py-2 px-3">Ngày mua</th>
              <th className="py-2 px-3">Ngày bảo hành</th>
              <th className="py-2 px-3">
                CPU
                <button
                  onClick={() => openCategoryModal("cpu")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">
                RAM
                <button
                  onClick={() => openCategoryModal("ram")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">
                Màn hình
                <button
                  onClick={() => openCategoryModal("screen")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">
                Ổ cứng
                <button
                  onClick={() => openCategoryModal("memory")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">
                Hệ điều hành
                <button
                  onClick={() => openCategoryModal("os")}
                  className="ml-2 text-blue-500"
                >
                  +
                </button>
              </th>
              <th className="py-2 px-3">Kích thước</th>
              <th className="py-2 px-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-t">
                <td className="py-2 px-3">{device.id}</td>
                <td className="py-2 px-3">{getCategoryName(device.device_type, "device_type")}</td>
                <td className="py-2 px-3">{device.device_name}</td>
                <td className="py-2 px-3">{device.user}</td>
                <td className="py-2 px-3">{device.buy_date}</td>
                <td className="py-2 px-3">{device.warranty_date}</td>
                <td className="py-2 px-3">{getCategoryName(device.cpu, "cpu")}</td>
                <td className="py-2 px-3">{getCategoryName(device.ram, "ram")}</td>
                <td className="py-2 px-3">{getCategoryName(device.screen, "screen")}</td>
                <td className="py-2 px-3">{getCategoryName(device.memory, "memory")}</td>
                <td className="py-2 px-3">{getCategoryName(device.os, "os")}</td>
                <td className="py-2 px-3">{device.size}</td>
                <td className="py-2 px-3 flex space-x-2">
                  <button
                    onClick={() => openEditModal(device)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteDevice(device.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal thêm thiết bị */}
      {isAddModalOpen && (
        <Modal title="Thêm thiết bị" onClose={closeAddModal} onSubmit={addDevice} formData={formData} onChange={handleInputChange} categories={{ deviceTypes, cpus, rams, screens, memories, osList }} />
      )}

      {/* Modal sửa thiết bị */}
      {isEditModalOpen && (
        <Modal title="Chỉnh sửa thiết bị" onClose={closeEditModal} onSubmit={updateDevice} formData={formData} onChange={handleInputChange} categories={{ deviceTypes, cpus, rams, screens, memories, osList }} />
      )}

      {/* Modal danh mục */}
      {categoryModal.open && (
        <CategoryModal
          type={categoryModal.type}
          onClose={closeCategoryModal}
          data={{
            cpu: [cpus, setCpus],
            ram: [rams, setRams],
            screen: [screens, setScreens],
            memory: [memories, setMemories],
            os: [osList, setOsList],
            device_type: [deviceTypes, setDeviceTypes]
          }}
        />
      )}
    </div>
  );
};

const Modal = ({ title, onClose, onSubmit, formData, onChange, categories }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-1/2">
        <h2 className="text-xl mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input name="device_name" value={formData.device_name} onChange={onChange} placeholder="Tên thiết bị" className="border p-2 rounded" />
          <input name="user" value={formData.user} onChange={onChange} placeholder="Người dùng" className="border p-2 rounded" />
          <select name="device_type" value={formData.device_type} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn loại thiết bị</option>
            {categories.deviceTypes.map(dt => <option key={dt.id_devicetype} value={dt.id_devicetype}>{dt.device_type}</option>)}
          </select>
          <input type="date" name="buy_date" value={formData.buy_date} onChange={onChange} className="border p-2 rounded" />
          <input type="date" name="warranty_date" value={formData.warranty_date} onChange={onChange} className="border p-2 rounded" />
          <select name="cpu" value={formData.cpu} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn CPU</option>
            {categories.cpus.map(cpu => <option key={cpu.id_cpu} value={cpu.id_cpu}>{cpu.name_cpu}</option>)}
          </select>
          <select name="ram" value={formData.ram} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn RAM</option>
            {categories.rams.map(ram => <option key={ram.id_ram} value={ram.id_ram}>{ram.name_ram}</option>)}
          </select>
          <select name="screen" value={formData.screen} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn Màn hình</option>
            {categories.screens.map(scr => <option key={scr.id_screen} value={scr.id_screen}>{scr.name_screen} ({scr.size_screen})</option>)}
          </select>
          <select name="memory" value={formData.memory} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn Ổ cứng</option>
            {categories.memories.map(mem => <option key={mem.id_memory} value={mem.id_memory}>{mem.memory_type} {mem.size_memory}</option>)}
          </select>
          <select name="os" value={formData.os} onChange={onChange} className="border p-2 rounded">
            <option value="">Chọn Hệ điều hành</option>
            {categories.osList.map(os => <option key={os.id_os} value={os.id_os}>{os.name_os}</option>)}
          </select>
          <input name="size" value={formData.size} onChange={onChange} placeholder="Kích thước" className="border p-2 rounded" />
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Hủy</button>
          <button onClick={onSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default TechEquipment;
