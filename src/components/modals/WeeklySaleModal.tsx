import React from "react";
import { Pencil, X } from "lucide-react";

export interface WeeklySaleModalProps {
  isWeeklyModalOpen: boolean;
  setIsWeeklyModalOpen: (open: boolean) => void;
  editingWeekly: any;
  setEditingWeekly: React.Dispatch<React.SetStateAction<any>>;
  handleSaveWeekly: (e: React.FormEvent) => void;
}

export function WeeklySaleModal({
  isWeeklyModalOpen,
  setIsWeeklyModalOpen,
  editingWeekly,
  setEditingWeekly,
  handleSaveWeekly,
}: WeeklySaleModalProps) {
  return (
    <>
          {isWeeklyModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
              <div className="bg-white border-4 border-slate-900 w-full max-w-2xl shadow-[16px_16px_0px_0px_#0f172a] my-auto">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-indigo-50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <Pencil className="w-6 h-6 border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    Edit Data Manual Mingguan
                  </h3>
                  <button
                    onClick={() => setIsWeeklyModalOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 bg-slate-100 border-b-2 border-slate-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                   <span>Tahun: {editingWeekly.tahun}</span>
                   <span>Bulan: {editingWeekly.bulan}</span>
                   <span>Minggu: {editingWeekly.minggu}</span>
                </div>
                <form onSubmit={handleSaveWeekly} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Profit Regular (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.profit || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, profit: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 5000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Profit Dropship (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.profitDS || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, profitDS: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 2000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Iklan (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.iklan || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, iklan: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 1000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        HPP (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.hpp || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, hpp: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 3000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-rose-500 uppercase">
                    * MENGEDIT DATA DI ATAS AKAN MENIMPA HASIL KALKULASI OTOMATIS DARI TRANSAKSI HARIAN UNTUK MINGGU INI.
                  </p>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsWeeklyModalOpen(false)}
                      className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-indigo-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      SIMPAN PERUBAHAN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

    </>
  );
}