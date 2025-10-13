/* eslint-disable */
import { RULES } from "./auth-rules";

// Import component views
import Login from "../views/login/login";
import Unauthorized from "../views/Unauthorzed/Unauthorized";

import AdminPage from "../views/Admin/Admin";
import Dashboard from "../views/Admin/AdminDashboard";
import WelcomePage from "../views/Welcome/WelcomePage";

import UserProfile from "../views/Users/Userprofiles";
import AddUser from "../Layout/Users/AddUserRouter";
import SettingUser from "../Layout/Users/SettingUserRouter";

import RoleDepartmentRouter from "../Layout/Department/RoleDepartmentRouter";
import Department from "../Layout/Department/Department";

import DocumentManagement from "../views/Documents/DocumentsManagerment";

import Techenologyquipment from "../views/Techequiqment/Techequiqment";
import RepairTech from "../views/Techequiqment/RepairTech";
import Staticsequipments from "../views/Techequiqment/Staticsequipment";

import DataentryRouter from "../Layout/Dataentry/DataentryRouter";
import ChartRouter from "../Layout/Chart/ChartRouter";

// Mỗi entry: { path, component, rule }
// rule === RULES.PUBLIC => route public
export const ROUTES = [
  // Public
  { path: "/", component: Login, rule: RULES.PUBLIC },
  { path: "/unauthorized", component: Unauthorized, rule: RULES.PUBLIC },

  // Manager only
  { path: "/admin", component: AdminPage, rule: RULES.AUTHED_ANY },
  { path: "/dashboard", component: Dashboard, rule: RULES.MANAGER_ONLY },
  { path: "/Welcome", component: WelcomePage, rule: RULES.AUTHED_ANY},
  { path: "/DocumentsManagement", component: DocumentManagement, rule: RULES.MANAGER_ONLY },
  { path: "/Dataentry/*", component: DataentryRouter, rule: RULES.MANAGER_ONLY },
  { path: "/Chartview/*", component: ChartRouter, rule: RULES.MANAGER_ONLY },

  // HR (manager hoặc user.hr)
  { path: "/RoleDepartment/*", component: RoleDepartmentRouter, rule: RULES.HR_OR_MANAGER },
  { path: "/Department/*", component: Department, rule: RULES.HR_OR_MANAGER },
  { path: "/Adduser/*", component: AddUser, rule: RULES.HR_OR_MANAGER },
  { path: "/SettingUser/*", component: SettingUser, rule: RULES.HR_OR_MANAGER },

  // Profile
  { path: "/userprofile", component: UserProfile, rule: RULES.PROFILE },

  // Devices
  { path: "/Techequipment", component: Techenologyquipment, rule: RULES.DEVICES_LIST },
  { path: "/Repairhistory", component: RepairTech, rule: RULES.DEVICES_REPAIR },
  { path: "/Staticsequipment", component: Staticsequipments, rule: RULES.DEVICES_STATS },
];
