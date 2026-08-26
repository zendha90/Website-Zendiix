import React, { useState, useEffect } from "react";
import { Download, Copy, Check, Plus, Trash2, Settings, Sparkles, X, ChevronDown, ChevronUp, AlertTriangle, RefreshCcw, Search, Package, Pencil } from "lucide-react";
import { Product } from "../../services";
import { SupplierExportConfig, ExportPreset, ExportRule, DEFAULT_SUPPLIER_EXPORT_CONFIGS, DROPSHIP_SUPPLIERS } from "../../utils/supplierConfigs";

export interface SupplierExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  productStats: { incoming: Map<string, number>; sales: Map<string, number> };
}

export function SupplierExportModal({
  isOpen,
  onClose,
  products,
  productStats,
}: SupplierExportModalProps) {


  const isSupplierExportModalOpen = isOpen;
  const setIsSupplierExportModalOpen = (val: boolean) => { if (!val) onClose(); };
  const [selectedSupplierForExport, setSelectedSupplierForExport] = useState("S-KIM");
  const [supplierExportToast, setSupplierExportToast] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "preset">("preset");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const saved = localStorage.getItem("selectedPresetId");
    if (saved === "preset-kim-combined") {
      return "preset-all-dropship";
    }
    return saved || "preset-all-dropship";
  });
  const [presetActiveSupplierEdit, setPresetActiveSupplierEdit] = useState<string>("S-KIM");
  const [separatorType, setSeparatorType] = useState<"tab" | "space">("tab");
  const [exportPresets, setExportPresets] = useState<ExportPreset[]>(() => {
    const saved = localStorage.getItem("supplierExportPresets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExportPreset[];
        const filtered = parsed.filter(p => p.id !== "preset-kim-combined" && !p.selectedSuppliers.includes("KIM"));
        if (filtered.length > 0) {
          return filtered;
        }
      } catch (e) {
        console.error("Error parsing supplierExportPresets", e);
      }
    }
    return [
      {
        id: "preset-all-dropship",
        name: "Semua Dropship",
        selectedSuppliers: ["S-KIM", "S-akumaucantik", "S-LINA"],
        supplierConfigs: JSON.parse(JSON.stringify(DEFAULT_SUPPLIER_EXPORT_CONFIGS.filter(c => ["S-KIM", "S-akumaucantik", "S-LINA"].includes(c.supplier))))
      }
    ];
  });

  const [activePresetAction, setActivePresetAction] = useState<null | "create" | "rename" | "delete">(null);
  const [presetActionValue, setPresetActionValue] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("supplierExportPresets", JSON.stringify(exportPresets));
  }, [exportPresets]);

  useEffect(() => {
    localStorage.setItem("selectedPresetId", selectedPresetId);
  }, [selectedPresetId]);

  const [supplierExportConfigs, setSupplierExportConfigs] = useState<SupplierExportConfig[]>(() => {
    const saved = localStorage.getItem("supplierExportConfigs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SupplierExportConfig[];
        // Merge defaults to ensure any missing default rules are populated
        const merged = DEFAULT_SUPPLIER_EXPORT_CONFIGS.map(def => {
          const userSup = parsed.find(p => p.supplier.trim().toLowerCase() === def.supplier.trim().toLowerCase());
          if (userSup) {
            const mergedRules = [...userSup.rules];
            def.rules.forEach(defRule => {
              const ruleExists = mergedRules.some(r => r.id === defRule.id || r.namePattern.toLowerCase() === defRule.namePattern.toLowerCase());
              if (!ruleExists) {
                mergedRules.push(defRule);
              }
            });
            return {
              ...userSup,
              rules: mergedRules
            };
          }
          return def;
        });

        // Also append any custom suppliers the user created that aren't in defaults
        parsed.forEach(userSup => {
          const inDefaults = DEFAULT_SUPPLIER_EXPORT_CONFIGS.some(def => def.supplier.trim().toLowerCase() === userSup.supplier.trim().toLowerCase());
          if (!inDefaults) {
            merged.push(userSup);
          }
        });
        return merged;
      } catch (e) {
        console.error("Error parsing supplierExportConfigs", e);
      }
    }
    return DEFAULT_SUPPLIER_EXPORT_CONFIGS;
  });

  useEffect(() => {
    localStorage.setItem("supplierExportConfigs", JSON.stringify(supplierExportConfigs));
  }, [supplierExportConfigs]);

  const getActiveConfig = (supplierName: string): SupplierExportConfig => {
    const existing = supplierExportConfigs.find(
      c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()
    );
    if (existing) return existing;
    return {
      supplier: supplierName,
      formatTemplate: "qty-unit-tab-code",
      rules: [
        {
          id: `${supplierName}-default`,
          namePattern: "Default",
          isDefault: true,
          unit: "pasang",
          minusStockQtyType: "fixed",
          minusStockFixedQty: 1,
          minusStockFormulaTarget: 4,
          stockZeroQty: 1,
          stockOneQty: 0,
          stockTwoQty: 0,
        }
      ]
    };
  };

  const updateTemplate = (supplierName: string, template: any) => {
    setSupplierExportConfigs(prev => {
      const existing = prev.find(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
      if (existing) {
        return prev.map(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase() ? { ...c, formatTemplate: template } : c);
      } else {
        return [...prev, {
          supplier: supplierName,
          formatTemplate: template,
          rules: [
            {
              id: `${supplierName}-default`,
              namePattern: "Default",
              isDefault: true,
              unit: "pasang",
              minusStockQtyType: "fixed",
              minusStockFixedQty: 1,
              minusStockFormulaTarget: 4,
              stockZeroQty: 1,
              stockOneQty: 0,
              stockTwoQty: 0,
            }
          ]
        }];
      }
    });
  };

  const updateRuleField = (supplierName: string, ruleId: string, field: keyof ExportRule, value: any) => {
    setSupplierExportConfigs(prev => {
      const existing = prev.find(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
      if (existing) {
        return prev.map(c => {
          if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
            return {
              ...c,
              rules: c.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r)
            };
          }
          return c;
        });
      } else {
        const defaultConfig = getActiveConfig(supplierName);
        const updatedRules = defaultConfig.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r);
        return [...prev, { ...defaultConfig, rules: updatedRules }];
      }
    });
  };

  const addCustomRule = (supplierName: string) => {
    const newRule: ExportRule = {
      id: `rule-${Math.random().toString(36).substring(2, 9)}`,
      namePattern: "CustomPattern",
      isDefault: false,
      unit: "pasang",
      minusStockQtyType: "fixed",
      minusStockFixedQty: 1,
      minusStockFormulaTarget: 4,
      stockZeroQty: 1,
      stockOneQty: 0,
      stockTwoQty: 0,
    };
    
    setSupplierExportConfigs(prev => {
      const existing = prev.find(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
      if (existing) {
        return prev.map(c => {
          if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
            return {
              ...c,
              rules: [newRule, ...c.rules]
            };
          }
          return c;
        });
      } else {
        const defaultConfig = getActiveConfig(supplierName);
        return [...prev, {
          ...defaultConfig,
          rules: [newRule, ...defaultConfig.rules]
        }];
      }
    });
  };

  const deleteRule = (supplierName: string, ruleId: string) => {
    setSupplierExportConfigs(prev => {
      return prev.map(c => {
        if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
          return {
            ...c,
            rules: c.rules.filter(r => r.id !== ruleId)
          };
        }
        return c;
      });
    });
  };

  const resetSupplierConfig = (supplierName: string) => {
    const defaultConf = DEFAULT_SUPPLIER_EXPORT_CONFIGS.find(
      c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()
    );
    const fallbackConf = defaultConf || {
      supplier: supplierName,
      formatTemplate: "qty-unit-tab-code" as const,
      rules: [
        {
          id: `${supplierName}-default`,
          namePattern: "Default",
          isDefault: true,
          unit: "pasang",
          minusStockQtyType: "fixed" as const,
          minusStockFixedQty: 1,
          minusStockFormulaTarget: 4,
          stockZeroQty: 1,
          stockOneQty: 0,
          stockTwoQty: 0,
        }
      ]
    };
    setSupplierExportConfigs(prev => {
      const filtered = prev.filter(c => c.supplier.trim().toLowerCase() !== supplierName.trim().toLowerCase());
      return [...filtered, JSON.parse(JSON.stringify(fallbackConf))];
    });
  };

  const getActiveConfigForEdit = (supplierName: string): SupplierExportConfig => {
    if (exportMode === "preset") {
      const activePreset = exportPresets.find(p => p.id === selectedPresetId);
      if (activePreset) {
        const found = activePreset.supplierConfigs.find(
          c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()
        );
        if (found) return found;
      }
    }
    return getActiveConfig(supplierName);
  };

  const updateTemplatePresetOrGlobal = (supplierName: string, template: any) => {
    if (exportMode === "preset") {
      setExportPresets(prev => prev.map(preset => {
        if (preset.id === selectedPresetId) {
          const exists = preset.supplierConfigs.some(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
          let updatedConfigs = [];
          if (exists) {
            updatedConfigs = preset.supplierConfigs.map(c => 
              c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase() 
                ? { ...c, formatTemplate: template } 
                : c
            );
          } else {
            const globalConf = getActiveConfig(supplierName);
            updatedConfigs = [...preset.supplierConfigs, { ...globalConf, formatTemplate: template }];
          }
          return { ...preset, supplierConfigs: updatedConfigs };
        }
        return preset;
      }));
    } else {
      updateTemplate(supplierName, template);
    }
  };

  const updateRuleFieldPresetOrGlobal = (supplierName: string, ruleId: string, field: keyof ExportRule, value: any) => {
    if (exportMode === "preset") {
      setExportPresets(prev => prev.map(preset => {
        if (preset.id === selectedPresetId) {
          const exists = preset.supplierConfigs.some(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
          let updatedConfigs = [];
          if (exists) {
            updatedConfigs = preset.supplierConfigs.map(c => {
              if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
                return {
                  ...c,
                  rules: c.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r)
                };
              }
              return c;
            });
          } else {
            const globalConf = getActiveConfig(supplierName);
            const updatedRules = globalConf.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r);
            updatedConfigs = [...preset.supplierConfigs, { ...globalConf, rules: updatedRules }];
          }
          return { ...preset, supplierConfigs: updatedConfigs };
        }
        return preset;
      }));
    } else {
      updateRuleField(supplierName, ruleId, field, value);
    }
  };

  const addCustomRulePresetOrGlobal = (supplierName: string) => {
    const newRule: ExportRule = {
      id: `rule-${Math.random().toString(36).substring(2, 9)}`,
      namePattern: "CustomPattern",
      isDefault: false,
      unit: "pasang",
      minusStockQtyType: "fixed",
      minusStockFixedQty: 1,
      minusStockFormulaTarget: 4,
      stockZeroQty: 1,
      stockOneQty: 0,
      stockTwoQty: 0,
    };

    if (exportMode === "preset") {
      setExportPresets(prev => prev.map(preset => {
        if (preset.id === selectedPresetId) {
          const exists = preset.supplierConfigs.some(c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase());
          let updatedConfigs = [];
          if (exists) {
            updatedConfigs = preset.supplierConfigs.map(c => {
              if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
                return { ...c, rules: [newRule, ...c.rules] };
              }
              return c;
            });
          } else {
            const globalConf = getActiveConfig(supplierName);
            updatedConfigs = [...preset.supplierConfigs, { ...globalConf, rules: [newRule, ...globalConf.rules] }];
          }
          return { ...preset, supplierConfigs: updatedConfigs };
        }
        return preset;
      }));
    } else {
      addCustomRule(supplierName);
    }
  };

  const deleteRulePresetOrGlobal = (supplierName: string, ruleId: string) => {
    if (exportMode === "preset") {
      setExportPresets(prev => prev.map(preset => {
        if (preset.id === selectedPresetId) {
          const updatedConfigs = preset.supplierConfigs.map(c => {
            if (c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()) {
              return { ...c, rules: c.rules.filter(r => r.id !== ruleId) };
            }
            return c;
          });
          return { ...preset, supplierConfigs: updatedConfigs };
        }
        return preset;
      }));
    } else {
      deleteRule(supplierName, ruleId);
    }
  };

  const resetSupplierConfigPresetOrGlobal = (supplierName: string) => {
    const defaultConf = DEFAULT_SUPPLIER_EXPORT_CONFIGS.find(
      c => c.supplier.trim().toLowerCase() === supplierName.trim().toLowerCase()
    );
    const fallbackConf = defaultConf || {
      supplier: supplierName,
      formatTemplate: "qty-unit-tab-code" as const,
      rules: [
        {
          id: `${supplierName}-default`,
          namePattern: "Default",
          isDefault: true,
          unit: "pasang",
          minusStockQtyType: "fixed" as const,
          minusStockFixedQty: 1,
          minusStockFormulaTarget: 4,
          stockZeroQty: 1,
          stockOneQty: 0,
          stockTwoQty: 0,
        }
      ]
    };

    if (exportMode === "preset") {
      setExportPresets(prev => prev.map(preset => {
        if (preset.id === selectedPresetId) {
          const filtered = preset.supplierConfigs.filter(c => c.supplier.trim().toLowerCase() !== supplierName.trim().toLowerCase());
          return {
            ...preset,
            supplierConfigs: [...filtered, JSON.parse(JSON.stringify(fallbackConf))]
          };
        }
        return preset;
      }));
    } else {
      resetSupplierConfig(supplierName);
    }
  };

  const getExportPreviewText = (supplierName: string) => {
    const { incoming, sales: salesMap } = productStats;
    
    let activeSuppliers: string[] = [];
    if (exportMode === "preset") {
      const activePreset = exportPresets.find(p => p.id === selectedPresetId);
      if (activePreset) {
        activeSuppliers = activePreset.selectedSuppliers;
      }
    } else {
      activeSuppliers = [supplierName];
    }
    
    if (activeSuppliers.length === 0) {
      return "";
    }

    const matchedProducts = products.filter(p => {
      if (!p.supplier) return false;
      const psup = p.supplier.trim().toLowerCase();
      return activeSuppliers.some(s => s.trim().toLowerCase() === psup);
    });
    
    // Sort products alphabetically A-Z by code, and then by name
    const sortedProducts = [...matchedProducts].sort((a, b) => {
      const codeA = (a.kodeBarang || "").trim().toUpperCase();
      const codeB = (b.kodeBarang || "").trim().toUpperCase();
      if (codeA !== codeB) {
        return codeA.localeCompare(codeB);
      }
      const nameA = (a.namaBarang || "").trim().toUpperCase();
      const nameB = (b.namaBarang || "").trim().toUpperCase();
      return nameA.localeCompare(nameB);
    });

    const lines = sortedProducts.map(p => {
      const pSupplier = (p.supplier || "").trim();
      
      let config: SupplierExportConfig;
      if (exportMode === "preset") {
        const activePreset = exportPresets.find(pr => pr.id === selectedPresetId);
        const presetSupConf = activePreset?.supplierConfigs.find(
          c => c.supplier.trim().toLowerCase() === pSupplier.toLowerCase()
        );
        config = presetSupConf || getActiveConfig(pSupplier);
      } else {
        config = getActiveConfig(pSupplier);
      }

      const tt = p.id ? (salesMap.get(p.id) || 0) : 0;
      const tm = p.id ? (incoming.get(p.id) || 0) : 0;
      const stokSaatIni = p.stokAwal + tm - tt;
      
      // Match rule
      let matchedRule = config.rules.find(r => {
        if (r.isDefault) return false;
        const pattern = r.namePattern.toLowerCase().trim();
        const pName = (p.namaBarang || "").toLowerCase();
        const pCode = (p.kodeBarang || "").toLowerCase();
        
        if (pattern === "normal") {
          const hasZeroPower = (str: string) => /(?:^|[^1-9])0[.,]00/.test(str);
          return pName.includes("normal") || 
                 hasZeroPower(pName) || 
                 hasZeroPower(pCode) || 
                 pName.includes("plano") || 
                 pName.includes("pln") || 
                 pCode.includes("plano") || 
                 pCode.includes("pln");
        }
        return pName.includes(pattern) || pCode.includes(pattern);
      });
      
      if (!matchedRule) {
        matchedRule = config.rules.find(r => r.isDefault);
      }
      
      let qty = 0;
      if (matchedRule) {
        if (stokSaatIni < 0) {
          if (matchedRule.minusStockQtyType === "formula") {
            qty = Math.max(0, matchedRule.minusStockFormulaTarget - stokSaatIni);
          } else {
            qty = matchedRule.minusStockFixedQty;
          }
        } else if (stokSaatIni === 0) {
          qty = matchedRule.stockZeroQty;
        } else if (stokSaatIni === 1) {
          qty = matchedRule.stockOneQty;
        } else if (stokSaatIni === 2) {
          qty = matchedRule.stockTwoQty;
        } else {
          qty = 0;
        }
      }
      
      if (qty <= 0) return null;
      
      const unitStr = matchedRule?.unit ? ` ${matchedRule.unit}` : "";
      
      const kb = p.kodeBarang || "";
      const isTab = separatorType === "tab";

      switch (config.formatTemplate) {
        case "qty-unit-tab-code": {
          const left = `${qty}${unitStr}`;
          if (isTab) {
            return `${left}\t${kb}`;
          } else {
            return `${left.padEnd(16)}${kb}`;
          }
        }
        case "qty-tab-code": {
          const left = `${qty}`;
          if (isTab) {
            return `${left}\t${kb}`;
          } else {
            return `${left.padEnd(8)}${kb}`;
          }
        }
        case "code-tab-qty": {
          if (isTab) {
            return `${kb}\t${qty}`;
          } else {
            return `${kb.padEnd(40)}${qty}`;
          }
        }
        case "code-tab-qty-unit": {
          if (isTab) {
            return `${kb}\t${qty}${unitStr}`;
          } else {
            return `${kb.padEnd(40)}${qty}${unitStr}`;
          }
        }
        case "code-x-qty": {
          if (isTab) {
            return `${kb}\tx${qty}`;
          } else {
            return `${kb.padEnd(40)}x${qty}`;
          }
        }
        default: {
          const left = `${qty}${unitStr}`;
          if (isTab) {
            return `${left}\t${kb}`;
          } else {
            return `${left.padEnd(16)}${kb}`;
          }
        }
      }
    }).filter(Boolean);
    
    return lines.join("\n");
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

  if (!isOpen) return null;
  return (
(() => {
            const uniqueProductSuppliers = Array.from(new Set(products.map((p) => p.supplier).filter(Boolean))) as string[];
            const suppliersList = Array.from(new Set([...DROPSHIP_SUPPLIERS, ...uniqueProductSuppliers]))
              .filter(s => s && s.trim().toUpperCase() !== "KIM")
              .sort((a, b) => a.localeCompare(b));
            
            const activePreset = exportPresets.find(p => p.id === selectedPresetId) || exportPresets[0];
            
            const handleCreatePreset = () => {
              setActivePresetAction("create");
              setPresetActionValue("");
            };

            const handleRenamePreset = () => {
              if (!activePreset) return;
              setActivePresetAction("rename");
              setPresetActionValue(activePreset.name);
            };

            const handleDeletePreset = () => {
              if (!activePreset) return;
              setActivePresetAction("delete");
            };

            const submitPresetAction = () => {
              if (activePresetAction === "create") {
                const name = presetActionValue.trim();
                if (!name) return;
                const id = `preset-${Math.random().toString(36).substring(2, 9)}`;
                const newPreset: ExportPreset = {
                  id,
                  name,
                  selectedSuppliers: [],
                  supplierConfigs: []
                };
                setExportPresets(prev => [...prev, newPreset]);
                setSelectedPresetId(id);
              } else if (activePresetAction === "rename") {
                const name = presetActionValue.trim();
                if (!name || !activePreset) return;
                setExportPresets(prev => prev.map(p => p.id === activePreset.id ? { ...p, name } : p));
              } else if (activePresetAction === "delete") {
                if (!activePreset) return;
                const remaining = exportPresets.filter(p => p.id !== activePreset.id);
                setExportPresets(remaining);
                if (remaining.length > 0) {
                  setSelectedPresetId(remaining[0].id);
                } else {
                  const defaults = [
                    {
                      id: "preset-all-dropship",
                      name: "Semua Dropship",
                      selectedSuppliers: ["S-KIM", "S-akumaucantik", "S-LINA"],
                      supplierConfigs: JSON.parse(JSON.stringify(DEFAULT_SUPPLIER_EXPORT_CONFIGS.filter(c => ["S-KIM", "S-akumaucantik", "S-LINA"].includes(c.supplier))))
                    }
                  ];
                  setExportPresets(defaults);
                  setSelectedPresetId("preset-all-dropship");
                }
              }
              setActivePresetAction(null);
              setPresetActionValue("");
            };

            const cancelPresetAction = () => {
              setActivePresetAction(null);
              setPresetActionValue("");
            };

            const handleTogglePresetSupplier = (supplierName: string) => {
              setExportPresets(prev => prev.map(p => {
                if (p.id === selectedPresetId) {
                  const exists = p.selectedSuppliers.includes(supplierName);
                  let newSeps = [];
                  if (exists) {
                    newSeps = p.selectedSuppliers.filter(s => s !== supplierName);
                  } else {
                    newSeps = [...p.selectedSuppliers, supplierName];
                  }
                  return { ...p, selectedSuppliers: newSeps };
                }
                return p;
              }));
            };

            const editSupplier = exportMode === "preset"
              ? (activePreset?.selectedSuppliers.includes(presetActiveSupplierEdit)
                  ? presetActiveSupplierEdit
                  : (activePreset?.selectedSuppliers[0] || ""))
              : selectedSupplierForExport;

            const activeConfig = getActiveConfigForEdit(editSupplier);
            const previewText = getExportPreviewText(selectedSupplierForExport);

            let totalMatchedProducts = 0;
            if (exportMode === "preset") {
              const activeSuppliers = activePreset ? activePreset.selectedSuppliers : [];
              totalMatchedProducts = products.filter(p => p.supplier && activeSuppliers.some(s => s.trim().toLowerCase() === p.supplier?.trim().toLowerCase())).length;
            } else {
              totalMatchedProducts = products.filter(p => p.supplier?.trim().toLowerCase() === selectedSupplierForExport.trim().toLowerCase()).length;
            }

            return (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
                <div className="bg-white border-4 border-slate-900 w-full max-w-5xl p-6 md:p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-6 relative my-8">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-violet-600 flex items-center gap-2 uppercase tracking-widest">
                        <Sparkles className="w-6 h-6 shrink-0" /> EXPORT STOK BERDASARKAN SUPPLIER
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        Sistem export data stok terformat. Pilih supplier tunggal atau gunakan model preset multi-supplier.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsSupplierExportModalOpen(false)}
                      className="text-slate-500 hover:text-slate-900 font-bold text-lg p-1 border-2 border-transparent hover:border-slate-900"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex border-4 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#000]">
                    <button
                      onClick={() => setExportMode("single")}
                      className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-widest transition-all ${
                        exportMode === "single" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      👤 Supplier Tunggal
                    </button>
                    <button
                      onClick={() => setExportMode("preset")}
                      className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-widest transition-all ${
                        exportMode === "preset" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      🗂️ Model Preset (Multi-Supplier)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel: Configuration */}
                    <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
                      
                      {/* SINGLE SUPPLIER MODE CONTROLS */}
                      {exportMode === "single" && (
                        <div className="p-4 bg-slate-50 border-2 border-slate-900 space-y-2 shadow-[2px_2px_0px_0px_#000]">
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                            Pilih Supplier:
                          </label>
                          <select
                            value={selectedSupplierForExport}
                            onChange={(e) => setSelectedSupplierForExport(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-slate-900 text-xs font-bold uppercase tracking-wide focus:outline-none"
                          >
                            {suppliersList.map(sup => (
                              <option key={sup} value={sup}>{sup}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* PRESET MULTI-SUPPLIER MODE CONTROLS */}
                      {exportMode === "preset" && (
                        <div className="space-y-4">
                          {/* Preset Manager Card */}
                          <div className="p-4 bg-slate-50 border-2 border-slate-900 space-y-3 shadow-[2px_2px_0px_0px_#000]">
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                              Pilih Model Preset:
                            </label>
                            
                            {activePresetAction ? (
                              <div className="bg-amber-50 border-2 border-slate-900 p-3 space-y-2.5 shadow-[2px_2px_0px_0px_#000] rounded">
                                {activePresetAction === "delete" ? (
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-rose-700">
                                      Yakin ingin menghapus preset <span className="font-black underline">"{activePreset?.name}"</span>?
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={submitPresetAction}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-[10px] border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                                      >
                                        Ya, Hapus
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelPresetAction}
                                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                      {activePresetAction === "create" ? "Nama Preset Baru:" : "Ubah Nama Preset:"}
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <input
                                        type="text"
                                        value={presetActionValue}
                                        onChange={(e) => setPresetActionValue(e.target.value)}
                                        placeholder="Contoh: Shopee Premium"
                                        className="flex-1 px-2.5 py-1.5 bg-white border-2 border-slate-900 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") submitPresetAction();
                                          if (e.key === "Escape") cancelPresetAction();
                                        }}
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={submitPresetAction}
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelPresetAction}
                                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  value={selectedPresetId}
                                  onChange={(e) => {
                                    const pid = e.target.value;
                                    setSelectedPresetId(pid);
                                    const pr = exportPresets.find(p => p.id === pid);
                                    if (pr && pr.selectedSuppliers.length > 0) {
                                      setPresetActiveSupplierEdit(pr.selectedSuppliers[0]);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-white border-2 border-slate-900 text-xs font-bold uppercase tracking-wide focus:outline-none"
                                >
                                  {exportPresets.map(preset => (
                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                  ))}
                                </select>
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleCreatePreset}
                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
                                    title="Buat Preset Baru"
                                  >
                                    <Plus className="w-4 h-4" /> <span className="sm:hidden lg:inline text-[10px]">Baru</span>
                                  </button>
                                  <button
                                    onClick={handleRenamePreset}
                                    className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
                                    title="Rename Preset"
                                  >
                                    <Pencil className="w-4 h-4" /> <span className="sm:hidden lg:inline text-[10px]">Ubah</span>
                                  </button>
                                  <button
                                    onClick={handleDeletePreset}
                                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
                                    title="Hapus Preset"
                                  >
                                    <Trash2 className="w-4 h-4" /> <span className="sm:hidden lg:inline text-[10px]">Hapus</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Preset Supplier Selector Grid */}
                          <div className="p-4 bg-white border-2 border-slate-900 space-y-2 shadow-[2px_2px_0px_0px_#000]">
                            <div className="flex justify-between items-center">
                              <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                                Aturan Pilih Supplier ({activePreset?.selectedSuppliers.length || 0} dipilih):
                              </span>
                              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                Aturan Custom disimpan per preset
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 max-h-[160px] overflow-y-auto border border-dashed border-slate-200 p-2">
                              {suppliersList.map(sup => {
                                const isChecked = activePreset?.selectedSuppliers.includes(sup);
                                return (
                                  <label 
                                    key={sup} 
                                    className={`flex items-center gap-2 text-xs font-bold p-1.5 border cursor-pointer select-none transition-all ${
                                      isChecked 
                                        ? "bg-violet-50 border-violet-300 text-violet-700" 
                                        : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked || false}
                                      onChange={() => {
                                        handleTogglePresetSupplier(sup);
                                        if (!isChecked) {
                                          setPresetActiveSupplierEdit(sup);
                                        }
                                      }}
                                      className="rounded border-2 border-slate-900 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="truncate">{sup}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Select Supplier to Edit in Preset */}
                          {activePreset && activePreset.selectedSuppliers.length > 0 && (
                            <div className="p-4 bg-violet-50/50 border-2 border-slate-900 space-y-2 shadow-[2px_2px_0px_0px_#000]">
                              <label className="block text-xs font-black text-violet-800 uppercase tracking-wider">
                                ⚙️ Konfigurasi Aturan untuk Supplier di Preset ini:
                              </label>
                              <select
                                value={editSupplier}
                                onChange={(e) => setPresetActiveSupplierEdit(e.target.value)}
                                className="w-full px-3 py-2 bg-white border-2 border-slate-900 text-xs font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                              >
                                {activePreset.selectedSuppliers.map(sup => (
                                  <option key={sup} value={sup}>{sup}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NO FORMAT TEMPLATE SELECTOR (ALWAYS USE DEFAULT) */}
                      {!editSupplier && exportMode === "preset" && (
                        <div className="p-8 text-center border-2 border-dashed border-slate-300 text-slate-400 font-bold text-xs">
                          Belum ada supplier yang dipilih dalam preset ini. Silakan centang 1 atau lebih supplier di atas.
                        </div>
                      )}

                      {/* RULES LIST FOR THE SELECTED SUPPLIER */}
                      {editSupplier && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-2">
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Settings className="w-4 h-4 text-violet-600" /> Aturan Custom ({activeConfig.rules.length})
                              </h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Aturan pencocokan nama & konversi stok {editSupplier}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin me-reset aturan export untuk "${editSupplier}" ke setelan bawaan?`)) {
                                    resetSupplierConfigPresetOrGlobal(editSupplier);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-[9px] border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all flex items-center gap-1"
                                title="Reset aturan ke setelan pabrik default"
                              >
                                <RefreshCcw className="w-3 h-3" /> Reset
                              </button>
                              <button
                                onClick={() => addCustomRulePresetOrGlobal(editSupplier)}
                                className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-[9px] border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Tambah
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {activeConfig.rules.map((rule, idx) => (
                              <div 
                                key={rule.id} 
                                className={`p-4 border-2 border-slate-900 relative transition-all shadow-[4px_4px_0px_0px_#000] ${
                                  rule.isDefault 
                                    ? "bg-amber-50/70 border-amber-900" 
                                    : "bg-white border-slate-900"
                                }`}
                              >
                                {!rule.isDefault && (
                                  <button
                                    onClick={() => deleteRulePresetOrGlobal(editSupplier, rule.id)}
                                    className="absolute right-3 top-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 border border-transparent hover:border-rose-200 rounded transition-all"
                                    title="Hapus Aturan"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}

                                <div className="space-y-4">
                                  {rule.isDefault ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-widest">
                                        <Sparkles className="w-4 h-4 shrink-0 text-amber-600" /> ⭐ Aturan Default Bawaan
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        Digunakan otomatis jika nama barang tidak cocok dengan aturan khusus manapun di bawah.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                        <Settings className="w-3.5 h-3.5" /> Aturan Khusus #{idx}
                                      </div>
                                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                        <Search className="w-3.5 h-3.5 text-slate-400" /> Keyword Pencarian Nama / Kode Barang:
                                      </label>
                                      <input
                                        type="text"
                                        value={rule.namePattern}
                                        onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "namePattern", e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder-slate-300"
                                        placeholder="Contoh: Clear, Plano, Normal, 0,00"
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <Package className="w-3.5 h-3.5 text-slate-400" /> Satuan Barang (Unit):
                                      </label>
                                      <input
                                        type="text"
                                        value={rule.unit}
                                        onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "unit", e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder-slate-300"
                                        placeholder="Contoh: pasang / botol"
                                      />
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Stok Minus (&lt; 0):
                                      </label>
                                      <div className="flex gap-1.5">
                                        <select
                                          value={rule.minusStockQtyType}
                                          onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "minusStockQtyType", e.target.value)}
                                          className="px-2 py-1.5 bg-white border-2 border-slate-900 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all w-1/2 cursor-pointer"
                                        >
                                          <option value="fixed">Jumlah Tetap</option>
                                          <option value="formula">Formula Target</option>
                                        </select>
                                        {rule.minusStockQtyType === "formula" ? (
                                          <input
                                            type="number"
                                            value={rule.minusStockFormulaTarget}
                                            onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "minusStockFormulaTarget", Number(e.target.value))}
                                            className="px-2 py-1.5 bg-white border-2 border-slate-900 text-xs font-mono font-bold w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                                            placeholder="Target"
                                            title="Hasil akhir = Target - Stok Sekarang"
                                          />
                                        ) : (
                                          <input
                                            type="number"
                                            value={rule.minusStockFixedQty}
                                            onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "minusStockFixedQty", Number(e.target.value))}
                                            className="px-2 py-1.5 bg-white border-2 border-slate-900 text-xs font-mono font-bold w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                                            placeholder="Qty"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-3.5 border-t-2 border-dashed border-slate-200">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                      📊 Jml Export Sesuai Stok Sekarang:
                                    </div>
                                    <div className="grid grid-cols-3 gap-2.5">
                                      {/* Stok 0 */}
                                      <div className="bg-rose-50/50 border border-rose-100 p-2 space-y-1">
                                        <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span> Stok = 0
                                        </label>
                                        <input
                                          type="number"
                                          value={rule.stockZeroQty}
                                          onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "stockZeroQty", Number(e.target.value))}
                                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs font-mono font-bold focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-200"
                                        />
                                      </div>

                                      {/* Stok 1 */}
                                      <div className="bg-amber-50/50 border border-amber-100 p-2 space-y-1">
                                        <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span> Stok = 1
                                        </label>
                                        <input
                                          type="number"
                                          value={rule.stockOneQty}
                                          onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "stockOneQty", Number(e.target.value))}
                                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                                        />
                                      </div>

                                      {/* Stok 2 */}
                                      <div className="bg-emerald-50/50 border border-emerald-100 p-2 space-y-1">
                                        <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Stok = 2
                                        </label>
                                        <input
                                          type="number"
                                          value={rule.stockTwoQty}
                                          onChange={(e) => updateRuleFieldPresetOrGlobal(editSupplier, rule.id, "stockTwoQty", Number(e.target.value))}
                                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Live Preview */}
                    <div className="flex flex-col gap-4">
                      {/* Live Preview Header */}
                      <div className="bg-slate-900 text-white p-4 font-black text-xs uppercase tracking-widest flex items-center justify-between shadow-[4px_4px_0px_0px_#475569]">
                        <span>👁️ Live Preview Hasil Export</span>
                        <span className="bg-violet-700 px-2 py-0.5 text-[10px]">
                          {previewText ? previewText.split("\n").filter(Boolean).length : 0} / {totalMatchedProducts} Barang
                        </span>
                      </div>

                      {/* Align Columns Setting Selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 border-2 border-slate-900 p-3 shadow-[2px_2px_0px_0px_#000] gap-2">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-slate-500" /> Pemisah Kolom (Separator):
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setSeparatorType("tab")}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-slate-900 transition-all ${
                              separatorType === "tab" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            title="Format Tabulasi. Sangat cocok dan bersih saat di-paste langsung ke Microsoft Excel atau Google Sheets (tanpa spasi berlebih)."
                          >
                            Tab (\t) - Excel / Sheets
                          </button>
                          <button
                            onClick={() => setSeparatorType("space")}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-slate-900 transition-all ${
                              separatorType === "space" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            title="Format Spasi Rata Kiri. Membuat tampilan kolom sejajar dan rapi saat dibagikan ke WhatsApp, chat, atau catatan teks."
                          >
                            Spasi Rata - Chat WA
                          </button>
                        </div>
                      </div>
                      
                      {/* Export Text Block */}
                      <div className="flex-1 min-h-[250px] relative bg-slate-50 border-2 border-slate-900 p-4 font-mono text-xs text-slate-800 whitespace-pre leading-relaxed max-h-[40vh] overflow-y-auto select-all shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)]">
                        {previewText || (
                          <div className="text-slate-400 space-y-2 font-bold py-8 text-center uppercase">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p>Tidak ada data produk yang diexport.</p>
                            <p className="text-[10px] normal-case text-slate-500">
                              {exportMode === "preset" 
                                ? "Pastikan Anda telah mencentang supplier di atas dan produk yang sesuai ada di katalog."
                                : `Pastikan nama supplier barang di tabel sesuai dengan pilihan "${selectedSupplierForExport}".`}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Download Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-slate-900">
                        <button
                          onClick={() => {
                            if (!previewText) return;
                            navigator.clipboard.writeText(previewText);
                            setSupplierExportToast(true);
                            setTimeout(() => setSupplierExportToast(false), 2500);
                          }}
                          disabled={!previewText}
                          className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copy to Clipboard
                        </button>
                        <button
                          onClick={() => {
                            if (!previewText) return;
                            const blob = new Blob([previewText], { type: "text/plain;charset=utf-8;" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            const downloadName = exportMode === "preset"
                              ? `Export_Stok_Preset_${activePreset ? activePreset.name.replace(/\s+/g, "_") : "Preset"}.txt`
                              : `Export_Stok_${selectedSupplierForExport}.txt`;
                            link.setAttribute("download", downloadName);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          disabled={!previewText}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download .TXT
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Copied Toast Alert */}
                  {supplierExportToast && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase tracking-widest border border-white shadow-lg rounded animate-bounce">
                      ✓ Copied to clipboard!
                    </div>
                  )}
                </div>
              </div>
            );
          })()
  );
}
}