/* eslint-disable */
export const RULES = {
  // Nhóm
  PROFILE:       { anyOf: ["role.manager", "user.*", "user.hr"] },
  DEVICES_GROUP: { anyOf: ["role.manager", "device.*", "device.static"] },
  DOCS_GROUP:    { anyOf: ["role.manager"] },
  HR_GROUP:      { anyOf: ["role.manager", "user.hr"] },
  BCDB_GROUP:    { anyOf: ["role.manager"] },

  // Mục trong nhóm Thiết bị
  DEVICES_LIST:   { anyOf: ["role.manager", "device.*"] },
  DEVICES_REPAIR: { anyOf: ["role.manager", "device.*"] },
  DEVICES_STATS:  { anyOf: ["role.manager", "device.*", "device.static"] },

  // Route helper
  MANAGER_ONLY:  { anyOf: ["role.manager"] },
  HR_OR_MANAGER: { anyOf: ["role.manager", "user.hr"] },
  PUBLIC:        {}, // không yêu cầu quyền

  AUTHED_ANY: { anyOf: ["role.manager", "user.*", "user.hr", "device.*", "device.static"] },
};
