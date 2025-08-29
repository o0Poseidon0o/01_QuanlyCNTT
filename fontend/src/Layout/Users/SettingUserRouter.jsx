import { Routes, Route } from "react-router-dom";
import SettingUser from "../../views/Users/SettingUser";

const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<SettingUser />} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
