import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import AdminNavbar from "../../components/Navabar/AdminNavbar"
import AddUser from "../../components/Users/AddUser";



const SettingUser = () => {
    
  return (
    <>
      <Sidebar></Sidebar>
      <div className="relative md:ml-64 bg-slate-100">
        <AdminNavbar />
        <div className="px-4 md:px-10 mx-auto w-full m-10 absolute">
        <AddUser/>
        </div>
        
        
        {/* Header
        <HeaderStats /> */}
        {/* <div className="px-4 md:px-10 mx-auto w-full -m-24">
          
        </div> */}
      </div>
    </>
  );
};

export default SettingUser;
