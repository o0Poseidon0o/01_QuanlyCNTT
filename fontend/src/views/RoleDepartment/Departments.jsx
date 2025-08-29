import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import AdminNavbar from "../../components/Navabar/AdminNavbar";
import DepartmentApplication from "../../components/RoleDepartment/DepartmentApllication";
import FromRoleDepartment from "../../components/RoleDepartment/FormRoleDepartment";

const Department = () => {
  // console.log("Usermanager component loaded");
  return (
    <>
      <Sidebar></Sidebar>
      <div className="relative md:ml-64 bg-slate-100">
        <AdminNavbar />
        <div className="px-4 md:px-10 mx-auto w-full m-10 absolute">
          <FromRoleDepartment />
          <DepartmentApplication />
        </div>
      </div>
    </>
  );
};

export default Department;
