// ForgotPassword.jsx — UI only (no API, có id_users, không email)
import React, { useState } from "react";

const ForgotPassword = () => {
  const [userId, setUserId] = useState("");           // <-- thêm id_users
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ old: false, nw: false, cf: false });

  const show = (type, text) => setMsg({ type, text });
  const validatePassword = (v) => typeof v === "string" && v.trim().length >= 6;
  const validateUserId = (v) => /^\d+$/.test(v) && Number(v) > 0; // số nguyên dương

  const handleSubmit = (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!validateUserId(userId)) return show("error", "Vui lòng nhập ID người dùng hợp lệ (số dương).");
    if (!validatePassword(oldPassword)) return show("error", "Mật khẩu cũ ≥ 6 ký tự.");
    if (!validatePassword(newPassword)) return show("error", "Mật khẩu mới ≥ 6 ký tự.");
    if (newPassword === oldPassword) return show("error", "Mật khẩu mới không được trùng mật khẩu cũ.");
    if (newPassword !== confirmPassword) return show("error", "Xác nhận mật khẩu không khớp.");

    setLoading(true);
    // Demo: không gọi API
    setTimeout(() => {
      setLoading(false);
      show("success", `(Demo) Hợp lệ. Sẽ đổi mật khẩu cho id_users=${userId}.`);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 400);
  };

  // Strength meter (đơn giản)
  const score = [
    newPassword.length >= 6,
    /[A-Z]/.test(newPassword),
    /[a-z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ].filter(Boolean).length;
  const label = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh", "Rất mạnh"][score] || "";
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a", "#15803d"];

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-gray-800 font-bold text-2xl mb-1">Đổi mật khẩu</h1>
          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            DEMO UI
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Nhập <b>ID người dùng</b>, mật khẩu hiện tại (Admin cấp) và đặt mật khẩu mới.
        </p>

        <form onSubmit={handleSubmit}>
          {/* ID người dùng */}
          <div className="flex items-center border-2 mb-4 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={userId}
              onChange={(e) => {
                // chỉ cho số
                const onlyDigits = e.target.value.replace(/\D/g, "");
                setUserId(onlyDigits);
              }}
              placeholder="ID người dùng (vd: 123)"
              disabled={loading}
              required
              autoComplete="off"
            />
          </div>

          {/* Mật khẩu hiện tại */}
          <div className="flex items-center border-2 mb-4 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type={showPwd.old ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="text-xs text-indigo-600 ml-2"
              onClick={() => setShowPwd((s) => ({ ...s, old: !s.old }))}
            >
              {showPwd.old ? "Ẩn" : "Hiện"}
            </button>
          </div>

          {/* Mật khẩu mới */}
          <div className="flex items-center border-2 mb-2 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type={showPwd.nw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới (≥ 6 ký tự)"
              disabled={loading}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="text-xs text-indigo-600 ml-2"
              onClick={() => setShowPwd((s) => ({ ...s, nw: !s.nw }))}
            >
              {showPwd.nw ? "Ẩn" : "Hiện"}
            </button>
          </div>

          {/* Strength bar */}
          <div className="mb-4">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${(score / 5) * 100}%`, backgroundColor: colors[score] || "#e5e7eb" }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Độ mạnh: {label}</div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="flex items-center border-2 mb-4 py-2 px-3 rounded-2xl">
            <input
              className="pl-2 w-full outline-none border-none"
              type={showPwd.cf ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              disabled={loading}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="text-xs text-indigo-600 ml-2"
              onClick={() => setShowPwd((s) => ({ ...s, cf: !s.cf }))}
            >
              {showPwd.cf ? "Ẩn" : "Hiện"}
            </button>
          </div>

          {msg.text && (
            <div
              className={`mb-4 text-sm rounded px-3 py-2 border ${
                msg.type === "error"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-2xl text-white font-semibold transition ${
              loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
