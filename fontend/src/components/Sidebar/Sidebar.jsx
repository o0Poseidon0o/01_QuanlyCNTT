/* eslint-disable */
import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import UserDropdown from "../Dropdowns/UserDropdown";
import logo from "../../images/logo/logo_towa.png";

import { getPermissions, canAccess } from "../unitls/acl";
import { RULES } from "../../config/auth-rules";

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

function SectionTitle({ children }) {
  return (
    <h6 className="md:min-w-full text-[12px] tracking-wider uppercase font-bold block pt-1 pb-2">
      <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
        {children}
      </span>
    </h6>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={cx(
        "group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm uppercase font-semibold transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
        "hover:translate-x-[2px]",
        active
          ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 pl-3 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-slate-700 hover:text-rose-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
      )}
    >
      <i
        className={cx(
          icon,
          "mr-1 text-[15px] transition-colors",
          active
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 group-hover:text-rose-500"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroup({ icon, label, children, isOpen, setOpen }) {
  return (
    <li className="relative group select-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-full text-left flex items-center justify-between px-4 py-2.5 rounded-lg",
          "text-sm uppercase font-semibold transition-all duration-200",
          "text-slate-700 hover:text-rose-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
        )}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          <i className={cx(icon, "text-[15px] text-slate-400 group-hover:text-rose-500")} />
          {label}
        </span>
        <i
          className={cx(
            "fas fa-chevron-down text-[11px] transition-transform md:opacity-0 md:group-hover:opacity-100",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <ul
        className={cx(
          "mt-1 ml-3 pl-3 rounded-xl border-l-4",
          "bg-white/70 dark:bg-slate-900/50 backdrop-blur",
          "overflow-hidden transition-all duration-300 ease-out origin-top",
          "shadow-sm dark:shadow-none",
          "max-h-0 opacity-0 translate-y-1 pointer-events-none",
          "md:group-hover:max-h-96 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto",
          isOpen && "max-h-96 opacity-100 translate-y-0 pointer-events-auto"
        )}
        style={{
          borderImage: "linear-gradient(to bottom, #38bdf8, #a78bfa, #f472b6) 1",
        }}
      >
        <div className="py-1 space-y-1">{children}</div>
      </ul>
    </li>
  );
}

export default function Sidebar() {
  const [collapseShow, setCollapseShow] = useState("hidden");
  const [openEquip, setOpenEquip] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const [openFunc, setOpenFunc] = useState(false);
  const [openBCDB, setOpenBCDB] = useState(false);

  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const startsWith = (prefixes = []) =>
    prefixes.some((p) => location.pathname.startsWith(p));

  const perms = useMemo(() => getPermissions(), []);
  const showProfile = canAccess(perms, RULES.PROFILE);
  const showDeviceGrp = canAccess(perms, RULES.DEVICES_GROUP);
  const showDocs = canAccess(perms, RULES.DOCS_GROUP);
  const showHR = canAccess(perms, RULES.HR_GROUP);
  const showBCDB = canAccess(perms, RULES.BCDB_GROUP);
  const canDeviceList = canAccess(perms, RULES.DEVICES_LIST);
  const canDeviceRepair = canAccess(perms, RULES.DEVICES_REPAIR);
  const canDeviceStats = canAccess(perms, RULES.DEVICES_STATS);

  return (
    <>
      <nav
        className={cx(
          "md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:w-72",
          "md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden",
          "flex flex-wrap items-center justify-between relative z-50 py-4 px-4 md:px-6",
          "shadow-2xl backdrop-blur-xl",
          "bg-[radial-gradient(80%_50%_at_0%_0%,rgba(56,189,248,0.18),transparent),radial-gradient(80%_50%_at_100%_0%,rgba(167,139,250,0.18),transparent)]",
          "dark:bg-[radial-gradient(80%_50%_at_0%_0%,rgba(56,189,248,0.07),transparent),radial-gradient(80%_50%_at_100%_0%,rgba(244,114,182,0.08),transparent)]",
          "border border-white/30 dark:border-white/10 rounded-2xl md:rounded-none md:border-0"
        )}
      >
        <div className="md:flex-col md:items-stretch md:min-h-full px-0 flex flex-wrap items-center justify-between w-full mx-auto">
          {/* Toggle mobile */}
          <button
            className="cursor-pointer text-slate-900 dark:text-slate-200 md:hidden px-3 py-1 text-xl leading-none bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 shadow hover:shadow-md transition"
            type="button"
            onClick={() =>
              setCollapseShow((s) =>
                s === "hidden" ? "bg-white/90 dark:bg-slate-900/90 m-2 py-3 px-4 rounded-2xl shadow-xl" : "hidden"
              )
            }
          >
            <i className="fas fa-bars" />
          </button>

          {/* Brand */}
          <Link
            className="md:block text-left md:pb-2 text-slate-700 dark:text-slate-100 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
            to="/"
          >
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo"
                className="h-9 w-auto md:h-10 rounded-md ring-1 ring-white/40 dark:ring-white/10"
              />
             
            </div>
          </Link>

          {/* User mobile */}
          <ul className="md:hidden items-center flex flex-wrap list-none">
            <li className="inline-block relative">
              <UserDropdown />
            </li>
          </ul>

          {/* Collapse */}
          <div
            className={cx(
              "md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-3 md:shadow-none",
              "shadow-2xl absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded-2xl",
              collapseShow
            )}
          >
            <hr className="my-3 border-dashed border-slate-200 dark:border-slate-700" />

            {showProfile && (
              <>
                <ul className="flex flex-col gap-1 mb-3">
                  <li>
                    <NavLink
                      to="/userprofile"
                      icon="fas fa-user-circle"
                      label="Thông tin tài khoản"
                      active={isActive("/userprofile")}
                    />
                  </li>
                </ul>
                <hr className="my-3 border-dashed border-slate-200 dark:border-slate-700" />
              </>
            )}

            {showDeviceGrp && (
              <>
                <SectionTitle>Quản lý thiết bị CNTT</SectionTitle>
                <ul className="flex flex-col gap-1 mb-3">
                  <NavGroup
                    icon="fas fa-fingerprint"
                    label="Các loại thiết bị"
                    isOpen={openEquip || startsWith(["/Techequipment", "/Repairhistory", "/Staticsequipment","/Softwarelist"])}
                    setOpen={setOpenEquip}
                  >
                    {canDeviceList && (
                      <li>
                        <NavLink to="/Techequipment" icon="fas fa-list" label="Danh sách thiết bị" active={isActive("/Techequipment")} />
                      </li>
                    )}
                    {canDeviceRepair && (
                      <li>
                        <NavLink to="/Softwarelist" icon="fas fa-th-large" label="Quản lý phần mềm" active={isActive("/Softwarelist")} />
                      </li>
                    )}
                    {canDeviceStats && (
                      <li>
                        <NavLink to="/Staticsequipment" icon="fas fa-chart-pie" label="Thống kê" active={isActive("/Staticsequipment")} />
                      </li>
                    )}
                    {canDeviceRepair && (
                      <li>
                        <NavLink to="/Repairhistory" icon="fas fa-tools" label="Lịch sử sửa chữa" active={isActive("/Repairhistory")} />
                      </li>
                    )}
                  </NavGroup>
                </ul>
                <hr className="my-3 border-dashed border-slate-200 dark:border-slate-700" />
              </>
            )}

            {showHR && (
              <>
                <SectionTitle>Nhân sự</SectionTitle>
                <ul className="flex flex-col gap-1 mb-3">
                  <NavGroup
                    icon="fas fa-shield-alt"
                    label="Role & Phòng ban"
                    isOpen={openManage || startsWith(["/RoleDepartment", "/Department"])}
                    setOpen={setOpenManage}
                  >
                    <li><NavLink to="/RoleDepartment" icon="fas fa-user-shield" label="Quản lý Role" active={isActive("/RoleDepartment")} /></li>
                    <li><NavLink to="/Department" icon="fas fa-building" label="Quản lý Phòng ban" active={isActive("/Department")} /></li>
                  </NavGroup>

                  <NavGroup
                    icon="fas fa-users-cog"
                    label="Quản lý User"
                    isOpen={openFunc || startsWith(["/Adduser", "/SettingUser"])}
                    setOpen={setOpenFunc}
                  >
                    <li><NavLink to="/Adduser" icon="fas fa-user-plus" label="Thêm User" active={isActive("/Adduser")} /></li>
                    <li><NavLink to="/SettingUser" icon="fas fa-users" label="Danh sách User" active={isActive("/SettingUser")} /></li>
                  </NavGroup>
                </ul>
                <hr className="my-3 border-dashed border-slate-200 dark:border-slate-700" />
              </>
            )}

            {showDocs && (
              <>
                <SectionTitle>Văn bản</SectionTitle>
                <ul className="flex flex-col gap-1 mb-3">
                  <NavGroup icon="fas fa-file-alt" label="Các loại văn bản" isOpen={openDocs || startsWith(["/DocumentsManagement"])} setOpen={setOpenDocs}>
                    <li><NavLink to="/DocumentsManagement" icon="fas fa-folder-open" label="Quản lý văn bản" active={isActive("/DocumentsManagement")} /></li>
                    <li><NavLink to="#" icon="fas fa-th-list" label="Danh sách văn bản" active={false} /></li>
                  </NavGroup>
                </ul>
                <hr className="my-3 border-dashed border-slate-200 dark:border-slate-700" />
              </>
            )}

            {showBCDB && (
              <>
                <SectionTitle>Các Trang chức năng</SectionTitle>
                <ul className="flex flex-col gap-1 mb-3">
                  <NavGroup icon="fas fa-database" label="Nhập liệu BCDB" isOpen={openBCDB || startsWith(["/Dataentry", "/Chartview"])} setOpen={setOpenBCDB}>
                    <li><NavLink to="/Dataentry" icon="fas fa-calendar-alt" label="Lịch nhập liệu" active={isActive("/Dataentry")} /></li>
                    <li><NavLink to="/Chartview" icon="fas fa-chart-line" label="Tổng hợp" active={isActive("/Chartview")} /></li>
                  </NavGroup>
                </ul>
              </>
            )}

            <footer className="mt-auto text-center py-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                © {new Date().getFullYear()} Towa Việt Nam.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                <Link to="/terms" className="hover:text-rose-600">Copyright</Link>{" "}
                |{" "}
                <Link to="/privacy" className="hover:text-rose-600">Lê Minh Nhân V 1.0</Link>
              </p>
            </footer>
          </div>
        </div>
      </nav>
    </>
  );
}
