// src/components/RoleDepartment/SettingRoleDepartment.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "../../lib/httpClient";
import { toast } from "react-toastify";

/* ===================== API ===================== */
const API_BASE = "http://localhost:5000/api";
const API = {
  roles: {
    list: `${API_BASE}/roles/all-roles`,
    update: (id) => `${API_BASE}/roles/update/${id}`,
    delete: (id) => `${API_BASE}/roles/delete/${id}`,
    search: (name) => `${API_BASE}/roles/search?name=${encodeURIComponent(name)}`,
  },
  perms: {
    all: `${API_BASE}/admin/permissions`,
    role: (id) => `${API_BASE}/admin/roles/${id}/permissions`,
    save: (id) => `${API_BASE}/admin/roles/${id}/permissions`, // PUT { keys: string[] }
    create: `${API_BASE}/admin/permissions`,                   // POST { key, description }
    update: (id) => `${API_BASE}/admin/permissions/${id}`,     // PUT { key?, description? }
    delete: (id) => `${API_BASE}/admin/permissions/${id}`,     // DELETE
  },
};

// Kèm Bearer token nếu httpClient chưa tự gắn
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== Utils ===================== */
const classNames = (...a) => a.filter(Boolean).join(" ");
const debounce = (fn, delay = 400) => {
  let t = null;
  let lastArgs = [];
  const debounced = (...args) => {
    lastArgs = args;
    clearTimeout(t);
    t = setTimeout(() => fn(...lastArgs), delay);
  };
  debounced.cancel = () => {
    clearTimeout(t);
    t = null;
    lastArgs = [];
  };
  return debounced;
};

const moduleFromKey = (key) =>
  key?.includes(".") ? key.split(".")[0] : key === "*" ? "wildcard" : "misc";

