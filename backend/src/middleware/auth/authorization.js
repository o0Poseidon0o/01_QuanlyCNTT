// backend/src/middleware/authorization.js

// ⚠️ Đường dẫn theo vị trí file này: src/middleware/ -> ../../models/...
const Roles = require("../../models/Roles/modelRoles");
const Permission = require("../../models/Permissions/Permission");

// NẠP association Role <-> Permission (qua RolePermission) trước khi dùng include
require("../../models/Permissions/RolePermission");

// ===== Helper: so khớp key được cấp và key yêu cầu =====
function matchPattern(grantedKey, requiredKey) {
  if (!grantedKey || !requiredKey) return false;
  // "*" = toàn quyền
  if (grantedKey === "*") return true;
  // "module.*" = toàn bộ action trong module
  if (grantedKey.endsWith(".*")) {
    const prefix = grantedKey.slice(0, -2);
    return requiredKey === prefix || requiredKey.startsWith(prefix + ".");
  }
  // so khớp chính xác
  return grantedKey === requiredKey;
}

async function getGrantedSet(id_roles) {
  const role = await Roles.findByPk(id_roles, {
    include: [{ model: Permission, attributes: ["key"], through: { attributes: [] } }],
  });
  const keys = (role?.Permissions || []).map(p => p.key).filter(Boolean);
  return new Set(keys);
}

// ===== Middlewares =====
// Cho qua nếu KHỚP ÍT NHẤT 1 quyền trong danh sách yêu cầu
const requirePermissionAny = (...requiredKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
      if (!req.user.id_roles) return res.status(401).json({ message: "Missing id_roles in token" });
      if (!requiredKeys?.length) return next(); // không yêu cầu gì thì cho qua

      // cache theo request để không query nhiều lần nếu 1 request gọi nhiều guard
      if (!req._grantedSet) req._grantedSet = await getGrantedSet(req.user.id_roles);
      const granted = req._grantedSet;

      const ok = requiredKeys.some(required =>
        Array.from(granted).some(g => matchPattern(g, required))
      );

      if (!ok) {
        return res.status(403).json({ message: "Forbidden", required: requiredKeys });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
};

// Cho qua chỉ khi ĐỦ TẤT CẢ quyền trong danh sách yêu cầu
const requirePermissionAll = (...requiredKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
      if (!req.user.id_roles) return res.status(401).json({ message: "Missing id_roles in token" });
      if (!requiredKeys?.length) return next();

      if (!req._grantedSet) req._grantedSet = await getGrantedSet(req.user.id_roles);
      const granted = req._grantedSet;

      const ok = requiredKeys.every(required =>
        Array.from(granted).some(g => matchPattern(g, required))
      );

      if (!ok) {
        return res.status(403).json({ message: "Forbidden", required: requiredKeys });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
};

// Alias mặc định
const requirePermission = requirePermissionAny;

module.exports = { requirePermission, requirePermissionAny, requirePermissionAll };
