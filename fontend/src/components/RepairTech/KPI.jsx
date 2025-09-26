import React from "react";
import { Card, CardContent } from "../ui/card";

export default function KPI({ title, value, subtitle, icon, variant }) {
  return (
    <Card className={variant === "danger" ? "border-rose-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
          </div>
          <div className={`h-10 w-10 grid place-items-center rounded-xl ${variant==="danger"?"bg-rose-50 text-rose-600":"bg-slate-50 text-slate-700"}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
