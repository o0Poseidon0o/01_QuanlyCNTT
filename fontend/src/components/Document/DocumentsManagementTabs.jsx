import React, { useState } from "react";

const DocumentManagementTabs = () => {
  const [activeTab, setActiveTab] = useState("list");

  const tabs = [
    { id: "list", label: "Danh sách văn bản" },
    { id: "add", label: "Thêm mới" },
    { id: "categories", label: "Phân loại" },
    { id: "stats", label: "Thống kê" },
  ];

  return (
    <div className="p-4">
      {/* Tabs header */}
      <div className="relative flex">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-${10 - index} px-6 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === tab.id
                ? "bg-white text-blue-500 border border-b-0 border-gray-300"
                : "bg-gray-100 text-gray-500 hover:text-blue-500 border border-gray-300"
            }`}
            style={{
              marginLeft: index !== 0 ? "-10px" : "0", // Tab sau chồng lên tab trước
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs content */}
      <div className="border border-gray-300 p-4 rounded-b-lg bg-white">
        {activeTab === "list" && (
          <div>
            <h2 className="text-lg font-semibold">Danh sách văn bản</h2>
            <p>Hiển thị danh sách các văn bản hiện tại.</p>
            {/* Thêm bảng danh sách tại đây */}
          </div>
        )}
        {activeTab === "add" && (
          <div>
            <h2 className="text-lg font-semibold">Thêm mới văn bản</h2>
            <p>Form để thêm văn bản mới vào hệ thống.</p>
            {/* Thêm form thêm văn bản tại đây */}
          </div>
        )}
        {activeTab === "categories" && (
          <div>
            <h2 className="text-lg font-semibold">Phân loại văn bản</h2>
            <p>Danh sách các loại văn bản.</p>
            {/* Hiển thị các loại văn bản */}
          </div>
        )}
        {activeTab === "stats" && (
          <div>
            <h2 className="text-lg font-semibold">Thống kê văn bản</h2>
            <p>Biểu đồ hoặc bảng số liệu thống kê.</p>
            {/* Thêm biểu đồ tại đây */}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagementTabs;
