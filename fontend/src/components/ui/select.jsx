import React, { createContext, useContext } from "react";

const Ctx = createContext(null);

export function Select({ value, onValueChange, children }) {
  return <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>;
}
export function SelectTrigger({ className = "", children }) {
  return <div className={`relative ${className}`}>{children}</div>;
}
export function SelectValue({ placeholder }) {
  const ctx = useContext(Ctx);
  return (
    <div className="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm">
      <span>{ctx?.value || placeholder}</span>
      <span className="text-slate-400">▾</span>
      {/* real select is rendered in Content */}
    </div>
  );
}
export function SelectContent({ className = "", children }) {
  const ctx = useContext(Ctx);
  // Render a hidden select that mirrors items
  const options = React.Children.toArray(children)
    .filter(Boolean)
    .map((child) => {
      if (child.type?.displayName === "SelectItem") {
        return { value: child.props.value, label: child.props.children };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <select
      className={`mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ${className}`}
      value={ctx?.value || ""}
      onChange={(e) => ctx?.onValueChange?.(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
SelectItem.displayName = "SelectItem";

export default Select;
export { Select as Root, SelectTrigger as Trigger, SelectContent as Content, SelectItem as Item, SelectValue as Value };
