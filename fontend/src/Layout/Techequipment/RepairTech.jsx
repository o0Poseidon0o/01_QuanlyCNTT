import { Routes, Route } from "react-router-dom";
import RepairTech from "../../components/RepairTech/RepairTech";


const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<RepairTech/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
