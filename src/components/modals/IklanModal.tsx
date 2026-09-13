import React from "react";
import { Megaphone, X, AlertTriangle } from "lucide-react";

export interface IklanModalProps {
  isIklanModalOpen: boolean;
  setIsIklanModalOpen: (open: boolean) => void;
  editingIklan: any;
  setEditingIklan: React.Dispatch<React.SetStateAction<any>>;
  handleSaveIklan: (e: React.FormEvent) => void;
  handlePasteInIklanModal: (e: React.ClipboardEvent) => void;
  iklanList?: any[];
}

export function IklanModal({
  isIklanModalOpen,
  setIsIklanModalOpen,
  editingIklan,
  setEditingIklan,
  handleSaveIklan,
  handlePasteInIklanModal,
  iklanList = [],
}: IklanModalProps) {
  const currentNoPesanan = (editingIklan.noPesanan || "").trim().toLowerCase();
  const existingDuplicate = (currentNoPesanan && currentNoPesanan !== "-")
    ? iklanList.find(
        (item: any) =>
          item.id !== editingIklan.id &&
          (item.noPesanan || "").trim().toLowerCase() === currentNoPesanan
      )
    : null;

  return (
    <>
          {isIklanModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-lg shadow-[16px_16px_0px_0px_#0f172a] my-auto">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <Megaphone className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    {editingIklan.id ? "Edit Pengeluaran Iklan" : "Tambah Pengeluaran Iklan"}
                  </h3>
                  <button
                    onClick={() => setIsIklanModalOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onPaste={handlePasteInIklanModal} onSubmit={handleSaveIklan} className="p-8 space-y-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Tanggal (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 15/05/2026"
                      value={editingIklan.tanggal || ""}
                      onChange={(e) =>
                        setEditingIklan({
                          ...editingIklan,
                          tanggal: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Total Pembayaran (Rp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 150000"
                      value={editingIklan.totalPembayaran || ""}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/\D/g, "");
                        setEditingIklan({
                          ...editingIklan,
                          totalPembayaran: cleanVal ? Number(cleanVal) : "",
                        });
                      }}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center justify-between">
                      <span>No. Pesanan (Opsional)</span>
                      {existingDuplicate && (
                        <span className="text-amber-600 font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> SUDAH PERNAH DIINPUT
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nomor pesanan..."
                      value={editingIklan.noPesanan || ""}
                      onChange={(e) =>
                        setEditingIklan({
                          ...editingIklan,
                          noPesanan: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-4 bg-white border-2 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none ${
                        existingDuplicate
                          ? "border-amber-500 bg-amber-50/50 text-amber-950"
                          : "border-slate-900"
                      }`}
                    />
                    {existingDuplicate && (
                      <div className="mt-2 p-3 bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs flex items-start gap-2 shadow-[2px_2px_0px_0px_#f59e0b]">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-black uppercase tracking-wider text-[11px] text-amber-900">
                            Peringatan: No. Pesanan Ganda (Double Input)
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            No. Pesanan <span className="font-mono font-black">{editingIklan.noPesanan}</span> sudah pernah tercatat pada tanggal <strong>{existingDuplicate.tanggal}</strong> dengan total pembayaran <strong>Rp {Number(existingDuplicate.totalPembayaran).toLocaleString("id-ID")}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsIklanModalOpen(false)}
                      className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-4 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all ${
                        existingDuplicate
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {existingDuplicate ? "TETAP SIMPAN (GANDA)" : "SIMPAN DATA"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

    </>
  );
}