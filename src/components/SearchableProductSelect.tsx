import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Product } from "../services";

export interface SearchableProductSelectProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
}

export function SearchableProductSelect({ products, value, onChange }: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedProduct = React.useMemo(() => {
    return products.find(p => p.id === value);
  }, [products, value]);

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!search.trim()) return products.slice(0, 50); // limit to keep responsive
    const query = search.toLowerCase();
    return products
      .filter(p => {
        const code = (p.kodeBarang || "").toLowerCase();
        const name = (p.namaBarang || "").toLowerCase();
        return code.includes(query) || name.includes(query);
      })
      .slice(0, 100); // limit to top 100 matches to prevent lagging
  }, [products, search]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch(""); // Reset search on open
        }}
        className="w-full flex items-center justify-between px-2 py-1 border border-slate-900 bg-white font-bold text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 text-left cursor-pointer"
      >
        <span className="truncate font-mono">
          {value === "" && "✨ OTOMATIS (AUTO-MATCH)"}
          {value === "new" && "🆕 PAKSA BUAT BARU DI KATALOG"}
          {value !== "" && value !== "new" && selectedProduct && `${selectedProduct.kodeBarang} - ${selectedProduct.namaBarang}`}
          {value !== "" && value !== "new" && !selectedProduct && value}
        </span>
        <ChevronDown className="w-3.5 h-3.5 ml-1 shrink-0 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-[120] bg-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] max-h-[220px] flex flex-col">
          {/* Search Input Box */}
          <div className="p-1 border-b border-slate-900 bg-slate-50 flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Cari kode / nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[10px] font-bold border border-slate-400 bg-white text-slate-800 focus:outline-none focus:border-slate-900 font-sans"
              autoFocus
            />
          </div>

          {/* List of Options */}
          <div className="overflow-y-auto flex-1 max-h-[160px]">
            {/* Automatic match option */}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1 text-left text-[10px] font-bold border-b border-slate-100 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-1 transition-colors ${value === "" ? "bg-emerald-50 text-emerald-900" : "text-slate-700"}`}
            >
              <span>✨</span>
              <span className="font-mono">-- OTOMATIS (AUTO-MATCH) --</span>
            </button>

            {/* Force new option */}
            <button
              type="button"
              onClick={() => {
                onChange("new");
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1 text-left text-[10px] font-bold border-b border-slate-100 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-1 transition-colors ${value === "new" ? "bg-indigo-50 text-indigo-900" : "text-slate-700"}`}
            >
              <span>🆕</span>
              <span className="font-mono">🆕 PAKSA BUAT BARU DI KATALOG</span>
            </button>

            {/* Filtered products */}
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2 py-1 text-left text-[10px] font-bold border-b border-slate-100 hover:bg-slate-50 flex flex-col transition-colors ${value === p.id ? "bg-indigo-50 text-indigo-900 border-l-2 border-l-slate-900 pl-1.5" : "text-slate-800"}`}
              >
                <span className="font-mono text-slate-900 font-extrabold">{p.kodeBarang}</span>
                <span className="text-[9px] text-slate-500 font-medium truncate">{p.namaBarang}</span>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="p-2 text-center text-[10px] text-slate-400 font-bold font-sans">
                Barang tidak ditemukan 😢
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
