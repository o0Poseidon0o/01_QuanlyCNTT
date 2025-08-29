import { Routes, Route } from "react-router-dom";
import Techequiqment from "../../components/Technologyequipment/Techequipment";


const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Techequiqment/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
