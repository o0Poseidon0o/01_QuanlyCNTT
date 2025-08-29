import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./views/login/login";
import AdminPage from "./views/Admin/Admin";
import Dashboard from "./views/Admin/AdminDashboard";
import UserProfile from "./views/Users/Userprofiles";
import AddUser from "./Layout/Users/AddUserRouter";
import SettingUser from "./Layout/Users/SettingUserRouter";
import RoleDepartmentRouter from "./Layout/Department/RoleDepartmentRouter";
import Department from "./Layout/Department/Department";
import DataentryRouter from "./Layout/Dataentry/DataentryRouter";
import ChartRouter from "./Layout/Chart/ChartRouter";
import ProtectedRoute from "./components/unitls/ProtectedRoute";
import Unauthorized from "./views/Unauthorzed/Unauthorized"; // Trang báo lỗi quyền hạn
import WelcomePage from "./views/Welcome/WelcomePage";
import DocumentManagement from "./views/Documents/DocumentsManagerment"
import Techenologyquipment from "./views/Techequiqment/Techequiqment";
import Repairhistorylist from "./views/Techequiqment/Repairhistory";
import Staticsequipments from "./views/Techequiqment/Staticsequipment";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Route có bảo vệ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["user", "manager", "admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/DocumentsManagement"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <DocumentManagement/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userprofile"
          element={
            <ProtectedRoute allowedRoles={["user", "manager", "admin"]}>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Adduser/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/SettingUser/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <SettingUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/RoleDepartment/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <RoleDepartmentRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Department/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <Department />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Dataentry/*"
          element={
            <ProtectedRoute allowedRoles={["user", "manager", "admin"]}>
              <DataentryRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Chartview/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <ChartRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Welcome"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <WelcomePage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Techequipment"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <Techenologyquipment/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Repairhistory"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <Repairhistorylist/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Staticsequipment"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager","user"]}>
              <Staticsequipments/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
