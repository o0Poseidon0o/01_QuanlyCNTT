import React from "react";

export function Dialog({ open, onOpenChange, children }) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);
  return (
    <div className={open ? "" : "hidden"} aria-hidden={!open}>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => onOpenChange?.(false)} />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = "", children }) {
  return (
    <div className={`w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-lg ${className}`}>
      {children}
    </div>
  );
}
export function DialogHeader({ className = "", ...props }) {
  return <div className={`px-4 pt-4 ${className}`} {...props} />;
}
export function DialogTitle({ className = "", ...props }) {
  return <h3 className={`text-lg font-semibold tracking-tight ${className}`} {...props} />;
}
export function DialogFooter({ className = "", ...props }) {
  return <div className={`flex justify-end gap-2 px-4 pb-4 ${className}`} {...props} />;
}

export default Dialog;
