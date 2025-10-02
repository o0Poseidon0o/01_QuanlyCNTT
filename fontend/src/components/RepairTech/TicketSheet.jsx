import React, { useState, useEffect, useCallback } from "react";
import { DocumentTextIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getRepair, updateStatus, uploadFiles } from "../../services/repairsApi";

const STATUS_MAP = {
  requested: { label: "Requested", cls: "bg-slate-200 text-slate-700" },
  approved: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  pending_parts: { label: "Pending parts", cls: "bg-violet-100 text-violet-700" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Canceled", cls: "bg-rose-100 text-rose-700" },
};

const fmtDate = (x) => (x ? new Date(x).toLocaleString() : "-");
const fmtVND = (n) =>
  n == null ? "-" : Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function SeverityBadge({ sev, label }) {
  const map = {
    critical: "bg-rose-600",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    low: "bg-slate-500",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded text-white ${map[sev] || "bg-slate-500"}`}>
      {label || sev || "low"}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Actions({ ticket, onChanged, onRefresh }) {
  const [busy, setBusy] = useState(false);

  const markCompleted = async () => {
    setBusy(true);
    try {
      await updateStatus(ticket.id_repair, { actor_user: 1, new_status: "completed", note: "Hoàn tất" });
      onRefresh?.();
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert("Cập nhật trạng thái thất bại");
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      await uploadFiles(ticket.id_repair, files, 1);
      onRefresh?.();
      onChanged?.();
    } catch (err) {
      console.error(err);
      alert("Upload thất bại");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      <button
        className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
        disabled={busy}
        onClick={markCompleted}
      >
        Đánh dấu hoàn tất
      </button>
      <label className="px-3 py-1 rounded bg-slate-200 text-slate-800 cursor-pointer">
        Tải file
        <input type="file" className="hidden" multiple onChange={onUpload} />
      </label>
    </div>
  );
}

const mergeTicketWithDetail = (summary, payload) => {
  if (!summary && !payload) return null;
  const base = { ...(summary || {}) };
  const ticketInfo = payload?.ticket ? { ...payload.ticket } : {};
  const detail = payload?.detail ? { ...payload.detail } : {};
  const combinedCost =
    Number(detail.labor_cost || 0) + Number(detail.parts_cost || 0) + Number(detail.other_cost || 0);

  const timeline = Array.isArray(payload?.history)
    ? payload.history.map((h) => ({
        ...h,
        actor_name: h.actor_name || h.User?.username || null,
      }))
    : [];

  const merged = {
    ...base,
    ...ticketInfo,
    ...detail,
    detail,
    timeline,
    parts: Array.isArray(payload?.parts) ? payload.parts : [],
    files: Array.isArray(payload?.files) ? payload.files : [],
    reporter_name: ticketInfo.reporter_name || base.reporter_name || null,
    approver_name: ticketInfo.approver_name || base.approver_name || null,
    device_name: ticketInfo.device_name || base.device_name || "",
    vendor_name: detail.vendor_name || base.vendor_name || null,
    technician_name: detail.technician_name || base.assignee || null,
  };

  if (!Number.isNaN(combinedCost) && combinedCost > 0) {
    merged.total_cost = combinedCost;
  }

  return merged;
};

/**
 * Props:
 * - ticket: object | null
 * - onOpenChange: (open:boolean)=>void
 * - onChanged?: ()=>void // callback để refetch list
 */
export default function TicketSheet({ ticket, onOpenChange, onChanged }) {
  const [fullTicket, setFullTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchDetail = useCallback(
    async (summary, { silent } = {}) => {
      if (!summary?.id_repair) return;
      if (!silent) {
        setLoadingDetail(true);
        setDetailError(null);
      }
      try {
        const payload = await getRepair(summary.id_repair);
        setFullTicket(mergeTicketWithDetail(summary, payload));
        setDetailError(null);
      } catch (err) {
        console.error("Không thể tải chi tiết ticket", err);
        setFullTicket(summary);
        setDetailError("Không thể tải chi tiết ticket. Vui lòng thử lại.");
      } finally {
        if (!silent) {
          setLoadingDetail(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!ticket) {
      setFullTicket(null);
      setLoadingDetail(false);
      setDetailError(null);
      return;
    }
    fetchDetail(ticket);
  }, [ticket, ticket?.id_repair, fetchDetail]);

  const refreshDetail = useCallback(() => {
    if (ticket) {
      fetchDetail(ticket, { silent: true });
    }
  }, [fetchDetail, ticket]);

  const view = fullTicket || ticket || {};
  const timeline = view.timeline || [];
  const parts = view.parts || [];
  const files = view.files || [];

  return (
    <Sheet open={!!ticket} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" /> Ticket #{ticket?.id_repair ?? "-"}
          </SheetTitle>
        </SheetHeader>

        {!ticket ? (
          <div className="mt-6 space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="mt-2">
            <Actions ticket={view} onChanged={onChanged} onRefresh={refreshDetail} />

            {loadingDetail && (
              <div className="mt-3 text-xs text-slate-500">Đang tải chi tiết ticket...</div>
            )}
            {detailError && !loadingDetail && (
              <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {detailError}
              </div>
            )}

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="assets">Parts & Files</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Mô tả</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-600">{view.issue_description || "-"}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <InfoRow
                        label="Thiết bị"
                        value={`${view.device_name || "-"}${view.device_code ? ` (${view.device_code})` : ""}`}
                      />
                      <InfoRow label="Severity" value={<SeverityBadge sev={view.severity} label={view.severity_label} />} />
                      <InfoRow label="Priority" value={view.priority_label || view.priority || "-"} />
                      <InfoRow
                        label="Trạng thái"
                        value={
                          <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[view.status]?.cls || "bg-slate-200"}`}>
                            {STATUS_MAP[view.status]?.label || view.status_label || view.status || "-"}
                          </span>
                        }
                      />
                      <InfoRow label="Người báo cáo" value={view.reporter_name || "-"} />
                      <InfoRow label="Báo lúc" value={fmtDate(view.date_reported)} />
                      <InfoRow label="SLA" value={view.sla_hours ? `${view.sla_hours} h` : "-"} />
                      <InfoRow label="Assignee" value={view.technician_name || view.assignee || "-"} />
                      <InfoRow label="Vendor" value={view.vendor_name || "-"} />
                      <InfoRow label="Chi phí" value={fmtVND(view.total_cost)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Kết quả thực thi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <InfoRow label="Bắt đầu" value={fmtDate(view.start_time)} />
                      <InfoRow label="Kết thúc" value={fmtDate(view.end_time)} />
                      <InfoRow label="Labor (h)" value={view.total_labor_hours ?? "-"} />
                      <InfoRow label="Outcome" value={view.outcome || "-"} />
                      <InfoRow label="Gia hạn BH" value={`${view.warranty_extend_mon || 0} tháng`} />
                      <InfoRow
                        label="Bảo trì kế"
                        value={view.next_maintenance_date ? fmtDate(view.next_maintenance_date) : "-"}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TIMELINE */}
              <TabsContent value="timeline">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nhật ký trạng thái</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="relative border-l pl-4">
                      {timeline.map((h) => (
                        <li key={h.id_history || `${h.created_at}-${h.actor_name}`} className="mb-4">
                          <div className="absolute -left-[6px] h-3 w-3 rounded-full bg-slate-300" />
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{h.actor_name || "—"}</span>
                              <span className="text-xs text-slate-400">{fmtDate(h.created_at)}</span>
                            </div>
                            <div className="text-slate-600">
                              {h.note || `${h.old_status_label || h.old_status || ""} → ${h.new_status_label || h.new_status || ""}`}
                            </div>
                          </div>
                        </li>
                      ))}
                      {!timeline.length && (
                        <div className="text-sm text-slate-500">Chưa có lịch sử</div>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PARTS & FILES */}
              <TabsContent value="assets" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Phụ tùng sử dụng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b">
                          <th className="py-2 pr-3">Tên</th>
                          <th className="py-2 pr-3">Mã</th>
                          <th className="py-2 pr-3">SL</th>
                          <th className="py-2 pr-3">Đơn giá</th>
                          <th className="py-2 pr-3">Nhà cung cấp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.map((p, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 pr-3">{p.part_name}</td>
                            <td className="py-2 pr-3">{p.part_code || "-"}</td>
                            <td className="py-2 pr-3">{p.qty}</td>
                            <td className="py-2 pr-3">{fmtVND(p.unit_cost)}</td>
                            <td className="py-2 pr-3">{p.supplier_name || "-"}</td>
                          </tr>
                        ))}
                        {!parts.length && (
                          <tr>
                            <td colSpan={5} className="py-2 text-slate-500">Không có phụ tùng</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tệp đính kèm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {files.map((f, idx) => (
                        <a
                          key={idx}
                          href={f.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                          <div>
                            <div className="text-sm font-medium">{f.file_name}</div>
                            <div className="text-xs text-slate-500">{f.mime_type}</div>
                          </div>
                          <ChevronRightIcon className="ml-auto h-4 w-4 text-slate-400" />
                        </a>
                      ))}
                      {!files.length && (
                        <div className="text-sm text-slate-500">Chưa có tệp đính kèm</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
