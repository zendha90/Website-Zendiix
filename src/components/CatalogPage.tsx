import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Sparkles, ShoppingBag, Plus, ArrowRight } from "lucide-react";
import { Product, subscribeToProducts } from "../services";

export function CatalogPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-slate-900 border-4 border-slate-900 flex items-center justify-center text-white font-black text-3xl shadow-[8px_8px_0px_0px_#6366f1]">
            Z
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase font-display">
            ZENDIIX
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="p-10 border-4 border-slate-900 bg-white shadow-[12px_12px_0px_0px_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[16px_16px_0px_0px_#0f172a] transition-all cursor-not-allowed group">
            <div className="w-12 h-12 bg-indigo-100 border-2 border-slate-900 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 border-2 border-slate-900 bg-indigo-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
              Web Katalog
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Browsing koleksi produk terbaru sedang dalam tahap pengembangan.
            </p>
          </div>

          <div className="p-10 border-4 border-slate-900 bg-white shadow-[12px_12px_0px_0px_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[16px_16px_0px_0px_#0f172a] transition-all cursor-not-allowed group">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-slate-900 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <Plus className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
              Customer Order
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Sistem pemesanan mandiri untuk pelanggan akan hadir segera.
            </p>
          </div>
        </div>

        <div className="pt-12">
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[6px_6px_0px_0px_#6366f1] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#6366f1] transition-all"
          >
            Portal Management <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
