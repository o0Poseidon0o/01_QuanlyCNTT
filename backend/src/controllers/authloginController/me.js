// backend/src/routes/auth/me.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth/auth");
const Roles = require("../../models/Roles/modelRoles");
const Permission = require("../../models/Permissions/Permission");
require("../../models/Permissions/RolePermission"); // nạp association

router.get("/me", auth, async (req, res, next) => {
  try {
    // req.user.id_roles có sẵn do middleware auth gắn từ token
    const perms = await Permission.findAll({
      attributes: ["key"],
      include: [{
        model: Roles,
        attributes: [],
        where: { id_roles: req.user.id_roles },
        through: { attributes: [] },
      }],
      order: [["key", "ASC"]],
    });
    const permissionKeys = perms.map(p => p.key).filter(Boolean);

    res.json({
      id_users: req.user.id_users,
      id_roles: req.user.id_roles,
      name_role: req.user.name_role || null,
      permissions: permissionKeys,
    });
  } catch (e) { next(e); }
});

module.exports = router;
