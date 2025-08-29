import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import AdminNavbar from "../../components/Navabar/AdminNavbar";
const AdminPage = () => {
  return (
    <>
      <Sidebar></Sidebar>
      <div className="relative md:ml-64 bg-slate-100">
        <AdminNavbar />
        <div className="px-4 md:px-10 mx-auto w-full m-10 absolute">
          <div className="mt-10">
            <h1>Đây là nơi chứa những ứng dụng nhỏ</h1>
            <h1>Tác giả: Lê Minh Nhân</h1>
          </div>
        </div>
        {/* Header
        <HeaderStats /> */}
        {/* <div className="px-4 md:px-10 mx-auto w-full -m-24">
          
        </div> */}
      </div>
    </>
  );
};

export default AdminPage;
