/* eslint-disable */
import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import UserDropdown from "../Dropdowns/UserDropdown";
import logo from "../../images/logo/logo_towa.png";

// ⬇️ Import util & rule dùng chung
import { getPermissions, canAccess } from "../unitls/acl";
import { RULES } from "../../config/auth-rules";

/** Helper gọn gàng để nối class */
function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

/** Link đơn */
function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={cx(
        "flex items-center gap-2 px-3 py-2 rounded-md text-xs uppercase font-bold transition",
        "text-blueGray-700 hover:text-red-600 hover:bg-blueGray-50",
        "dark:text-blueGray-200 dark:hover:bg-blueGray-800",
        active && "bg-blue-50 text-blue-600 border-l-4 border-blue-500 pl-2"
      )}
    >
      <i className={cx(icon, "mr-1 text-sm", active && "text-blue-600")} />
      {label}
    </Link>
  );
}

/** Nhóm có submenu (hover desktop, click mobile) */
function NavGroup({ icon, label, children, isOpen, setOpen }) {
  return (
    <li className="relative group select-none">
      {/* Button cho mobile mở/đóng; desktop vẫn hover */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-full text-left flex items-center justify-between px-3 py-2 rounded-md",
          "text-blueGray-700 hover:text-red-600 hover:bg-blueGray-50",
          "text-xs uppercase font-bold transition",
          "dark:text-blueGray-200 dark:hover:bg-blueGray-800"
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <i className={cx(icon, "mr-1 text-sm")} />
          {label}
        </span>
        <i
          className={cx(
            "fas fa-chevron-down text-[10px] transition-transform md:opacity-0 md:group-hover:opacity-100",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Submenu: hover (md) + open (mobile) với animation gọn mượt */}
      <ul
        className={cx(
          "mt-1 ml-2 border-l-2 border-blueGray-200 pl-2 rounded-md",
          "bg-white/70 dark:bg-blueGray-900/40",
          // Animation: chiều cao + mờ + trượt xuống
          "overflow-hidden transition-all duration-300 ease-out origin-top",
          // Trạng thái đóng (mặc định)
          "max-h-0 opacity-0 translate-y-1 pointer-events-none",
          // Mở khi hover trên desktop
          "md:group-hover:max-h-96 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto",
          // Mở khi mobile bấm
          isOpen && "max-h-96 opacity-100 translate-y-0 pointer-events-auto"
        )}
      >
        {children}
      </ul>
    </li>
  );
}

export default function Sidebar() {
  const [collapseShow, setCollapseShow] = useState("hidden"); // menu mobile

  // State nhóm
  const [openEquip, setOpenEquip] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const [openFunc, setOpenFunc] = useState(false);
  const [openBCDB, setOpenBCDB] = useState(false); // BCDB (mobile)

  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const startsWith = (prefixes = []) =>
    prefixes.some((p) => location.pathname.startsWith(p));

  // 🔐 Quyền hiện có (đọc từ localStorage qua util chung)
  const perms = useMemo(() => getPermissions(), []);

  /** ====== DÙNG CHUNG RULES ======
   * RULES định nghĩa tại: src/config/auth-rules.js
   * - PROFILE:        role.manager | user.* | user.hr
   * - DEVICES_GROUP:  role.manager | device.* | device.static
   * - DOCS_GROUP:     role.manager
   * - HR_GROUP:       role.manager | user.hr
   * - BCDB_GROUP:     role.manager
   * - DEVICES_LIST:   role.manager | device.*
   * - DEVICES_REPAIR: role.manager | device.*
   * - DEVICES_STATS:  role.manager | device.* | device.static
   */
  const showProfile   = canAccess(perms, RULES.PROFILE);
  const showDeviceGrp = canAccess(perms, RULES.DEVICES_GROUP);
  const showDocs      = canAccess(perms, RULES.DOCS_GROUP);
  const showHR        = canAccess(perms, RULES.HR_GROUP);
  const showBCDB      = canAccess(perms, RULES.BCDB_GROUP);

  const canDeviceList   = canAccess(perms, RULES.DEVICES_LIST);
  const canDeviceRepair = canAccess(perms, RULES.DEVICES_REPAIR);
  const canDeviceStats  = canAccess(perms, RULES.DEVICES_STATS);

  return (
    <>
      <nav
        className={cx(
          "md:left-0 md:block md:fixed md:top-0 md:bottom-0",
          "md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden",
          "shadow-xl bg-white/95 dark:bg-blueGray-900/95 backdrop-blur",
          "flex flex-wrap items-center justify-between",
          "relative md:w-64 z-50 py-4 px-4 md:px-6"
        )}
      >
        <div className="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto">
          {/* Toggler mobile */}
          <button
            className="cursor-pointer text-black dark:text-blueGray-200 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
            type="button"
            onClick={() =>
              setCollapseShow((s) =>
                s === "hidden" ? "bg-white m-2 py-3 px-4 rounded-lg" : "hidden"
              )
            }
            aria-label="Toggle navigation"
          >
            <i className="fas fa-bars" />
          </button>

          {/* Brand */}
          <Link
            className="md:block text-left md:pb-2 text-blueGray-600 dark:text-blueGray-100 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
            to="/"
          >
            <img src={logo} alt="Logo" className="w-1/2 h-auto md:w-3/4" />
          </Link>

          {/* User (mobile) */}
          <ul className="md:hidden items-center flex flex-wrap list-none">
            <li className="inline-block relative">
              <UserDropdown />
            </li>
          </ul>

          {/* Collapse container */}
          <div
            className={cx(
              "md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-2 md:shadow-none",
              "shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded",
              collapseShow
            )}
          >
            {/* Collapse header (mobile) */}
            <div className="md:min-w-full md:hidden block pb-3 mb-3 border-b border-solid border-blueGray-200">
              <div className="flex flex-wrap items-center">
                <div className="w-6/12">
                  <Link
                    className="md:block text-left text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
                    to="/"
                  >
                    <img src={logo} alt="Logo" className="h-8" />
                  </Link>
                </div>
                <div className="w-6/12 flex justify-end">
                  <button
                    type="button"
                    className="cursor-pointer text-black dark:text-blueGray-200 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
                    onClick={() => setCollapseShow("hidden")}
                    aria-label="Close navigation"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Search (mobile) */}
            <form className="mt-3 mb-4 md:hidden">
              <div className="mb-3 pt-0">
                <input
                  type="text"
                  placeholder="Search"
                  className="border px-3 py-2 h-11 placeholder-blueGray-300 text-blueGray-700 bg-white rounded-md text-sm leading-snug outline-none focus:ring w-full"
                />
              </div>
            </form>

            {/* Divider */}
            <hr className="my-4 md:min-w-full" />

            {/* Tài khoản */}
            {showProfile && (
              <>
                <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4 gap-1">
                  <li className="items-center">
                    <NavLink
                      to="/userprofile"
                      icon="fas fa-user-circle text-blueGray-400"
                      label="Thông tin của tài khoản"
                      active={isActive("/userprofile")}
                    />
                  </li>
                </ul>
                <hr className="my-4 md:min-w-full" />
              </>
            )}

            {/* Quản lý thiết bị CNTT */}
            {showDeviceGrp && (
              <>
                <h6 className="md:min-w-full text-blueGray-500 dark:text-blueGray-300 text-[11px] tracking-wider uppercase font-bold block pt-1 pb-2">
                  Quản lý thiết bị CNTT
                </h6>
                <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4 gap-1">
                  <NavGroup
                    icon="fas fa-fingerprint text-blueGray-400"
                    label="Các loại thiết bị"
                    isOpen={
                      openEquip ||
                      startsWith(["/Techequipment", "/Repairhistory", "/Staticsequipment","/Softwarelist"])
                    }
                    setOpen={setOpenEquip}
                  >
                    {canDeviceList && (
                      <li>
                        <NavLink
                          to="/Techequipment"
                          icon="fas fa-list text-blueGray-400"
                          label="Danh sách thông tin thiết bị"
                          active={isActive("/Techequipment")}
                        />
                      </li>
                    )}
                    {canDeviceRepair && (
                      <li>
                        <NavLink
                          to="/Softwarelist"
                          icon="fas fa-th-large text-indigo-500"
                          label="Quản lý phần mềm"
                          active={isActive("/Softwarelist")}
                        />
                      </li>
                    )}
                    {canDeviceStats && (
                      <li>
                        <NavLink
                          to="/Staticsequipment"
                          icon="fas fa-chart-pie text-blueGray-400"
                          label="Thống kê"
                          active={isActive("/Staticsequipment")}
                        />
                      </li>
                    )}
                    {canDeviceRepair && (
                      <li>
                        <NavLink
                          to="/Repairhistory"
                          icon="fas fa-tools text-blueGray-400"
                          label="Lịch sử sửa chữa"
                          active={isActive("/Repairhistory")}
                        />
                      </li>
                    )}
                    
                  </NavGroup>
                </ul>
                <hr className="my-4 md:min-w-full" />
              </>
            )}

            

            {/* Nhân sự (manager hoặc user.hr) */}
            {showHR && (
              <>
                <h6 className="md:min-w-full text-blueGray-500 dark:text-blueGray-300 text-[11px] tracking-wider uppercase font-bold block pt-1 pb-2">
                  Nhân sự
                </h6>
                <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4 gap-1">
                  <NavGroup
                    icon="fas fa-shield-alt text-blueGray-400"
                    label="Quản lý Role và phòng ban"
                    isOpen={openManage || startsWith(["/RoleDepartment", "/Department"])}
                    setOpen={setOpenManage}
                  >
                    <li>
                      <NavLink
                        to="/RoleDepartment"
                        icon="fas fa-user-shield text-blueGray-400"
                        label="Quản lý Role"
                        active={isActive("/RoleDepartment")}
                      />
                    </li>
                    <li>
                      <NavLink
                        to="/Department"
                        icon="fas fa-building text-blueGray-400"
                        label="Quản lý Phòng ban"
                        active={isActive("/Department")}
                      />
                    </li>
                  </NavGroup>

                  <NavGroup
                    icon="fas fa-users-cog text-blueGray-400"
                    label="Quản lý User"
                    isOpen={openFunc || startsWith(["/Adduser", "/SettingUser"])}
                    setOpen={setOpenFunc}
                  >
                    <li>
                      <NavLink
                        to="/Adduser"
                        icon="fas fa-user-plus text-blueGray-400"
                        label="Thêm User"
                        active={isActive("/Adduser")}
                      />
                    </li>
                    <li>
                      <NavLink
                        to="/SettingUser"
                        icon="fas fa-users text-blueGray-400"
                        label="Quản lý User"
                        active={isActive("/SettingUser")}
                      />
                    </li>
                  </NavGroup>
                </ul>
                <hr className="my-4 md:min-w-full" />
              </>
            )}
{/* Văn bản (manager) */}
            {showDocs && (
              <>
                <h6 className="md:min-w-full text-blueGray-500 dark:text-blueGray-300 text-[11px] tracking-wider uppercase font-bold block pt-1 pb-2">
                  Văn bản
                </h6>
                <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4 gap-1">
                  <NavGroup
                    icon="fas fa-file-alt text-blueGray-400"
                    label="Các loại văn bản"
                    isOpen={openDocs || startsWith(["/DocumentsManagement"])}
                    setOpen={setOpenDocs}
                  >
                    <li>
                      <NavLink
                        to="/DocumentsManagement"
                        icon="fas fa-folder-open text-blueGray-400"
                        label="Quản lý văn bản"
                        active={isActive("/DocumentsManagement")}
                      />
                    </li>
                    <li>
                      <NavLink
                        to="#"
                        icon="fas fa-th-list text-blueGray-400"
                        label="Danh sách văn bản"
                        active={false}
                      />
                    </li>
                  </NavGroup>
                </ul>
                <hr className="my-4 md:min-w-full" />
              </>
            )}
            {/* Các Trang chức năng (manager) */}
            {showBCDB && (
              <>
                <h6 className="md:min-w-full text-blueGray-500 dark:text-blueGray-300 text-[11px] tracking-wider uppercase font-bold block pt-1 pb-2">
                  Các Trang chức năng
                </h6>
                <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4 gap-1">
                  <NavGroup
                    icon="fas fa-database text-blueGray-400"
                    label="Nhập liệu BCDB"
                    isOpen={openBCDB || startsWith(["/Dataentry", "/Chartview"])}
                    setOpen={setOpenBCDB}
                  >
                    <li>
                      <NavLink
                        to="/Dataentry"
                        icon="fas fa-calendar-alt text-blueGray-400"
                        label="Lịch nhập liệu"
                        active={isActive("/Dataentry")}
                      />
                    </li>
                    <li>
                      <NavLink
                        to="/Chartview"
                        icon="fas fa-chart-line text-blueGray-400"
                        label="Tổng hợp"
                        active={isActive("/Chartview")}
                      />
                    </li>
                  </NavGroup>
                </ul>
                <hr className="my-4 md:min-w-full" />
              </>
            )}

            {/* Footer */}
            <footer className="mt-auto text-center py-4 border-t border-blueGray-200 dark:border-blueGray-700">
              <p className="text-blueGray-500 dark:text-blueGray-300 text-sm">
                © {new Date().getFullYear()} Towa Việt Nam.
              </p>
              <p className="text-blueGray-400 dark:text-blueGray-500 text-xs">
                <Link to="/terms" className="hover:text-red-600">
                  Copyright
                </Link>{" "}
                |{" "}
                <Link to="/privacy" className="hover:text-red-600">
                  Lê Minh Nhân V 1.0
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </nav>
    </>
  );
}
