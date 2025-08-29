import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import AdminNavbar from "../../components/Navabar/AdminNavbar"
import DataEntry from "../../components/Dataentry/DataEntry";

const DataEntryViews = () => {
    // console.log("Usermanager component loaded");
  return (
    <>
      <Sidebar></Sidebar>
      <div className="relative md:ml-64 bg-slate-100">
        <AdminNavbar />
        <div className="px-4 md:px-10 mx-auto w-full m-10 absolute">
        <DataEntry/>
        </div>
        
      </div>
    </>
  );
};

export default DataEntryViews;
