import { Routes, Route } from "react-router-dom";
import RoleDepartment from "../../views/RoleDepartment/RoleDepartment"

const RoleDepartmentRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<RoleDepartment/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default RoleDepartmentRouter;
