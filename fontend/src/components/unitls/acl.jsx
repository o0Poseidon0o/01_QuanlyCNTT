/* eslint-disable */
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const uniq = (arr) => Array.from(new Set(arr || []));

// match "user.*" / "device.*" / exact
export function matchOne(userPerm, rule) {
  if (!userPerm || !rule) return false;
  if (rule.endsWith(".*")) return userPerm.startsWith(rule.slice(0, -2));
  return userPerm === rule;
}

export function getPermissions() {
  const out = new Set();

  const p = parseJson(localStorage.getItem("permissions"));
  if (Array.isArray(p)) p.forEach((x) => out.add(String(x)));

  const role = localStorage.getItem("role");
  if (role) out.add(`role.${role}`);

  const tok = localStorage.getItem("token");
  if (tok && tok.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(tok.split(".")[1]));
      const nameRole = payload?.name_role;
      const idRole = payload?.id_roles;
      if (nameRole) out.add(`role.${nameRole}`);
      if (String(idRole) === "100") out.add("role.manager");
    } catch {}
  }

  const idr = localStorage.getItem("id_roles");
  if (idr && String(idr) === "100") out.add("role.manager");

  // alias: role.manage -> role.manager
  if (out.has("role.manage")) { out.delete("role.manage"); out.add("role.manager"); }
  if (out.has("role.admin") || out.has("role.manager")) out.add("role.manager");

  return uniq(Array.from(out));
}

export function canAccess(userPerms, { anyOf = [], allOf = [], notAnyOf = [] } = {}) {
  const perms = userPerms || [];
  if (perms.includes("role.manager")) return true;

  const okAny = anyOf.length ? anyOf.some((r) => perms.some((p) => matchOne(p, r))) : true;
  const okAll = allOf.length ? allOf.every((r) => perms.some((p) => matchOne(p, r))) : true;
  const okNot = notAnyOf.length ? !notAnyOf.some((r) => perms.some((p) => matchOne(p, r))) : true;

  return okAny && okAll && okNot;
}
