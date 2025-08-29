import { Routes, Route } from "react-router-dom";
import DataEntryViews from "../../views/Dataentry/DataentryViews";

const DataentryRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DataEntryViews />} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default DataentryRouter;
