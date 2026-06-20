import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Pencil, 
  X, 
  Check, 
  ArrowUpDown, 
  Sparkles, 
  Settings, 
  Layers,
  Plus,
  Trash2
} from "lucide-react";
import { Product, upsertProduct } from "../services";

// Series aggregation algorithm
const getSeriesNameFromProduct = (product: Product): string => {
  if (product.groupName && product.groupName.trim() !== "") {
    return product.groupName.trim();
  }

  let name = product.namaBarang;
  
  // Remove Series Master Families variants and general Series keywords
  name = name.replace(/series master families/i, '');
  name = name.replace(/master families/i, '');
  name = name.replace(/\bseries\b/i, '');

  // Remove SPH minus values (e.g. -1.50, -1,50, - 1.50)
  name = name.replace(/-\s*\d+[,.]\d+/g, '');
  name = name.replace(/-\s*\d+/g, '');
  
  // Remove loose diopter decimal values (e.g., 1.50, 1,50)
  name = name.replace(/\b\d+[,.]\d+\b/g, '');
  
  // Clean plano/normal/0.00 patterns
  name = name.replace(/(plano|normal|0\.00|0,00|\bsph\b|\bpower\b)/i, '');
  
  // Remove specified color
  if (product.color) {
    const colorWord = product.color.trim();
    if (colorWord) {
      const colorRegex = new RegExp(`\\b${colorWord}\\b`, 'i');
      name = name.replace(colorRegex, '');
    }
  }

  // Remove common color keywords to clean properly
  const colorsToRemove = ['grey', 'gray', 'brown', 'hazel', 'blue', 'green', 'pink', 'black', 'chocolate', 'choco', 'violet', 'clear'];
  colorsToRemove.forEach(col => {
    const r = new RegExp(`\\b${col}\\b`, 'i');
    name = name.replace(r, '');
  });

  // Clean remaining hyphens, brackets, commas, semicolons, and spaces
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/^[-–—\s,;.()\s[\]]+|[-–—\s,;.()\s\]]+$/g, '');

  return name || product.namaBarang;
};

// Quick helper to determine color hex codes for swatches
const getColorHex = (colorName: string): string => {
  const name = (colorName || '').toLowerCase();
  if (name.includes('brown') || name.includes('coklat') || name.includes('choco')) return '#A27045';
  if (name.includes('gray') || name.includes('grey') || name.includes('abu')) return '#8EA1A5';
  if (name.includes('hazel') || name.includes('gold')) return '#C79A46';
  if (name.includes('pink') || name.includes('rose')) return '#EB99AA';
  if (name.includes('blue') || name.includes('biru')) return '#539BE2';
  if (name.includes('green') || name.includes('olive') || name.includes('hijau')) return '#698E69';
  if (name.includes('nude') || name.includes('amber')) return '#D2B48C';
  return '#1F2937'; // Black/dark defaults
};

const splitImageUrls = (str: string | undefined | null): string[] => {
  if (!str) return [];
  const parts = str.split(',');
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    if (part.startsWith('data:') && i + 1 < parts.length) {
      const fullDataUrl = part + ',' + parts[i + 1].trim();
      result.push(fullDataUrl);
      i++;
    } else {
      result.push(part);
    }
  }
  return result;
};

const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(e.target?.result as string || "");
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string || "");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

interface GroupedSeries {
  seriesName: string;
  representativeProduct: Product;
  allProducts: Product[];
  colors: string[];
}

interface KatalogTabProps {
  products: Product[];
}

