import { Routes, Route } from "react-router-dom";
import DocumentManagementTabs from "../../components/Document/DocumentsManagementTabs";


const UserRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DocumentManagementTabs/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default UserRouter;
