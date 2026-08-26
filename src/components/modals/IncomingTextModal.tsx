import React, { useState, useEffect } from "react";
import { ArrowDown, X, ArrowRight, Pencil, Trash2, Settings, Plus, Sparkles, ChevronDown, ChevronUp, AlertTriangle, Check, RefreshCcw, Search, Package } from "lucide-react";
import { Product } from "../../services";
import { SearchableProductSelect } from "../SearchableProductSelect";
import { findAutoMatch } from "../../utils/helpers";
import { parseFormatAkumaucantik, parseFormatKim, parseFormatShopee, parseFormatSisse, parseFormatAnna } from "../../utils/parsers";
import { AllSupplierConfigs, DEFAULT_SUPPLIER_CONFIGS } from "../../utils/supplierConfigs";

export interface IncomingTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  upsertProduct: (p: any) => Promise<string>;
  addIncomingGood: (ig: any) => Promise<any>;
  setSavingProgress: (progress: { current: number; total: number; title?: string } | null) => void;
}

export function IncomingTextModal({
  isOpen,
  onClose,
  products,
  upsertProduct,
  addIncomingGood,
  setSavingProgress,
}: IncomingTextModalProps) {


  const isIncomingTextModalOpen = isOpen;
  const setIsIncomingTextModalOpen = (val: boolean) => { if (!val) onClose(); };
  const [replacementGlobal, setReplacementGlobal] = useState<{ old: string; new: string }[]>(() => {
    const saved = localStorage.getItem("replacementGlobal");
    return saved ? JSON.parse(saved) : [];
  });
  const [replacementKim, setReplacementKim] = useState<{ old: string; new: string }[]>(() => {
    const saved = localStorage.getItem("replacementKim");
    return saved ? JSON.parse(saved) : [];
  });
  const [rawText, setRawText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<
    "akumaucantik" | "anna" | "shopee" | "sisse" | "kim"
  >("akumaucantik");
  
  const [supplierConfigs, setSupplierConfigs] = useState<AllSupplierConfigs>(() => {
    const saved = localStorage.getItem("supplierDoubleConfigs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SUPPLIER_CONFIGS,
          ...parsed,
          akumaucantik: { ...DEFAULT_SUPPLIER_CONFIGS.akumaucantik, ...parsed.akumaucantik },
          anna: { ...DEFAULT_SUPPLIER_CONFIGS.anna, ...parsed.anna },
          shopee: { ...DEFAULT_SUPPLIER_CONFIGS.shopee, ...parsed.shopee },
          sisse: { ...DEFAULT_SUPPLIER_CONFIGS.sisse, ...parsed.sisse },
          kim: { ...DEFAULT_SUPPLIER_CONFIGS.kim, ...parsed.kim },
        };
      } catch (e) {
        return DEFAULT_SUPPLIER_CONFIGS;
      }
    }
    return DEFAULT_SUPPLIER_CONFIGS;
  });

  useEffect(() => {
    localStorage.setItem("supplierDoubleConfigs", JSON.stringify(supplierConfigs));
  }, [supplierConfigs]);

  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const [parsedItems, setParsedItems] = useState<
    {
      rawName: string;
      qty: number;
      overrideProductId?: string;
      isEditingMapping?: boolean;
      isEditingProductDetails?: boolean;
      customProductDetails?: {
        kodeBarang?: string;
        namaBarang?: string;
        supplier?: string;
        hargaBeli?: number;
        hargaJual?: number;
        color?: string;
        bc?: string;
        kadarAir?: string;
      };
      detectedUnit?: string;
      isAlreadyDoubled?: boolean;
    }[]
  >([]);


  const handleProcessText = () => {
    let newList: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];
    if (selectedFormat === "akumaucantik") {
      newList = parseFormatAkumaucantik(rawText, replacementGlobal, supplierConfigs.akumaucantik);
    } else if (selectedFormat === "kim") {
      newList = parseFormatKim(rawText, replacementKim, replacementGlobal, supplierConfigs.kim);
    } else if (selectedFormat === "shopee") {
      newList = parseFormatShopee(rawText, replacementGlobal, supplierConfigs.shopee);
    } else if (selectedFormat === "sisse") {
      newList = parseFormatSisse(rawText, replacementGlobal, supplierConfigs.sisse);
    } else if (selectedFormat === "anna") {
      newList = parseFormatAnna(rawText, replacementGlobal, supplierConfigs.anna);
    }

    setParsedItems(newList);
  };

  const handleSaveBulkIncoming = async () => {
    let successCount = 0;
    const itemsToSave = parsedItems.filter(
      (item) => item.rawName.trim() && item.qty > 0,
    );

    if (itemsToSave.length === 0) {
      alert("Tidak ada barang valid untuk ditambahkan!");
      return;
    }

    setSavingProgress({ current: 0, total: itemsToSave.length, title: "Menyinkronkan Data Barang Masuk" });

    for (let i = 0; i < itemsToSave.length; i++) {
      const item = itemsToSave[i];
      const cleanName = item.rawName.trim();
      let matched: Product | undefined = undefined;

      if (item.overrideProductId === "new") {
        // Explicitly forced to create new
      } else if (item.overrideProductId) {
        matched = products.find((p) => p.id === item.overrideProductId);
      } else {
        matched = findAutoMatch(cleanName, products);
      }

      let prodId = "";
      let prodKode = "";
      let prodNama = "";
      let prodSupplier = "";

      if (matched) {
        prodId = matched.id!;
        prodKode = matched.kodeBarang;
        prodNama = matched.namaBarang;
        prodSupplier = matched.supplier || "";

        // If custom details are provided, update the product on-the-fly!
        if (item.customProductDetails) {
          const updatedProduct: Product = {
            ...matched,
            kodeBarang:
              item.customProductDetails.kodeBarang || matched.kodeBarang,
            namaBarang:
              item.customProductDetails.namaBarang || matched.namaBarang,
            supplier:
              item.customProductDetails.supplier !== undefined
                ? item.customProductDetails.supplier
                : matched.supplier || "",
            hargaBeli:
              item.customProductDetails.hargaBeli !== undefined
                ? Number(item.customProductDetails.hargaBeli)
                : matched.hargaBeli || 0,
            hargaJual:
              item.customProductDetails.hargaJual !== undefined
                ? Number(item.customProductDetails.hargaJual)
                : matched.hargaJual || 0,
            color:
              item.customProductDetails.color !== undefined
                ? item.customProductDetails.color
                : matched.color || "",
            bc:
              item.customProductDetails.bc !== undefined
                ? item.customProductDetails.bc
                : matched.bc || "",
            kadarAir:
              item.customProductDetails.kadarAir !== undefined
                ? item.customProductDetails.kadarAir
                : matched.kadarAir || "",
          };
          await upsertProduct(updatedProduct);
          prodKode = updatedProduct.kodeBarang;
          prodNama = updatedProduct.namaBarang;
          prodSupplier = updatedProduct.supplier || "";
        }
      } else {
        try {
          const finalKode = item.customProductDetails?.kodeBarang || cleanName;
          const finalNama = item.customProductDetails?.namaBarang || cleanName;
          const generatedId = await upsertProduct({
            kodeBarang: finalKode,
            namaBarang: finalNama,
            supplier: item.customProductDetails?.supplier || "",
            hargaBeli: Number(item.customProductDetails?.hargaBeli || 0),
            hargaJual: Number(item.customProductDetails?.hargaJual || 0),
            stokAwal: 0,
            color: item.customProductDetails?.color || "",
            bc: item.customProductDetails?.bc || "",
            kadarAir: item.customProductDetails?.kadarAir || "",
          });
          prodId = generatedId;
          prodKode = finalKode;
          prodNama = finalNama;
          prodSupplier = item.customProductDetails?.supplier || "";
        } catch (err) {
          console.error("Gagal membuat produk otomatis:", cleanName, err);
          setSavingProgress({ current: i + 1, total: itemsToSave.length, title: "Menyinkronkan Data Barang Masuk" });
          continue;
        }
      }

      try {
        await addIncomingGood({
          productId: prodId,
          kodeBarang: prodKode,
          namaBarang: prodNama,
          qty: item.qty,
          tanggal: null,
          supplier: prodSupplier,
        });
        successCount++;
      } catch (e) {
        console.error("Error adding incoming good", e);
      }
      setSavingProgress({ current: i + 1, total: itemsToSave.length, title: "Menyinkronkan Data Barang Masuk" });
    }

    setSavingProgress(null);
    alert(`Berhasil menyinkronkan ${successCount} data barang masuk!`);
    setIsIncomingTextModalOpen(false);
    setRawText("");
    setParsedItems([]);
  };

  const handleParsedItemNameChange = (index: number, val: string) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], rawName: val };
      return copy;
    });
  };

  const handleParsedItemQtyChange = (index: number, val: number) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], qty: val };
      return copy;
    });
  };

  const handleParsedItemOverrideChange = (index: number, val: string) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], overrideProductId: val };
      return copy;
    });
  };

  const handleParsedItemToggleEditMapping = (index: number) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        isEditingMapping: !copy[index].isEditingMapping,
      };
      return copy;
    });
  };

  const handleParsedItemToggleEditDetails = (index: number) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const isOpening = !item.isEditingProductDetails;

      let customProductDetails = item.customProductDetails;
      if (isOpening && !customProductDetails) {
        const cleanName = item.rawName.trim();
        let matched: Product | undefined = undefined;
        if (item.overrideProductId === "new") {
          // New
        } else if (item.overrideProductId) {
          matched = products.find((p) => p.id === item.overrideProductId);
        } else {
          matched = findAutoMatch(cleanName, products);
        }

        customProductDetails = {
          kodeBarang: matched ? matched.kodeBarang : cleanName,
          namaBarang: matched ? matched.namaBarang : cleanName,
          supplier: matched ? matched.supplier || "" : "",
          hargaBeli: matched ? matched.hargaBeli || 0 : 0,
          hargaJual: matched ? matched.hargaJual || 0 : 0,
          color: matched ? matched.color || "" : "",
          bc: matched ? matched.bc || "" : "",
          kadarAir: matched ? matched.kadarAir || "" : "",
        };
      }

      copy[index] = {
        ...item,
        isEditingProductDetails: isOpening,
        customProductDetails,
      };
      return copy;
    });
  };

  const handleCustomProductDetailsChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (item.customProductDetails) {
        copy[index] = {
          ...item,
          customProductDetails: {
            ...item.customProductDetails,
            [field]: value,
          },
        };
      }
      return copy;
    });
  };

  const handleParsedItemDelete = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };


  if (!isOpen) return null;
  return (
    <>
          {isIncomingTextModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-4xl shadow-[16px_16px_0px_0px_#0f172a] my-auto flex flex-col max-h-[90vh]">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50 shrink-0">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowDown className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    Tambah Barang Masuk via Teks
                  </h3>
                  <button
                    onClick={() => {
                      setIsIncomingTextModalOpen(false);
                      setRawText("");
                      setParsedItems([]);
                    }}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                  {/* Format Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">
                        Pilih Format Paste Teks
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                        className={`px-3 py-1.5 border-2 border-slate-900 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none flex items-center gap-1.5 ${isConfigPanelOpen ? 'bg-amber-300 text-slate-900' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
                      >
                        ⚙️ {isConfigPanelOpen ? "Sembunyikan Aturan" : "Atur Aturan Double Qty"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                      {[
                        {
                          id: "akumaucantik",
                          name: "akumaucantik",
                          desc: "1psg Maki Gray",
                        },
                        { id: "anna", name: "anna", desc: "NORMAL/MINUS Anna" },
                        {
                          id: "shopee",
                          name: "shopee",
                          desc: "Format Invoice Shopee",
                        },
                        {
                          id: "sisse",
                          name: "sisse",
                          desc: "NORMAL/MINUS Sisse",
                        },
                        {
                          id: "kim",
                          name: "kim",
                          desc: "KIM TRAPZ \n1 X Rp...",
                        },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setSelectedFormat(fmt.id as any)}
                          className={`p-3 text-left border-2 border-slate-900 font-bold transition-all shadow-[2px_2px_0px_0px_#0f172a] active:shadow-none ${selectedFormat === fmt.id ? "bg-emerald-100" : "bg-white hover:bg-slate-50"}`}
                        >
                          <div className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
                            {fmt.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                            {fmt.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Supplier Dynamic Double Qty Configurations */}
                  {isConfigPanelOpen && (
                    <div className="p-5 bg-amber-50/70 border-4 border-dashed border-slate-900 space-y-5 rounded-none animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900 pb-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                            ⚙️ Konfigurasi Aturan Tiap Supplier
                          </h4>
                          <p className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">
                            Anda bisa menambah, menghapus, atau mengubah opsi kata kunci & satuan secara dinamis.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin meriset aturan seluruh supplier ke default awal?")) {
                              setSupplierConfigs(DEFAULT_SUPPLIER_CONFIGS);
                            }
                          }}
                          className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-rose-900 text-[10px] font-black uppercase tracking-wider transition-all self-start sm:self-auto"
                        >
                          Reset ke Default
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. AKUMAUCANTIK */}
                        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-900 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                              Supplier: akumaucantik
                            </span>
                          </div>
                          
                          {/* Keywords */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Kata Kunci Lensa (Double Qty)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {supplierConfigs.akumaucantik.doubleKeywords.map((kw, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                                  {kw}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...supplierConfigs.akumaucantik.doubleKeywords];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        akumaucantik: { ...supplierConfigs.akumaucantik, doubleKeywords: next }
                                      });
                                    }}
                                    className="text-rose-400 hover:text-rose-600 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {supplierConfigs.akumaucantik.doubleKeywords.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada kata kunci</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-kw-akumaucantik"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !supplierConfigs.akumaucantik.doubleKeywords.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        akumaucantik: {
                                          ...supplierConfigs.akumaucantik,
                                          doubleKeywords: [...supplierConfigs.akumaucantik.doubleKeywords, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-kw-akumaucantik') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !supplierConfigs.akumaucantik.doubleKeywords.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      akumaucantik: {
                                        ...supplierConfigs.akumaucantik,
                                        doubleKeywords: [...supplierConfigs.akumaucantik.doubleKeywords, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>

                          {/* Units */}
                          <div className="space-y-1.5 pt-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Satuan Yang Di-double (e.g. pasang, psg)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {supplierConfigs.akumaucantik.doubleUnits.map((unit, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase">
                                  {unit}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...supplierConfigs.akumaucantik.doubleUnits];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        akumaucantik: { ...supplierConfigs.akumaucantik, doubleUnits: next }
                                      });
                                    }}
                                    className="text-white hover:text-rose-200 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {supplierConfigs.akumaucantik.doubleUnits.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada satuan</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-unit-akumaucantik"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !supplierConfigs.akumaucantik.doubleUnits.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        akumaucantik: {
                                          ...supplierConfigs.akumaucantik,
                                          doubleUnits: [...supplierConfigs.akumaucantik.doubleUnits, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-unit-akumaucantik') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !supplierConfigs.akumaucantik.doubleUnits.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      akumaucantik: {
                                        ...supplierConfigs.akumaucantik,
                                        doubleUnits: [...supplierConfigs.akumaucantik.doubleUnits, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 2. ANA */}
                        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                            <span className="px-2 py-0.5 bg-blue-100 border border-blue-900 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                              Supplier: anna (ANA)
                            </span>
                          </div>
                          
                          {/* Units */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Satuan Yang Di-double (e.g. pasang, psg)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {supplierConfigs.anna.doubleUnits.map((unit, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase">
                                  {unit}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...supplierConfigs.anna.doubleUnits];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        anna: { ...supplierConfigs.anna, doubleUnits: next }
                                      });
                                    }}
                                    className="text-white hover:text-rose-200 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {supplierConfigs.anna.doubleUnits.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada satuan</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-unit-anna"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !supplierConfigs.anna.doubleUnits.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        anna: {
                                          ...supplierConfigs.anna,
                                          doubleUnits: [...supplierConfigs.anna.doubleUnits, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-unit-anna') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !supplierConfigs.anna.doubleUnits.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      anna: {
                                        ...supplierConfigs.anna,
                                        doubleUnits: [...supplierConfigs.anna.doubleUnits, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 3. SHOPEE */}
                        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                            <span className="px-2 py-0.5 bg-orange-100 border border-orange-900 text-orange-900 text-[10px] font-black uppercase tracking-wider">
                              Format: Shopee
                            </span>
                          </div>
                          
                          {/* Keywords */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Produk Khusus (Double Qty)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {supplierConfigs.shopee.doubleKeywords.map((kw, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                                  {kw}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...supplierConfigs.shopee.doubleKeywords];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        shopee: { ...supplierConfigs.shopee, doubleKeywords: next }
                                      });
                                    }}
                                    className="text-rose-400 hover:text-rose-600 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {supplierConfigs.shopee.doubleKeywords.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada produk</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-kw-shopee"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !supplierConfigs.shopee.doubleKeywords.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        shopee: {
                                          ...supplierConfigs.shopee,
                                          doubleKeywords: [...supplierConfigs.shopee.doubleKeywords, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-kw-shopee') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !supplierConfigs.shopee.doubleKeywords.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      shopee: {
                                        ...supplierConfigs.shopee,
                                        doubleKeywords: [...supplierConfigs.shopee.doubleKeywords, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>

                          {/* Unwanted Words */}
                          <div className="space-y-1.5 pt-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Kata Yang Dihapus Dari Teks (Unwanted Words)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[50px] bg-slate-50 max-h-[120px] overflow-y-auto">
                              {(supplierConfigs.shopee.unwantedWords || []).map((word, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold">
                                  {word}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...(supplierConfigs.shopee.unwantedWords || [])];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        shopee: { ...supplierConfigs.shopee, unwantedWords: next }
                                      });
                                    }}
                                    className="text-white hover:text-rose-200 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {(supplierConfigs.shopee.unwantedWords || []).length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada kata terdaftar</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-word-shopee"
                                type="text"
                                placeholder="Contoh: ( ½ Pasang )"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !(supplierConfigs.shopee.unwantedWords || []).includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        shopee: {
                                          ...supplierConfigs.shopee,
                                          unwantedWords: [...(supplierConfigs.shopee.unwantedWords || []), val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-word-shopee') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !(supplierConfigs.shopee.unwantedWords || []).includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      shopee: {
                                        ...supplierConfigs.shopee,
                                        unwantedWords: [...(supplierConfigs.shopee.unwantedWords || []), val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 4. KIM */}
                        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                            <span className="px-2 py-0.5 bg-purple-100 border border-purple-900 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                              Supplier: KIM
                            </span>
                          </div>
                          
                          {/* Keywords */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Kata Kunci Lensa (Double Qty)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {supplierConfigs.kim.doubleKeywords.map((kw, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                                  {kw}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...supplierConfigs.kim.doubleKeywords];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        kim: { ...supplierConfigs.kim, doubleKeywords: next }
                                      });
                                    }}
                                    className="text-rose-400 hover:text-rose-600 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {supplierConfigs.kim.doubleKeywords.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada kata kunci</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-kw-kim"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !supplierConfigs.kim.doubleKeywords.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        kim: {
                                          ...supplierConfigs.kim,
                                          doubleKeywords: [...supplierConfigs.kim.doubleKeywords, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-kw-kim') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  if (val && !supplierConfigs.kim.doubleKeywords.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      kim: {
                                        ...supplierConfigs.kim,
                                        doubleKeywords: [...supplierConfigs.kim.doubleKeywords, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 5. SISSE */}
                        <div className="p-4 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                            <span className="px-2 py-0.5 bg-rose-100 border border-rose-900 text-rose-900 text-[10px] font-black uppercase tracking-wider">
                              Supplier: Sisse
                            </span>
                          </div>

                          {/* Units */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Satuan Yang Di-double (e.g. pasang, psg)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {(supplierConfigs.sisse.doubleUnits || []).map((unit, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold uppercase">
                                  {unit}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...(supplierConfigs.sisse.doubleUnits || [])];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        sisse: { ...supplierConfigs.sisse, doubleUnits: next }
                                      });
                                    }}
                                    className="text-white hover:text-rose-200 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {(!supplierConfigs.sisse.doubleUnits || supplierConfigs.sisse.doubleUnits.length === 0) && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada satuan</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-unit-sisse"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    const curr = supplierConfigs.sisse.doubleUnits || [];
                                    if (val && !curr.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        sisse: {
                                          ...supplierConfigs.sisse,
                                          doubleUnits: [...curr, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-unit-sisse') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  const curr = supplierConfigs.sisse.doubleUnits || [];
                                  if (val && !curr.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      sisse: {
                                        ...supplierConfigs.sisse,
                                        doubleUnits: [...curr, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                          
                          {/* Keywords */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none">
                              Kata Kunci Lensa (Double Qty)
                            </label>
                            <div className="flex flex-wrap gap-1 border-2 border-slate-200 p-2 min-h-[40px] bg-slate-50">
                              {(supplierConfigs.sisse.doubleKeywords || []).map((kw, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                                  {kw}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...(supplierConfigs.sisse.doubleKeywords || [])];
                                      next.splice(idx, 1);
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        sisse: { ...supplierConfigs.sisse, doubleKeywords: next }
                                      });
                                    }}
                                    className="text-rose-400 hover:text-rose-600 font-black ml-1 text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              {(!supplierConfigs.sisse.doubleKeywords || supplierConfigs.sisse.doubleKeywords.length === 0) && (
                                <span className="text-[10px] text-slate-400 italic">Belum ada kata kunci</span>
                              )}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                id="add-kw-sisse"
                                type="text"
                                placeholder="Ketik lalu tekan Tambah"
                                className="flex-1 px-2 py-1 border-2 border-slate-900 text-xs font-bold focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    const curr = supplierConfigs.sisse.doubleKeywords || [];
                                    if (val && !curr.includes(val)) {
                                      setSupplierConfigs({
                                        ...supplierConfigs,
                                        sisse: {
                                          ...supplierConfigs.sisse,
                                          doubleKeywords: [...curr, val]
                                        }
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('add-kw-sisse') as HTMLInputElement;
                                  const val = input?.value.trim();
                                  const curr = supplierConfigs.sisse.doubleKeywords || [];
                                  if (val && !curr.includes(val)) {
                                    setSupplierConfigs({
                                      ...supplierConfigs,
                                      sisse: {
                                        ...supplierConfigs.sisse,
                                        doubleKeywords: [...curr, val]
                                      }
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw Text Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">
                      Paste Daftar Teks Di Sini
                    </label>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={
                        selectedFormat === "akumaucantik"
                          ? "Contoh:\n2 psg maki\n1 psg matake\n❌ 1 psg emma (ini diskip karena silang)"
                          : selectedFormat === "kim"
                            ? "Contoh:\nKIM TRAPZ GRAY\n1 X Rp50000\nITEM LAIN\n-2"
                            : selectedFormat === "shopee"
                              ? "Contoh:\nMSBS Softlens Maki\nVariasi: Gray -1.00\nx1\nRp45.000"
                              : selectedFormat === "sisse"
                                ? "Contoh:\n1psg Softlens JISSEO Idol Desire Ocean Blue -3.50\n5psg Softlens JISSEO Idol Desire Amber Gray -0.00\n3psg Softlens JISSEO Idol Desire Euro Gray -0.00\nNORMAL sisse gray 10 Rp50000\nMINUS sisse blue 350 5 Rp60000"
                                : "Contoh:\nNORMAL anna black 10 Rp50000\nMINUS anna gray 150 5 Rp60000"
                      }
                      rows={6}
                      className="w-full p-4 border-2 border-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessText}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all flex items-center gap-1.5"
                      >
                        Proses Teks & Deteksi{" "}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Parsed Items List */}
                  {parsedItems.length > 0 && (
                    <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest">
                          Hasil Deteksi ({parsedItems.length} Baris)
                        </label>
                        <span className="text-[10px] text-slate-500 font-bold">
                          Tekan tombol sinkronisasi untuk menyimpan seluruh
                          daftar
                        </span>
                      </div>

                      <div className="border-2 border-slate-900 overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left whitespace-nowrap text-xs">
                            <thead className="bg-slate-900 text-white font-black sticky top-0 z-10 uppercase tracking-widest text-[9px]">
                              <tr>
                                <th className="px-4 py-3">
                                  Nama Barang (Hasil Deteksi)
                                </th>
                                <th className="px-4 py-3 text-center w-24">
                                  Qty
                                </th>
                                <th className="px-4 py-3">
                                  Status Pemetaan Katalog
                                </th>
                                <th className="px-4 py-3 text-center w-24">
                                  Aksi
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {parsedItems.map((item, idx) => {
                                const matched = findAutoMatch(
                                  item.rawName,
                                  products,
                                );
                                return (
                                  <React.Fragment key={idx}>
                                    <tr className="hover:bg-slate-50">
                                      <td className="px-4 py-2.5">
                                        <input
                                          type="text"
                                          value={item.rawName}
                                          onChange={(e) =>
                                            handleParsedItemNameChange(
                                              idx,
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-2.5 py-1.5 border-2 border-slate-900 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                        />
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          min="1"
                                          value={item.qty}
                                          onChange={(e) =>
                                            handleParsedItemQtyChange(
                                              idx,
                                              Number(e.target.value),
                                            )
                                          }
                                          className="w-16 px-1.5 py-1 text-center font-mono border-2 border-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                        />
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {item.isEditingMapping ? (
                                          <div className="flex items-center gap-1.5 w-[320px]">
                                            <div className="flex-1 min-w-0">
                                              <SearchableProductSelect
                                                products={products}
                                                value={item.overrideProductId || ""}
                                                onChange={(val) =>
                                                  handleParsedItemOverrideChange(idx, val)
                                                }
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleParsedItemToggleEditMapping(
                                                  idx,
                                                )
                                              }
                                              className="px-2.5 py-1.5 text-xs font-black bg-slate-900 text-white border border-slate-900 transition-all active:translate-y-[1px] shrink-0"
                                            >
                                              Selesai
                                            </button>
                                          </div>
                                        ) : (
                                          <div>
                                            {item.overrideProductId ===
                                            "new" ? (
                                              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-sm uppercase tracking-wider">
                                                🆕 Paksa Buat Baru di Katalog
                                              </span>
                                            ) : item.overrideProductId ? (
                                              (() => {
                                                const ovrP = products.find(
                                                  (p) =>
                                                    p.id ===
                                                    item.overrideProductId,
                                                );
                                                return (
                                                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1.5 rounded-sm uppercase tracking-wider">
                                                    ✅ Pemetaan Manual:{" "}
                                                    {ovrP
                                                      ? ovrP.kodeBarang
                                                      : item.overrideProductId}
                                                  </span>
                                                );
                                              })()
                                            ) : matched ? (
                                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-sm uppercase tracking-wider">
                                                ✅ Terpetakan ke:{" "}
                                                {matched.kodeBarang}
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-sm uppercase tracking-wider animate-pulse">
                                                ✨ Akan dibuat baru di katalog
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 text-center flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleParsedItemToggleEditMapping(
                                              idx,
                                            )
                                          }
                                          className={`p-1 px-2 border-2 ${item.isEditingMapping ? "bg-amber-100 border-slate-900 text-slate-900" : "border-transparent hover:border-slate-900 hover:bg-slate-100 text-indigo-600"}`}
                                          title="Ubah Pemetaan Katalog"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleParsedItemToggleEditDetails(
                                              idx,
                                            )
                                          }
                                          className={`p-1 px-2 border-2 ${item.isEditingProductDetails ? "bg-emerald-100 border-slate-900 text-slate-900" : "border-transparent hover:border-slate-900 hover:bg-slate-100 text-emerald-600"}`}
                                          title="Edit Detail Barang (Katalog)"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleParsedItemDelete(idx)
                                          }
                                          className="p-1 px-2 border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 text-rose-600"
                                          title="Hapus baris ini"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                    {item.isEditingProductDetails &&
                                      item.customProductDetails && (
                                        <tr className="bg-slate-50">
                                          <td
                                            colSpan={4}
                                            className="px-6 py-4 border-l-4 border-l-emerald-500 border-b-2 border-slate-900"
                                          >
                                            <div className="space-y-3 whitespace-normal">
                                              <div className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                                                <Settings className="w-3.5 h-3.5" />{" "}
                                                Konfigurasi Detail Katalog untuk
                                                "{item.rawName}"
                                              </div>
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Kode Barang
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .kodeBarang || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "kodeBarang",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Nama Barang
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .namaBarang || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "namaBarang",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Supplier
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .supplier || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "supplier",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Harga Beli
                                                  </label>
                                                  <input
                                                    type="number"
                                                    value={
                                                      item.customProductDetails
                                                        .hargaBeli || 0
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "hargaBeli",
                                                        Number(e.target.value),
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-mono font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Harga Jual
                                                  </label>
                                                  <input
                                                    type="number"
                                                    value={
                                                      item.customProductDetails
                                                        .hargaJual || 0
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "hargaJual",
                                                        Number(e.target.value),
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-mono font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Warna
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .color || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "color",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    BC
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .bc || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "bc",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-black uppercase text-slate-500">
                                                    Kadar Air
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={
                                                      item.customProductDetails
                                                        .kadarAir || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomProductDetailsChange(
                                                        idx,
                                                        "kadarAir",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs font-bold border-2 border-slate-900 bg-white text-slate-800 focus:outline-none"
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex justify-end pt-1">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleParsedItemToggleEditDetails(
                                                      idx,
                                                    )
                                                  }
                                                  className="px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                                                >
                                                  Selesai Mengisi
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t-4 border-slate-900 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                  <div className="text-xs text-slate-500 font-bold">
                    {parsedItems.length > 0 &&
                      (() => {
                        const total = parsedItems.length;
                        const mappedCount = parsedItems.filter(
                          (i) =>
                            (i.overrideProductId &&
                              i.overrideProductId !== "new") ||
                            (!i.overrideProductId &&
                              findAutoMatch(i.rawName, products)),
                        ).length;
                        const newCount = total - mappedCount;
                        return (
                          <p>
                            Terdeteksi{" "}
                            <span className="font-black text-slate-900">
                              {total}
                            </span>{" "}
                            baris.{" "}
                            <span className="font-black text-emerald-600">
                              {mappedCount}
                            </span>{" "}
                            terpetakan ke katalog,{" "}
                            <span className="font-black text-indigo-600">
                              {newCount}
                            </span>{" "}
                            akan dibuat baru.
                          </p>
                        );
                      })()}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsIncomingTextModalOpen(false);
                        setRawText("");
                        setParsedItems([]);
                      }}
                      className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBulkIncoming}
                      disabled={parsedItems.length === 0}
                      className={`px-8 py-3 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all ${parsedItems.length === 0 ? "bg-slate-400 cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-700"}`}
                    >
                      SINKRONISASI DATA MASUK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </>
  );
}