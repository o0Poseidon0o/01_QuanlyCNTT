/* eslint-disable */
import React from "react";
import { Navigate } from "react-router-dom";
import { getPermissions, canAccess } from "../unitls/acl";

export default function PermissionRoute({
  anyOf = [],
  allOf = [],
  notAnyOf = [],
  fallback = "/unauthorized",
  children,
}) {
  const perms = getPermissions();
  const ok = canAccess(perms, { anyOf, allOf, notAnyOf });
  return ok ? children : <Navigate to={fallback} replace />;
}
