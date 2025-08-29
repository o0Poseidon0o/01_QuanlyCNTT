import { Routes, Route } from "react-router-dom";
import Departments from "../../views/RoleDepartment/Departments";

const Department = () => {
  return (
    <Routes>
      <Route path="/" element={<Departments/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default Department;
