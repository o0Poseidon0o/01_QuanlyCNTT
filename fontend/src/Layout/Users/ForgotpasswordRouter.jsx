import { Routes, Route } from "react-router-dom";
import Forgotpassword from "../../views/Users/Forgotpassword";

const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Forgotpassword />} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
