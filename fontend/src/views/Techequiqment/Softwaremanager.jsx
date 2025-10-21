import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import AdminNavbar from "../../components/Navabar/AdminNavbar";
import SoftwareManager from "../../components/Technologyequipment/Software";



const Softwarelist = () => {
  // console.log("Usermanager component loaded");
  return (
    <>
      <Sidebar></Sidebar>
      <div className="relative md:ml-64 bg-slate-100">
        <AdminNavbar />
        <div className="px-4 md:px-10 mx-auto w-full m-20 absolute">
          <SoftwareManager />
        </div>
      </div>
    </>
  );
};

export default Softwarelist;
