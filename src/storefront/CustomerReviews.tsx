import React, { useState, useEffect } from "react";
import { Review, subscribeToReviews } from "../services";
import { Star, ChevronLeft, Search, ArrowLeft, AlertTriangle, Sparkles, Database } from "lucide-react";

interface CustomerReviewsProps {
  branding?: {
    logoUrl?: string;
    logoText?: string;
    footerAboutText?: string;
    announcementTexts?: string[];
  };
  dbError?: {
    message: string;
    suggestedIp?: string;
  } | null;
}

export function CustomerReviews({ branding, dbError }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const filteredReviews = reviews.filter(r => 
    r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.comment?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen w-full bg-neutral-50 font-sans text-neutral-800 antialiased selection:bg-slate-900 selection:text-white flex justify-center items-start">
      
      {/* Centered High-Fidelity Shopee Mobile Layout consistent with / */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] flex flex-col relative transition-all">
        
        {/* Top Shopee Style Notice Banner */}
        <div className="w-full bg-[#1F1F1F] text-white text-[9.5px] font-bold py-2 px-3 overflow-hidden flex items-center justify-center z-50">
          <div className="flex items-center gap-1.5 uppercase tracking-wider text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>KUMPULAN ULASAN PELANGGAN SETIA</span>
          </div>
        </div>

        {/* Elegant Sticky Header Bar (Nav) consistent with / */}
        <header className="sticky top-0 z-50 bg-white text-slate-900 px-4 py-4 border-b border-neutral-100 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 text-slate-900 hover:text-slate-700 transition-colors font-extrabold text-[11px] uppercase tracking-wider"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Beranda</span>
            </button>

            <div className="flex-1 text-center font-display text-xs font-black text-slate-950 truncate uppercase pr-4">
              Kumpulan Ulasan
            </div>

            <div className="w-[44px]" /> {/* Spacer to balance left return button */}
          </div>
        </header>

        {/* Main reviews content with bottom padding */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-10 scrollbar-none">
          
          {/* dbError cPanel MySQL Connection Warning Box (Matched consistently if offline) */}
          {dbError && (
            <div className="m-4 p-4 bg-rose-50 border-2 border-rose-100 rounded-xl text-rose-900 space-y-1.5 font-sans text-left">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-700 font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs tracking-tight uppercase text-rose-800">Database Offline</h4>
                  <p className="text-[10px] text-rose-700 leading-relaxed">
                    Gagal memuat ulasan terbaru ke database online. Silakan setup Remote Access Host MySQL di cPanel Anda dengan IP: <strong>{dbError.suggestedIp || "34.96.48.15"}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Branded Disclaimer Warning Box (Kotak Ikon Peringatan) */}
          <div className="m-4 p-4 bg-amber-50 border-2 border-amber-100 rounded-xl text-amber-900 space-y-2 font-sans text-left">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs tracking-tight uppercase text-slate-900 font-display">PEMBERITAHUAN KEASLIAN</h4>
                <p className="text-[10px] text-amber-850 mt-1 leading-relaxed font-sans">
                  Seluruh ulasan produk di bawah ini dikirimkan langsung oleh pelanggan resmi kami secara sukarela. Kami menjamin <strong>originalitas dan integritas 100%</strong> tanpa manipulasi demi kenyamanan belanja Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Elegant Search Input */}
          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Cari ulasan pelanggan secara spesifik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-neutral-100 text-neutral-800 rounded-md text-xs font-bold placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all font-sans"
              />
            </div>
          </div>

          {/* List of Customer Reviews */}
          <div className="px-4 space-y-3 text-left">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-200">
                <Search className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-600 font-bold">Tidak ada ulasan ditemukan</p>
                <p className="text-[10px] text-neutral-400">Coba kata kunci pencarian yang berbeda.</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 capitalize font-display">{review.reviewerName}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-neutral-400">
                      {new Date(review.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-[11px] text-neutral-600 leading-relaxed font-sans whitespace-pre-wrap">
                      "{review.comment}"
                    </p>
                  )}

                  {review.photoUrl && (
                    <div className="relative aspect-square max-w-[150px] bg-neutral-50 rounded-lg overflow-hidden border border-neutral-100">
                      <img 
                        src={review.photoUrl} 
                        alt="Review upload" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Persistent Footer consistent with Storefront.tsx */}
          <footer className="bg-white border-t border-neutral-100 py-10 px-6 mt-8 font-sans">
            <div className="max-w-md mx-auto space-y-10 text-center">
              
              {/* Brand Message Section */}
              <div className="space-y-3">
                <h4 className="font-display text-xl font-bold tracking-tight text-slate-950 uppercase">
                  Tentang {branding?.logoText || "Zendiix"}
                </h4>
                <div className="w-10 h-0.5 bg-slate-900 mx-auto opacity-20 mb-4 rounded-full" />
                <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs mx-auto font-medium">
                  {branding?.footerAboutText || "Zendiix hadir memberikan solusi produk softlens premium untuk menunjang keindahan dan kesehatan mata dengan standarisasi kualitas tinggi bagi para pecinta fashion optik."}
                </p>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] font-display">Ikuti Kami</p>
                <div className="flex justify-center gap-10">
                  <a href="#" className="text-slate-900 border-b-2 border-transparent hover:border-slate-900 transition-all pb-0.5 text-[10px] uppercase font-black tracking-wider">
                    Instagram
                  </a>
                  <a href="#" className="text-slate-900 border-b-2 border-transparent hover:border-slate-900 transition-all pb-0.5 text-[10px] uppercase font-black tracking-wider">
                    Shopee
                  </a>
                  <a href="#" className="text-slate-900 border-b-2 border-transparent hover:border-slate-900 transition-all pb-0.5 text-[10px] uppercase font-black tracking-wider">
                    TikTok
                  </a>
                </div>
              </div>

              {/* Payment Methods Section with Logos */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] font-display">Metode Pembayaran</p>
                <div className="flex justify-center items-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" 
                    alt="QRIS" 
                    className="h-4 object-contain"
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" 
                    alt="BCA" 
                    className="h-3.5 object-contain"
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" 
                    alt="Mandiri" 
                    className="h-3.5 object-contain"
                  />
                </div>
              </div>

              {/* Legality / Copyright */}
              <div className="pt-4 border-t border-neutral-50">
                <p className="text-[9px] font-bold text-neutral-300 tracking-wider">
                  &copy; 2026 {branding?.logoText || "ZENDIIX"} Softlens. All rights reserved.
                </p>
              </div>

            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

