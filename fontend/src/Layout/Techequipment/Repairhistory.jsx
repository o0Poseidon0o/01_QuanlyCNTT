import { Routes, Route } from "react-router-dom";
import Repairhistory from "../../components/Technologyequipment/Repairhistory";


const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Repairhistory/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
