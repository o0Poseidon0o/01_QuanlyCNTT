import { Routes, Route } from "react-router-dom";
import AddUser from '../../views/Users/AddUser'

const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AddUser />} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
