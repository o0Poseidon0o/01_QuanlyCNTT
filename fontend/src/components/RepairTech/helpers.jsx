export function formatDate(dt) {
  if (!dt) return "-";
  try { return new Date(dt).toLocaleString(); } catch { return String(dt); }
}

export function formatMoney(n) {
  if (n == null) return "-";
  try { return Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" }); }
  catch { return `${n}`; }
}

export function isOverSLA(row) {
  if (!row?.sla_hours) return false;
  const start = new Date(row.date_reported);
  const end = row.end_time ? new Date(row.end_time) : new Date();
  const diffH = (end - start) / 36e5;
  return diffH > row.sla_hours && row.status !== "completed" && row.status !== "canceled";
}

export function calcKPIs(rows) {
  const open = rows.filter((r) => !["completed","canceled"].includes(r.status)).length;
  const inProgress = rows.filter((r) => ["in_progress","pending_parts"].includes(r.status)).length;
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

export function buildMonthlyCost(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const d = new Date(r.date_reported);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + (r.total_cost || 0));
  });
  return Array.from(map.entries())
    .map(([month, cost]) => ({ month, cost }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function buildStatusDist(rows) {
  const map = {};
  rows.forEach((r) => (map[r.status] = (map[r.status] || 0) + 1));
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
