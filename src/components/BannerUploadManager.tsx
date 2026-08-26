import React, { useState, useRef } from "react";
import { UploadCloud, Sparkles, Image, Check, AlertCircle, RefreshCw } from "lucide-react";
import { compressImageFile } from "../utils/helpers";

export function BannerUploadManager({ onAddBanner }: { onAddBanner: (imageUrl: string, linkUrl: string) => Promise<void> }) {
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"file" | "link" | "presets">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, 1200, 600, 0.7).then(compressedUrl => {
        setPreviewUrl(compressedUrl);
        setImageUrl(compressedUrl);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressImageFile(file, 1200, 600, 0.7).then(compressedUrl => {
        setPreviewUrl(compressedUrl);
        setImageUrl(compressedUrl);
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert("Pilih file gambar atau masukkan URL terlebih dahulu!");
      return;
    }
    setIsLoading(true);
    try {
      await onAddBanner(imageUrl, linkUrl);
      setImageUrl("");
      setLinkUrl("");
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("Banner berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal menambahkan banner.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (url: string) => {
    setPreviewUrl(url);
    setImageUrl(url);
    setLinkUrl("");
  };

  return (
    <div className="bg-slate-50 border-4 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a] text-left">
      <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-widest">
        TAMBAH BANNER BARU
      </h3>
      
      <div className="flex border-b-2 border-slate-900 mb-6 gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab("file"); setPreviewUrl(null); setImageUrl(""); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-b-0 -mb-[2px] transition-all ${
            activeTab === "file" 
              ? "bg-white border-slate-900 text-indigo-600 shadow-[2px_-2px_0px_0px_#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Upload Gambar (Lokal)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("link"); setPreviewUrl(null); setImageUrl(""); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-b-0 -mb-[2px] transition-all ${
            activeTab === "link"
              ? "bg-white border-slate-900 text-indigo-600 shadow-[2px_-2px_0px_0px_#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Paste Link Gambar (URL)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("presets"); setPreviewUrl(null); setImageUrl(""); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-b-0 -mb-[2px] transition-all ${
            activeTab === "presets"
              ? "bg-white border-slate-900 text-indigo-600 shadow-[2px_-2px_0px_0px_#0f172a]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Gunakan Preset Estetik
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="flex flex-col justify-between">
            {activeTab === "file" && (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] max-h-[300px] border-4 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex flex-col items-center justify-center p-4 cursor-pointer transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider text-center">
                  Drag & Drop file gambar di sini
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">
                  Atau klik untuk browsing (Maks 800 KB)
                </p>
              </div>
            )}

            {activeTab === "link" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Link URL Gambar Online</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(e.target.value); }}
                    className="w-full h-10 px-3 border-2 border-slate-900 focus:outline-none text-xs font-bold focus:ring-1 focus:ring-indigo-600 placeholder-slate-400 bg-white"
                  />
                </div>
                <div className="p-4 bg-indigo-50 border-2 border-slate-900 text-slate-700 text-xs font-semibold leading-relaxed font-sans">
                  💡 Tips: Anda dapat menyalin tautan gambar apa pun dari internet dan menempelkannya di atas untuk menjadikannya banner promosi instan.
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto scrollbar-none pb-2">
                <button
                  type="button"
                  onClick={() => loadPreset("/src/assets/images/hero_banner_zendiix_png_1781662668206.jpg")}
                  className="p-2 border-2 border-slate-900 hover:bg-slate-100 flex flex-col items-center gap-1 bg-white"
                >
                  <div className="w-full aspect-[4/5] bg-slate-100 border border-slate-300 overflow-hidden">
                    <img src="/src/assets/images/hero_banner_zendiix_png_1781662668206.jpg" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center block">Zendiix Classic</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadPreset("https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600")}
                  className="p-2 border-2 border-slate-900 hover:bg-slate-100 flex flex-col items-center gap-1 bg-white"
                >
                  <div className="w-full aspect-[4/5] bg-slate-100 border border-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center block font-sans">Red Lipstick</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadPreset("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600")}
                  className="p-2 border-2 border-slate-900 hover:bg-slate-100 flex flex-col items-center gap-1 bg-white"
                >
                  <div className="w-full aspect-[4/5] bg-slate-100 border border-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center block font-sans">Pink Cosmetics</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadPreset("https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600")}
                  className="p-2 border-2 border-slate-900 hover:bg-slate-100 flex flex-col items-center gap-1 bg-white"
                >
                  <div className="w-full aspect-[4/5] bg-slate-100 border border-slate-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center block font-sans">Liquid Splash</span>
                </button>
              </div>
            )}

            <div className="mt-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                Target Link / Router URL (Opsional)
              </label>
              <input 
                type="text" 
                placeholder="Misal: /?kategori=Daily atau Kosongkan" 
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full h-10 px-3 border-2 border-slate-900 focus:outline-none text-xs font-bold focus:ring-1 focus:ring-indigo-600 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 bg-white text-center">
            {previewUrl ? (
              <div className="w-full max-w-[200px]">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-2 block animate-pulse">PREVIEW RASIO 4:5</span>
                <div className="relative w-full aspect-[4/5] bg-slate-100 border-2 border-slate-900 overflow-hidden shadow-md">
                  <img src={previewUrl} className="w-full h-full object-cover animate-fade-in" alt="Preview banner" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : (
              <div className="text-slate-400 space-y-2 font-sans">
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-normal text-slate-600">
                  Sisi Preview Banner 4:5
                </p>
                <p className="text-[9px] font-bold tracking-tight text-slate-400 max-w-[180px] mx-auto uppercase">
                  Setelah mengunggah gambar, replika ukuran 4:5 akan terpampang langsung di sini.
                </p>
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-3 border-t-2 border-slate-900 border-dashed">
          <button
            type="submit"
            disabled={isLoading || !imageUrl}
            className={`px-6 py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] transition-all flex items-center gap-1.5 ${
              isLoading || !imageUrl
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
                : "bg-indigo-600 text-white hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
            }`}
          >
            {isLoading ? "MENYIMPAN..." : "SIMPAN BANNER"}
          </button>
        </div>
      </form>
    </div>
  );
}