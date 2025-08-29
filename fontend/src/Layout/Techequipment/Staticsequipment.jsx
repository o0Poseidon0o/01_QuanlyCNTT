import { Routes, Route } from "react-router-dom";
import Staticsequipment from "../../components/Technologyequipment/Staticsequipment";


const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Staticsequipment/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
