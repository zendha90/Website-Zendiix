import React from "react";
import { UploadCloud, Save } from "lucide-react";

export interface ProgressModalsProps {
  importProgress: { current: number; total: number; stage?: string } | null;
  savingProgress: { current: number; total: number; title?: string } | null;
}

export function ProgressModals({
  importProgress,
  savingProgress,
}: ProgressModalsProps) {
  return (
    <>
      {importProgress && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 w-full max-w-sm p-8 shadow-[12px_12px_0px_0px_#0f172a] flex flex-col items-center text-center gap-6">
            <UploadCloud className="w-12 h-12 text-indigo-600 animate-bounce" />
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center justify-center gap-2 uppercase tracking-widest">
                <UploadCloud className="w-5 h-5" /> Mengimport Data...
              </h3>
              <p className="text-sm text-slate-500">
                Memproses {importProgress.current} dari {importProgress.total}{" "}
                baris.
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {savingProgress && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 w-full max-w-sm p-8 shadow-[12px_12px_0px_0px_#0f172a] flex flex-col items-center text-center gap-6">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <Save className="w-5 h-5 text-indigo-600 absolute" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center justify-center gap-2 uppercase tracking-widest">
                {savingProgress.title || "Menyimpan..."}
              </h3>
              {savingProgress.total > 1 ? (
                <p className="text-sm text-slate-500 font-bold">
                  Memproses {savingProgress.current} dari {savingProgress.total} baris.
                </p>
              ) : (
                <p className="text-sm text-slate-500 font-bold">
                  Sedang memproses, harap tunggu...
                </p>
              )}
            </div>
            {savingProgress.total > 1 && (
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.round((savingProgress.current / savingProgress.total) * 100)}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}