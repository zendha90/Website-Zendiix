import React from "react";
import { ArrowDown, X } from "lucide-react";
import { Product } from "../../services";

export interface IncomingGoodForm {
  id?: string;
  productId?: string;
  kodeBarang?: string;
  namaBarang?: string;
  supplier?: string;
  qty?: number;
  tanggal?: string | null;
  catatan?: string;
}

export interface IncomingGoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingForm: IncomingGoodForm;
  setIncomingForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddIncoming: (e: React.FormEvent) => void;
  products: Product[];
}

export function IncomingGoodModal({
  isOpen,
  onClose,
  incomingForm,
  setIncomingForm,
  handleAddIncoming,
  products,
}: IncomingGoodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-4 border-slate-900 w-full max-w-lg shadow-[16px_16px_0px_0px_#0f172a] my-auto">
        <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
            <ArrowDown className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
            {incomingForm.id ? "Edit Barang Masuk" : "Tambah Barang Masuk"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleAddIncoming} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Pilih Barang
            </label>
            <select
              required
              value={incomingForm.productId || ""}
              onChange={(e) => {
                const selectedProd = products.find((p) => p.id === e.target.value);
                setIncomingForm({
                  ...incomingForm,
                  productId: e.target.value,
                  kodeBarang: selectedProd ? selectedProd.kodeBarang : (incomingForm.kodeBarang || ""),
                  namaBarang: selectedProd ? selectedProd.namaBarang : (incomingForm.namaBarang || ""),
                  supplier: selectedProd ? selectedProd.supplier : (incomingForm.supplier || ""),
                });
              }}
              className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
            >
              <option value="">-- Pilih Barang --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.kodeBarang} - {p.namaBarang}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Jumlah Masuk
            </label>
            <input
              type="number"
              required
              min="1"
              value={incomingForm.qty || 1}
              onChange={(e) =>
                setIncomingForm({
                  ...incomingForm,
                  qty: Number(e.target.value),
                })
              }
              className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Supplier (Opsional)
            </label>
            <input
              type="text"
              value={incomingForm.supplier || ""}
              onChange={(e) =>
                setIncomingForm({
                  ...incomingForm,
                  supplier: e.target.value,
                })
              }
              placeholder="Masukkan nama supplier..."
              className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black shadow-[4px_4px_0px_0px_#0f172a]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              Tanggal Input (Opsional)
            </label>
            <input
              type="datetime-local"
              value={incomingForm.tanggal || ""}
              onChange={(e) =>
                setIncomingForm({
                  ...incomingForm,
                  tanggal: e.target.value,
                })
              }
              className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black shadow-[4px_4px_0px_0px_#0f172a]"
            />
          </div>
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-indigo-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
            >
              {incomingForm.id ? "SIMPAN PERUBAHAN" : "SIMPAN RECORD"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
