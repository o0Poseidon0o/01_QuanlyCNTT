import React from "react";

const data = [
  {
    name: "Page A",
    uv: 590,
    pv: 800,
    amt: 1400,
  },
  {
    name: "Page B",
    uv: 868,
    pv: 967,
    amt: 1506,
  },
  {
    name: "Page C",
    uv: 1397,
    pv: 1098,
    amt: 989,
  },
  {
    name: "Page D",
    uv: 1480,
    pv: 1200,
    amt: 1228,
  },
  {
    name: "Page E",
    uv: 1520,
    pv: 1108,
    amt: 1100,
  },
  {
    name: "Page F",
    uv: 1400,
    pv: 680,
    amt: 1700,
  },
];

const Chart = () => {
  return (
    <div className="mt-5 w-full">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Tháng</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">UV</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">PV</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">AMT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={row.name} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-700">{row.name}</td>
                <td className="px-4 py-2 text-right text-slate-600">{row.uv}</td>
                <td className="px-4 py-2 text-right text-slate-600">{row.pv}</td>
                <td className="px-4 py-2 text-right text-slate-600">{row.amt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Chart;
