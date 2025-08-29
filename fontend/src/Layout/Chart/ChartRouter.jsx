import { Routes, Route } from "react-router-dom";
import ChartView from "../../views/Chart/ChartView";

const ChartRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ChartView/>} />
      {/* Có thể thêm các route khác ở đây */}
    </Routes>
  );
};

export default ChartRouter;
