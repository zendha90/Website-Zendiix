import React, { useState, useEffect, useRef } from "react";
import { BrandingSettings, StorefrontBanner, updateBranding, addBanner, deleteBanner } from "../services";
import { Type, Info, Megaphone, Save, CheckCircle2, RotateCcw, Image as ImageIcon, UploadCloud, Link as LinkIcon, Trash2, Sparkles, X, Layout } from "lucide-react";

interface BrandingTabProps {
  branding: BrandingSettings;
  banners: StorefrontBanner[];
}

export const BrandingTab: React.FC<BrandingTabProps> = ({ branding, banners }) => {
  const [formData, setFormData] = useState<BrandingSettings>(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(branding);
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setMessage("");

    try {
      await updateBranding(formData);
      setSaveStatus("success");
      setMessage("Pengaturan brand berhasil diperbarui!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error updating branding:", error);
      setSaveStatus("error");
      setMessage("Gagal memperbarui pengaturan brand. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset perubahan? Semua input akan kembali ke data terakhir yang tersimpan.")) {
      setFormData(branding);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Ukuran gambar logo terlalu besar! Gunakan gambar di bawah 500 KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="col-span-12 flex flex-col pt-8 animate-fade-in font-sans pb-20">
      <div className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_#0f172a] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b-4 border-slate-900 bg-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <Layout className="w-10 h-10 border-4 border-slate-900 bg-white p-1.5 shadow-[4px_4px_0px_0px_#0f172a]" />
                Branding & Banner
              </h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                Kustomisasi identitas visual, banner promosi, dan profil toko Anda.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 border-4 border-slate-900 bg-white text-slate-900 font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-8 py-3 border-4 border-slate-900 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 ${isSaving ? "opacity-30 cursor-not-allowed shadow-none" : ""}`}
              >
                {isSaving ? "Menyimpan..." : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Branding
                  </>
                )}
              </button>
            </div>
          </div>

          {saveStatus !== "idle" && (
            <div className={`mt-6 p-4 border-4 flex items-center gap-3 animate-bounce ${saveStatus === "success" ? "bg-emerald-50 border-emerald-900 text-emerald-900" : "bg-rose-50 border-rose-900 text-rose-900"}`}>
              {saveStatus === "success" ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              <span className="font-black uppercase tracking-widest text-xs">{message}</span>
            </div>
          )}
        </div>

        {/* Branding Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Logo & Identity Section */}
          <div className="p-8 space-y-10 border-r-4 border-slate-900">
            <div className="space-y-6">
               <div className="flex items-center gap-2 text-indigo-600">
                 <ImageIcon className="w-6 h-6" />
                 <h3 className="text-xl font-black uppercase tracking-tight">Logo & Identitas Utama</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Logo Frontend (Image)</label>
                    <div 
                      className="aspect-video border-4 border-dashed border-slate-300 bg-slate-50 relative flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-600 transition-all group"
                      onClick={() => logoFileInputRef.current?.click()}
                    >
                      {formData.logoUrl ? (
                        <>
                          <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <UploadCloud className="text-white w-8 h-8" />
                          </div>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-slate-300 w-10 h-10 mb-2" />
                          <span className="text-[10px] font-black uppercase text-slate-400">Pilih File Logo</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={logoFileInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    {formData.logoUrl && (
                      <button 
                        onClick={() => setFormData({ ...formData, logoUrl: "" })}
                        className="text-[10px] font-black uppercase text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus Logo & Pakai Teks
                      </button>
                    )}
                 </div>

                 <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Logo Text (Fallback)</label>
                    <input 
                      type="text"
                      value={formData.logoText}
                      onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
                      className="w-full px-5 py-3 border-4 border-slate-900 bg-white font-black text-xl uppercase tracking-tighter shadow-[6px_6px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_#0f172a] transition-all"
                      placeholder="e.g. ZENDIIX"
                    />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Teks ini muncul jika gambar logo tidak diatur.</p>
                 </div>
               </div>
            </div>

            <div className="space-y-6 pt-10 border-t-2 border-slate-100">
               <div className="flex items-center gap-2 text-indigo-600">
                 <Info className="w-6 h-6" />
                 <h3 className="text-xl font-black uppercase tracking-tight">Tentang Brand (Footer)</h3>
               </div>
               
               <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Profil Singkat / Slogan</label>
                  <textarea 
                    rows={4}
                    value={formData.footerAboutText}
                    onChange={(e) => setFormData({ ...formData, footerAboutText: e.target.value })}
                    className="w-full px-5 py-4 border-4 border-slate-900 bg-white font-bold text-sm tracking-wide shadow-[6px_6px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_#0f172a] transition-all resize-none font-sans"
                    placeholder="e.g. Destinasi terbaik untuk koleksi softlens premium yang nyaman dan estetik..."
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Deskripsi ini ditampilkan pada bagian 'Tentang' di footer website.</p>
               </div>
            </div>
          </div>

          {/* Announcement Banner Section */}
          <div className="p-8 space-y-10 bg-slate-50/50">
            <div className="space-y-6">
               <div className="flex items-center gap-2 text-indigo-600">
                 <Megaphone className="w-6 h-6" />
                 <h3 className="text-xl font-black uppercase tracking-tight">Pengumuman Ticker</h3>
               </div>

               <div className="space-y-6">
                 {formData.announcementTexts.map((text, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Slide Pengumuman #{idx + 1}</label>
                        {formData.announcementTexts.length > 1 && (
                          <button 
                            onClick={() => {
                              const newTexts = formData.announcementTexts.filter((_, i) => i !== idx);
                              setFormData({ ...formData, announcementTexts: newTexts });
                            }}
                            className="text-[10px] font-black uppercase text-rose-600 hover:underline"
                          >
                            Hapus Baris
                          </button>
                        )}
                      </div>
                      <input 
                        type="text"
                        value={text}
                        onChange={(e) => {
                          const newTexts = [...formData.announcementTexts];
                          newTexts[idx] = e.target.value;
                          setFormData({ ...formData, announcementTexts: newTexts });
                        }}
                        className="w-full px-5 py-4 border-4 border-slate-900 bg-white font-bold text-sm tracking-wide shadow-[6px_6px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_#0f172a] transition-all"
                        placeholder="e.g. FLASH SALE! DISKON HINGGA 50% UNTUK SEMUA PRODUK"
                      />
                   </div>
                 ))}

                 <button 
                  onClick={() => setFormData({ ...formData, announcementTexts: [...formData.announcementTexts, ""] })}
                  className="w-full py-4 border-4 border-dashed border-slate-400 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 font-black uppercase tracking-widest text-[10px] transition-all"
                 >
                   + Tambah Slide Pengumuman
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* BANNER PROMOTION SECTION */}
      <div className="mt-16 bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_#0f172a] overflow-hidden">
        <div className="p-8 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
            <UploadCloud className="w-8 h-8 border-2 border-slate-900 bg-indigo-100 p-1 shadow-[3px_3px_0px_0px_#0f172a]" />
            Manajemen Banner Promosi (Sliding)
          </h2>
        </div>

        <div className="p-8 space-y-12">
          {/* Banner Upload Manager Integrated */}
          <BannerUploadSection />

          {/* List of active banners */}
          <div className="border-t-2 border-slate-100 pt-10">
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Banner Aktif Saat Ini ({banners.length})
            </h3>

            {banners.length === 0 ? (
              <div className="p-12 border-4 border-dashed border-slate-300 bg-slate-50 text-center flex flex-col items-center justify-center">
                <UploadCloud className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Belum Ada Banner Kustom
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">
                  Sistem akan menampilkan banner fallback default. Silakan tambahkan banner baru di atas!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {banners.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden flex flex-col group"
                  >
                    <div className="relative aspect-[4/5] bg-slate-100 border-b-2 border-slate-900 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={`Banner ${idx + 1}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={async () => {
                          if (confirm("Hapus banner ini?")) {
                            await deleteBanner(item.id!);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded border-2 border-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2 bg-slate-50">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Slide {idx + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Helper Sub-component for Banner Upload within Branding Tab */
const BannerUploadSection = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("Gambar terlalu besar! Maksimal 800 KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setIsUploading(true);
    try {
      await addBanner({ imageUrl, linkUrl });
      setImageUrl("");
      setLinkUrl("");
      setPreviewUrl(null);
      alert("Banner ditambahkan!");
    } catch (err) {
      alert("Gagal tambah banner.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 border-4 border-slate-900 p-8 shadow-[8px_8px_0px_0px_#0f172a]">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-6">
            <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
               <UploadCloud className="w-5 h-5 text-indigo-600" />
               Upload Banner Baru
            </h4>
            
            <div 
               className="aspect-[4/5] border-4 border-dashed border-slate-300 bg-white relative flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600 transition-all overflow-hidden"
               onClick={() => fileInputRef.current?.click()}
            >
               {previewUrl ? (
                 <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center p-6">
                    <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Pilih Gambar (Ratio 4:5)</p>
                 </div>
               )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
         </div>

         <div className="space-y-8 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Target Link (URL - Opsional)</label>
                <div className="relative">
                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="text"
                     value={linkUrl}
                     onChange={(e) => setLinkUrl(e.target.value)}
                     className="w-full pl-11 pr-4 py-4 border-4 border-slate-900 font-bold text-xs shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                     placeholder="https://iklan.com"
                   />
                </div>
              </div>
            </div>

            <button
               onClick={handleSubmit}
               disabled={!imageUrl || isUploading}
               className={`w-full py-5 bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${(!imageUrl || isUploading) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
            >
               {isUploading ? "SEDANG MENGUPLOAD..." : "TAMBAHKAN KE SLIDE"}
            </button>

            <div className="p-4 bg-amber-50 border-4 border-amber-900">
               <p className="text-[10px] font-bold text-amber-900 leading-relaxed uppercase tracking-wider">
                  ⚠️ Gunakan gambar dengan rasio 4:5 (Portrait) agar pas dengan tampilan mobile storefront.
               </p>
            </div>
         </div>
       </div>
    </div>
  );
};

