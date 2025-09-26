import React, { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

export function Tabs({ defaultValue, children, className = "" }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Ctx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}
export function TabsList({ className = "", children }) {
  return <div className={`inline-grid gap-2 rounded-md bg-slate-100 p-1 ${className}`}>{children}</div>;
}
export function TabsTrigger({ value, children }) {
  const ctx = useContext(Ctx);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={`px-3 py-1 rounded-md text-sm ${
        active ? "bg-white shadow font-semibold" : "text-slate-600 hover:bg-white/70"
      }`}
    >
      {children}
    </button>
  );
}
export function TabsContent({ value, children, className = "" }) {
  const ctx = useContext(Ctx);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}

export default Tabs;
