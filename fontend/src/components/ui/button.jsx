import React from "react";

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 py-2";
const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400",
  outline:
    "border border-slate-300 hover:bg-slate-50 text-slate-800 focus-visible:ring-slate-400",
  ghost: "hover:bg-slate-100 text-slate-800",
};
const sizes = {
  sm: "h-8 px-2",
  md: "h-9",
  lg: "h-10 px-4",
  icon: "h-9 w-9 p-0",
};

export function Button({ asChild, variant = "default", size = "md", className = "", ...props }) {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || ""} ${className}`}
      {...props}
    />
  );
}
export default Button;
