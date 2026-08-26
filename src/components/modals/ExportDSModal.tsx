import React, { useState } from "react";
import { FileText, Copy, Check, Download, X } from "lucide-react";

export interface ExportDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportDSText: string;
}

export function ExportDSModal({ isOpen, onClose, exportDSText }: ExportDSModalProps) {
  const [exportDSToast, setExportDSToast] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-4 border-slate-900 w-full max-w-2xl shadow-[16px_16px_0px_0px_#0f172a] my-auto">
        <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
            <FileText className="w-6 h-6 border-2 border-slate-900 bg-amber-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
            Data Transaksi Dropship Terakhir
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={exportDSText}
              className="w-full p-4 bg-slate-50 border-2 border-slate-900 font-mono text-sm font-bold shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(exportDSText);
                setExportDSToast(true);
                setTimeout(() => setExportDSToast(false), 2000);
              }}
              className="flex-1 py-4 bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {exportDSToast ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" /> TERSALIN!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> SALIN KE CLIPBOARD
                </>
              )}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([exportDSText], {
                  type: "text/plain;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Export_Dropship_${new Date().toISOString().slice(0, 10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> DOWNLOAD .TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
