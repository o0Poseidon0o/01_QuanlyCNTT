import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  WrenchIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";

import KPI from "./KPI";
import TicketSheet from "./TicketSheet";
import { resolveStatusMeta } from "./statusMeta";
import { listRepairs, getSummaryStats } from "../../services/repairsApi";
import { STATUS_MAP, SEVERITY_OPTIONS, STATUS_OPTIONS } from "../../constants/repairEnums";

// ---------- helpers ----------
const formatDate = (dt) => (dt ? new Date(dt).toLocaleString() : "-");
const formatMoney = (n) =>
  n == null ? "-" : Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const normalize = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
const buildParams = (p = {}) => {
  const sanitized = Object.entries(p).reduce((acc, [key, value]) => {
    if (value == null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    if (value === "all") return acc;
    acc[key] = value;
    return acc;
  }, {});

  // Map status/severity sang NHÃN để tránh lỗi enum khi backend expect label
  if (sanitized.status) {
    const opt = STATUS_OPTIONS.find((o) => o.value === sanitized.status);
    if (opt?.label) sanitized.status = opt.label;
  }
  if (sanitized.severity) {
    const sev = SEVERITY_OPTIONS.find((o) => o.value === sanitized.severity);
    if (sev?.label) sanitized.severity = sev.label;
  }

  return { ...sanitized, _ts: Date.now(), includeCanceled: "0" };
};

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

export default function RepairManagementUI() {
  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");   // "" = chưa chọn
  const [severity, setSeverity] = useState("");// "" = chưa chọn
  const [device, setDevice] = useState("");    // "" = tất cả thiết bị

  // data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // charts + analytics
  const [chartMonthly, setChartMonthly] = useState([]);
  const [chartStatus, setChartStatus] = useState([]);
  const [prioritySummary, setPrioritySummary] = useState([]);
  const [topDevices, setTopDevices] = useState([]);
  const [vendorSummary, setVendorSummary] = useState([]);

  // selection
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const priorityTotal = useMemo(
    () => prioritySummary.reduce((s, x) => s + (x.value || 0), 0),
    [prioritySummary]
  );
  const formatPercent = (val, total) => (total > 0 ? Math.round((val / total) * 100) : 0);

  // filters gửi lên API (device không gửi)
  const filters = useMemo(
    () => ({
      q: search.trim() || undefined,
      status: status || undefined,
      severity: severity || undefined,
    }),
    [search, status, severity]
  );

  // danh sách tên thiết bị duy nhất cho dropdown
  const deviceOptions = useMemo(() => {
    const set = new Set();
    tickets.forEach((t) => {
      if (t?.device_name) set.add(String(t.device_name));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [tickets]);

  // hiển thị: tìm text + lọc theo device (client side) + search by outcome
  const visibleTickets = useMemo(() => {
    const q = normalize(search);
    return tickets.filter((t) => {
      const haystack =
        normalize(t.title) +
        " " +
        normalize(t.issue_description) +
        " " +
        normalize(t.device_name) +
        " " +
        normalize(t.device_code) +
        " " +
        normalize(t.outcome || t.detail?.outcome || "");
      const textOk = q ? haystack.includes(q) : true;
      const deviceOk = device ? String(t.device_name) === device : true;
      return textOk && deviceOk;
    });
  }, [tickets, search, device]);

  // fetch list (no-cache + clean)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listRepairs(buildParams(filters))
      .then((data) => {
        if (cancelled) return;
        setTickets(cleanTickets(Array.isArray(data) ? data : []));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Không thể tải danh sách ticket", err);
        setTickets([]);
        setError("Không thể tải danh sách ticket. Vui lòng thử lại.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  // fetch stats
  useEffect(() => {
    let cancelled = false;

    getSummaryStats()
      .then((s) => {
        if (cancelled) return;

        setChartMonthly((s?.monthly || []).map((item) => ({
          month: item.month,
          cost: Number(item.cost) || 0,
        })));

        const dist = (s?.status || []).map((x) => {
          const meta = resolveStatusMeta(x.name, x.label);
          return { name: meta.label, value: Number(x.value) || 0 };
        });
        setChartStatus(dist);

        setPrioritySummary(s?.priority || []);
        // removed: setSeveritySummary(...)
        setTopDevices(s?.topDevices || []);
        setVendorSummary(s?.vendors || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Không thể tải thống kê sửa chữa", err);
        setChartMonthly([]);
        setChartStatus([]);
        setPrioritySummary([]);
        // removed severity
        setTopDevices([]);
        setVendorSummary([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const kpi = useMemo(() => calcKPIs(tickets), [tickets]);
  const maxMonthlyCost = useMemo(
    () => chartMonthly.reduce((max, item) => Math.max(max, item.cost || 0), 0),
    [chartMonthly]
  );
  const totalStatusCount = useMemo(
    () => chartStatus.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartStatus]
  );
  const refetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRepairs(buildParams(filters));
      setTickets(cleanTickets(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Không thể tải lại danh sách ticket", err);
      setTickets([]);
      setError("Không thể tải danh sách ticket. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSeverity("");
    setDevice("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="transition-transform duration-300 ease-out">
              <div className="h-10 w-10 grid place-items-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <WrenchIcon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quản lý sửa chữa</h1>
              <p className="text-slate-500 dark:text-slate-400">Theo dõi ticket, SLA và chi phí sửa chữa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={refetchList} title="Làm mới">
              <ArrowPathIcon className="h-4 w-4" /> Làm mới
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => alert("TODO: export CSV")} title="Xuất CSV">
              <ArrowDownTrayIcon className="h-4 w-4" /> Xuất CSV
            </Button>
          </div>
        </div>

        {/* Bộ lọc */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="lg:col-span-4 flex items-center gap-2 rounded-xl border px-3 py-2 bg-white dark:bg-slate-950">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                <Input
                  className="border-0 focus-visible:ring-0 shadow-none"
                  placeholder="Tìm theo tiêu đề, thiết bị, outcome hoặc mô tả…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Thiết bị */}
              <div className="lg:col-span-3 flex gap-2">
                <div className="flex-1">
                  <Select value={device} onValueChange={setDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Thiết bị" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceOptions.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {device && (
                  <Button variant="outline" title="Bỏ chọn thiết bị" onClick={() => setDevice("")}>
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Trạng thái */}
              <div className="lg:col-span-3 flex gap-2">
                <div className="flex-1">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {status && (
                  <Button variant="outline" title="Bỏ chọn trạng thái" onClick={() => setStatus("")}>
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Mức độ */}
              <div className="lg:col-span-2 flex gap-2">
                <div className="flex-1">
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mức độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {severity && (
                  <Button variant="outline" title="Bỏ chọn mức độ" onClick={() => setSeverity("")}>
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Xoá lọc */}
              <div className="lg:col-span-12 flex justify-end">
                <Button type="button" variant="outline" onClick={resetFilters} title="Xoá lọc" className="gap-2">
                  <XMarkIcon className="h-4 w-4" />
                  Xoá lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <KPI
            title="Tickets mở"
            value={kpi.open}
            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
            subtitle="status ≠ completed/canceled"
          />
          <KPI
            title="Đang xử lý"
            value={kpi.inProgress}
            icon={<ClockIcon className="h-5 w-5" />}
            subtitle="in_progress + pending_parts"
          />
          <KPI
            title="Quá hạn"
            value={kpi.overdue}
            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
            subtitle="SLA vượt quá"
            variant="danger"
          />
          <KPI
            title="Chi phí tháng"
            value={formatMoney(kpi.costThisMonth)}
            icon={<CheckCircleIcon className="h-5 w-5" />}
            subtitle="Tổng chi phí tháng hiện tại"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle>Chi phí theo tháng</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {chartMonthly.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có dữ liệu chi phí.</p>
              ) : (
                <div className="space-y-3">
                  {chartMonthly.map((item) => {
                    const pct = maxMonthlyCost > 0 ? Math.round((item.cost / maxMonthlyCost) * 100) : 0;
                    return (
                      <div key={item.month} className="flex items-center gap-3">
                        <div className="w-20 text-sm text-slate-500">{item.month}</div>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-slate-900" style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                        <div className="w-28 text-right text-sm font-medium">{formatMoney(item.cost)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Tỉ lệ trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {chartStatus.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có dữ liệu trạng thái.</p>
              ) : (
                <div className="space-y-3">
                  {chartStatus.map((item) => {
                    const pct = totalStatusCount > 0 ? Math.round((item.value / totalStatusCount) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-slate-500">{item.name}</div>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">{item.value}</div>
                        <div className="w-10 text-right text-xs text-slate-400">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    <th className="py-2 pr-3">Kết quả</th>
                    <th className="py-2 pr-3">Mức độ</th>
                    <th className="py-2 pr-3">Ưu tiên</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Người báo cáo</th>
                    <th className="py-2 pr-3">Báo lúc</th>
                    <th className="py-2 pr-3">SLA (h)</th>
                    <th className="py-2 pr-3">Người xử lý / NCC</th>
                    <th className="py-2 pr-3">Chi phí</th>
                    <th className="py-2 pr-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={13} className="py-3">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))}
                  {!loading &&
                    visibleTickets.map((t) => {
                      return (
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
                                title="Mở chi tiết"
                                onClick={() => setSelected(t)}
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">{t.issue_description}</div>
                          </td>

                          {/* Outcome */}
                          <td className="py-3 pr-3">
                            <div className="text-xs text-slate-600 line-clamp-2">
                              {t.outcome || t.detail?.outcome || "-"}
                            </div>
                          </td>

                          <td className="py-3 pr-3 capitalize">{t.severity_label || t.severity}</td>
                          <td className="py-3 pr-3 capitalize">{t.priority_label || t.priority}</td>
                          <td className="py-3 pr-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[t.status]?.cls || "bg-slate-200"}`}>
                              {STATUS_MAP[t.status]?.label || t.status_label || t.status}
                            </span>
                          </td>
                          <td className="py-3 pr-3">{t.reporter_name || "-"}</td>
                          <td className="py-3 pr-3 text-slate-500">{formatDate(t.date_reported)}</td>
                          <td className="py-3 pr-3">{t.sla_hours || "-"}</td>
                          <td className="py-3 pr-3">
                            <div className="text-sm">{t.assignee || t.vendor_name || "-"}</div>
                            <div className="text-xs text-slate-500">
                              {t.repair_type === "vendor" ? "Bên ngoài" : "Nội bộ"}
                            </div>
                          </td>
                          <td className="py-3 pr-3">{formatMoney(t.total_cost)}</td>
                          <td className="py-3 pr-3">
                            <Button size="sm" variant="outline" onClick={() => setSelected(t)}>
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  {!loading && visibleTickets.length === 0 && (
                    <tr>
                      <td colSpan={13} className="py-3 text-slate-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Priority distribution */}
        <Card className="mt-6">
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <ChartPieIcon className="h-4 w-4 text-blue-500" /> Phân bố ưu tiên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prioritySummary.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              prioritySummary.map((item) => {
                const pct = formatPercent(item.value, priorityTotal);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">
                        {item.value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Vendor & Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4 text-amber-500" /> Nhà cung cấp nổi bật
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-3">Nhà cung cấp</th>
                    <th className="py-2 pr-3">Lượt</th>
                    <th className="py-2 pr-3">Chi phí</th>
                    <th className="py-2 pr-3">Avg / lượt</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorSummary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-slate-500">Chưa có dữ liệu.</td>
                    </tr>
                  ) : (
                    vendorSummary.map((vendor, idx) => (
                      <tr key={`${vendor.vendor_name}-${idx}`} className="border-b">
                        <td className="py-3 pr-3">{vendor.vendor_name}</td>
                        <td className="py-3 pr-3">{vendor.total_jobs}</td>
                        <td className="py-3 pr-3">{formatMoney(vendor.total_cost)}</td>
                        <td className="py-3 pr-3">{formatMoney(vendor.average_cost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex items-center gap-2">
                <WrenchIcon className="h-4 w-4 text-slate-600" /> Thiết bị nhiều sự cố
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-3">Thiết bị</th>
                    <th className="py-2 pr-3">Lượt sửa</th>
                    <th className="py-2 pr-3">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  {topDevices.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-slate-500">Chưa có dữ liệu.</td>
                    </tr>
                  ) : (
                    topDevices.map((device, idx) => (
                      <tr key={`${device.device_name}-${idx}`} className="border-b">
                        <td className="py-3 pr-3">{device.device_name}</td>
                        <td className="py-3 pr-3">{device.ticket_count}</td>
                        <td className="py-3 pr-3">{formatMoney(device.total_cost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Sheet chi tiết */}
        <TicketSheet
          ticket={selected}
          onOpenChange={(v) => {
            if (!v) {
              setSelected(null);
              refetchList();
            } else {
              // keep selected as is
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
