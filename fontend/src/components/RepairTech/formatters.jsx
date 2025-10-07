export const formatLabel = (value, fallback = "-") => {
  if (value == null) return fallback;
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      const joined = value.filter(Boolean).join(", ");
      return joined.length ? joined : fallback;
    }
    if (value.label != null && value.label !== "") return String(value.label);
    if (value.value != null && value.value !== "") return String(value.value);
    if (value.name != null && value.name !== "") return String(value.name);
    return fallback;
  }
  const str = String(value);
  return str.length ? str : fallback;
};

export const formatPercent = (fraction, total) => {
  if (!total) return 0;
  const pct = (Number(fraction) / Number(total)) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.round(pct);
};
