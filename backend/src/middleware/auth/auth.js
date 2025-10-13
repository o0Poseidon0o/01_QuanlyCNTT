// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../../models/Users/User");

// Middleware xác thực Bearer token: gắn req.user = { id_users, id_roles, name_role? }
const auth = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || req.headers.Authorization;
    if (!hdr || !hdr.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = hdr.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    let { id_users, id_roles, name_role } = payload || {};

    // Fallback nếu token cũ chưa có id_roles → tra DB
    if (!id_roles && id_users) {
      const dbUser = await User.findByPk(id_users, { attributes: ["id_users", "id_roles"] });
      id_roles = dbUser?.id_roles;
    }

    if (!id_users || !id_roles) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { id_users, id_roles, name_role: name_role || null };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

module.exports = auth;
