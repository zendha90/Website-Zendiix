import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: string;
  sortConfig: { key: any; direction: "asc" | "desc" } | null;
  onSort: (k: any) => void;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      className={`px-6 py-4 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-700 ${
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left"
      } ${isActive ? "text-white" : "text-slate-200"} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`flex items-center gap-1 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}
      >
        {label}
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100" />
        )}
      </div>
    </th>
  );
}