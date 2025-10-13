// backend/src/routes/RolesAdmin/roleAdminRoutes.js
const express = require("express");
const router = express.Router();

// Middleware
const auth = require("../../middleware/auth/auth");
const { requirePermission } = require("../../middleware/auth/authorization");

// Models
const Roles = require("../../models/Roles/modelRoles");
const Permission = require("../../models/Permissions/Permission");
const RolePermission = require("../../models/Permissions/RolePermission");

/**
 * Với app.use("/api/admin", router),
 * => các endpoint phía dưới sẽ lần lượt là:
 *   GET    /api/admin/permissions
 *   POST   /api/admin/permissions
 *   PUT    /api/admin/permissions/:id
 *   DELETE /api/admin/permissions/:id
 *   GET    /api/admin/roles/:id/permissions
 *   PUT    /api/admin/roles/:id/permissions
 */

/* ============ PERMISSIONS CRUD ============ */

// GET /api/admin/permissions
router.get(
  "/permissions",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const list = await Permission.findAll({ order: [["key", "ASC"]] });
      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/admin/permissions
router.post(
  "/permissions",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const { key, description = "" } = req.body || {};
      if (!key || !String(key).trim()) {
        return res.status(400).json({ message: "Key is required" });
      }
      const created = await Permission.create({
        key: String(key).trim(),
        description: String(description || ""),
      });
      res.status(201).json(created);
    } catch (e) {
      if (e?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Key đã tồn tại" });
      }
      next(e);
    }
  }
);

// PUT /api/admin/permissions/:id
router.put(
  "/permissions/:id",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { key, description } = req.body || {};

      const p = await Permission.findByPk(id);
      if (!p) return res.status(404).json({ message: "Permission not found" });

      if (key != null && !String(key).trim()) {
        return res.status(400).json({ message: "Key không hợp lệ" });
      }

      p.key = key != null ? String(key).trim() : p.key;
      p.description = description != null ? String(description) : p.description;
      await p.save();

      res.json(p);
    } catch (e) {
      if (e?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Key đã tồn tại" });
      }
      next(e);
    }
  }
);

// DELETE /api/admin/permissions/:id
router.delete(
  "/permissions/:id",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const p = await Permission.findByPk(id);
      if (!p) return res.status(404).json({ message: "Permission not found" });

      await p.destroy();
      res.json({ ok: true, id: Number(id) });
    } catch (e) {
      next(e);
    }
  }
);

/* ======= ROLE ↔ PERMISSIONS (assign) ======= */

// GET /api/admin/roles/:id/permissions → trả về mảng key
router.get(
  "/roles/:id/permissions",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const role = await Roles.findByPk(req.params.id, {
        include: [
          {
            model: Permission,
            attributes: ["key"],
            through: { attributes: [] },
          },
        ],
      });
      const keys = (role?.Permissions || []).map((p) => p.key);
      res.json(keys);
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/admin/roles/:id/permissions → ghi đè keys
router.put(
  "/roles/:id/permissions",
  auth,
  requirePermission("role.manage"),
  async (req, res, next) => {
    try {
      const { keys = [] } = req.body; // ["ticket.view","device.update",...]
      // Lấy danh sách permission theo key
      const perms = await Permission.findAll({ where: { key: keys } });

      // Xoá tất cả mapping cũ
      await RolePermission.destroy({ where: { id_roles: req.params.id } });

      // Tạo lại mapping
      if (perms.length) {
        await RolePermission.bulkCreate(
          perms.map((p) => ({
            id_roles: req.params.id,
            id_permission: p.id_permission,
          }))
        );
      }

      res.json({
        ok: true,
        id_roles: Number(req.params.id),
        count: perms.length,
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
