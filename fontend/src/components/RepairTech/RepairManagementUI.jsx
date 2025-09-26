import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench, RefreshCw, Download, Filter, Search,
  AlertTriangle, Clock3, CheckCircle2, ExternalLink
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";

import KPI from "./KPI";
import TicketSheet from "./TicketSheet";
import { listRepairs, getSummaryStats } from "../../services/repairsApi";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Tooltip as RTooltip
} from "recharts";

// ---------- helpers ----------
const formatDate = (dt) => (dt ? new Date(dt).toLocaleString() : "-");
const formatMoney = (n) =>
  n == null ? "-" : Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function isOverSLA(row) {
  if (!row?.sla_hours) return false;
  const start = new Date(row.date_reported);
  const end = row.end_time ? new Date(row.end_time) : new Date();
  const diffH = (end - start) / 36e5;
  return diffH > row.sla_hours && row.status !== "completed" && row.status !== "canceled";
}
function calcKPIs(rows) {
  const open = rows.filter((r) => !["completed", "canceled"].includes(r.status)).length;
  const inProgress = rows.filter((r) => ["in_progress", "pending_parts"].includes(r.status)).length;
  const overdue = rows.filter((r) => isOverSLA(r)).length;
  const now = new Date();
  const costThisMonth = rows
    .filter((r) => {
      const d = new Date(r.date_reported);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, r) => s + (r.total_cost || 0), 0);
  return { open, inProgress, overdue, costThisMonth };
}

// ---- chống cache + lọc bảo hiểm + chống trùng
const noCacheParams = (p = {}) => ({ ...p, _ts: Date.now(), includeCanceled: "0" });
const cleanTickets = (arr = []) => {
  const seen = new Set();
  return arr
    .filter((x) => {
      const st = String(x?.status || "").toLowerCase();
      const deleted = x?.deleted_at != null || x?.is_deleted === true;
      return st !== "canceled" && !deleted;
    })
    .filter((x) => {
      if (!x?.id_repair) return false;
      if (seen.has(x.id_repair)) return false;
      seen.add(x.id_repair);
      return true;
    });
};
// -----------------------------

const STATUS_MAP = {
  requested: { label: "Requested", color: "bg-slate-200 text-slate-700" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In progress", color: "bg-amber-100 text-amber-700" },
  pending_parts: { label: "Pending parts", color: "bg-violet-100 text-violet-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Canceled", color: "bg-rose-100 text-rose-700" },
};

export default function RepairManagementUI() {
  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");

  // data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // charts
  const [chartMonthly, setChartMonthly] = useState([]);
  const [chartStatus, setChartStatus] = useState([]);

  // selection
  const [selected, setSelected] = useState(null);

  // fetch list (no-cache + clean)
  useEffect(() => {
    setLoading(true);
    listRepairs(noCacheParams({ q: search, status, severity }))
      .then((data) => {
        console.log("🔎 /repairs response", {
          at: new Date().toISOString(),
          count: Array.isArray(data) ? data.length : 0,
          sample: Array.isArray(data) ? data.slice(0, 3) : []
        });
        setTickets(cleanTickets(Array.isArray(data) ? data : []));
      })
      .finally(() => setLoading(false));
  }, [search, status, severity]);

  // fetch stats
  useEffect(() => {
    getSummaryStats().then((s) => {
      setChartMonthly(s?.monthly || []);
      const dist = (s?.status || []).map((x) => ({
        name: STATUS_MAP[x.name]?.label || x.name,
        value: x.value,
      }));
      setChartStatus(dist);
    });
  }, []);

  const kpi = useMemo(() => calcKPIs(tickets), [tickets]);

  const refetchList = () => {
    setLoading(true);
    listRepairs(noCacheParams({ q: search, status, severity }))
      .then((data) => setTickets(cleanTickets(Array.isArray(data) ? data : [])))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header tối giản */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="h-10 w-10 grid place-items-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Wrench className="h-5 w-5" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Repair Management</h1>
              <p className="text-slate-500 dark:text-slate-400">Theo dõi ticket, SLA và chi phí</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={refetchList} title="Làm mới">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => alert("TODO: export CSV")} title="Xuất CSV">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Filters gọn */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tiêu đề, thiết bị, mô tả…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.keys(STATUS_MAP).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_MAP[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <KPI title="Tickets mở" value={kpi.open} icon={<AlertTriangle className="h-5 w-5" />} subtitle="status ≠ completed/canceled" />
          <KPI title="Đang xử lý" value={kpi.inProgress} icon={<Clock3 className="h-5 w-5" />} subtitle="in_progress + pending_parts" />
          <KPI title="Quá hạn" value={kpi.overdue} icon={<AlertTriangle className="h-5 w-5" />} subtitle="SLA vượt quá" variant="danger" />
          <KPI title="Chi phí tháng" value={formatMoney(kpi.costThisMonth)} icon={<CheckCircle2 className="h-5 w-5" />} subtitle="Tổng chi phí tháng hiện tại" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle>Chi phí theo tháng</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMonthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Tỉ lệ trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartStatus} dataKey="value" nameKey="name" outerRadius={90}>
                      {chartStatus.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Pie>
                    <Legend />
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Danh sách ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Thiết bị</th>
                    <th className="py-2 pr-3">Tiêu đề</th>
                    <th className="py-2 pr-3">Severity</th>
                    <th className="py-2 pr-3">Priority</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Báo lúc</th>
                    <th className="py-2 pr-3">SLA (h)</th>
                    <th className="py-2 pr-3">Assignee/Vendor</th>
                    <th className="py-2 pr-3">Chi phí</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={11} className="py-3">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))}
                  {!loading &&
                    tickets.map((t) => (
                      <tr key={t.id_repair} className="border-b hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3 pr-3 font-medium">#{t.id_repair}</td>
                        <td className="py-3 pr-3">
                          <div className="font-medium">{t.device_name}</div>
                          <div className="text-xs text-slate-500">{t.device_code || "-"}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-medium line-clamp-1 flex items-center gap-1">
                            {t.title}
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-700"
                              title="Open details"
                              onClick={() => setSelected(t)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">{t.issue_description}</div>
                        </td>
                        <td className="py-3 pr-3 capitalize">{t.severity}</td>
                        <td className="py-3 pr-3 capitalize">{t.priority}</td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[t.status]?.color || "bg-slate-200"}`}>
                            {STATUS_MAP[t.status]?.label || t.status}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-slate-500">{formatDate(t.date_reported)}</td>
                        <td className="py-3 pr-3">{t.sla_hours || "-"}</td>
                        <td className="py-3 pr-3">
                          <div className="text-sm">{t.assignee || t.vendor_name || "-"}</div>
                          <div className="text-xs text-slate-500">{t.repair_type === "vendor" ? "Vendor" : "In-house"}</div>
                        </td>
                        <td className="py-3 pr-3">{formatMoney(t.total_cost)}</td>
                        <td className="py-3 pr-3">
                          <Button size="sm" variant="outline" onClick={() => setSelected(t)}>
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {!loading && tickets.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-3 text-slate-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sheet chi tiết */}
        <TicketSheet
          ticket={selected}
          onOpenChange={(v) => {
            if (!v) {
              setSelected(null);
              refetchList();
            }
          }}
          onChanged={() => {
            refetchList();
          }}
        />
      </div>
    </div>
  );
}
