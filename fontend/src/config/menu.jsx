/* eslint-disable */
import { RULES } from "./auth-rules";

export const MENU_SECTIONS = [
  {
    type: "item",
    label: "Thông tin của tài khoản",
    icon: "fas fa-user-circle text-blueGray-400",
    to: "/userprofile",
    rule: RULES.PROFILE,
  },
  {
    type: "group",
    label: "Quản lý thiết bị CNTT",
    icon: "fas fa-fingerprint text-blueGray-400",
    rule: RULES.DEVICES_GROUP,
    children: [
      { to: "/Techequipment",   label: "Danh sách thông tin thiết bị", icon: "fas fa-list text-blueGray-400",      rule: RULES.DEVICES_LIST },
      { to: "/Repairhistory",   label: "Lịch sử sửa chữa",              icon: "fas fa-tools text-blueGray-400",     rule: RULES.DEVICES_REPAIR },
      { to: "/Staticsequipment",label: "Thống kê",                      icon: "fas fa-chart-pie text-blueGray-400", rule: RULES.DEVICES_STATS },
    ],
  },
  {
    type: "group",
    label: "Văn bản",
    icon: "fas fa-file-alt text-blueGray-400",
    rule: RULES.DOCS_GROUP,
    children: [
      { to: "/DocumentsManagement", label: "Quản lý văn bản", icon: "fas fa-folder-open text-blueGray-400", rule: RULES.MANAGER_ONLY },
      { to: "#", label: "Danh sách văn bản", icon: "fas fa-th-list text-blueGray-400", rule: RULES.MANAGER_ONLY },
    ],
  },
  {
    type: "group",
    label: "Nhân sự",
    icon: "fas fa-users-cog text-blueGray-400",
    rule: RULES.HR_GROUP,
    children: [
      { to: "/RoleDepartment", label: "Quản lý Role",      icon: "fas fa-user-shield text-blueGray-400", rule: RULES.HR_OR_MANAGER },
      { to: "/Department",     label: "Quản lý Phòng ban", icon: "fas fa-building text-blueGray-400",    rule: RULES.HR_OR_MANAGER },
      { to: "/Adduser",        label: "Thêm User",         icon: "fas fa-user-plus text-blueGray-400",   rule: RULES.HR_OR_MANAGER },
      { to: "/SettingUser",    label: "Quản lý User",      icon: "fas fa-users text-blueGray-400",       rule: RULES.HR_OR_MANAGER },
    ],
  },
  {
    type: "group",
    label: "Các Trang chức năng",
    icon: "fas fa-database text-blueGray-400",
    rule: RULES.BCDB_GROUP,
    children: [
      { to: "/Dataentry", label: "Lịch nhập liệu", icon: "fas fa-calendar-alt text-blueGray-400", rule: RULES.MANAGER_ONLY },
      { to: "/Chartview", label: "Tổng hợp",       icon: "fas fa-chart-line text-blueGray-400",   rule: RULES.MANAGER_ONLY },
    ],
  },
];
