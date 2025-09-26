import React from "react";

export function Sheet({ open, onOpenChange, children }) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);
  return (
    <div className={open ? "" : "hidden"} aria-hidden={!open}>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => onOpenChange?.(false)} />
      {children}
    </div>
  );
}

export function SheetContent({ side = "right", className = "", children }) {
  const sideCls = {
    right: "right-0 top-0 h-full w-full max-w-xl",
    left: "left-0 top-0 h-full w-full max-w-xl",
  }[side] || "right-0 top-0 h-full w-full max-w-xl";

  return (
    <div className={`fixed z-50 bg-white shadow-xl border-l border-slate-200 p-4 ${sideCls} ${className}`}>
      {children}
    </div>
  );
}
export function SheetHeader({ className = "", ...props }) {
  return <div className={`mb-2 ${className}`} {...props} />;
}
export function SheetTitle({ className = "", ...props }) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}

export default Sheet;
