import React, { useState } from "react";
import { FileText, Copy, Check, X } from "lucide-react";

export interface ExportDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportDSText: string;
}

export function ExportDSModal({ isOpen, onClose, exportDSText }: ExportDSModalProps) {
  const [exportDSToast, setExportDSToast] = useState(false);
  if (!isOpen) return null;

  const lineCount = exportDSText ? exportDSText.trim().split("\n").length : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportDSText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = exportDSText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setExportDSToast(true);
    setTimeout(() => {
      setExportDSToast(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white border-4 border-slate-900 w-full max-w-2xl shadow-[12px_12px_0px_0px_#0f172a] my-auto overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 border-2 border-slate-900 bg-amber-400 text-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider leading-tight">
                Data Transaksi Dropship Terakhir
              </h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                {lineCount > 0 ? `${lineCount} Baris Data Siap Disalin` : "Rincian Transaksi"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200 border-2 border-transparent hover:border-slate-900 rounded transition-all cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={exportDSText}
              className="w-full p-3.5 sm:p-4 bg-slate-50 border-2 border-slate-900 font-mono text-xs sm:text-sm font-semibold text-slate-900 shadow-[3px_3px_0px_0px_#0f172a] focus:outline-none focus:bg-white resize-none leading-relaxed select-all"
              placeholder="Tidak ada data untuk ditampilkan"
            />
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3.5 sm:py-4 border-2 border-slate-900 font-black uppercase tracking-widest text-xs sm:text-sm shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
                exportDSToast
                  ? "bg-emerald-400 text-slate-950 border-emerald-950"
                  : "bg-amber-400 hover:bg-amber-500 text-slate-950"
              }`}
            >
              {exportDSToast ? (
                <>
                  <Check className="w-5 h-5 text-slate-950 stroke-[3px]" />
                  <span>BERHASIL DISALIN!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5px]" />
                  <span>SALIN KE CLIPBOARD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