function groupPerms(perms = []) {
  const groups = {};
  for (const p of perms) {
    const mod = moduleFromKey(p.key);
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  Object.values(groups).forEach((arr) => arr.sort((a, b) => a.key.localeCompare(b.key)));
  return groups;
}

/* ================= Permission Drawer ================= */
function PermissionDrawer({
  open,
  onClose,
  role,
  allPermissions,     // [{id_permission,key,description}]
  initialSelected,    // ["ticket.view",...]
  onSave,             // save role-permissions
  onReloadPerms,      // reload full permissions from server (parent)
  saving,
  canManage,          // <== NEW: kiểm soát bật/tắt thao tác
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("group"); // 'group' | 'table'
  const [selected, setSelected] = useState(new Set(initialSelected));
  const [busyRow, setBusyRow] = useState(null); // id_permission đang thao tác

  useEffect(() => {
    setSelected(new Set(initialSelected));
    setQuery("");
    setTab("group");
  }, [role?.id_roles, initialSelected]);

  const filteredPerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter(
      (p) =>
        p.key.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        String(p.id_permission).includes(q)
    );
  }, [allPermissions, query]);

  const groups = useMemo(() => groupPerms(filteredPerms), [filteredPerms]);

  const toggle = (key) => {
    if (!canManage) return; // đọc-only
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const isAllChecked = (list) => list.every((p) => selected.has(p.key));
  const isSomeChecked = (list) => list.some((p) => selected.has(p.key));

  const toggleGroup = (list) => {
    if (!canManage) return; // đọc-only
    const next = new Set(selected);
    const all = isAllChecked(list);
    for (const p of list) {
      if (all) next.delete(p.key);
      else next.add(p.key);
    }
    setSelected(next);
  };

  const selectAllFiltered = () => {
    if (!canManage) return; // đọc-only
    const allKeys = filteredPerms.map((p) => p.key);
    const next = new Set(selected);
    const allOn = allKeys.every((k) => next.has(k));
    if (allOn) allKeys.forEach((k) => next.delete(k));
    else allKeys.forEach((k) => next.add(k));
    setSelected(next);
  };

  // CRUD Permission (đơn giản bằng prompt/confirm) — chỉ cho canManage
  const createPermission = async () => {
    if (!canManage) return;
    const key = window.prompt("Nhập KEY (vd: ticket.view):");
    if (!key || !key.trim()) return;
    const description = window.prompt("Mô tả (tuỳ chọn):") || "";
    try {
      await axios.post(
        API.perms.create,
        { key: key.trim(), description },
        { headers: authHeaders() }
      );
      toast.success("Đã tạo permission!");
      onReloadPerms && onReloadPerms();
    } catch (e) {
      if (e?.response?.status === 409) toast.error("Key đã tồn tại!");
      else toast.error("Không thể tạo permission.");
    }
  };

  const editPermission = async (p) => {
    if (!canManage) return;
    const newKey = window.prompt("Sửa KEY:", p.key);
    if (newKey == null) return; // cancel
    const newDesc = window.prompt("Sửa mô tả:", p.description || "") ?? "";
    try {
      setBusyRow(p.id_permission);
      await axios.put(
        API.perms.update(p.id_permission),
        { key: newKey.trim(), description: newDesc },
        { headers: authHeaders() }
      );
      toast.success("Đã cập nhật permission!");
      onReloadPerms && onReloadPerms();
      // cập nhật tick nếu đổi key
      if (newKey.trim() !== p.key) {
        const next = new Set(selected);
        if (next.has(p.key)) {
          next.delete(p.key);
          next.add(newKey.trim());
          setSelected(next);
        }
      }
    } catch (e) {
      if (e?.response?.status === 409) toast.error("Key đã tồn tại!");
      else toast.error("Không thể cập nhật permission.");
    } finally {
      setBusyRow(null);
    }
  };

  const deletePermission = async (p) => {
    if (!canManage) return;
    if (!window.confirm(`Xoá permission "${p.key}"?`)) return;
    try {
      setBusyRow(p.id_permission);
      await axios.delete(API.perms.delete(p.id_permission), { headers: authHeaders() });
      toast.success("Đã xoá permission!");
      onReloadPerms && onReloadPerms();
      // nếu đang tick thì bỏ tick
      const next = new Set(selected);
      next.delete(p.key);
      setSelected(next);
    } catch (e) {
      toast.error("Không thể xoá permission.");
    } finally {
      setBusyRow(null);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      {/* panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[760px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Phân quyền</h2>
              <p className="text-sm text-gray-500">
                Role: <span className="font-medium">{role?.name_role}</span> (ID: {role?.id_roles})
              </p>
              {!canManage && (
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  Chế độ xem (không có quyền role.manage)
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>

          {/* Search & Meta */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo key / mô tả / ID…"
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </div>
              <button
                onClick={selectAllFiltered}
                disabled={!canManage}
                className={classNames(
                  "rounded-lg px-3 py-2 text-sm whitespace-nowrap",
                  canManage ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-100 opacity-60 cursor-not-allowed"
                )}
              >
                Chọn/Bỏ chọn tất cả
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                Đang chọn <span className="font-semibold">{selected.size}</span> /{" "}
                <span className="font-semibold">{filteredPerms.length}</span> permission
              </div>
              {canManage && (
                <button
                  onClick={createPermission}
                  className="rounded-lg px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  Thêm permission
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 inline-flex rounded-lg border bg-gray-50 p-1">
            <button
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm",
                tab === "group" ? "bg-white shadow" : "text-gray-600"
              )}
              onClick={() => setTab("group")}
            >
              Theo nhóm
            </button>
            <button
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm",
                tab === "table" ? "bg-white shadow" : "text-gray-600"
              )}
              onClick={() => setTab("table")}
            >
              Bảng chi tiết
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === "group" ? (
            <div className="p-3 sm:p-4 space-y-4">
              {Object.entries(groups).map(([mod, list]) => (
                <div key={mod} className="border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAllChecked(list)}
                        onChange={() => toggleGroup(list)}
                        disabled={!canManage}
                        ref={(el) => {
                          if (el) el.indeterminate = !isAllChecked(list) && isSomeChecked(list);
                        }}
                      />
                      <span className="font-medium capitalize">
                        {mod === "wildcard" ? "Wildcard" : mod}
                      </span>
                      <span className="text-xs text-gray-500">({list.length} quyền)</span>
                    </div>
                    <button
                      onClick={() => toggleGroup(list)}
                      disabled={!canManage}
                      className={classNames(
                        "text-xs px-2 py-1 rounded border",
                        canManage ? "bg-white hover:bg-gray-100" : "bg-gray-50 opacity-60 cursor-not-allowed"
                      )}
                    >
                      {isAllChecked(list) ? "Bỏ chọn nhóm" : "Chọn nhóm"}
                    </button>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.map((p) => (
                      <label
                        key={p.id_permission}
                        className="flex items-start gap-3 p-2 rounded-lg border hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.key)}
                          onChange={() => toggle(p.key)}
                          disabled={!canManage}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium break-all">{p.key}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              ID: {p.id_permission}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-xs text-gray-500 mt-0.5 break-words">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groups).length === 0 && (
                <p className="text-gray-500 text-sm px-1">Không có permission nào khớp.</p>
              )}
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2.5 px-3 text-xs font-semibold uppercase text-gray-500">ID</th>
                        <th className="py-2.5 px-3 text-xs font-semibold uppercase text-gray-500">Key</th>
                        <th className="py-2.5 px-3 text-xs font-semibold uppercase text-gray-500">Description</th>
                        <th className="py-2.5 px-3 text-xs font-semibold uppercase text-gray-500">Đang cấp</th>
                        {canManage && (
                          <th className="py-2.5 px-3 text-xs font-semibold uppercase text-gray-500">Quản lý</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerms.map((p) => (
                        <tr key={p.id_permission} className="border-t hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-sm text-gray-700">{p.id_permission}</td>
                          <td className="py-2.5 px-3 text-sm font-medium break-all">{p.key}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-600 break-words">
                            {p.description || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={selected.has(p.key)}
                              onChange={() => toggle(p.key)}
                              disabled={!canManage}
                            />
                          </td>
                          {canManage && (
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={busyRow === p.id_permission}
                                  onClick={() => editPermission(p)}
                                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs"
                                >
                                  Sửa
                                </button>
                                <button
                                  disabled={busyRow === p.id_permission}
                                  onClick={() => deletePermission(p)}
                                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                                >
                                  Xoá
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredPerms.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 5 : 4} className="py-6 text-center text-gray-500">
                            Không có dữ liệu.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {canManage ? (
                <p className="text-xs text-gray-500 mt-2">
                  * Dùng “Sửa” để đổi <b>key/description</b>, “Xoá” để xoá permission. Sau khi thay đổi,
                  danh sách sẽ tự làm mới.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">* Bạn chỉ có quyền xem.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            disabled={saving}
          >
            Hủy
          </button>
          <button
            onClick={() => canManage && onSave(Array.from(selected))}
            className={classNames(
              "px-4 py-2 rounded-lg text-white",
              canManage
                ? saving
                  ? "bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            )}
            disabled={saving || !canManage}
          >
            {canManage ? (saving ? "Đang lưu…" : "Lưu phân quyền") : "Chỉ xem"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ================= Trang chính ================= */
export default function SettingRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedRole, setEditedRole] = useState({ id_roles: "", name_role: "" });
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // permissions
  const [allPerms, setAllPerms] = useState([]); // [{id_permission,key,description}]
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState(null);
  const [drawerKeys, setDrawerKeys] = useState([]); // ["ticket.view",...]
  const [savingPerms, setSavingPerms] = useState(false);

  // NEW: cờ quyền quản trị
  const [canManage, setCanManage] = useState(false);

  const didInit = useRef(false);

  // fetch roles
  const fetchRoles = useCallback(
    async (signal) => {
      try {
        const res = await axios.get(API.roles.list, {
          headers: authHeaders(),
          signal,
          params: { _t: Date.now() },
        });
        const sorted = (res.data || []).sort((a, b) => a.id_roles - b.id_roles);
        setRoles(sorted);
        setError(null);
      } catch (e) {
        if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
        setError(e?.response?.data?.message || "Lỗi khi lấy danh sách vai trò.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // fetch all permissions (đồng thời xác định canManage)
  const fetchAllPerms = useCallback(async (signal) => {
    try {
      const res = await axios.get(API.perms.all, {
        headers: authHeaders(),
        signal,
        params: { _t: Date.now() },
      });
      const arr = (res.data || []).map((p) => ({
        id_permission: p.id_permission,
        key: p.key,
        description: p.description || "",
      }));
      arr.sort((a, b) => a.key.localeCompare(b.key));
      setAllPerms(arr);
      setCanManage(true); // thành công => có role.manage
    } catch (e) {
      // 403 => không có role.manage => chế độ xem
      if (e?.response?.status === 403) {
        setCanManage(false);
        setAllPerms([]); // không tải được quyền
        // không cần toast làm phiền
        return;
      }
      if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
      toast.error("Không tải được danh sách permissions.");
      console.error(e);
    }
  }, []);

  // mount once
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const controller = new AbortController();
    fetchRoles(controller.signal);
    fetchAllPerms(controller.signal); // xác định canManage ở đây
    return () => controller.abort();
  }, [fetchRoles, fetchAllPerms]);

  // auto refresh roles
  useEffect(() => {
    let id;
    if (autoRefresh) {
      id = setInterval(() => fetchRoles(undefined), 5000);
    }
    return () => id && clearInterval(id);
  }, [autoRefresh, fetchRoles]);

  // Search
  const searchNow = useCallback(
    async (term) => {
      const q = (term || "").trim();
      if (!q) {
        const controller = new AbortController();
        fetchRoles(controller.signal);
        return;
      }
      try {
        const res = await axios.get(API.roles.search(q), {
          headers: authHeaders(),
          params: { _t: Date.now() },
        });
        const sorted = (res.data || []).sort((a, b) => a.id_roles - b.id_roles);
        setRoles(sorted);
      } catch {
        setError("Lỗi khi tìm kiếm vai trò.");
      }
    },
    [fetchRoles]
  );
  const debouncedSearch = useMemo(() => debounce(searchNow, 400), [searchNow]);
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchTerm(v);
    debouncedSearch(v);
  };
  const onSearchSubmit = () => {
    debouncedSearch.cancel();
    searchNow(searchTerm);
  };

  // Guarded actions: chỉ cho canManage
  const handleEdit = (role) => {
    if (!canManage) {
      toast.info("Bạn không có quyền role.manage để chỉnh sửa.");
      return;
    }
    setEditingId(role.id_roles);
    setEditedRole({ ...role });
  };

  const handleSave = async (id) => {
    if (!canManage) return;
    if (!editedRole.name_role?.trim()) {
      toast.error("Tên vai trò không được để trống!");
      return;
    }
    try {
      await axios.put(
        API.roles.update(id),
        { name_role: editedRole.name_role.trim() },
        { headers: authHeaders(), params: { _t: Date.now() } }
      );
      toast.success("Cập nhật vai trò thành công!");
      setEditingId(null);
      const c = new AbortController();
      fetchRoles(c.signal);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Có lỗi xảy ra khi cập nhật vai trò.");
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) {
      toast.info("Bạn không có quyền role.manage để xoá.");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa vai trò này?")) return;
    try {
      await axios.delete(API.roles.delete(id), {
        headers: authHeaders(),
        params: { _t: Date.now() },
      });
      toast.success("Xóa vai trò thành công!");
      const c = new AbortController();
      fetchRoles(c.signal);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Có lỗi xảy ra khi xóa vai trò.");
    }
  };

  // Open drawer → chỉ cho canManage (vì backend cũng đang chặn 403)
  const openPermissionDrawer = async (role) => {
    if (!canManage) {
      toast.info("Bạn không có quyền role.manage để phân quyền.");
      return;
    }
    setDrawerRole(role);
    setDrawerKeys([]);
    setDrawerOpen(true);
    try {
      const res = await axios.get(API.perms.role(role.id_roles), {
        headers: authHeaders(),
        params: { _t: Date.now() },
      });
      setDrawerKeys(res.data || []);
    } catch (e) {
      setDrawerOpen(false);
      if (e?.response?.status === 403) {
        toast.warn("Bạn không có quyền role.manage để xem/đổi phân quyền.");
      } else {
        toast.error("Không tải được phân quyền của role.");
      }
    }
  };

  const savePermissions = async (keys) => {
    if (!canManage) return;
    try {
      setSavingPerms(true);
      await axios.put(
        API.perms.save(drawerRole.id_roles),
        { keys },
        { headers: authHeaders(), params: { _t: Date.now() } }
      );
      toast.success("Đã lưu phân quyền cho role!");
      setDrawerOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Lưu phân quyền thất bại.");
    } finally {
      setSavingPerms(false);
    }
  };

  /* =============== Render =============== */
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 w-full rounded-2xl bg-gradient-to-r from-indigo-100 to-blue-100 animate-pulse" />
        <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-[360px] w-full bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Hero header */}
      <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Roles & Permissions</h1>
            <p className="text-sm text-white/80">
              Chỉnh sửa vai trò và cấu hình phân quyền theo từng role
            </p>
            {!canManage && (
              <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-white/10">
                Chế độ xem (không có role.manage)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg">
              Tổng vai trò: <span className="font-semibold">{roles.length}</span>
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg">
              Tổng permission: <span className="font-semibold">{allPerms.length}</span>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh((v) => !v)}
              />
              <span>Tự động làm mới</span>
            </label>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên role…"
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        </div>
        <button
          onClick={onSearchSubmit}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Table Roles */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500">ID</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500">Tên Role</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-500 w-72">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const editing = editingId === role.id_roles;
                return (
                  <tr key={role.id_roles} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{role.id_roles}</td>
                    <td className="py-3 px-4">
                      {editing ? (
                        <input
                          value={editedRole.name_role}
                          onChange={(e) =>
                            setEditedRole((r) => ({ ...r, name_role: e.target.value }))
                          }
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-medium">{role.name_role}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {!editing ? (
                          <>
                            {canManage && (
                              <button
                                onClick={() => handleEdit(role)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                              >
                                Chỉnh sửa
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => openPermissionDrawer(role)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                              >
                                Phân quyền
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => handleDelete(role.id_roles)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                              >
                                Xóa
                              </button>
                            )}
                            {!canManage && (
                              <span className="text-xs text-gray-500">Chỉ xem</span>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSave(role.id_roles)}
                              className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                              disabled={!canManage}
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {roles.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Không có dữ liệu role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer phân quyền */}
      <PermissionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={drawerRole}
        allPermissions={allPerms}
        initialSelected={drawerKeys}
        onSave={savePermissions}
        onReloadPerms={() => {
          const c = new AbortController();
          fetchAllPerms(c.signal);
        }}
        saving={savingPerms}
        canManage={canManage} // <== truyền cờ quyền
      />
    </div>
  );
}
