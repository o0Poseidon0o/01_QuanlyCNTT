// src/components/Users/ProfileUsers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../lib/httpClient";
import {
  createRepair,
  // listRepairs, // ⛔️ bỏ, dùng endpoint /repairs/user/:id
  confirmComplete,
} from "../../services/repairsApi";

/* ================== CONFIG ================== */
const API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const DEFAULT_AVT =
  "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=default";

const PAGE_SIZE_DEFAULT = 8;

/* ================== LOCAL CONFIRM CACHE (hide button after refresh) ================== */
const HIDE_TTL_MS = 10 * 60 * 1000; // 10 phút
const confirmStoreKey = (uid) => `u:${uid}:confirmHidden`;
function loadConfirmStore(uid) {
  try {
    return JSON.parse(localStorage.getItem(confirmStoreKey(uid)) || "{}");
  } catch {
    return {};
  }
}
function saveConfirmStore(uid, obj) {
  try {
    localStorage.setItem(confirmStoreKey(uid), JSON.stringify(obj || {}));
  } catch {}
}
function isLocallyHidden(uid, tid) {
  const store = loadConfirmStore(uid);
  const ts = store?.[tid];
  if (!ts) return false;
  if (Date.now() - ts > HIDE_TTL_MS) {
    delete store[tid];
    saveConfirmStore(uid, store);
    return false;
  }
  return true;
}
function markLocallyHidden(uid, tid) {
  const store = loadConfirmStore(uid);
  store[tid] = Date.now();
  saveConfirmStore(uid, store);
}
function clearLocalHidden(uid, tid) {
  const store = loadConfirmStore(uid);
  if (store?.[tid]) {
    delete store[tid];
    saveConfirmStore(uid, store);
  }
}

/* ================== THEME HOOK ================== */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      const saved = localStorage.getItem("theme");
      if (!saved) setTheme(e.matches ? "dark" : "light");
    };
    mql?.addEventListener?.("change", onChange);
    return () => mql?.removeEventListener?.("change", onChange);
  }, []);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

/* ================== STYLE TOKENS ================== */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";
const TRANS = "transition-colors duration-150";
const RING =
  "ring-1 ring-neutral-200 dark:ring-neutral-700 group-hover:ring-neutral-300 dark:group-hover:ring-neutral-600";

const STYLES = {
  page:
    "min-h-screen p-6 mt-10 bg-gradient-to-b from-sky-50 via-white to-white " +
    "dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220]",
  panel:
    "bg-white shadow-md border border-sky-100 rounded-xl " +
    "dark:bg-neutral-800/70 dark:border-neutral-700 backdrop-blur",
  panelHead:
    "p-4 border-b border-sky-100/80 bg-white/80 backdrop-blur flex items-center justify-between " +
    "dark:border-neutral-700 dark:bg-neutral-800/60",
  hTitle: "text-sm font-semibold text-neutral-900 dark:text-neutral-50",
  subText: "text-xs text-neutral-600 dark:text-neutral-300",
  text: "text-sm text-neutral-900 dark:text-neutral-50",
  textMute: "text-[11px] text-neutral-500 dark:text-neutral-300",
  input:
    `text-sm px-3 py-2 border rounded-lg w/full ` +
    `border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 ` +
    `dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 ${FOCUS} ${TRANS}`.replace(
      "w/full",
      "w-full"
    ),
  select:
    `text-sm px-3 py-2 border rounded-lg ` +
    `border-neutral-300 bg-white text-neutral-900 ` +
    `dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 ${FOCUS} ${TRANS}`,
  btn:
    `px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-sky-50 ` +
    `text-sm text-neutral-700 shadow-sm ${FOCUS} ${TRANS} ` +
    `dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700`,
  btnPrimary:
    `px-4 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 ${FOCUS} ${TRANS}`,
  btnSoftIndigo:
    `text-xs px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 ` +
    `${FOCUS} ${TRANS} dark:border-sky-700/40 dark:text-sky-300 dark:hover:bg-sky-900/20`,
  tableWrap: "overflow-x-auto max-w-full",
  tableHead:
    "bg-gradient-to-b from-sky-100/80 to-blue-50/80 text-neutral-800 " +
    "dark:from-neutral-800/90 dark:to-neutral-800/90 dark:text-neutral-100 sticky top-0 z-10",
  tableTd: "px-3 py-2 text-sm text-neutral-800 dark:text-neutral-50",
  tableTh: "text-left text-xs font-medium uppercase tracking-wide px-3 py-2",
  divider: "divide-y divide-sky-100 dark:divide-neutral-700",
  hoverRow: "hover:bg-sky-50 dark:hover:bg-neutral-700/60",
  pillBase:
    "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold",
};

const VI_SEVERITY = {
  critical: "Khẩn",
  high: "Cao",
  medium: "Trung Bình",
  low: "Thấp",
};
const VI_PRIORITY = {
  urgent: "Khẩn",
  high: "Cao",
  normal: "Bình Thường",
  low: "Thấp",
};