export function KatalogTab({ products }: KatalogTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSeries, setEditingSeries] = useState<GroupedSeries | null>(null);
  
  // Editing form states
  const [imageUrl, setImageUrl] = useState("");
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [durasi, setDurasi] = useState("");
  const [diameter, setDiameter] = useState("");
  const [gDia, setGDia] = useState("");
  const [rating, setRating] = useState("");
  const [reviewsCount, setReviewsCount] = useState("");
  const [allowDualPower, setAllowDualPower] = useState(true);
  const [customCategory, setCustomCategory] = useState("");
  const [hideSpecs, setHideSpecs] = useState(false);
  const [notSoftlens, setNotSoftlens] = useState(false);
  const [description, setDescription] = useState("");
  const [isFlashSale, setIsFlashSale] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sort direction
  const [sortKey, setSortKey] = useState<"name" | "variants">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Parse products into Series
  const seriesList = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    products.forEach((p) => {
      const seriesName = getSeriesNameFromProduct(p);
      if (!groups[seriesName]) {
        groups[seriesName] = [];
      }
      groups[seriesName].push(p);
    });

    return Object.entries(groups).map(([seriesName, groupProducts]) => {
      // Find representative product (prefer product that already has image or properties if filled)
      const rep = groupProducts.find(
        p => p.imageUrl || p.durasi || p.diameter || p.gDia || p.rating || p.reviewsCount || p.allowDualPower !== undefined || p.customCategory
      ) || groupProducts[0];

      // Extract unique colors/variants list
      const colorsSet = new Set<string>();
      groupProducts.forEach(p => {
        if (p.color) colorsSet.add(p.color);
      });

      return {
        seriesName,
        representativeProduct: rep,
        allProducts: groupProducts,
        colors: Array.from(colorsSet),
      } as GroupedSeries;
    });
  }, [products]);

  // Filter and sort
  const filteredSeries = useMemo(() => {
    let result = seriesList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.seriesName.toLowerCase().includes(q) || 
        s.colors.some(c => c.toLowerCase().includes(q)) ||
        (s.representativeProduct.customCategory && s.representativeProduct.customCategory.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortKey === "name") {
        return sortAsc
          ? a.seriesName.localeCompare(b.seriesName)
          : b.seriesName.localeCompare(a.seriesName);
      } else {
        return sortAsc
          ? a.allProducts.length - b.allProducts.length
          : b.allProducts.length - a.allProducts.length;
      }
    });

    return result;
  }, [seriesList, searchQuery, sortKey, sortAsc]);

  const handleEditClick = (series: GroupedSeries) => {
    const rp = series.representativeProduct;
    setEditingSeries(series);
    setImageUrl(rp.imageUrl || "");
    setDurasi(rp.durasi || "");
    setDiameter(rp.diameter || "");
    setGDia(rp.gDia || "");
    setRating(rp.rating !== undefined ? rp.rating.toString() : "");
    setReviewsCount(rp.reviewsCount !== undefined ? rp.reviewsCount.toString() : "");
    setAllowDualPower(rp.allowDualPower !== false);
    setCustomCategory(rp.customCategory || "");
    setHideSpecs(rp.hideSpecs || false);
    setNotSoftlens(rp.notSoftlens || false);
    setDescription(rp.description || "");
    setIsFlashSale(rp.isFlashSale || false);

    // Map each color to its variant product's existing imageUrl
    const initialColorImages: Record<string, string> = {};
    series.colors.forEach(col => {
      const prodForColor = series.allProducts.find(p => p.color === col && p.imageUrl);
      initialColorImages[col] = prodForColor ? (prodForColor.imageUrl || "") : "";
    });
    setColorImages(initialColorImages);

    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onResult: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file).then(compressedUrl => {
      onResult(compressedUrl);
    });
  };

  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>, currentUrls: string, onUpdate: (newUrls: string) => void) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const existing = splitImageUrls(currentUrls);
    const readPromises = Array.from(files).map((file: any) => {
      return compressImageFile(file);
    });

    Promise.all(readPromises).then(newDatas => {
      const validNew = newDatas.filter(Boolean);
      const updated = [...existing, ...validNew];
      onUpdate(updated.join(', '));
    });
  };

  const handleRemoveImageAtIndex = (currentUrls: string, index: number, onUpdate: (newUrls: string) => void) => {
    const existing = splitImageUrls(currentUrls);
    existing.splice(index, 1);
    onUpdate(existing.join(', '));
  };

  const handleSaveSpesifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // Prepare values
      const parsedRating = rating ? parseFloat(rating) : undefined;
      const parsedReviewsCount = reviewsCount ? parseInt(reviewsCount) : undefined;

      // Update ALL variants in this series
      const updatePromises = editingSeries.allProducts.map(prod => {
        const customColorImg = colorImages[prod.color || ""];
        
        // Merge logic: ensure main series photos are always included alongside color-specific photos
        const colorParts = splitImageUrls(customColorImg);
        const seriesParts = splitImageUrls(imageUrl);
        
        // Filter out any overlap to prevent duplicates, then combine (color-specific photos first)
        const uniqueColorParts = colorParts.filter(p => !seriesParts.includes(p));
        const finalImg = [...uniqueColorParts, ...seriesParts].filter(Boolean).join(", ");

        return upsertProduct({
          ...prod,
          imageUrl: finalImg || undefined,
          durasi: durasi || undefined,
          diameter: diameter || undefined,
          gDia: gDia || undefined,
          rating: parsedRating,
          reviewsCount: parsedReviewsCount,
          allowDualPower: allowDualPower,
          customCategory: customCategory || undefined,
          hideSpecs: hideSpecs,
          notSoftlens: notSoftlens,
          isFlashSale: isFlashSale,
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt
        });
      });

      await Promise.all(updatePromises);
      
      setSuccessMsg(`Spesifikasi Seri "${editingSeries.seriesName}" berhasil diperbarui ke semua varian!`);
      
      // Auto close after success
      setTimeout(() => {
        setEditingSeries(null);
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Gagal menyimpan spesifikasi: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="col-span-12 min-h-[500px] pt-8 min-w-0">
      <div className="bg-white border-2 border-slate-900 flex flex-col min-h-[500px] overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]">
        
        {/* HEADER */}
        <div className="p-6 border-b-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
              <BookOpen className="w-6 h-6 border-2 border-slate-900 bg-indigo-100 p-0.5 shadow-[2px_2px_0px_0px_#0f172a]" />
              Katalog & Spesifikasi Seri
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
              Kelola Gambar, Kategori Khusus, Diameter, & Durasi Seri Lensa Olens di Sini
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="CARI SERI / WARNA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold uppercase tracking-widest w-64 shadow-[2px_2px_0px_0px_#0f172a]"
              />
            </div>
            
            <button
              onClick={() => {
                setSortKey(sortKey === "name" ? "variants" : "name");
              }}
              className="px-4 py-2 bg-white border-2 border-slate-900 hover:bg-slate-50 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[2px_2px_0px_0px_#0f172a]"
            >
              <ArrowUpDown className="w-4 h-4" />
              Urut: {sortKey === "name" ? "NAMA SERI" : "JUMLAH PRODUK"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-slate-900 flex-1">
          
          {/* CATALOG LIST PANEL */}
          <div className="lg:col-span-8 p-6 overflow-x-auto min-w-0">
            {filteredSeries.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Tidak Ada Seri Katalog yang Ditemukan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6">
                {filteredSeries.map((s) => {
                  const rp = s.representativeProduct;
                  const hasSpec = rp.imageUrl || rp.durasi || rp.diameter || rp.gDia;
                  
                  return (
                    <div 
                      key={s.seriesName} 
                      className={`border-2 border-slate-900 p-4 transition-all flex flex-col justify-between relative bg-white ${
                        editingSeries?.seriesName === s.seriesName 
                          ? 'shadow-[4px_4px_0px_0px_#6366f1] ring-2 ring-indigo-500/20' 
                          : 'shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0f172a]'
                      }`}
                    >
                      <div>
                        {/* Title and Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3 border-b-2 border-dashed border-slate-200 pb-2">
                          <div>
                            <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">
                              {s.seriesName}
                            </h3>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {s.allProducts.length} Varian SPH/Color
                            </span>
                          </div>
                          
                          {/* Image preview */}
                          {rp.imageUrl ? (
                            <img 
                              src={splitImageUrls(rp.imageUrl)[0]} 
                              alt={s.seriesName} 
                              className="w-12 h-12 rounded-lg border-2 border-slate-900 object-cover shadow-[2px_2px_0px_0px_#0f172a] shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Specs overview */}
                        <div className="space-y-1.5 text-xs font-medium mb-4">
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Durasi</span>
                            <span className="font-bold text-slate-900 font-mono">{rp.durasi || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Diameter</span>
                            <span className="font-bold text-slate-900 font-mono">{rp.diameter || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tipe Produk</span>
                            <span className={`font-black uppercase tracking-wider text-[10px] px-2 rounded ${
                              rp.notSoftlens ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {rp.notSoftlens ? "Bukan Softlens" : "Softlens"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dual SPH?</span>
                            <span className={`font-black uppercase tracking-wider text-[10px] px-2 rounded ${
                              rp.allowDualPower !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {rp.allowDualPower !== false ? "Mendukung" : "Sama Saja"}
                            </span>
                          </div>
                          {rp.customCategory && (
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori</span>
                              <span className="font-bold text-indigo-700 text-right max-w-[65%] truncate uppercase text-[10px]">
                                {rp.customCategory}
                              </span>
                            </div>
                          )}
                          {rp.rating && (
                            <div className="flex justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rating</span>
                              <span className="font-bold text-indigo-600 font-mono flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {rp.rating} ({rp.reviewsCount || 0} reviews)
                              </span>
                            </div>
                          )}
                          {rp.description && (
                            <div className="pt-1.5 border-t border-slate-100 mt-1.5 text-left">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Deskripsi:</span>
                              <p className="text-[10px] text-slate-600 font-semibold line-clamp-2 italic leading-normal mt-0.5">
                                "{rp.description}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Active Colors in database */}
                        <div className="mb-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                            Warna yang Terdeteksi:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {s.colors.map(col => (
                              <span 
                                key={col} 
                                className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditClick(s)}
                        className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Ubah Spesifikasi Seri
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* EDIT FORM SIDEBAR */}
          <div className="lg:col-span-4 p-6 bg-slate-50 min-h-[400px]">
            {editingSeries ? (
              <div className="sticky top-6">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
                      SEMPURNAKAN PRODUK CATALOG
                    </span>
                    <h3 className="font-black text-base text-slate-900 uppercase tracking-wide">
                      Edit {editingSeries.seriesName}
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingSeries(null)}
                    className="p-1.5 border-2 border-slate-900 hover:bg-red-100 text-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSpesifikasi} className="space-y-4">
                   <div className="space-y-2 bg-white p-4 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0f172a]">
                     <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none border-b border-neutral-100 pb-1.5 mb-1">
                       Foto Utama Seri (Bisa Lebih Dari 1)
                     </label>
                     <div className="flex gap-2">
                       <input
                         type="text"
                         value={imageUrl}
                         onChange={(e) => setImageUrl(e.target.value)}
                         className="flex-1 px-3 py-2 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-xs font-mono"
                         placeholder="Paste URL (pisahkan dengan koma jika lebih dari 1)"
                       />
                       <label className="flex items-center justify-center border-2 border-slate-900 bg-white hover:bg-slate-100 cursor-pointer px-3 text-[10px] font-black uppercase text-slate-800 transition-colors shrink-0">
                         <span>Upload Files</span>
                         <input
                           type="file"
                           accept="image/*"
                           multiple
                           className="hidden"
                           onChange={(e) => handleMultipleFilesUpload(e, imageUrl, setImageUrl)}
                         />
                       </label>
                     </div>

                     {/* Visual Main Image Gallery */}
                     {splitImageUrls(imageUrl).length > 0 && (
                       <div className="space-y-1.5 mt-2">
                         <span className="text-[9px] font-black uppercase text-slate-400">Daftar Gambar Seri ({splitImageUrls(imageUrl).length})</span>
                         <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                           {splitImageUrls(imageUrl).map((imgUrl, idx) => (
                             <div key={idx} className="relative w-16 h-16 border-2 border-slate-950 rounded-lg overflow-hidden group">
                               <img src={imgUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                               <button
                                 type="button"
                                 onClick={() => handleRemoveImageAtIndex(imageUrl, idx, setImageUrl)}
                                 className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md flex items-center justify-center"
                                 title="Hapus"
                               >
                                 <X className="w-2.5 h-2.5 font-bold" />
                               </button>
                               <span className="absolute bottom-0 left-0 right-0 bg-slate-950/70 text-[8px] text-white font-black text-center py-0.5">
                                 #{idx + 1}
                               </span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Multi-Image Upload per Color */}
                   {editingSeries.colors && editingSeries.colors.length > 0 && (
                     <div className="space-y-3 bg-white p-4 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0f172a]">
                       <div>
                         <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none border-b-2 border-slate-900 pb-2 mb-1">
                           Gambar Berbeda Per Warna (Bisa Lebih Dari 1)
                         </span>
                         <p className="text-[9px] text-slate-500 font-bold leading-normal">
                           Setiap warna bisa memiliki beberapa gambar sendiri. Klik "Upload" atau seret file gambar untuk menambahkan ke warna terkait. Kosongkan jika ingin mengikuti foto utama seri.
                         </p>
                       </div>

                       <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                         {editingSeries.colors.map(color => {
                           const specificImg = colorImages[color] || "";
                           const specImgArray = splitImageUrls(specificImg);
                           
                           return (
                             <div key={color} className="p-3 border-2 border-slate-200 bg-slate-50 flex flex-col gap-2 rounded-lg relative">
                               
                               <div className="flex items-center justify-between">
                                 {/* Color title with preview swatch */}
                                 <div className="flex items-center gap-2">
                                   <div 
                                     className="w-5 h-5 rounded-full border border-slate-900 shadow-sm shrink-0" 
                                     style={{ backgroundColor: getColorHex(color) }}
                                   />
                                   <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{color}</span>
                                 </div>

                                 {/* File Upload Trigger */}
                                 <div className="flex items-center gap-1.5">
                                   <label className="border border-slate-900 bg-white hover:bg-slate-100 cursor-pointer py-1 px-2.5 text-[9px] font-black uppercase text-slate-800 transition-colors">
                                     <span>+ Upload Gambar</span>
                                     <input
                                       type="file"
                                       accept="image/*"
                                       multiple
                                       className="hidden"
                                       onChange={(e) => handleMultipleFilesUpload(e, specificImg, (newVal) => {
                                         setColorImages(prev => ({ ...prev, [color]: newVal }));
                                       })}
                                     />
                                   </label>
                                   {specificImg && (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setColorImages(prev => ({ ...prev, [color]: "" }));
                                       }}
                                       className="border border-red-900 bg-red-50 hover:bg-red-100 text-red-950 px-2 py-1 text-[9px] font-black uppercase"
                                     >
                                       Reset Semua
                                     </button>
                                   )}
                                 </div>
                               </div>

                               {/* Manual Text Area for URLs */}
                               <input
                                 type="text"
                                 value={specificImg}
                                 onChange={(e) => {
                                   setColorImages(prev => ({ ...prev, [color]: e.target.value }));
                                 }}
                                 className="w-full px-2 py-1 bg-white border border-slate-300 text-[10px] font-mono"
                                 placeholder="Paste URL (pisah dengan koma jika > 1)"
                               />

                               {/* Grid of multi images for this color */}
                               <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200 rounded min-h-[44px]">
                                 {specImgArray.length > 0 ? (
                                   specImgArray.map((imgSrc, sIdx) => (
                                     <div key={sIdx} className="relative w-10 h-10 border border-slate-700 rounded overflow-hidden group">
                                       <img src={imgSrc} alt={`${color} ${sIdx}`} className="w-full h-full object-cover" loading="lazy" />
                                       <button
                                         type="button"
                                         onClick={() => handleRemoveImageAtIndex(specificImg, sIdx, (newVal) => {
                                           setColorImages(prev => ({ ...prev, [color]: newVal }));
                                         })}
                                         className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 shadow-sm flex items-center justify-center scale-75"
                                         title="Hapus gambar ini"
                                       >
                                         <X className="w-2.5 h-2.5" />
                                       </button>
                                       <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-[6px] text-white text-center py-0.5">
                                         #{sIdx + 1}
                                       </span>
                                     </div>
                                   ))
                                 ) : (
                                   <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-medium p-1">
                                     <img 
                                       src={splitImageUrls(imageUrl)[0] || "https://picsum.photos/seed/placeholder/150/150"} 
                                       className="w-5 h-5 object-cover rounded opacity-40 border border-slate-300"
                                     />
                                     <span>Mengikuti Foto Utama Seri</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                  {/* Kategori Kustom */}
                  <div className="space-y-1 bg-indigo-50/50 p-4 border-2 border-dashed border-indigo-200 rounded-xl">
                    <label className="block text-[10px] font-black text-indigo-950 uppercase tracking-widest leading-none">
                      Kategori Kustom (Custom Filters)
                    </label>
                    <p className="text-[9px] text-indigo-700 font-bold mb-1.5 leading-normal">
                      Tambahkan kategori sendiri untuk seri ini. Pisahkan dengan koma jika lebih dari satu kategori (contoh: <b>Natural, Best Seller, New</b>). Kategori ini akan langsung muncul sebagai tombol filter di halaman depan toko!
                    </p>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold"
                      placeholder="Contoh: Natural, Best Seller, Glam, Daily"
                    />
                  </div>

                  {/* Deskripsi Khusus */}
                  <div className="space-y-1 bg-slate-50 p-4 border-2 border-slate-200 rounded-xl">
                    <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
                      Deskripsi Produk / Seri Lensa
                    </label>
                    <p className="text-[9px] text-slate-500 font-bold mb-1.5 leading-normal">
                      Tulis deskripsi detail produk. Jika produk ini diset sebagai <b>Bukan Produk Softlens</b>, deskripsi ini akan tampil menggantikan tabel spesifikasi dan pilihan minus mata di frontend.
                    </p>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold font-sans rounded-lg resize-none"
                      placeholder="Tulis deskripsi detail produk di sini..."
                    />
                  </div>

                  {/* Flash Sale Toggle */}
                  <div className="space-y-1 bg-pink-50/50 p-4 border-2 border-dashed border-pink-200 rounded-xl">
                    <label className="block text-[10px] font-black text-pink-950 uppercase tracking-widest leading-none">
                      Flash Sale
                    </label>
                    <div className="flex items-center h-12 bg-white border-2 border-slate-900 px-4 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer w-full font-black uppercase text-pink-950">
                        <input
                          type="checkbox"
                          checked={isFlashSale}
                          onChange={(e) => setIsFlashSale(e.target.checked)}
                          className="w-4 h-4 text-pink-600 border-2 border-slate-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Aktifkan Flash Sale</span>
                      </label>
                    </div>
                  </div>

                  {/* Durasi */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Durasi Seri (Wear Time)
                    </label>
                    <input
                      type="text"
                      value={durasi}
                      onChange={(e) => setDurasi(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold"
                      placeholder="e.g. 1 Month (2p) atau 1 Day (10p)"
                    />
                  </div>

                   {/* Opsi Bukan Produk Softlens */}
                  <div className="space-y-1.5 bg-rose-50/60 p-4 border-2 border-dashed border-rose-200 rounded-xl">
                    <label className="block text-[10px] font-black text-rose-950 uppercase tracking-widest leading-none">
                      Tipe Produk: Bukan Softlens
                    </label>
                    <p className="text-[9px] text-rose-700 font-bold mb-2 leading-normal">
                      Aktifkan opsi ini jika produk ini adalah <b>Aksesori, Air Pembersih, atau Case</b> (bukan lensa kontak). Frontend otomatis akan menyembunyikan spesifikasi lensa kontak (DIA, BC, Water) serta <b>pilihan ukuran SPH minus mata</b>, lalu menggantinya dengan deskripsi produk saja.
                    </p>
                    <div className="flex items-center h-12 bg-white border-2 border-slate-900 px-4 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer w-full font-black uppercase text-rose-950">
                        <input
                          type="checkbox"
                          checked={notSoftlens}
                          onChange={(e) => {
                            setNotSoftlens(e.target.checked);
                            setHideSpecs(e.target.checked); // keeps hideSpecs in sync too
                          }}
                          className="w-4 h-4 text-rose-600 border-2 border-slate-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Bukan Produk Softlens (Aksesori/Cairan)</span>
                      </label>
                    </div>
                  </div>

                  {/* Diameter */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Diameter DIA
                    </label>
                    <input
                      type="text"
                      value={diameter}
                      onChange={(e) => setDiameter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold"
                      placeholder="e.g. 14.2 mm"
                    />
                  </div>

                  {/* Allow Dual Power (Same or Dual) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Opsi Beda Minus (Untuk Checkout)?
                    </label>
                    <div className="flex items-center h-12 bg-white border-2 border-slate-900 px-4">
                      <label className="flex items-center gap-2 cursor-pointer w-full">
                        <input
                          type="checkbox"
                          checked={allowDualPower}
                          onChange={(e) => setAllowDualPower(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-2 border-slate-900 focus:ring-0"
                        />
                        <span className="text-xs font-black uppercase text-slate-700">Mata Beda SPH Sifatnya Opsional</span>
                      </label>
                    </div>
                  </div>

                  {/* Rating & reviews */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Rating Manual (1-5)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold"
                        placeholder="e.g. 4.9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Jumlah Ulasan
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={reviewsCount}
                        onChange={(e) => setReviewsCount(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none text-xs font-bold"
                        placeholder="e.g. 147"
                      />
                    </div>
                  </div>

                  {/* Error & Success indicators */}
                  {errorMsg && (
                    <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 text-[10px] font-bold uppercase tracking-wider">
                      {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-100 border-2 border-emerald-900 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                      {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Menyimpan Ke Database..." : "Simpan & Terapkan Seri"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <Settings className="w-10 h-10 text-slate-400 mb-3 animate-spin duration-3000" />
                <h4 className="font-black text-xs text-slate-500 uppercase tracking-widest mb-1">
                  Pilih Seri Terlebih Dahulu
                </h4>
                <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-normal">
                  Klik tombol "Ubah Spesifikasi Seri" di sebelah kiri untuk dapat melengkapi kustomisasi data visual secara instan
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