const ProfileUsers = () => {
  // đồng bộ theme theo system
  useTheme();

  const [userId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("id_users") || "" : ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [devices, setDevices] = useState([]);

  // Tickets
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPageSize, setTicketPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Tabs
  const STATUS_TABS = useMemo(
    () => [
      { key: "all", label: "Tất cả" },
      { key: "requested", label: "Được yêu cầu" },
      { key: "approved", label: "Đã duyệt" },
      { key: "in_progress", label: "Đang xử lý" },
      { key: "pending_parts", label: "Chờ linh kiện" },
      { key: "completed", label: "Hoàn tất" },
      { key: "canceled", label: "Huỷ" },
    ],
    []
  );
  const [ticketTab, setTicketTab] = useState("all");

  // Xác nhận hoàn thành
  const [confirmingId, setConfirmingId] = useState(null);

  // Đổi mật khẩu
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpShow, setCpShow] = useState({ nw: false, cf: false });
  const [cpMsg, setCpMsg] = useState({ type: "", text: "" });
  const [cpLoading, setCpLoading] = useState(false);

  // ép re-render khi set local hide
  const [localHideTick, setLocalHideTick] = useState(0);

  // ✅ thêm header x-user-id cho mọi request (backend sẽ đọc đúng user hiện tại)
  useEffect(() => {
    if (userId) {
      try {
        axios.defaults.headers.common["x-user-id"] = String(userId);
      } catch {}
    }
  }, [userId]);

  const validatePassword = (v) => typeof v === "string" && v.trim().length >= 6;

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    setCpMsg({ type: "", text: "" });

    if (!userId || !/^\d+$/.test(String(userId))) {
      setCpMsg({ type: "error", text: "Thiếu hoặc sai ID người dùng." });
      return;
    }
    if (!validatePassword(cpNew)) {
      setCpMsg({ type: "error", text: "Mật khẩu mới tối thiểu 6 ký tự." });
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpMsg({ type: "error", text: "Xác nhận mật khẩu không khớp." });
      return;
    }

    setCpLoading(true);
    try {
      await axios.put(`${API_BASE}/users/update/${userId}`, {
        password_user: cpNew,
      });
      setCpMsg({ type: "success", text: "Cập nhật mật khẩu thành công." });
      setCpNew("");
      setCpConfirm("");
      setTimeout(() => setShowPwdModal(false), 600);
    } catch (err) {
      setCpMsg({
        type: "error",
        text: err?.response?.data?.message || "Cập nhật mật khẩu thất bại.",
      });
    } finally {
      setCpLoading(false);
    }
  };

  // ===== Signature =====
  const [sigMsg, setSigMsg] = useState({ type: "", text: "" });
  const [sigLoading, setSigLoading] = useState(false);
  const [sigVer, setSigVer] = useState(0);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const sigImgTriedRef = useRef(false);

  const signatureUrl = useMemo(() => {
    if (!user?.id_users) return "";
    const bust = `${
      (user?.updated_at && new Date(user.updated_at).getTime()) || 0
    }-${sigVer}`;
    return `${API_BASE}/signatures/file/${user.id_users}?v=${bust}`;
  }, [user, sigVer]);

  const inputFileRef = useRef(null);
  const onClickUploadSig = () => inputFileRef.current?.click();

  const handleChooseSigFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigMsg({ type: "", text: "" });

    const allowed = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setSigMsg({ type: "error", text: "Chỉ cho phép PNG/JPG/SVG." });
      e.target.value = "";
      return;
    }
    if (!userId) {
      setSigMsg({ type: "error", text: "Thiếu ID người dùng." });
      e.target.value = "";
      return;
    }

    setSigLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(
        `${API_BASE}/signatures/upload/${userId}`,
        fd,
        {
          headers: {},
          transformRequest: [
            (d, h) => {
              if (h && h["Content-Type"]) delete h["Content-Type"];
              return d;
            },
          ],
        }
      );

      const stored = res?.data?.signature_image;
      if (stored) {
        setUser((u) => ({
          ...(u || {}),
          signature_image: stored,
          updated_at: new Date().toISOString(),
        }));
        sigImgTriedRef.current = false;
        setSigVer((v) => v + 1);
        setSigMsg({ type: "success", text: "Tải chữ ký thành công." });
      } else {
        setSigMsg({
          type: "error",
          text: "Tải lên không trả về đường dẫn chữ ký.",
        });
      }
    } catch (err) {
      setSigMsg({
        type: "error",
        text: err?.response?.data?.message || "Tải chữ ký thất bại.",
      });
    } finally {
      setSigLoading(false);
      e.target.value = "";
    }
  };

  const handleDeleteSignature = async () => {
    if (!userId) {
      setSigMsg({ type: "error", text: "Thiếu ID người dùng." });
      return;
    }
    setSigMsg({ type: "", text: "" });
    setSigLoading(true);
    try {
      await axios.delete(`${API_BASE}/signatures/${userId}`);
      setUser((u) => ({
        ...(u || {}),
        signature_image: "",
        updated_at: new Date().toISOString(),
      }));
      sigImgTriedRef.current = false;
      setSigVer((v) => v + 1);
      setSigMsg({ type: "success", text: "Đã xoá chữ ký." });
    } catch (err) {
      setSigMsg({
        type: "error",
        text: err?.response?.data?.message || "Xoá chữ ký thất bại.",
      });
    } finally {
      setSigLoading(false);
    }
  };

  // Vẽ chữ ký
  const openDrawModal = () => {
    setSigMsg({ type: "", text: "" });
    setShowDrawModal(true);
    setTimeout(() => initCanvas(), 50);
  };
  const closeDrawModal = () => setShowDrawModal(false);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = 480;
    const cssH = 180;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    ctxRef.current = ctx;
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches?.length) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onStartDraw = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };
  const onMoveDraw = (e) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  };
  const onEndDraw = () => {
    drawingRef.current = false;
  };
  const onClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const cssW = parseInt(canvas.style.width || "480", 10);
    const cssH = parseInt(canvas.style.height || "180", 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
  };

  const onSaveDrawing = async () => {
    if (!canvasRef.current) return;
    if (!userId) {
      setSigMsg({ type: "error", text: "Thiếu ID người dùng." });
      return;
    }
    setSigLoading(true);
    setSigMsg({ type: "", text: "" });

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      let res;
      try {
        res = await axios.post(
          `${API_BASE}/signatures/draw/${userId}`,
          { dataUrl },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        if (err?.response?.status === 400) {
          res = await axios.post(`${API_BASE}/signatures/draw/${userId}`, dataUrl, {
            headers: { "Content-Type": "text/plain" },
          });
        } else {
          throw err;
        }
      }

      const stored = res?.data?.signature_image;
      if (stored) {
        setUser((u) => ({
          ...(u || {}),
          signature_image: stored,
          updated_at: new Date().toISOString(),
        }));
        sigImgTriedRef.current = false;
        setSigVer((v) => v + 1);
        setSigMsg({ type: "success", text: "Đã lưu chữ ký vẽ tay." });
        setShowDrawModal(false);
      } else {
        setSigMsg({ type: "error", text: "Lưu không trả về đường dẫn chữ ký." });
      }
    } catch (err) {
      setSigMsg({
        type: "error",
        text: err?.response?.data?.message || "Lưu chữ ký thất bại.",
      });
    } finally {
      setSigLoading(false);
    }
  };

  // Helpers
  const canonical = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const deptMap = useMemo(() => {
    const m = {};
    (departments || []).forEach((d) => {
      m[String(d.id_departments)] = d.department_name || d.name || d.title;
    });
    return m;
  }, [departments]);

  const roleMap = useMemo(() => {
    const m = {};
    (roles || []).forEach((r) => {
      m[String(r.id_roles || r.id_role || r.id)] =
        r.role_name || r.name_role || r.name || r.title;
    });
    return m;
  }, [roles]);

  const departmentName = useMemo(() => {
    if (!user) return "—";
    return (
      user.department_name ||
      user?.Department?.department_name ||
      user?.Departments?.department_name ||
      deptMap[String(user.id_departments)] ||
      "—"
    );
  }, [user, deptMap]);

  const roleName = useMemo(() => {
    if (!user) return "—";
    return (
      user.role_name ||
      user?.Role?.name_role ||
      user?.Roles?.name_role ||
      roleMap[String(user.id_roles)] ||
      "—"
    );
  }, [user, roleMap]);

  // Status pill
  const statusPill = (st, label) => {
    const v = String(st || "").toLowerCase();
    const map = {
      requested:
        "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-900/25 dark:border-sky-800",
      approved:
        "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/25 dark:border-blue-800",
      in_progress:
        "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/25 dark:border-indigo-800",
      pending_parts:
        "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/25 dark:border-amber-800",
      completed:
        "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/25 dark:border-emerald-800",
      canceled:
        "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/25 dark:border-rose-800",
    };
    const cls =
      map[v] ||
      "text-neutral-700 bg-neutral-50 border-neutral-200 dark:text-neutral-200 dark:bg-neutral-800 dark:border-neutral-700";
    const show = label || st || "—";
    return <span className={`${STYLES.pillBase} ${cls}`}>{show}</span>;
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const formatTimeShort = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(
      d.getSeconds()
    )} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const formatVND = (n) => `${(Number(n) || 0).toLocaleString("vi-VN")} đ`;

  // Fetch user
  useEffect(() => {
    let mounted = true;
    const fetchUser = async (id) => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/users/search`, {
          params: { id_users: id },
          headers: { "Cache-Control": "no-cache" },
        });
        let data = null;
        if (Array.isArray(res.data)) data = res.data[0] || null;
        else if (res.data?.user) data = res.data.user;
        else if (Array.isArray(res.data?.users)) data = res.data.users[0] || null;
        else data = res.data || null;

        if (!mounted) return;

        if (!data) {
          setError("Không tìm thấy người dùng.");
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message || "Lỗi khi tải thông tin người dùng"
        );
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (userId) fetchUser(userId);
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Fetch departments
  useEffect(() => {
    let mounted = true;
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_BASE}/departments/all-departments`);
        if (!mounted) return;
        setDepartments(
          Array.isArray(res.data) ? res.data : res.data?.departments || []
        );
      } catch {
        if (mounted) setDepartments([]);
      }
    };
    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch roles
  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      const tryEndpoints = [
        `${API_BASE}/roles/all-roles`,
        `${API_BASE}/roles/all`,
        `${API_BASE}/roles/list`,
        `${API_BASE}/roles`,
      ];
      for (const url of tryEndpoints) {
        try {
          const r = await axios.get(url);
          const list = Array.isArray(r.data) ? r.data : r.data?.roles || [];
          if (list.length) {
            if (mounted) setRoles(list);
            return;
          }
        } catch {}
      }
      if (mounted) setRoles([]);
    };
    fetchRoles();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch devices
  useEffect(() => {
    let mounted = true;
    const fetchDevices = async () => {
      if (!userId) return;

      let baseDevices = [];
      try {
        const rAll = await axios.get(`${API_BASE}/devices/all`, {
          headers: { "Cache-Control": "no-cache" },
          params: { t: Date.now() },
        });
        const allDevices = Array.isArray(rAll.data) ? rAll.data : [];
        baseDevices = allDevices
          .filter((d) => String(d.id_users) === String(userId))
          .map((d) => ({
            id_devices: d.id_devices,
            name_devices: d.name_devices,
            note: d.DeviceNote || d.note || null,
            start_time: null,
          }));
      } catch {
        baseDevices = [];
      }

      try {
        const rAssign = await axios.get(
          `${API_BASE}/assignments/active-by-user/${userId}`,
          { headers: { "Cache-Control": "no-cache" }, params: { t: Date.now() } }
        );
        const assigns = Array.isArray(rAssign.data) ? rAssign.data : [];

        const assignDevices = assigns
          .map((r) => ({
            id_devices:
              r.id_devices ??
              r.Device?.id_devices ??
              r.device?.id_devices ??
              r.device_id,
            name_devices:
              r.Device?.name_devices ??
              r.device?.name_devices ??
              r.name_devices ??
              "",
            start_time: r.start_time || null,
            note:
              r.Device?.DeviceNote ??
              r.Device?.note ??
              r.device?.note ??
              r.note ??
              null,
          }))
          .filter((d) => d.id_devices);

        const map = new Map();
        baseDevices.forEach((d) => map.set(String(d.id_devices), d));
        assignDevices.forEach((d) => {
          const key = String(d.id_devices);
          if (map.has(key)) {
            const curr = map.get(key);
            map.set(key, { ...curr, start_time: d.start_time ?? curr.start_time });
          } else {
            map.set(key, d);
          }
        });

        if (mounted) setDevices(Array.from(map.values()));
      } catch {
        if (mounted) setDevices(baseDevices);
      }
    };

    fetchDevices();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Fetch my tickets — dùng endpoint backend mới: GET /repairs/user/:id
  const fetchMyTickets = async () => {
    if (!userId) return;
    setTicketsLoading(true);
    setTicketsError("");
    try {
      const res = await axios.get(`${API_BASE}/repairs/user/${userId}`, {
        params: {
          page: 1,
          limit: 500,
          includeCanceled: 1, // lấy cả "Huỷ" để tab riêng có dữ liệu
          _ts: Date.now(),
        },
        headers: { "Cache-Control": "no-cache" },
      });

      const rawList = Array.isArray(res.data)
        ? res.data
        : res?.data?.repairs || [];

      const normalized = (rawList || [])
        .map((t) => ({
          id_repair: t.id_repair ?? t.id ?? t.ticket_id,
          device_code:
            t.device_code ??
            t.id_devices ??
            t.Device?.id_devices ??
            t.device?.id_devices ??
            "",
          device_name:
            t.device_name ??
            t.Device?.name_devices ??
            t.device?.name_devices ??
            "",
          title: t.title ?? t.issue_title ?? "—",
          issue_description: t.issue_description ?? t.description ?? "",
          result: t.outcome ?? t.result ?? t.repair_result ?? "-",
          status: t.status,
          status_label: t.status_label || t.status,
          severity: (t.severity || "").toString().toLowerCase(),
          severity_label: t.severity_label || t.severity,
          priority: (t.priority || "").toString().toLowerCase(),
          priority_label: t.priority_label || t.priority,
          created_at:
            t.date_reported ?? t.created_at ?? t.createdAt ?? t.created_time,
          sla_hours: t.sla_hours ?? t.sla ?? null,
          reported_by:
            t.reported_by ??
            t.created_by ??
            t.reporter_id ??
            t.Reporter?.id_users ??
            null,
          reporter_name:
            t.reporter_name ??
            t.Reporter?.username ??
            t.created_by_name ??
            t.reported_by ??
            "",
          assignee_name:
            t.assignee ??
            t.assignee_name ??
            t.technician_name ??
            t.Technician?.username ??
            "",
          vendor_name: t.vendor_name ?? t.RepairVendor?.vendor_name ?? "",
          repair_type: t.repair_type ?? "",
          total_cost:
            t.total_cost ??
            Number(t.labor_cost || 0) +
              Number(t.parts_cost || 0) +
              Number(t.other_cost || 0),
          user_confirmed: t.user_confirmed ?? t.is_user_confirmed ?? null,
        }))
        // vẫn chỉ giữ ticket do chính user tạo
        .filter((t) => String(t.reported_by) === String(userId));

      // Dọn local hide: nếu server đã user_confirmed=true thì bỏ ẩn; nếu hết TTL cũng bỏ
      try {
        const store = loadConfirmStore(userId);
        let changed = false;
        normalized.forEach((t) => {
          const tid = t.id_repair;
          if (!tid) return;
          if (t.user_confirmed) {
            if (store?.[tid]) {
              delete store[tid];
              changed = true;
            }
          } else {
            if (store?.[tid] && Date.now() - store[tid] > HIDE_TTL_MS) {
              delete store[tid];
              changed = true;
            }
          }
        });
        if (changed) saveConfirmStore(userId, store);
      } catch {}

      normalized.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setMyTickets(normalized);
      setTicketPage(1);
    } catch (e) {
      setTicketsError(
        e?.response?.data?.message || "Không tải được danh sách ticket của bạn."
      );
      setMyTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const refreshMyTickets = () => fetchMyTickets();

  useEffect(() => {
    fetchMyTickets();
  }, [userId]); // eslint-disable-line

  // Modal tạo ticket
  const NEW_TICKET_DEFAULT = {
    id_devices: "",
    title: "",
    issue_description: "",
    severity: "medium",
    priority: "normal",
    sla_hours: 24,
  };
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ntForm, setNtForm] = useState(NEW_TICKET_DEFAULT);
  const [ntMsg, setNtMsg] = useState({ type: "", text: "" });
  const [ntLoading, setNtLoading] = useState(false);

  const openCreateTicket = (prefillDeviceId) => {
    setNtMsg({ type: "", text: "" });
    setNtForm((f) => ({
      ...f,
      id_devices: prefillDeviceId || devices[0]?.id_devices || "",
    }));
    setShowCreateTicket(true);
  };

  const submitCreateTicket = async (e) => {
    e?.preventDefault?.();
    setNtMsg({ type: "", text: "" });

    if (!userId) {
      setNtMsg({ type: "error", text: "Thiếu ID người dùng." });
      return;
    }
    if (!ntForm.id_devices) {
      setNtMsg({ type: "error", text: "Vui lòng chọn thiết bị." });
      return;
    }
    if (!String(ntForm.title || "").trim()) {
      setNtMsg({ type: "error", text: "Vui lòng nhập tiêu đề." });
      return;
    }

    setNtLoading(true);
    try {
      const payload = { ...ntForm, reported_by: Number(userId) };
      const res = await createRepair(payload);
      const idNew = res?.id_repair;

      setNtMsg({
        type: "success",
        text: `Tạo ticket thành công${idNew ? ` (#${idNew})` : ""}.`,
      });

      setTimeout(() => {
        setNtForm(NEW_TICKET_DEFAULT);
        setShowCreateTicket(false);
        refreshMyTickets();
      }, 800);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Tạo ticket thất bại. Vui lòng kiểm tra quyền & dữ liệu.";
      setNtMsg({ type: "error", text: msg });
    } finally {
      setNtLoading(false);
    }
  };

  // Lọc + phân trang
  const filteredByTab = useMemo(() => {
    if (ticketTab === "all") {
      // 👇 giữ nguyên như API cũ: tab "Tất cả" KHÔNG hiển thị "Huỷ"
      return myTickets.filter(
        (t) => String(t.status || "").toLowerCase() !== "canceled"
      );
    }
    return myTickets.filter(
      (t) => String(t.status || "").toLowerCase() === ticketTab
    );
  }, [myTickets, ticketTab]);

  const filteredTickets = useMemo(() => {
    const q = canonical(ticketQuery);
    if (!q) return filteredByTab;
    return filteredByTab.filter((t) => {
      const haystack = [
        t.id_repair,
        t.title,
        t.result,
        t.severity,
        t.severity_label,
        t.priority,
        t.priority_label,
        t.status,
        t.status_label,
        t.device_code,
        t.device_name,
        t.reporter_name,
        t.assignee_name,
        t.vendor_name,
      ]
        .map((x) => canonical(x))
        .join(" ");
      return haystack.includes(q);
    });
  }, [filteredByTab, ticketQuery]);

  const totalTicketPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / ticketPageSize)
  );

  useEffect(() => {
    setTicketPage((p) => Math.min(p, totalTicketPages));
  }, [totalTicketPages]);

  const pageTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(start, start + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize, localHideTick]); // 👈 thêm localHideTick

  // ----------- CHỐT: chặn xác nhận lặp lại cực nhanh -----------
  const confirmedOnceRef = useRef(new Set());

  // Xử lý xác nhận hoàn thành — CHỈ user tạo ticket mới được bấm
  const handleUserConfirm = async (ticketId) => {
    if (!userId) return;
    if (confirmingId === ticketId || confirmedOnceRef.current.has(ticketId))
      return;

    const target = myTickets.find((t) => t.id_repair === ticketId);
    if (!target) return;

    const isCompleted = String(target.status || "").toLowerCase() === "completed";
    const isOwner = String(target.reported_by) === String(userId);
    if (!isOwner) return; // không phải chủ ticket thì không cho
    if (!isCompleted || target.user_confirmed) return;

    confirmedOnceRef.current.add(ticketId);
    setConfirmingId(ticketId);

    // 👉 Ẩn cục bộ ngay để F5 không hiện lại (TTL 10 phút)
    markLocallyHidden(userId, ticketId);
    setLocalHideTick((n) => n + 1);

    // Optimistic update (giữ tương thích UI hiện tại)
    setMyTickets((prev) =>
      prev.map((t) =>
        t.id_repair === ticketId ? { ...t, user_confirmed: true } : t
      )
    );

    try {
      await confirmComplete(ticketId, Number(userId));
      await fetchMyTickets();
    } catch (e) {
      // rollback
      setMyTickets((prev) =>
        prev.map((t) =>
          t.id_repair === ticketId ? { ...t, user_confirmed: false } : t
        )
      );
      confirmedOnceRef.current.delete(ticketId);
      clearLocalHidden(userId, ticketId);   // 👉 lỗi thì hiện lại nút
      setLocalHideTick((n) => n + 1);
      alert(e?.response?.data?.message || "Không xác nhận được.");
    } finally {
      setConfirmingId(null);
    }
  };

  if (!userId) {
    return (
      <div className={`${STYLES.page} flex items-center justify-center`}>
        <div className={STYLES.panel + " w-full max-w-xl p-6 text-center"}>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Hồ sơ người dùng
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Vui lòng đăng nhập để xem hồ sơ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={STYLES.page}>
      {/* FULL-WIDTH + ĐẢO THỨ TỰ: ticket trái, avatar phải */}
      <div className="w-full max-w-none flex flex-col lg:flex-row-reverse gap-6">
        {/* Sidebar */}
        <section
          className={`${STYLES.panel} w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-6 h-fit`}
          aria-label="Thanh thông tin cá nhân"
        >
          <div className={STYLES.panelHead}>
            <h2 className={STYLES.hTitle}>Hồ sơ</h2>
            <button
              type="button"
              onClick={() => {
                setCpMsg({ type: "", text: "" });
                setCpNew("");
                setCpConfirm("");
                setShowPwdModal(true);
              }}
              className={STYLES.btnSoftIndigo}
            >
              Đổi MK
            </button>
          </div>

          {loading ? (
            <div className="p-4 animate-pulse">
              <div className="mx-auto w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-3 h-3 w-28 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto" />
              <div className="mt-2 h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto" />
            </div>
          ) : (
            !error &&
            user && (
              <div className="p-4">
                <div className="flex flex-col items-center group">
                  <div
                    className={`w-20 h-20 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-600 ${RING} ${TRANS}`}
                  >
                    <img
                      src={
                        user?.id_users
                          ? `${API_BASE}/avatars/${user.id_users}?t=${user?.updated_at || ""}`
                          : DEFAULT_AVT
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => (e.currentTarget.src = DEFAULT_AVT)}
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {user.username || "—"}
                    </div>
                    <div className={STYLES.textMute}>{roleName}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-300 mt-1">
                      ID: {user.id_users}
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="mt-4 w-full">
                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-100 mb-1">
                      Chữ ký
                    </div>

                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                          ✔
                        </span>
                        <span className="text-[12px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {user?.signature_image ? "Đã thiết lập" : "Chưa có"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 flex items-center justify-center">
                        <img
                          key={signatureUrl}
                          src={signatureUrl || `${API_BASE}/signatures/file/0`}
                          alt="Signature"
                          className="max-h-16 object-contain"
                          loading="lazy"
                          onError={(e) => {
                            if (!sigImgTriedRef.current && user?.id_users) {
                              sigImgTriedRef.current = true;
                              e.currentTarget.src = `${API_BASE}/signatures/file/${user.id_users}?v=retry-${Date.now()}`;
                              return;
                            }
                            e.currentTarget.src = `${API_BASE}/signatures/file/0?v=ticket-${Date.now()}`;
                          }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          ref={inputFileRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml"
                          className="hidden"
                          onChange={handleChooseSigFile}
                        />
                        <button
                          type="button"
                          disabled={sigLoading}
                          onClick={onClickUploadSig}
                          className={STYLES.btn}
                        >
                          {sigLoading ? "Đang tải..." : "Tải ảnh chữ ký"}
                        </button>
                        <button
                          type="button"
                          disabled={sigLoading}
                          onClick={openDrawModal}
                          className={STYLES.btn}
                        >
                          Vẽ chữ ký
                        </button>
                        {!!user?.signature_image && (
                          <button
                            type="button"
                            disabled={sigLoading}
                            onClick={handleDeleteSignature}
                            className={`px-2.5 py-1.5 text-xs rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 ${FOCUS} ${TRANS} dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20`}
                          >
                            Xoá
                          </button>
                        )}
                      </div>

                      {sigMsg.text && (
                        <div
                          className={`mt-2 text-[12px] rounded px-3 py-2 border ${
                            sigMsg.type === "error"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {sigMsg.text}
                        </div>
                      )}

                      <div className="mt-2 text-center">
                        <div className="text-[12px] text-neutral-900 dark:text-neutral-50 font-medium leading-tight">
                          {user?.username || "—"}
                        </div>
                        <div className={STYLES.textMute}>{roleName}</div>
                      </div>
                    </div>
                  </div>
                  {/* /Signature block */}
                </div>
              </div>
            )
          )}
        </section>

        {/* Main */}
        <section className="flex-1 space-y-6">
          {/* Thông tin chi tiết */}
          <div className={STYLES.panel}>
            <div className={STYLES.panelHead}>
              <h3 className={STYLES.hTitle}>Thông tin chi tiết</h3>
            </div>
            {loading ? (
              <div className="p-4 animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 h-3 bg-neutral-100 dark:bg-neutral-700 rounded" />
                    <div className="col-span-8 h-3 bg-neutral-100 dark:bg-neutral-700 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                {error}
              </div>
            ) : user ? (
              <div className={STYLES.divider}>
                <Row label="Email" value={user.email_user || "—"} />
                <Row label="Bộ phận" value={departmentName} />
                <Row label="Mã bộ phận" value={user.id_departments || "—"} />
                <Row label="Vai trò" value={roleName} />
                <Row
                  label="Chữ ký"
                  value={
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                        ✔
                      </span>
                      {user?.signature_image ? "Đã thiết lập" : "Chưa có"}
                    </span>
                  }
                />
              </div>
            ) : null}
          </div>

          {/* Thiết bị */}
          <div className={STYLES.panel}>
            <div className={STYLES.panelHead}>
              <h3 className={STYLES.hTitle}>Thiết bị đang sử dụng</h3>
              <div className="text-xs text-neutral-500 dark:text-neutral-300">
                {devices.length} mục
              </div>
            </div>
            <div className="p-0">
              {devices.length > 0 ? (
                <>
                  <div className={STYLES.tableWrap}>
                    <table className="min-w-full text-sm">
                      <thead className={STYLES.tableHead}>
                        <tr>
                          <Th># Thiết bị</Th>
                          <Th>Tên thiết bị</Th>
                          <Th className="hidden md:table-cell">Ghi chú</Th>
                          <Th className="w-1">Tạo ticket</Th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y divide-neutral-200 dark:divide-neutral-700`}
                      >
                        {devices.map((d) => (
                          <tr key={d.id_devices} className={STYLES.hoverRow}>
                            <Td className="font-medium">{d.id_devices}</Td>
                            <Td>{d.name_devices || "—"}</Td>
                            <Td className="hidden md:table-cell text-neutral-500 dark:text-neutral-300">
                              {d.DeviceNote || d.note || "—"}
                            </Td>
                            <Td>
                              <button
                                type="button"
                                onClick={() => openCreateTicket(d.id_devices)}
                                className={STYLES.btnSoftIndigo}
                              >
                                + Ticket
                              </button>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                  Không có thiết bị.
                </div>
              )}
            </div>
          </div>

          {/* Tickets */}
          <div className={STYLES.panel}>
            <div className={STYLES.panelHead}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full">
                <h3 className={STYLES.hTitle}>Danh sách ticket</h3>

                <div className="flex items-center gap-2">
                  <input
                    value={ticketQuery}
                    onChange={(e) => {
                      setTicketQuery(e.target.value);
                      setTicketPage(1);
                    }}
                    placeholder="Tìm theo tiêu đề / thiết bị / người báo cáo…"
                    className={`${STYLES.input} w-56`}
                    aria-label="Tìm ticket"
                  />
                  <select
                    className={STYLES.select}
                    value={ticketPageSize}
                    onChange={(e) => {
                      setTicketPageSize(Number(e.target.value));
                      setTicketPage(1);
                    }}
                    aria-label="Số mục mỗi trang"
                  >
                    {[5, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}/trang
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refreshMyTickets}
                    className={STYLES.btn}
                    title="Làm mới danh sách ticket"
                  >
                    Làm mới
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS_TABS.map((t) => {
                  const active = ticketTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTicketTab(t.key);
                        setTicketPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${TRANS} ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-neutral-200 text-neutral-700 hover:bg-sky-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-700/50"
                      } ${FOCUS}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            {ticketsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : ticketsError ? (
              <div className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                {ticketsError}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                Không có ticket.
              </div>
            ) : (
              <>
                <div className={STYLES.tableWrap}>
                  <table className="min-w-full text-sm">
                    <thead className={STYLES.tableHead}>
                      <tr>
                        <Th className="w-16">#</Th>
                        <Th>Thiết bị</Th>
                        <Th>Tiêu đề</Th>
                        <Th className="hidden md:table-cell">Kết quả</Th>
                        <Th className="hidden md:table-cell">Mức độ</Th>
                        <Th className="hidden md:table-cell">Ưu tiên</Th>
                        <Th>Trạng thái</Th>
                        <Th className="hidden lg:table-cell">Người báo cáo</Th>
                        <Th>Báo lúc</Th>
                        <Th className="hidden md:table-cell">SLA (h)</Th>
                        <Th className="hidden lg:table-cell">Người xử lý / NCC</Th>
                        <Th className="hidden md:table-cell">Chi phí</Th>
                        <Th className="w-40">Hành động</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {pageTickets.map((t) => {
                        const devTop = t.device_code || "—";
                        const devSub = t.device_name || "—";
                        const title = t.title || "—";
                        const titleSub =
                          (t.issue_description || "").trim() || null;

                        const sev =
                          t.severity_label ||
                          VI_SEVERITY[
                            String(t.severity || "").toLowerCase()
                          ] ||
                          t.severity ||
                          "—";
                        const pri =
                          t.priority_label ||
                          VI_PRIORITY[
                            String(t.priority || "").toLowerCase()
                          ] ||
                          t.priority ||
                          "—";
                        const reporter = t.reporter_name || user?.username || "—";
                        const handler =
                          t.assignee_name || (t.vendor_name ? t.vendor_name : "-");
                        const handlerSub = t.vendor_name
                          ? "NCC"
                          : t.assignee_name
                          ? "Nội bộ"
                          : "";

                        const isCompleted =
                          String(t.status).toLowerCase() === "completed";
                        const isOwner =
                          String(t.reported_by) === String(userId);

                        return (
                          <tr
                            key={t.id_repair}
                            className={`${STYLES.hoverRow} ${
                              t.user_confirmed ? "opacity-70" : ""
                            }`}
                          >
                            <Td className="font-semibold">#{t.id_repair}</Td>

                            <Td className="whitespace-nowrap">
                              <div className="font-medium">{devTop}</div>
                              <div className={STYLES.textMute}>{devSub}</div>
                            </Td>

                            <Td className="max-w-[720px]">
                              <div className="flex items-center gap-1">
                                <a
                                  href={`/repairs/${t.id_repair}`}
                                  className="text-neutral-900 dark:text-neutral-50 hover:underline font-medium truncate"
                                  title={title}
                                >
                                  {title}
                                </a>
                              </div>
                              {titleSub ? (
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-300 truncate">
                                  {titleSub}
                                </div>
                              ) : null}
                            </Td>

                            <Td className="hidden md:table-cell">
                              {t.result || "-"}
                            </Td>
                            <Td className="hidden md:table-cell">{sev}</Td>
                            <Td className="hidden md:table-cell">{pri}</Td>

                            <Td>
                              {statusPill(
                                t.status,
                                isCompleted && t.user_confirmed
                                  ? "Hoàn tất (đã xác nhận)"
                                  : t.status_label
                              )}
                            </Td>

                            <Td className="hidden lg:table-cell">{reporter}</Td>
                            <Td className="whitespace-nowrap">
                              {formatTimeShort(t.created_at)}
                            </Td>
                            <Td className="hidden md:table-cell">
                              {t.sla_hours ?? "-"}
                            </Td>
                            <Td className="hidden lg:table-cell">
                              <div className="font-medium">{handler}</div>
                              <div className={STYLES.textMute}>{handlerSub}</div>
                            </Td>
                            <Td className="hidden md:table-cell">
                              {formatVND(t.total_cost)}
                            </Td>

                            {/* Hành động */}
                            <Td>
                              {(() => {
                                const canConfirm =
                                  isCompleted &&
                                  isOwner && // chỉ chủ ticket
                                  !t.user_confirmed &&
                                  confirmingId !== t.id_repair &&
                                  !confirmedOnceRef.current.has(t.id_repair) &&
                                  !isLocallyHidden(userId, t.id_repair); // 👈 chặn hiện lại nút trong TTL

                                if (canConfirm) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUserConfirm(t.id_repair)
                                      }
                                      disabled={confirmingId === t.id_repair}
                                      className={`text-xs px-3 py-1.5 rounded-lg text-white ${
                                        confirmingId === t.id_repair
                                          ? "bg-emerald-400"
                                          : "bg-emerald-600 hover:bg-emerald-700"
                                      } ${FOCUS} ${TRANS}`}
                                      title="Xác nhận đã hoàn thành"
                                    >
                                      {confirmingId === t.id_repair
                                        ? "Đang xác nhận..."
                                        : "Xác nhận đã hoàn thành"}
                                    </button>
                                  );
                                }

                                if (t.user_confirmed) {
                                  return (
                                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                                      Đã xác nhận
                                    </span>
                                  );
                                }

                                return (
                                  <span className="text-xs text-neutral-400">
                                    —
                                  </span>
                                );
                              })()}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 flex items-center justify-between text-sm">
                  <div className="text-neutral-600 dark:text-neutral-300">
                    Tổng: {filteredTickets.length} ticket
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={ticketPage <= 1}
                      onClick={() =>
                        setTicketPage((p) => Math.max(1, p - 1))
                      }
                      className={`px-3 py-1.5 rounded-lg border ${
                        ticketPage <= 1
                          ? "text-neutral-400 border-neutral-200 dark:border-neutral-700"
                          : "text-neutral-700 border-neutral-300 hover:bg-sky-50 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700/50"
                      } ${FOCUS} ${TRANS}`}
                    >
                      Trước
                    </button>
                    <div>
                      Trang <span className="font-medium">{ticketPage}</span> /{" "}
                      <span>{totalTicketPages}</span>
                    </div>
                    <button
                      disabled={ticketPage >= totalTicketPages}
                      onClick={() =>
                        setTicketPage((p) => Math.min(totalTicketPages, p + 1))
                      }
                      className={`px-3 py-1.5 rounded-lg border ${
                        ticketPage >= totalTicketPages
                          ? "text-neutral-400 border-neutral-200 dark:border-neutral-700"
                          : "text-neutral-700 border-neutral-300 hover:bg-sky-50 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700/50"
                      } ${FOCUS} ${TRANS}`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Modal đổi mật khẩu */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !cpLoading && setShowPwdModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`${STYLES.panel} w-full max-w-md shadow-2xl`}>
              <div className={STYLES.panelHead}>
                <h4 className={STYLES.hTitle}>Đổi mật khẩu</h4>
                <button
                  type="button"
                  className={`text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 ${FOCUS}`}
                  onClick={() => !cpLoading && setShowPwdModal(false)}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleSubmitChangePassword}
                className="p-4 space-y-3"
              >
                <div className={STYLES.subText}>
                  ID người dùng:{" "}
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {userId}
                  </span>
                </div>

                <div className="flex items-center border-2 border-neutral-200 dark:border-neutral-600 py-2 px-3 rounded-xl bg-white dark:bg-neutral-800">
                  <input
                    className="pl-2 w-full outline-none border-none bg-transparent text-neutral-900 dark:text-neutral-50"
                    type={cpShow.nw ? "text" : "password"}
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    placeholder="Mật khẩu mới (≥ 6 ký tự)"
                    disabled={cpLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="text-xs text-sky-700 dark:text-sky-300 ml-2"
                    onClick={() => setCpShow((s) => ({ ...s, nw: !s.nw }))}
                  >
                    {cpShow.nw ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                <PasswordStrength value={cpNew} />

                <div className="flex items-center border-2 border-neutral-200 dark:border-neutral-600 py-2 px-3 rounded-xl bg-white dark:bg-neutral-800">
                  <input
                    className="pl-2 w-full outline-none border-none bg-transparent text-neutral-900 dark:text-neutral-50"
                    type={cpShow.cf ? "text" : "password"}
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    disabled={cpLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="text-xs text-sky-700 dark:text-sky-300 ml-2"
                    onClick={() => setCpShow((s) => ({ ...s, cf: !s.cf }))}
                  >
                    {cpShow.cf ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                {cpMsg.text && (
                  <div
                    className={`text-sm rounded px-3 py-2 border ${
                      cpMsg.type === "error"
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    {cpMsg.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={cpLoading}
                    onClick={() => setShowPwdModal(false)}
                    className={STYLES.btn}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={cpLoading}
                    className={STYLES.btnPrimary}
                  >
                    {cpLoading ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal vẽ chữ ký */}
      {showDrawModal && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`${STYLES.panel} w-full max-w-2xl shadow-2xl overflow-hidden`}
            >
              <div className={STYLES.panelHead}>
                <h4 className={STYLES.hTitle}>Vẽ chữ ký</h4>
                <button
                  type="button"
                  className={`text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 ${FOCUS}`}
                  onClick={closeDrawModal}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 overflow-auto">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={onStartDraw}
                    onMouseMove={onMoveDraw}
                    onMouseUp={onEndDraw}
                    onMouseLeave={onEndDraw}
                    onTouchStart={onStartDraw}
                    onTouchMove={onMoveDraw}
                    onTouchEnd={onEndDraw}
                    className="bg-white dark:bg-neutral-900 rounded-md shadow-inner cursor-crosshair select-none touch-none"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-neutral-500 dark:text-neutral-300">
                    Dùng chuột hoặc tay (mobile) để ký. Nên ký trong khung trắng.
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={onClearCanvas} className={STYLES.btn}>
                      Xoá khung
                    </button>
                    <button
                      type="button"
                      disabled={sigLoading}
                      onClick={onSaveDrawing}
                      className={STYLES.btnPrimary}
                    >
                      {sigLoading ? "Đang lưu..." : "Lưu chữ ký"}
                    </button>
                  </div>
                </div>

                {sigMsg.text && (
                  <div
                    className={`mt-3 text-sm rounded px-3 py-2 border ${
                      sigMsg.type === "error"
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    {sigMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo ticket */}
      {showCreateTicket && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !ntLoading && setShowCreateTicket(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <form
              onSubmit={submitCreateTicket}
              className={`${STYLES.panel} w-full max-w-lg shadow-2xl overflow-hidden`}
            >
              <div className={STYLES.panelHead}>
                <h4 className={STYLES.hTitle}>Tạo yêu cầu sửa chữa</h4>
                <button
                  type="button"
                  className={`text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 ${FOCUS}`}
                  onClick={() => !ntLoading && setShowCreateTicket(false)}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className={STYLES.subText + " mb-1"}>Thiết bị</div>
                  <select
                    className={STYLES.select}
                    value={ntForm.id_devices}
                    onChange={(e) =>
                      setNtForm({ ...ntForm, id_devices: e.target.value })
                    }
                    disabled={ntLoading}
                    required
                  >
                    <option value="">-- Chọn thiết bị --</option>
                    {devices.map((d) => (
                      <option key={d.id_devices} value={d.id_devices}>
                        {d.id_devices} — {d.name_devices || "Thiết bị"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className={STYLES.subText + " mb-1"}>Tiêu đề</div>
                  <input
                    className={STYLES.input}
                    placeholder="VD: Laptop không khởi động"
                    value={ntForm.title}
                    onChange={(e) =>
                      setNtForm({ ...ntForm, title: e.target.value })
                    }
                    disabled={ntLoading}
                    required
                  />
                </div>

                <div>
                  <div className={STYLES.subText + " mb-1"}>Mô tả</div>
                  <textarea
                    rows={4}
                    className={STYLES.input}
                    placeholder="Triệu chứng, khi nào xảy ra, đã thử gì…"
                    value={ntForm.issue_description}
                    onChange={(e) =>
                      setNtForm({
                        ...ntForm,
                        issue_description: e.target.value,
                      })
                    }
                    disabled={ntLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className={STYLES.subText + " mb-1"}>Mức độ</div>
                    <select
                      className={STYLES.select}
                      value={ntForm.severity}
                      onChange={(e) =>
                        setNtForm({ ...ntForm, severity: e.target.value })
                      }
                      disabled={ntLoading}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <div className={STYLES.subText + " mb-1"}>Priority</div>
                    <select
                      className={STYLES.select}
                      value={ntForm.priority}
                      onChange={(e) =>
                        setNtForm({ ...ntForm, priority: e.target.value })
                      }
                      disabled={ntLoading}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className={STYLES.subText + " mb-1"}>SLA (giờ)</div>
                  <input
                    type="number"
                    min={1}
                    className={STYLES.input}
                    value={ntForm.sla_hours}
                    onChange={(e) =>
                      setNtForm({
                        ...ntForm,
                        sla_hours: Number(e.target.value),
                      })
                    }
                    disabled={ntLoading}
                  />
                </div>

                {ntMsg.text && (
                  <div
                    className={`text-sm rounded px-3 py-2 border ${
                      ntMsg.type === "error"
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    {ntMsg.text}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={ntLoading}
                  onClick={() => setShowCreateTicket(false)}
                  className={STYLES.btn}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={ntLoading}
                  className={STYLES.btnPrimary}
                >
                  {ntLoading ? "Đang tạo..." : "Tạo ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Sub components ---------- */
const Row = ({ label, value }) => (
  <div className="grid grid-cols-12 gap-3 p-3">
    <div className="col-span-4 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
      {label}
    </div>
    <div className="col-span-8 text-sm text-neutral-900 dark:text-neutral-50">
      {value}
    </div>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th className={`${STYLES.tableTh} ${className}`}>{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`${STYLES.tableTd} ${className}`}>{children}</td>
);

function PasswordStrength({ value }) {
  const score = [
    value.length >= 6,
    /[A-Z]/.test(value),
    [/[a-z]/.test(value)],
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ]
    .flat()
    .filter(Boolean).length;
  const label =
    ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh", "Rất mạnh"][score] || "";
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a", "#15803d"];

  return (
    <div className="mb-1">
      <div className="h-1.5 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${(score / 5) * 100}%`,
            backgroundColor: colors[score] || "#e5e7eb",
          }}
        />
      </div>
      <div className="text-[11px] text-gray-500 dark:text-neutral-300 mt-1">
        Độ mạnh: {label}
      </div>
    </div>
  );
}

export default ProfileUsers;
