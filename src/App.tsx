import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  Lock,
  UploadCloud,
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  X,
  Menu,
  Settings,
  Download,
  Trash2,
  Table,
  RefreshCcw,
  Wrench,
  ShoppingBag,
  ArrowRight,
  Undo,
  Calendar,
  Megaphone,
  TrendingUp,
  Check,
  Eye,
  BookOpen,
  Sparkles,
  Type,
  Layout,
  AlertTriangle,
  Database,
  Copy,
  Save,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  subscribeToProducts,
  subscribeToSales,
  subscribeToIncomingGoods,
  upsertProduct,
  processSale,
  addSaleRecord,
  deleteAllProducts,
  deleteAllSales,
  deleteAllIncomingGoods,
  deleteSale,
  updateSale,
  addIncomingGood,
  deleteIncomingGood,
  subscribeToSalesDS,
  addSaleDSRecord,
  deleteSaleDS,
  updateSaleDS,
  deleteAllSalesDS,
  Product,
  Sale,
  IncomingGood,
  SaleDS,
  Iklan,
  WeeklySale,
  subscribeToIklan,
  addIklanRecord,
  updateIklan,
  deleteIklan,
  deleteAllIklan,
  subscribeToWeeklySales,
  addWeeklySaleRecord,
  updateWeeklySale,
  deleteWeeklySale,
  deleteAllWeeklySales,
  StorefrontBanner,
  subscribeToBanners,
  addBanner,
  deleteBanner,
  BrandingSettings,
  subscribeToBranding,
} from "./services";
import Papa from "papaparse";
import { Storefront } from "./storefront/Storefront";
import { CustomerReviews } from "./storefront/CustomerReviews";
import { AdminReviews } from "./components/AdminReviews"; // ADD THIS
import { KatalogTab } from "./components/KatalogTab";
import { BrandingTab } from "./components/BrandingTab";

const DROPSHIP_SUPPLIERS = ["S-KIM", "S-akumaucantik", "S-LINA"];

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

const parseToDate = (tStr: any): Date | null => {
  if (!tStr) return null;
  if (typeof tStr === "object" && tStr.seconds) {
    return new Date(tStr.seconds * 1000);
  }
  if (tStr instanceof Date) return tStr;
  const sStr = String(tStr).trim();
  if (!sStr) return null;

  const cleanStr = sStr.replace(/\s+/g, ' ');

  const indonesianMonths: { [key: string]: number } = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agt: 7, agst: 7, agu: 7,
    oktober: 9, okt: 9,
    september: 8, sep: 8,
    november: 10, nov: 10,
    desember: 11, des: 11
  };

  // 1. Check space separated "DD Month YYYY" (e.g. "15 Mei 2026")
  const spaceParts = cleanStr.split(' ');
  if (spaceParts.length === 3) {
    const dStr = spaceParts[0].trim();
    const mStr = spaceParts[1].trim().toLowerCase();
    const yStr = spaceParts[2].trim();
    
    let monthIdx = -1;
    if (indonesianMonths[mStr] !== undefined) {
      monthIdx = indonesianMonths[mStr];
    } else {
      const mInt = parseInt(mStr, 10);
      if (!isNaN(mInt)) monthIdx = mInt - 1;
    }

    if (monthIdx >= 0 && monthIdx <= 11) {
      const day = parseInt(dStr, 10);
      const year = parseInt(yStr, 10);
      if (!isNaN(day) && !isNaN(year)) {
        if (year > 999) {
          return new Date(year, monthIdx, day);
        } else if (day > 999) {
          return new Date(day, monthIdx, year);
        }
      }
    }
  }

  // 2. Check dash/slash/dot separated (e.g. "15-Mei-2026" or "15/05/2026")
  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim().toLowerCase();
    const p2 = parts[2].trim();

    let monthIdx = -1;
    if (indonesianMonths[p1] !== undefined) {
      monthIdx = indonesianMonths[p1];
    } else {
      const mInt = parseInt(p1, 10);
      if (!isNaN(mInt)) monthIdx = mInt - 1;
    }

    if (monthIdx >= 0 && monthIdx <= 11) {
      const day = parseInt(p0, 10);
      const year = parseInt(p2, 10);
      if (!isNaN(day) && !isNaN(year)) {
        if (year > 999) {
          return new Date(year, monthIdx, day);
        } else if (day > 999) {
          return new Date(day, monthIdx, year);
        }
      }
    }
  }

  // 3. Fallback standard Date parsing
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) return d;

  // 4. Fallback Indonesian regex match if standard parse fails
  const matches = cleanStr.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (matches) {
    const day = parseInt(matches[1], 10);
    const monthName = matches[2];
    const year = parseInt(matches[3], 10);
    if (indonesianMonths[monthName] !== undefined) {
      return new Date(year, indonesianMonths[monthName], day);
    }
  }

  return null;
};

const formatToIndoDateStr = (date: Date): string => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const normalizeOrderDate = (dateStr: any): string => {
  if (!dateStr) return "";
  const d = parseToDate(dateStr);
  if (d && !isNaN(d.getTime())) {
    return formatToIndoDateStr(d);
  }
  return String(dateStr).trim();
};


interface WeekDef {
  month: number;
  monthName: string;
  week: number;
  startDay: number;
  endDay: number;
}

const WEEKS_DEFINITION: WeekDef[] = [
  { month: 1, monthName: "JANUARY", week: 1, startDay: 1, endDay: 10 }, // adjusted so Jan 1-3 is not neglected
  { month: 1, monthName: "JANUARY", week: 2, startDay: 11, endDay: 17 },
  { month: 1, monthName: "JANUARY", week: 3, startDay: 18, endDay: 24 },
  { month: 1, monthName: "JANUARY", week: 4, startDay: 25, endDay: 31 },
  
  { month: 2, monthName: "FEBRUARY", week: 1, startDay: 1, endDay: 7 },
  { month: 2, monthName: "FEBRUARY", week: 2, startDay: 8, endDay: 14 },
  { month: 2, monthName: "FEBRUARY", week: 3, startDay: 15, endDay: 21 },
  { month: 2, monthName: "FEBRUARY", week: 4, startDay: 22, endDay: 28 },
  
  { month: 3, monthName: "MARCH", week: 1, startDay: 1, endDay: 7 },
  { month: 3, monthName: "MARCH", week: 2, startDay: 8, endDay: 14 },
  { month: 3, monthName: "MARCH", week: 3, startDay: 15, endDay: 21 },
  { month: 3, monthName: "MARCH", week: 4, startDay: 22, endDay: 31 },
  
  { month: 4, monthName: "APRIL", week: 1, startDay: 1, endDay: 7 },
  { month: 4, monthName: "APRIL", week: 2, startDay: 8, endDay: 14 },
  { month: 4, monthName: "APRIL", week: 3, startDay: 15, endDay: 21 },
  { month: 4, monthName: "APRIL", week: 4, startDay: 22, endDay: 30 },
  
  { month: 5, monthName: "MAY", week: 1, startDay: 1, endDay: 7 },
  { month: 5, monthName: "MAY", week: 2, startDay: 8, endDay: 14 },
  { month: 5, monthName: "MAY", week: 3, startDay: 15, endDay: 21 },
  { month: 5, monthName: "MAY", week: 4, startDay: 22, endDay: 31 },
  
  { month: 6, monthName: "JUNE", week: 1, startDay: 1, endDay: 7 },
  { month: 6, monthName: "JUNE", week: 2, startDay: 8, endDay: 14 },
  { month: 6, monthName: "JUNE", week: 3, startDay: 15, endDay: 21 },
  { month: 6, monthName: "JUNE", week: 4, startDay: 22, endDay: 30 },
  
  { month: 7, monthName: "JULY", week: 1, startDay: 1, endDay: 7 },
  { month: 7, monthName: "JULY", week: 2, startDay: 8, endDay: 14 },
  { month: 7, monthName: "JULY", week: 3, startDay: 15, endDay: 21 },
  { month: 7, monthName: "JULY", week: 4, startDay: 22, endDay: 31 },
  
  { month: 8, monthName: "AUGUST", week: 1, startDay: 1, endDay: 7 },
  { month: 8, monthName: "AUGUST", week: 2, startDay: 8, endDay: 14 },
  { month: 8, monthName: "AUGUST", week: 3, startDay: 15, endDay: 21 },
  { month: 8, monthName: "AUGUST", week: 4, startDay: 22, endDay: 31 },
  
  { month: 9, monthName: "SEPTEMBER", week: 1, startDay: 1, endDay: 7 },
  { month: 9, monthName: "SEPTEMBER", week: 2, startDay: 8, endDay: 14 },
  { month: 9, monthName: "SEPTEMBER", week: 3, startDay: 15, endDay: 21 },
  { month: 9, monthName: "SEPTEMBER", week: 4, startDay: 22, endDay: 30 },
  
  { month: 10, monthName: "OCTOBER", week: 1, startDay: 1, endDay: 7 },
  { month: 10, monthName: "OCTOBER", week: 2, startDay: 8, endDay: 14 },
  { month: 10, monthName: "OCTOBER", week: 3, startDay: 15, endDay: 21 },
  { month: 10, monthName: "OCTOBER", week: 4, startDay: 22, endDay: 31 },
  
  { month: 11, monthName: "NOVEMBER", week: 1, startDay: 1, endDay: 7 },
  { month: 11, monthName: "NOVEMBER", week: 2, startDay: 8, endDay: 14 },
  { month: 11, monthName: "NOVEMBER", week: 3, startDay: 15, endDay: 21 },
  { month: 11, monthName: "NOVEMBER", week: 4, startDay: 22, endDay: 30 },
  
  { month: 12, monthName: "DECEMBER", week: 1, startDay: 1, endDay: 7 },
  { month: 12, monthName: "DECEMBER", week: 2, startDay: 8, endDay: 14 },
  { month: 12, monthName: "DECEMBER", week: 3, startDay: 15, endDay: 21 },
  { month: 12, monthName: "DECEMBER", week: 4, startDay: 22, endDay: 31 },
];

function CatalogPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-slate-900 border-4 border-slate-900 flex items-center justify-center text-white font-black text-3xl shadow-[8px_8px_0px_0px_#6366f1]">
            Z
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase font-display">
            ZENDIIX
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="p-10 border-4 border-slate-900 bg-white shadow-[12px_12px_0px_0px_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[16px_16px_0px_0px_#0f172a] transition-all cursor-not-allowed group">
            <div className="w-12 h-12 bg-indigo-100 border-2 border-slate-900 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 border-2 border-slate-900 bg-indigo-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
              Web Katalog
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Browsing koleksi produk terbaru sedang dalam tahap pengembangan.
            </p>
          </div>

          <div className="p-10 border-4 border-slate-900 bg-white shadow-[12px_12px_0px_0px_#0f172a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[16px_16px_0px_0px_#0f172a] transition-all cursor-not-allowed group">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-slate-900 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <Plus className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
              Customer Order
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Sistem pemesanan mandiri untuk pelanggan akan hadir segera.
            </p>
          </div>
        </div>

        <div className="pt-12">
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[6px_6px_0px_0px_#6366f1] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#6366f1] transition-all"
          >
            Portal Management <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function applyGlobalReplacements(name: string, replacements: { old: string; new: string }[]) {
  const sortedReps = [...replacements]
    .filter(r => r.old.trim() !== "")
    .sort((a, b) => b.old.length - a.old.length);

  let result = name;
  for (const rep of sortedReps) {
    if (result.toUpperCase().includes(rep.old.toUpperCase())) {
      // Escape special chars and replace globally (case-insensitive)
      const escapedOld = rep.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOld, "gi");
      result = result.replace(regex, rep.new);
    }
  }
  return result.trim();
}

function parseFormatAkumaucantik(text: string, replacements: { old: string; new: string }[]) {
  const lines = text.split(/\r?\n/);
  const multiplierKeywords = /(maki|matake|emma|veronica|clear)/i;
  const list: { rawName: string; qty: number }[] = [];

  for (let line of lines) {
    let cleanLine = line.trim();
    if (!cleanLine) continue;

    // 1. Jika ada tanda silang, langsung SKIP
    if (/❌/.test(cleanLine)) continue;

    // 2. Bersihkan dari emoji centang atau checkbox
    cleanLine = cleanLine.replace(/✅|[\u2705\u2611\uFE0F\u2611]/g, "");

    // 3. Bersihkan spasi berlebih
    cleanLine = cleanLine.replace(/\s+/g, " ").trim();

    if (!cleanLine) continue;

    // 5. Cocokkan format: 1psg NAMA-BARANG (misal: 1 psg maki, 2 botol serum)
    const match = cleanLine.match(/^(\d+)\s*(pasang|psg|botol)\s*(.+)$/i);
    if (!match) continue;

    let qty = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    let name = match[3].trim();

    // 6. Multiplier 2x KHUSUS pasang/psg + keyword tertentu
    if (
      (unit === "pasang" || unit === "psg") &&
      multiplierKeywords.test(name)
    ) {
      qty *= 2;
    }

    // Apply replacements
    name = applyGlobalReplacements(name, replacements);

    list.push({ rawName: name, qty });
  }
  return list;
}

function parseFormatKim(text: string, replacementsKim: { old: string; new: string }[], replacementsGlobal: { old: string; new: string }[]) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number }[] = [];
  let currentProductName = "";

  for (let line of lines) {
    let row = line.trim();
    if (!row) continue;

    // Check if row is a quantity line
    if (/^\d+\s*X\s*Rp/i.test(row)) {
      let qty = parseInt(row.split(/\s*X\s*/i)[0], 10);
      if (isNaN(qty)) qty = 1;

      if (currentProductName !== "") {
        let finalName = currentProductName.trim();
        
        // Apply multipliers
        if (finalName.toUpperCase().includes("TRAPZ")) {
          qty *= 2;
        }

        // Apply KIM replacements first
        finalName = applyGlobalReplacements(finalName, replacementsKim);
        // Apply Global replacements second
        finalName = applyGlobalReplacements(finalName, replacementsGlobal);

        list.push({ rawName: finalName, qty });
        currentProductName = "";
      }
    } else if (/^-?\d+(\.\d+)?$/.test(row)) {
      if (currentProductName !== "") {
        currentProductName += " " + row;
      } else {
        currentProductName = row;
      }
    } else {
      if (currentProductName !== "") {
        currentProductName += " " + row;
      } else {
        currentProductName = row;
      }
    }
  }

  // Add the last product if exists
  if (currentProductName !== "") {
    let finalName = applyGlobalReplacements(currentProductName, replacementsKim);
    finalName = applyGlobalReplacements(finalName, replacementsGlobal);
    list.push({ rawName: finalName, qty: 1 });
  }

  return list;
}

function parseFormatShopee(text: string, replacements: { old: string; new: string }[]) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number }[] = [];

  let productName = "";
  let variation = "";
  let quantity = "";

  const specialProducts = ["Matake", "Maki", "Mini Emma", "Trapezium"];
  const unwantedWords = [
    "-1 LENS/BTL/BOX",
    "-1 LENS/BTL/BO",
    "|",
    "X2 CLEAR 12 BULAN,",
    "( ½ Pasang )",
  ];

  function isProductLine(line: string) {
    const keywords = [
      "MSBS",
      "Softlens Case",
      "Kotak",
      "Tempat Softlens",
      "Softlens",
      "FREE",
      "Case Softlens",
    ];
    const upper = line.toUpperCase();
    return keywords.some((k) => upper.includes(k.toUpperCase()));
  }

  function flushCurrentEntry() {
    if (productName && variation && quantity) {
      let finalQty = parseInt(quantity, 10);
      if (isNaN(finalQty)) finalQty = 1;

      const hasSpecial = specialProducts.some((sp) =>
        productName.toLowerCase().includes(sp.toLowerCase()),
      );
      if (hasSpecial) {
        finalQty *= 2;
      }

      let rawName = `${productName} Variasi: ${variation}`;
      rawName = applyGlobalReplacements(rawName, replacements);

      list.push({
        rawName: rawName,
        qty: finalQty,
      });

      productName = "";
      variation = "";
      quantity = "";
    }
  }

  for (let line of lines) {
    let cleanLine = line.trim();
    if (!cleanLine) continue;

    unwantedWords.forEach((word) => {
      cleanLine = cleanLine.replace(word, "").trim();
    });

    if (/^\[Grosir\]/i.test(cleanLine)) {
      flushCurrentEntry();
      continue;
    }

    if (isProductLine(cleanLine)) {
      flushCurrentEntry();
      productName = cleanLine;
      variation = "";
      quantity = "";
      continue;
    }

    if (/^Variasi\s*:/i.test(cleanLine)) {
      variation = cleanLine.replace(/^Variasi\s*:/i, "").trim();
      continue;
    }

    if (/^x\d+/i.test(cleanLine)) {
      quantity = cleanLine.replace(/x/i, "").trim();
      continue;
    }

    if (/^Rp[\d\.]+/i.test(cleanLine.replace(/\s+/g, ""))) {
      flushCurrentEntry();
      continue;
    }
  }

  flushCurrentEntry();
  return list;
}

function parseFormatSisse(text: string, replacements: { old: string; new: string }[]) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number }[] = [];

  for (let line of lines) {
    const trimLine = line.trim();
    if (!trimLine) continue;

    if (/^MINUS/i.test(trimLine)) {
      const match = trimLine.match(/^MINUS\s+([\s\S]*?)\s+(\d+)\s+(\d+)\s*Rp/i);
      if (match) {
        const name = match[1]
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase());
        const power = parseInt(match[2], 10);
        const qty = parseInt(match[3], 10);
        const minusValue = "-" + (power / 100).toFixed(2);
        let finalName = `${name} ${minusValue}`;
        finalName = applyGlobalReplacements(finalName, replacements);
        list.push({ rawName: finalName, qty });
      }
    } else if (/^NORMAL/i.test(trimLine)) {
      const match = trimLine.match(/^NORMAL\s+([\s\S]*?)\s+(\d+)\s*Rp/i);
      if (match) {
        const name = match[1]
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase());
        const qty = parseInt(match[2], 10);
        let finalName = `${name} -0.00`;
        finalName = applyGlobalReplacements(finalName, replacements);
        list.push({ rawName: finalName, qty });
      }
    }
  }
  return list;
}

function parseFormatAnna(text: string, replacements: { old: string; new: string }[]) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number }[] = [];

  for (let line of lines) {
    let cleanLine = line.trim();
    if (!cleanLine) continue;

    // 1. Jika ada tanda silang (❌), langsung SKIP
    if (/❌/.test(cleanLine)) continue;

    // 2. Bersihkan dari emoji centang atau checkbox dan simbol aneh lainnya
    cleanLine = cleanLine.replace(/✅|[\u2705\u2611\uFE0F\u2611]/g, "");

    // 3. Bersihkan spasi berlebih
    cleanLine = cleanLine.replace(/\s+/g, " ").trim();
    if (!cleanLine) continue;

    // 4. Cocokkan format: [angka][pasang/botol/psg/btl] [nama barang]
    const match = cleanLine.match(
      /^(\d+)\s*(pasang|psg|botol|btl|ps)?\s*(.+)$/i,
    );
    if (!match) continue;

    let qty = parseInt(match[1], 10);
    const unit = match[2] ? match[2].toLowerCase() : "";
    let name = match[3].trim();

    name = applyGlobalReplacements(name, replacements);

    list.push({ rawName: name, qty });
  }

  return list;
}

function findAutoMatch(
  rawName: string,
  productList: Product[],
): Product | undefined {
  if (!rawName) return undefined;
  
  const cleanRaw = rawName.toLowerCase().trim();
  const slugRaw = cleanRaw.replace(/[^a-z0-9]/g, "");

  // 1. Priority: Exact match Code
  const exactCodeMatch = productList.find(p => p.kodeBarang && p.kodeBarang.toLowerCase().trim() === cleanRaw);
  if (exactCodeMatch) return exactCodeMatch;

  // 2. Priority: Exact match Name
  const exactNameMatch = productList.find(p => p.namaBarang && p.namaBarang.toLowerCase().trim() === cleanRaw);
  if (exactNameMatch) return exactNameMatch;

  // 3. Priority: Slug match
  const slugMatch = productList.find(p => {
    const pSlugCode = (p.kodeBarang || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const pSlugName = (p.namaBarang || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return (pSlugCode && pSlugCode === slugRaw) || (pSlugName && pSlugName === slugRaw);
  });
  if (slugMatch) return slugMatch;

  // 4. Advanced Word Intersection
  const inputWords = cleanRaw.split(/[^a-z0-9]+/).filter(w => w.length >= 1);
  if (inputWords.length === 0) return undefined;

  let bestMatch: Product | undefined = undefined;
  let bestScore = 0;
  let minLengthDiff = 999;

  for (const p of productList) {
    const pName = (p.namaBarang || "").toLowerCase();
    const pCode = (p.kodeBarang || "").toLowerCase();
    const pFullName = (pCode + " " + pName);
    const pWords = pFullName.split(/[^a-z0-9]+/).filter(w => w.length >= 1);
    const pWordsSet = new Set(pWords);
    const pDigitsOnly = pFullName.replace(/[^0-9]/g, "");
    
    let score = 0;
    let numericMismatches = 0;

    for (const iw of inputWords) {
      const isNumber = /^\d+$/.test(iw);
      
      if (pWordsSet.has(iw)) {
        score += isNumber ? 4 : 2; 
      } else if (isNumber) {
        // Number not found directly, check if it's part of the product's digits
        // e.g., "150" vs "1,50"
        if (pDigitsOnly.includes(iw) || iw.includes(pDigitsOnly)) {
          score += 2;
        } else {
          numericMismatches++;
        }
      } else {
        // Fuzzy word match
        let foundPartial = false;
        for (const pw of pWords) {
          if (pw.includes(iw) || iw.includes(pw)) {
            score += 0.5;
            foundPartial = true;
            break;
          }
        }
      }
    }

    // Heavy penalty for variation mismatches
    score -= numericMismatches * 5;

    // Strict requirement: If input has numbers, the match MUST have at least one numeric intersection
    const inputNumericWords = inputWords.filter(w => /^\d+$/.test(w));
    if (inputNumericWords.length > 0) {
      let numericSatisfied = false;
      for (const inw of inputNumericWords) {
        if (pWordsSet.has(inw) || pDigitsOnly.includes(inw)) {
          numericSatisfied = true;
          break;
        }
      }
      if (!numericSatisfied) {
        score -= 10; // Extra heavy penalty if no numbers match but input has numbers
      }
    }

    const currentLen = pFullName.length;
    const lengthDiff = Math.abs(cleanRaw.length - currentLen);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = p;
      minLengthDiff = lengthDiff;
    } else if (score > 0 && score === bestScore) {
      if (lengthDiff < minLengthDiff) {
        bestMatch = p;
        minLengthDiff = lengthDiff;
      }
    }
  }

  // Reasonable threshold for fuzzy matching
  if (bestScore >= 3) {
    return bestMatch;
  }

  return undefined;
}

function BannerUploadManager({ onAddBanner }: { onAddBanner: (imageUrl: string, linkUrl: string) => Promise<void> }) {
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

function AppContent({ sharedProducts, sharedBanners, sharedBranding }: { sharedProducts: Product[]; sharedBanners: StorefrontBanner[]; sharedBranding: BrandingSettings }) {
  const [products, setProducts] = useState<Product[]>(sharedProducts);
  const [banners, setBanners] = useState<StorefrontBanner[]>(sharedBanners || []);
  const [branding, setBranding] = useState<BrandingSettings>(sharedBranding);

  useEffect(() => {
    setProducts(sharedProducts);
  }, [sharedProducts]);

  useEffect(() => {
    if (sharedBanners) {
      setBanners(sharedBanners);
    }
  }, [sharedBanners]);

  useEffect(() => {
    if (sharedBranding) {
      setBranding(sharedBranding);
    }
  }, [sharedBranding]);

  const findSupplierForProduct = (name: string): string => {
    if (!name) return "";
    const cleanName = name.trim().toLowerCase();
    const match = products.find(p => {
      const pName = (p.namaBarang || "").trim().toLowerCase();
      const pCode = (p.kodeBarang || "").trim().toLowerCase();
      return cleanName.includes(pName) || pName.includes(cleanName) || cleanName.includes(pCode);
    });
    return match ? (match.supplier || "") : "";
  };

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesDS, setSalesDS] = useState<SaleDS[]>([]);
  const [incomingGoods, setIncomingGoods] = useState<IncomingGood[]>([]);
  const [iklanList, setIklanList] = useState<Iklan[]>([]);
  const [weeklySalesList, setWeeklySalesList] = useState<WeeklySale[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [hasCustomPassword, setHasCustomPassword] = useState(false);

  const queryClient = useQueryClient();

  const ROW_HEIGHT = 48; // Standard row height in pixels
  const VISIBLE_ROWS_COUNT = 15; // Number of rows fully rendered simultaneously in the viewport

  // TanStack Query for state caching, auto window-focus-refetching, and smart client sync
  const { data: qSales } = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: () => fetch("/api/sales").then(res => res.json()),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: isAuthenticated,
  });

  const { data: qSalesDS } = useQuery<SaleDS[]>({
    queryKey: ["salesDS"],
    queryFn: () => fetch("/api/sales-ds").then(res => res.json()),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: isAuthenticated,
  });

  const { data: qIncoming } = useQuery<IncomingGood[]>({
    queryKey: ["incomingGoods"],
    queryFn: () => fetch("/api/incoming-goods").then(res => res.json()),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (qSales) setSales(qSales);
  }, [qSales]);

  useEffect(() => {
    if (qSalesDS) setSalesDS(qSalesDS);
  }, [qSalesDS]);

  useEffect(() => {
    if (qIncoming) setIncomingGoods(qIncoming);
  }, [qIncoming]);

  useEffect(() => {
    fetch('/api/admin/check-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.hasCustomPassword) {
          setHasCustomPassword(true);
        }
      })
      .catch(err => {
        console.error('Failed to check admin password config', err);
      });
  }, []);

  const [activeTab, setActiveTab] = useState("form"); // form, stok_barang, database_penjualan
  const [pengaturanSubTab, setPengaturanSubTab] = useState<"sync" | "rules" | "maintenance">("sync");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [databaseSubTab, setDatabaseSubTab] = useState<"regular" | "dropship">("regular");
  const [parsingMode, setParsingMode] = useState<"standard" | "shopee" | "kim">("standard");
  const [replacementGlobal, setReplacementGlobal] = useState<{ old: string; new: string }[]>(() => {
    const saved = localStorage.getItem("replacementGlobal");
    if (saved) return JSON.parse(saved);
    return [
      { old: "-0.00", new: "Normal" },
      { old: "(Min. Order 10 Btl) Cairan Air Tetes Mata Softlens X2 Contacts O2 15ml Freshkon Simi A+ Be Seen 15ml Variasi: A+ 10ml", new: "A+ 10ml" },
      { old: "[ COD ] Eye Tools Opener Alat Pakai Bantu Pasang Pakai Softlens Pemula Lensa Kontak Contact Lenses Mudah Praktis Variasi: Pink (Merah Muda)", new: "Alat Pakai Softlens PINK" },
      { old: "[ COD ] Eye Tools Opener Alat Pakai Bantu Pasang Pakai Softlens Pemula Lensa Kontak Contact Lenses Mudah Praktis Variasi: Blue (Biru)", new: "Alat Pakai Softlens TOSCA" },
      { old: "FREE BOX Eye Tools Opener Alat Bantu Pakai Softlens Pembuka Kelopak Mata Variasi: Trans Love Hijau", new: "Alat Pakai Softlens Transparant Green" },
      { old: "FREE BOX Eye Tools Opener Alat Bantu Pakai Softlens Pembuka Kelopak Mata Variasi: Trans Love Abu", new: "Alat Pakai Softlens Transparant Grey" },
      { old: "FREE BOX Eye Tools Opener Alat Bantu Pakai Softlens Pembuka Kelopak Mata Variasi: Trans Love Pink", new: "Alat Pakai Softlens Transparant Pink" },
      { old: "FREE BOX Eye Tools Opener Alat Bantu Pakai Pembuka Kelopak Mata Variasi: Trans Love Ungu", new: "Alat Pakai Softlens Transparant Violet" },
      { old: "[ COD ] Eye Tools Opener Alat Pakai Bantu Pasang Pakai Softlens Pemula Lensa Kontak Contact Lenses Mudah Praktis Variasi: White (Putih)", new: "Alat Pakai Softlens WHITE" },
      { old: "(Min. 10 Botol) Cairan Pembersih Softlens X2 Ice Simi A+ Be Seen Nicelook Sol8 60ml sd 360ml Variasi: BE SEEN 60ml", new: "Be Seen 60ml" },
      { old: "BERRYBLUE", new: "BERRY BLUE" },
      { old: "AIR BESSEN-60ML", new: "Be Seen 60ml" },
      { old: "CAIRAN SOFTLENS BIO TRUE 60ML TRAVEL SIZE EXP 2025/01 Variasi: 2025/01", new: "Bio True 60ml" },
      { old: "CAIRAN SOFTLENS BIO TRUE 60ML TRAVEL SIZE EXP 2025/01 Variasi: 2025/04", new: "Bio True 60ml" },
      { old: "CAIRAN SOFTLENS BIO TRUE 60ML TRAVEL SIZE EXP 2025/05 Variasi: 2025/05", new: "Bio True 60ml" },
      { old: "BOWN", new: "BROWN" },
      { old: "BRWN", new: "BROWN" },
      { old: "Softlens KPOP  K-POP | K POP & New KPOP Dia. 16.00 Big Eyes Minus -0.50 sd -2.75 By Exoticon Variasi: OCRE BROWN", new: "KPOP Ochre Brown" },
      { old: "Softlens KPOP  K-POP | K POP & New KPOP Dia. 16.00 Big Eyes Normal By Exoticon Variasi: OCRE BROWN", new: "KPOP Ochre Brown" },
      { old: "Softlens KPOP  K-POP | K POP & New KPOP Dia. 16.00 Big Eyes Minus -3.00 sd -6.00 By Exoticon Variasi: OCRE BROWN", new: "KPOP Ochre Brown" },
      { old: "TETES MATA FRESH-COMFORT-15ml", new: "Fresh Comfort 15ml" },
      { old: "(Min. Order 10 Btl) Cairan Air Tetes Mata Softlens X2 Contacts O2 15ml Freshkon Simi A+ Be Seen 15ml Variasi: FRESHKON 10ml", new: "FRESHKON 10ml" },
      { old: "(Min. Order 10 Btl) Cairan Air Tetes Mata Softlens X2 Contacts O2 15ml Freshkon Simi A+ Be Seen 15ml Variasi: O2 15ml", new: "O2 Comfort Drops 15ml" },
      { old: "GRAY", new: "Grey" },
      { old: "Idol Desire ", new: "I-dol Desire " },
      { old: "IDOL ROZE", new: "I-dol Roze" },
      { old: "Kotak Softlens ISI 3 PASANG Tempat Softlen Lenscase Kaida BEAR + Penjepit Variasi: LINE isi 3", new: "Lenscase 3in1 LINE" },
      { old: "Kotak Softlens ISI 3 PASANG Tempat Softlen Lenscase Kaida BEAR + Penjepit Variasi: BEAR isi 3", new: "Lenscase 3in1 We Are Bears" },
      { old: "Softlens Living Color Lily Dia. 14.40 Big Eyes Minus -0.50 sd -6.00 By Irislab Variasi:", new: "LILY" },
      { old: "Softlens Living Color Lily Dia. 14.40 Big Eyes Normal By Irislab Variasi:", new: "LILY" },
      { old: "SOFTLENS LILY GREY (-0.50 S/D -6.00) Variasi:", new: "LILY GREY" },
      { old: "Softlens Macaron Dia. 14.50mm Natural Look Minus -0.50 sd -6.00 By CTK Variasi:", new: "MACARON" },
      { old: "Softlens Macaron Dia. 14.50mm Natural Look Normal By CTK Variasi:", new: "MACARON" },
      { old: "Softlens Macaron Dia. 14.50mm Natural Look Minus -0.50 sd -6.00 By CTK Variasi: ALMOND BROWN,", new: "MACARON ALMOND " },
      { old: "Softlens Macaron Dia. 14.50mm Natural Look Normal By CTK Variasi: ALMOND BROWN,NORMAL  0.00", new: "MACARON ALMOND NORMAL" },
      { old: "MAKI BROWN DREAMCOLOR (NORMAL S/D -6.00) Variasi:", new: "MAKI" },
      { old: "MAKI GREY DREAMCOLOR (NORMAL s/d -8.00) Variasi:", new: "MAKI" },
      { old: "MATAKE GREY DREAMCOLOR (NORMAL S/D -10.00) Variasi:", new: "MATAKE" },
      { old: "MATAKE BROWN DREAMCOLOR DC1 (NORMAL S/D -10.00) 14.5MM Variasi:", new: "MATAKE BROWN" },
      { old: "MATAKE BROWN DREAMCOLOR DC1 (NORMAL S/D -10.00) 14.5MM Variasi: BROWN", new: "MATAKE BROWN" },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Minus -0.50 sd -6.00 By Irislab Variasi: CHOCO BROWN,", new: "Mini Circle Choco " },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Normal By Irislab Variasi: CHOCO BRWN,", new: "Mini Circle Choco " },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Minus -0.50 sd -6.00 By Irislab Variasi: HONEY BROWN,", new: "MINI CIRCLE HONEY " },
      { old: "(COD) SOFTLENS LIVING COLOR MINI CIRCLE - ICE GREY NORMAL & MINUS - 0.50 SD - 6.00 Variasi: ICE GREY,", new: "Mini Circle Ice " },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Normal By Irislab Variasi: ICE GREY,", new: "Mini Circle Ice " },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Minus -0.50 sd -6.00 By Irislab Variasi: OCEAN GREY,", new: "MINI CIRCLE OCEAN " },
      { old: "Softlens Living Color Mini Circle Dia. 14.00 Normal By Irislab Variasi: OCEAN GREY,", new: "MINI CIRCLE OCEAN " },
      { old: "MINI EMMA BROWN (NORMAL S/D -4.00) Variasi: ", new: "Mini Emma Brown " },
      { old: "Softlens Newbluk Dia. 15.00mm Natural Look Minus -0.50 sd -6.00 By CTK Variasi:", new: "NEWBLUK" },
      { old: "Softlens Newbluk Dia. 15.00mm Natural Look Normal By CTK Variasi:", new: "NEWBLUK" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - CRYSTAL GREY 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - GALAXY GREY 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - HONEY BROWN 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - MARBLE GREY 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - OCRE ASH 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - OCRE BROWN 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS CTK NEW MORE DUBAI - OCRE KAKAO 0.00 S.D - 6.00 Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS NEW MORE DUBAI - NORMAL DIA. 14.50MM BEST SELLER Variasi:", new: "NMD" },
      { old: "Softlens New More Dubai Dia. 14.50 Natural Look Minus -0.50 sd -1.75 By CTK Variasi:", new: "NMD" },
      { old: "Softlens New More Dubai Dia. 14.50 Natural Look Minus -2.00 sd -3.25 By CTK Variasi:", new: "NMD" },
      { old: "Softlens New More Dubai Dia. 14.50 Natural Look Minus -3.50 sd -4.50 By CTK Variasi:", new: "NMD" },
      { old: "Softlens New More Dubai Dia. 14.50 Natural Look Normal By CTK Variasi:", new: "NMD" },
      { old: "(COD) SOFTLENS NEW MORE DUBAI - NORMAL DIA. 14.50MM BEST SELLER Variasi: CRYSTALL GREY,", new: "NMD Crystal Grey " },
      { old: "MALT NORMAL", new: "NORMAL" },
      { old: "NORMAL ", new: "NORMAL" },
      { old: "NORMAL  0.00", new: "NORMAL" },
      { old: "(Minimal Order 10 Botol) Cairan Air Tetes Mata Softlens X2 Contacts O2 15ml Freshkon Simi A+ 10ml Be Seen 15ml Variasi: O2 15ml", new: "O2 Comfort Drops 15ml" },
      { old: "Cairan Tetes Mata Softlens O2 15ml Fresh & Comfort With Oxygen Variasi: AIR TETES MATA,O2 - 15 ML", new: "O2 Comfort Drops 15ml" },
      { old: "Alat Bantu Cuci Softlens Manual | Steamer Softlens Manual Variasi: STEAMER SOFTLENS", new: "Pencuci Manual" },
      { old: "(COD) PINSET SOFTLENS / ALAT PENJEPIT SOFTLENS Variasi: PINSET 2 IN 1", new: "Pinset" },
      { old: "HPT Tweezer Penjepit Softlens Capitan Contact Lens Jepitan Pencabut Lensa Kontak Mata Softlens Variasi: PUTIH", new: "Pinset" },
      { old: "Air softlens / CAIRAN SOFTLENS RENU FRESH 60ML TRAVEL SIZE Variasi: EXP 2025/03", new: "Renu 60ml" },
      { old: "Softlens Russian Velvet Dia. 14.50mm Minus -3.00 sd -6.00 By Exoticon Variasi: IRINA - GREY,", new: "Russian Velvet Irina Grey " },
      { old: "Softlens Russian Velvet Dia. 14.50mm Minus -0.50 sd -2.75 By Exoticon Variasi: IRINA - GREY,", new: "Russian Velvet Irina Grey " },
      { old: "Softlens Russian Velvet Dia. 14.50mm Normal By Exoticon Variasi: IRINA - GREY,", new: "Russian Velvet Irina Grey " },
      { old: "(Grosir Min. 10 Botol) Cairan Pembersih Softlens X2 Ice Simi A+ Be Seen Nicelook Sol8 60ml sd 360ml Variasi: SOL-8 60ml", new: "SOL-8 60ML" },
      { old: "(COD) SOFTLENS LIVING COLOR SPANISH - CARAMEL BROWN NORMAL S.D - 6.00 Variasi:", new: "SPANISH" },
      { old: "(COD) SOFTLENS LIVING COLOR SPANISH - MALT GREY NORMAL S.D - 6.00 Variasi:", new: "SPANISH" },
      { old: "(COD) SOFTLENS LIVING COLOR SPANISH - PASTEL GREY NORMAL S.D - 6.00 Variasi:", new: "SPANISH" },
      { old: "SOFTLENS SPANISH CARAMEL (NORMAL S/D -6.00) Variasi:", new: "Spanish Caramel Brown" },
      { old: "CRYSTALL", new: "CRYSTAL" },
      { old: "SOFTLENS SPANISH CARAMEL (NORMAL S/D -6.00) Variasi: CARAMEL", new: "Spanish Caramel Brown" },
      { old: "SOFTLENS LIVING COLOR SPANISH NORMAL S.D -6.00 14.4 MM Variasi: SPANISH CARAMEL,", new: "Spanish Caramel Brown " },
      { old: "SOFTLENS SPANISH GRANOLA (NORMAL S/D -6.00) Variasi: GRANOLA NORMAL", new: "SPANISH GRANOLA BROWN NORMAL" },
      { old: "SOFTLENS SPANISH MALT (NORMAL S/D -6.00) Variasi:", new: "SPANISH MALT GREY" },
      { old: "SOFTLENS LIVING COLOR SPANISH NORMAL S.D -6.00 14.4 MM Variasi: SPANISH MALT,", new: "Spanish Malt Grey " },
      { old: "SOFTLENS SPANISH PASTEL (NORMAL S/D -6.00) Variasi:", new: "SPANISH PASTEL GREY" },
      { old: "SOFTLENS LIVING COLOR SPANISH NORMAL S.D -6.00 14.4 MM Variasi: SPANIS PASTEL,", new: "Spanish Pastel Grey " },
      { old: "(COD) SOFTLENS CTK - TRAPEZIUM - BELLA SMOKY NORMAL S/D -6.00 Variasi:", new: "Trapezium" },
      { old: "Softlens Trapezium Betel & Bella Series Dia. 14.50mm Natural Look Normal By CTK Variasi:", new: "Trapezium" },
      { old: "Softlens Trapezium Betel & Bella Series Dia. 14.50mm Natural Look Normal By CTK Variasi: BELLA MOCHA,", new: "Trapezium Bella Mocha Brown " },
      { old: "Softlens Trapezium Betel & Bella Series Dia. 14.50mm Natural Look Minus -0.50 sd -2.75 By CTK Variasi: BELLA ONYX,", new: "Trapezium Bella Onyx Black " },
      { old: "Softlens Trapezium Betel & Bella Series Dia. 14.50mm Natural Look Minus -3.00 sd -6.00 By CTK Variasi: BELLA ONYX,", new: "Trapezium Bella Onyx Black " },
      { old: "Softlens Trapezium Betel & Bella Series Dia. 14.50mm Natural Look Normal By CTK Variasi: BELLA ONYX,NORMAL", new: "Trapezium Bella Onyx Black Normal" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 24 - BIG Bebek Topi", new: "Travel Kit Duck Hat" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 23 - BIG Bebek Koyo", new: "Travel Kit Duck Plester" },
      { old: "2in1 Case Lensa Mini Softlens Baby Bunny Cat Rabbit Bear Line Brown Premium / Wadah Soflens isi 2 in 1 Travel Kit Mini Cute Lucu / Tempat Softlen Kotak Soflen T Kit 09 Variasi: H", new: "Travel Kit Hologram Bear Flower" },
      { old: "2in1 Case Lensa Mini Baby Bunny Cat Rabbit Bear Line Brown Premium / Wadah Soflens isi 2 in 1 Travel Kit Mini Cute Lucu / Tempat Softlen Kotak Soflen T Kit 09 Variasi: I", new: "Travel Kit Hologram Bear Lemon" },
      { old: "2in1 Case Lensa Mini Softlens Baby Bunny Cat Rabbit Bear Line Brown Premium / Wadah Soflens isi 2 in 1 Travel Kit Mini Cute Lucu / Tempat Softlen Kotak Soflen T Kit 09 Variasi: J", new: "Travel Kit Hologram Carrot Rabbit" },
      { old: "2in1 Case Lensa Mini Softlens Baby Bunny Cat Rabbit Bear Line Brown Premium / Wadah Soflens isi 2 in 1 Travel Kit Mini Cute Lucu / Tempat Softlen Kotak Soflen T Kit 09 Variasi: G", new: "Travel Kit Hologram Stripes" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 7 -BIG Pink Segitiga", new: "Travel Kit Kakao Apeach" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 6 - BIG Dog Kuning", new: "Travel Kit Kakao Ryan" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Biru", new: "Travel Kit Kapsul Blue" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Cream Tua", new: "Travel Kit Kapsul Cream" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Hijau Tua", new: "Travel Kit Kapsul Green" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Orange", new: "Travel Kit Kapsul Peach" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Pink", new: "Travel Kit Kapsul Pink" },
      { old: "Tempat Soflens Kapsul Premium Travel Kit Kotak Softlens Capsul Oval Bulat / Travel Kit Mini Brown Line Softlen + Capitan - T Kit 25 Variasi: Ungu Tua", new: "Travel Kit Kapsul Violet" },
      { old: "Kotak Softlens Love Pita Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Love Biru", new: "Travel Kit Transparant Love Tosca" },
      { old: "Kotak Softlens Love Pita Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Love Pink", new: "Travel Kit Transparant Love Pink" },
      { old: "Kotak Softlens Love Pita Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Love Ungu", new: "Travel Kit Transparant Love Violet" },
      { old: "Kotak Softlens L-I-N-E 3D / Travel Kit Soflens Karakter Animal Variasi: BROWN", new: "Travel Kit Line Brown" },
      { old: "Kotak Softlens L-I-N-E 3D / Travel Kit Soflens Karakter Animal Variasi: PUTIH", new: "Travel Kit Line Cony" },
      { old: "Kotak Softlens Love Pink Rose Premium / Tempat Softlens Heart Hati Merah Free Capitan Tongkat Stik Kaida / Tempat Softlens Love Cute Case Transparant Softlen / Travel Kit Mini Fashion + Stick Variasi: Maroon - Bear", new: "Travel Kit Mini 3D Bear" },
      { old: "Kotak Softlens Love Pink Rose Premium / Tempat Softlens Heart Hati Merah Free Capitan Tongkat Stik Kaida / Tempat Softlens Love Cute Case Transparant Softlen / Travel Kit Mini Fashion + Stick Variasi: Maroon - Cherry", new: "Travel Kit Mini 3D Cherry" },
      { old: "Kotak Softlens Love Pink Rose Premium / Tempat Softlens Heart Hati Merah Free Capitan Tongkat Stik Kaida / Tempat Softlens Love Cute Case Transparant Softlen / Travel Kit Mini Fashion + Stick Variasi: Maroon - Girl", new: "Travel Kit Mini 3D Girl" },
      { old: "Kotak Softlens Love Pink Rose Premium / Tempat Softlens Heart Hati Merah Free Capitan Tongkat Stik Kaida / Tempat Softlens Love Cute Case Transparant Softlen / Travel Kit Mini Fashion + Stick Variasi: Maroon - Strawberry", new: "Travel Kit Mini 3D Strawberry" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 29", new: "Travel Kit Mini Karakter 1" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 40", new: "Travel Kit Mini Karakter 2" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 13", new: "Travel Kit Mini Karakter 3" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 17", new: "Travel Kit Mini Karakter 4" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 15", new: "Travel Kit Mini Karakter 5" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 25", new: "Travel Kit Mini Karakter 6" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 45", new: "Travel Kit Mini Karakter 7" },
      { old: "Tempat Softlens KARAKTER ANIMAL / Kotak Lensa + Capitan + Tongkat / Kaida Mini Lucu Kotak Softlen / Box Soflens Variasi: 18", new: "Travel Kit Mini Karakter 8" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 5 - BIG Smile White", new: "Travel Kit Moon Smile" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 3 - BIG Laugh White", new: "Travel Kit Moon Wink Moon" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 2 - BIG Black Cat", new: "Travel Kit Sailor Moon Black" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak 3D Tempat Lensa Capit Tongkat Variasi: 1 - BIG White Cat", new: "Travel Kit Sailor Moon White" },
      { old: "Travel Kit Transparant 2in1 Grey", new: "Travel Kit Transparant 2in1 Grey" },
      { old: "Kotak Softlens Transparan Premium 2in1 / Travel Kit Tempat Kotak Transparant Soflens 2 IN 1 / Case Softlen Bening + Jepitan + Botol Variasi: 2in1 Bunga", new: "Travel Kit Transparant 2in1 Flower" },
      { old: "Kotak Softlens Transparan Premium 2in1 / Travel Kit Tempat Kotak Transparant Soflens 2 IN 1 / Case Softlen Bening + Jepitan + Botol Variasi: 2in1 Abu", new: "Travel Kit Transparant 2in1 Grey" },
      { old: "Kotak Softlens Transparan Premium 2in1 / Travel Kit Tempat Kotak Transparant Soflens 2 IN 1 / Case Softlen Bening + Jepitan + Botol Variasi: 2in1 Pink", new: "Travel Kit Transparant 2in1 Pink" },
      { old: "Kotak Softlens Transparan Premium 2in1 / Travel Kit Tempat Kotak Transparant Soflens 2 IN 1 / Case Softlen Bening + Jepitan + Botol Variasi: 2in1 Ungu", new: "Travel Kit Transparant 2in1 Violet" },
      { old: "Kotak Softlens Transparan Premium 2in1 / Travel Kit Tempat Kotak Transparant Soflens 2 IN 1 / Case Softlen Bening + Jepitan + Botol Variasi: 2in1 Putih", new: "Travel Kit Transparant 2in1 White" },
      { old: "Kotak Softlens Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Biru Muda", new: "Travel Kit Transparant Blue" },
      { old: "MSBS Softlens Case Bening Plastik Tempat Kontak Lensa + Penjepit + Tongkat Tempat Softlens Bening Satu Set Tempat Kontak Lensa Mata Variasi: BIRU MUDA", new: "Travel Kit Transparant Blue" },
      { old: "Kotak Softlens Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Pink", new: "Travel Kit Transparant Pink" },
      { old: "MSBS Softlens Case Bening Plastik Tempat Kontak Lensa + Penjepit + Tongkat Tempat Softlens Bening Satu Set Tempat Kontak Lensa Mata Variasi: PINK MUDA", new: "Travel Kit Transparant Pink" },
      { old: "Kotak Softlens Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Ungu", new: "Travel Kit Transparant Violet" },
      { old: "MSBS Softlens Case Bening Plastik Tempat Kontak Lensa + Penjepit + Tongkat Tempat Softlens Bening Satu Set Tempat Kontak Lensa Mata Variasi: LILAC", new: "Travel Kit Transparant Violet" },
      { old: "Kotak Softlens Transparan Premium / Travel Kit Tempat Kotak Transparant Soflens / Case Softlen Bening + Jepitan + Botol Variasi: Hijau", new: "Travel Kit Transparant Tosca" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 17 - BIG Bear Brown", new: "Travel Kit We Are Bears Alaska" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 14 - BIG Bear Choco", new: "Travel Kit We Are Bears Grizzly" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 16 - BIG Bear White", new: "Travel Kit We Are Bears Ice Bear" },
      { old: "Case BESAR Bear Cat Panda Dog Bunny Duck Pink Dora Kotak Softlens 3D Tempat Lensa Capit Tongkat Variasi: 15 - BIG Bear Gray", new: "Travel Kit We Are Bears Panda" },
      { old: "SOFTLENS LIVIGN COLOR - TWILIGHT - ECLIPSE GREY NORMAL DAN MINUS Variasi:", new: "TWILIGHT" },
      { old: "SOFTLENS LIVIGN COLOR - TWILIGHT - LUNAR GREY NORMAL DAN MINUS Variasi:", new: "TWILIGHT" },
      { old: "SOFTLENS LIVIGN COLOR - TWILIGHT - TERRA BROWN NORMAL DAN MINUS Variasi:", new: "TWILIGHT" },
      { old: "Softlens Living Color Twilight Dia. 14.20 Natural Normal By Irislab Variasi:", new: "TWILIGHT" },
      { old: "LIVING COLOR TWILIGHT ECLIPSE ( -0.50 S/ -6.00) Variasi:", new: "Twilight Eclipse Grey" },
      { old: "Softlens Living Color Twilight Dia. 14.20 Natural Minus -0.50 sd -6.00 By Irislab Variasi: ECLIPSE GREY,", new: "Twilight Eclipse Grey " },
      { old: "Softlens Living Color Twilight Dia. 14.20 Natural Minus -0.50 sd -6.00 By Irislab Variasi: LUNAR GREY,", new: "Twilight Lunar Grey " },
      { old: "TWILIGHT TERRA BROWN ( NORMAL S/D -6.00) Variasi:", new: "TWILIGHT TERRA BROWN" },
      { old: "Softlens Living Color Twilight Dia. 14.20 Natural Minus -0.50 sd -6.00 By Irislab Variasi: TERRA BROWN,", new: "TWILIGHT TERRA BROWN " },
      { old: "LIVING COLOR TWILIGHT (NORMAL ONLY) Variasi: TERRA BROWN", new: "Twilight Terra Brown Normal" },
      { old: "Softlens X2 Clear 12 Bln & Miimoo Clear 6 Bln Minus -0.50 sd -10.00 (Harga Perbox/Botol isi 1 lensa) Variasi:", new: "X2 CLEAR" },
      { old: "SOFTLENS X2 CLEAR 12 MONTHS - 0.50 SD - 10.00 Variasi: CLEAR/BENING", new: "X2 CLEAR" },
      { old: "(Grosir Min. 10 Botol) Cairan Pembersih Softlens X2 Ice Simi A+ Be Seen Nicelook Sol8 60ml sd 360ml Variasi: X2 60ml", new: "X2 Comfort 60ml" },
      { old: "Cairan Pembersih Softlens | Air Cuci Softlens X2 60ml Extra Comfort Multi Purpose Solution - Expired Maret 2028 Variasi: X2,60 ML", new: "X2 Comfort 60ml" },
      { old: "(Min. Order 10 Btl) Cairan Air Tetes Mata Softlens X2 Contacts O2 15ml Freshkon Simi A+ Be Seen 15ml Variasi: X2 CONTACTS 15ml", new: "X2 CONTACTS DROPS 15ML" },
      { old: "Cairan Tetes Mata Softlens X2 Contacts 15ml Fresh With HA - Expired Juli 2027 Variasi: X2 CONTACT,15 ML", new: "X2 CONTACTS DROPS 15ML" },
      { old: "Softlens Ice No. 8 Baby & Dol Eyes Minus -0.50 sd -2.75 By Exoticon Variasi: N8 BABY", new: "X2 Ice No.8" },
      { old: "Softlens Ice No. 8 Baby & Doll Eyes Normal By Exoticon Variasi: N8 BABY", new: "X2 Ice No.8" },
      { old: "SOFTLENS X2 ICE N8 GREY ( NORMAL S/D -10,00 ) Variasi: N8 GREY", new: "X2 ICE NO.8 Grey" }
    ];
  });

  const [replacementKim, setReplacementKim] = useState<{ old: string; new: string }[]>(() => {
    const saved = localStorage.getItem("replacementKim");
    if (saved) return JSON.parse(saved);
    return [
      { old: "CAIRAN X2 60ML", new: "X2 Comfort 60ml" },
      { old: "CAPITAN SOFTLEN NEW EDISI CAMPUR", new: "Pinset" },
      { old: "ICE N8", new: "X2 ICE NO.8" },
      { old: "MACARON BLUE", new: "MACARON BERRY BLUE" },
      { old: "MACARON CHOCO", new: "MACARON CHOCO BROWN" },
      { old: "MACARON GREY", new: "MACARON SUGAR GREY" },
      { old: "MORE DUBAI", new: "NMD" },
      { old: "NEW MORE DUBAI", new: "NMD" },
      { old: "NORMAL  0.00", new: "NORMAL" },
      { old: "PENCUCI SOFTLENS MANUAL PASTEL", new: "Pencuci Manual" },
      { old: "PENCUCI SOFTLENS MANUAL POLOS", new: "Pencuci Manual" },
      { old: "PLANO", new: "NORMAL" },
      { old: "TETES A+ 10ML", new: "A+ 10ml" },
      { old: "TETES FRESHKON 10ML", new: "Freshkon 10ml" },
      { old: "TETES X2 15 ML", new: "X2 Contacts Drops 15ml" },
      { old: "TOP GEL UNIVERSAL", new: "UNIVERSAL" },
      { old: "TRAPZ BELLA HAZEL", new: "Trapezium Bella Hazel" },
      { old: "TRAPZ BELLA ONYX", new: "Trapezium Bella Onyx Black" },
      { old: "TRAPZ BELLA SMOKY", new: "Trapezium Bella Smoky" },
      { old: "TRAPZ BETEL SEPIA", new: "Trapezium Betel Sepia" },
      { old: "TRAPZZ BELLA ONYX", new: "Trapezium Bella Onyx Black" },
      { old: "X2 KPOP OCHRE", new: "KPOP Ochre Brown" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("replacementGlobal", JSON.stringify(replacementGlobal));
  }, [replacementGlobal]);


  useEffect(() => {
    localStorage.setItem("replacementKim", JSON.stringify(replacementKim));
  }, [replacementKim]);

  const [searchIklanQuery, setSearchIklanQuery] = useState("");
  const [showFullIklan, setShowFullIklan] = useState(false);
  const [iklanDisplayLimit, setIklanDisplayLimit] = useState(5);
  const [selectedReportYear, setSelectedReportYear] = useState<number>(() => new Date().getFullYear());
  const [isIklanModalOpen, setIsIklanModalOpen] = useState(false);
  const [editingIklan, setEditingIklan] = useState<Partial<Iklan>>({});
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState<Partial<WeeklySale>>({});

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Product Form state
  const [namaBarang, setNamaBarang] = useState("");
  const [kodeBarang, setKodeBarang] = useState("");
  const [supplier, setSupplier] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [stokAwal, setStokAwal] = useState("");
  const [stokBarang, setStokBarang] = useState(""); // This is for "Stok Barang Masuk"
  const [color, setColor] = useState("");
  const [bc, setBc] = useState("");
  const [kadarAir, setKadarAir] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [durasi, setDurasi] = useState("");
  const [gDia, setGDia] = useState("");
  const [diameter, setDiameter] = useState("");
  const [rating, setRating] = useState("");
  const [reviewsCount, setReviewsCount] = useState("");
  const [allowDualPower, setAllowDualPower] = useState(true);
  const [groupName, setGroupName] = useState("");

  // Product stats and stock map precomputation to completely avoid heavy O(N^2) loops during render
  const productStats = React.useMemo(() => {
    const prodIncoming = new Map<string, number>();
    const prodSales = new Map<string, number>();

    const kodeToProduct = new Map<string, Product>();
    products.forEach(p => {
      if (p.kodeBarang) {
        kodeToProduct.set(p.kodeBarang.trim().toLowerCase(), p);
      }
    });

    incomingGoods.forEach(ig => {
      let pId: string | undefined = ig.productId;
      if (!pId && ig.kodeBarang) {
        pId = kodeToProduct.get(ig.kodeBarang.trim().toLowerCase())?.id;
      }
      if (pId) {
        prodIncoming.set(pId, (prodIncoming.get(pId) || 0) + (ig.qty || 0));
      }
    });

    sales.forEach(s => {
      let pId: string | undefined = s.productId;
      if (!pId && s.kodeBarang) {
        pId = kodeToProduct.get(s.kodeBarang.trim().toLowerCase())?.id;
      }
      if (pId) {
        prodSales.set(pId, (prodSales.get(pId) || 0) + (s.qty || 0));
      }
    });

    return {
      incoming: prodIncoming,
      sales: prodSales,
      kodeToProduct
    };
  }, [products, sales, incomingGoods]);

  const productStockMap = React.useMemo(() => {
    const stockMap: Record<string, number> = {};
    const { incoming, sales: salesMap } = productStats;
    
    products.forEach(p => {
      const tt = p.id ? (salesMap.get(p.id) || 0) : 0;
      const tm = p.id ? (incoming.get(p.id) || 0) : 0;
      const finalStock = p.stokAwal + tm - tt;
      if (p.id) {
        stockMap[p.id] = finalStock;
      }
      if (p.kodeBarang) {
        stockMap[p.kodeBarang.trim().toLowerCase()] = finalStock;
      }
    });

    return stockMap;
  }, [products, productStats]);

  const [searchInventory, setSearchInventory] = useState("");
  const [localSearchInventory, setLocalSearchInventory] = useState("");

  // Advanced Inventory Filters
  const [filterKondisi, setFilterKondisi] = useState<string>("all"); // "all", "in_stock", "low_stock", "out_of_stock", "best_seller"
  const [filterSuppliers, setFilterSuppliers] = useState<string[]>([]);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [filterStockOperator, setFilterStockOperator] = useState<string>("all"); // "all", "=", "<", ">", "<=", ">="
  const [filterStockQty, setFilterStockQty] = useState<number | "">("");

  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState<number | "all">(50);
  const [salesSearch, setSalesSearch] = useState("");
  const [localSalesSearch, setLocalSalesSearch] = useState("");

  const [salesDSPage, setSalesDSPage] = useState(1);
  const [salesDSLimit, setSalesDSLimit] = useState<number | "all">(50);
  const [salesDSSearch, setSalesDSSearch] = useState("");
  const [localSalesDSSearch, setLocalSalesDSSearch] = useState("");

  const [incomingPage, setIncomingPage] = useState(1);
  const [incomingLimit, setIncomingLimit] = useState<number | "all">(50);
  const [incomingSearch, setIncomingSearch] = useState("");
  const [localIncomingSearch, setLocalIncomingSearch] = useState("");

  // Debouncing handlers for search queries to prevent input lag on keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchInventory(localSearchInventory);
    }, 200);
    return () => clearTimeout(handler);
  }, [localSearchInventory]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSalesSearch(localSalesSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [localSalesSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSalesDSSearch(localSalesDSSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [localSalesDSSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setIncomingSearch(localIncomingSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [localIncomingSearch]);

  useEffect(() => {
    setSalesPage(1);
  }, [salesSearch, salesLimit]);

  useEffect(() => {
    setSalesDSPage(1);
  }, [salesDSSearch, salesDSLimit]);

  useEffect(() => {
    setIncomingPage(1);
  }, [incomingSearch, incomingLimit]);

  // Virtualization Scroll Start Indices
  const [salesStartIndex, setSalesStartIndex] = useState(0);
  const [salesDSStartIndex, setSalesDSStartIndex] = useState(0);
  const [incomingStartIndex, setIncomingStartIndex] = useState(0);
  const [inventoryStartIndex, setInventoryStartIndex] = useState(0);

  // Sync virtual scroll ranges to 0 when pagination, search, or limits change
  useEffect(() => {
    setSalesStartIndex(0);
  }, [salesPage, salesLimit, salesSearch]);

  useEffect(() => {
    setSalesDSStartIndex(0);
  }, [salesDSPage, salesDSLimit, salesDSSearch]);

  useEffect(() => {
    setIncomingStartIndex(0);
  }, [incomingPage, incomingLimit, incomingSearch]);



  const handleSalesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const computedIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    if (Math.abs(computedIndex - salesStartIndex) >= 3 || computedIndex === 0) {
      setSalesStartIndex(computedIndex);
    }
  };

  const handleSalesDSScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const computedIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    if (Math.abs(computedIndex - salesDSStartIndex) >= 3 || computedIndex === 0) {
      setSalesDSStartIndex(computedIndex);
    }
  };

  const handleIncomingScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const computedIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    if (Math.abs(computedIndex - incomingStartIndex) >= 3 || computedIndex === 0) {
      setIncomingStartIndex(computedIndex);
    }
  };

  const handleInventoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const computedIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    if (Math.abs(computedIndex - inventoryStartIndex) >= 3 || computedIndex === 0) {
      setInventoryStartIndex(computedIndex);
    }
  };

  const [editProductId, setEditProductId] = useState<string | null>(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState<Partial<Sale>>({});
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [saleDSToDelete, setSaleDSToDelete] = useState<SaleDS | null>(null);
  
  // Export last Dropship entry states
  const [isExportDSModalOpen, setIsExportDSModalOpen] = useState(false);
  const [exportDSText, setExportDSText] = useState("");
  const [exportDSToast, setExportDSToast] = useState(false);

  // Export Stock states
  const [isExportStockModalOpen, setIsExportStockModalOpen] = useState(false);
  const [exportStockText, setExportStockText] = useState("");
  const [exportStockToast, setExportStockToast] = useState(false);

  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [incomingForm, setIncomingForm] = useState<Partial<IncomingGood>>({
    qty: 1,
  });
  const [incomingToDelete, setIncomingToDelete] = useState<IncomingGood | null>(
    null,
  );

  const [isIncomingTextModalOpen, setIsIncomingTextModalOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<
    "akumaucantik" | "anna" | "shopee" | "sisse" | "kim"
  >("akumaucantik");
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
    }[]
  >([]);

  const handleEditSale = (sale: Sale) => {
    setEditSaleId(sale.id || null);
    setSaleForm({ ...sale });
    setIsSaleModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    try {
      await deleteSale(saleToDelete);
      setSaleToDelete(null);
    } catch (err) {
      alert("Gagal menghapus transaksi");
    }
  };

  const handleDeleteDSConfirm = async () => {
    if (!saleDSToDelete) return;
    try {
      setSalesDS((prev) => prev.filter((item) => item.id !== saleDSToDelete.id));
      await deleteSaleDS(saleDSToDelete);
      setSaleDSToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Gagal menghapus transaksi dropship.");
    }
  };

  const handleAddIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingForm.productId || !incomingForm.qty) return;
    const prod = products.find((p) => p.id === incomingForm.productId);
    if (!prod) return;

    try {
      await addIncomingGood({
        productId: prod.id!,
        kodeBarang: prod.kodeBarang,
        namaBarang: prod.namaBarang,
        qty: Number(incomingForm.qty),
        tanggal: null,
        supplier: prod.supplier,
      });
      setIsIncomingModalOpen(false);
      setIncomingForm({ qty: 1 });
    } catch (err) {
      alert("Gagal menambah barang masuk");
    }
  };

  const handleDeleteIncoming = async () => {
    if (!incomingToDelete) return;
    try {
      await deleteIncomingGood(incomingToDelete);
      setIncomingToDelete(null);
    } catch (err) {
      alert("Gagal menghapus data barang masuk");
    }
  };

  const handleProcessText = () => {
    let newList: { rawName: string; qty: number }[] = [];
    if (selectedFormat === "akumaucantik") {
      newList = parseFormatAkumaucantik(rawText, replacementGlobal);
    } else if (selectedFormat === "kim") {
      newList = parseFormatKim(rawText, replacementKim, replacementGlobal);
    } else if (selectedFormat === "shopee") {
      newList = parseFormatShopee(rawText, replacementGlobal);
    } else if (selectedFormat === "sisse") {
      newList = parseFormatSisse(rawText, replacementGlobal);
    } else if (selectedFormat === "anna") {
      newList = parseFormatAnna(rawText, replacementGlobal);
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

    for (const item of itemsToSave) {
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
    }

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

  const handleUpdateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSaleId) return;
    try {
      let hppValue = saleForm.hpp || 0;
      let totalHppValue = saleForm.totalHpp || 0;

      // Try to recover HPP if missing and we have a product match
      if (hppValue === 0) {
        const product = products.find(
          (p) => p.id === saleForm.productId || p.kodeBarang === saleForm.kodeBarang
        );
        if (product) {
          hppValue = product.hargaBeli;
          totalHppValue = hppValue * (saleForm.qty || 1);
        }
      } else if (totalHppValue === 0 && hppValue > 0) {
        totalHppValue = hppValue * (saleForm.qty || 1);
      }

      const updatedLaba = (saleForm.totalHarga || 0) - totalHppValue;
      await updateSale({
        ...saleForm,
        id: editSaleId,
        hpp: hppValue,
        totalHpp: totalHppValue,
        laba: updatedLaba,
      } as Sale);
      setIsSaleModalOpen(false);
      setEditSaleId(null);
      setSaleForm({});
    } catch (err) {
      alert("Gagal mengupdate transaksi");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditProductId(product.id || null);
    setNamaBarang(product.namaBarang);
    setKodeBarang(product.kodeBarang);
    setSupplier(product.supplier || "");
    setHargaBeli((product.hargaBeli || 0).toString());
    setHargaJual((product.hargaJual || 0).toString());
    setStokAwal((product.stokAwal || 0).toString());
    setStokBarang((product.stokBarang || 0).toString());
    setColor(product.color || "");
    setBc(product.bc || "");
    setKadarAir(product.kadarAir || "");
    setImageUrl(product.imageUrl || "");
    setDurasi(product.durasi || "");
    setGDia(product.gDia || "");
    setDiameter(product.diameter || "");
    setRating(product.rating !== undefined && product.rating !== null ? product.rating.toString() : "");
    setReviewsCount(product.reviewsCount !== undefined && product.reviewsCount !== null ? product.reviewsCount.toString() : "");
    setAllowDualPower(product.allowDualPower !== undefined ? product.allowDualPower : true);
    setGroupName(product.groupName || "");
    setIsProductModalOpen(true);
  };
  const [sortConfig, setSortConfig] = useState<{
    key: any;
    direction: "asc" | "desc";
  } | null>({ key: "kodeBarang", direction: "asc" });

  const handleSort = (key: any) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    setInventoryStartIndex(0);
  }, [
    searchInventory,
    sortConfig,
    filterKondisi,
    filterSuppliers,
    filterStockOperator,
    filterStockQty
  ]);

  // Unique lists computed dynamically for dynamic multi-column selects
  const uniqueSuppliers = React.useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.supplier && p.supplier.trim()) s.add(p.supplier.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const sortedAndFilteredProducts = React.useMemo(() => {
    const { incoming, sales: salesMap } = productStats;
    let baseProducts = products.map((p) => {
      const tt = p.id ? (salesMap.get(p.id) || 0) : 0;
      const tm = p.id ? (incoming.get(p.id) || 0) : 0;
      return {
        ...p,
        terjual: tt,
        stokBarang: tm,
        stokSaatIni: p.stokAwal + tm - tt,
      };
    });

    // 1. Text Search (spesifik nama/kode)
    if (searchInventory) {
      const q = searchInventory.toLowerCase().trim();
      baseProducts = baseProducts.filter(
        (p) =>
          (p.namaBarang && p.namaBarang.toLowerCase().includes(q)) ||
          (p.kodeBarang && p.kodeBarang.toLowerCase().includes(q)),
      );
    }

    // 2. Filter Kondisi Stok (Stok Kosong, Menipis, Aman, Terlaris)
    if (filterKondisi !== "all") {
      baseProducts = baseProducts.filter((p) => {
        if (filterKondisi === "kosong") return p.stokSaatIni <= 0;
        if (filterKondisi === "menipis") return p.stokSaatIni > 0 && p.stokSaatIni <= 2;
        if (filterKondisi === "aman") return p.stokSaatIni > 2;
        if (filterKondisi === "terlaris") return p.terjual >= 10;
        return true;
      });
    }

    // 3. Filter Supplier Spesifik (Multi-Select)
    if (filterSuppliers && filterSuppliers.length > 0) {
      const lowercasedSelected = filterSuppliers.map((s) => s.toLowerCase().trim());
      baseProducts = baseProducts.filter((p) => {
        const prodSup = (p.supplier || "").trim().toLowerCase();
        return lowercasedSelected.includes(prodSup);
      });
    }

    // 4. Filter Angka Stok (dengan perbandingan operator jumlah tertentu)
    if (filterStockOperator !== "all" && filterStockQty !== "") {
      const targetQty = Number(filterStockQty);
      if (!isNaN(targetQty)) {
        baseProducts = baseProducts.filter((p) => {
          if (filterStockOperator === "=") return p.stokSaatIni === targetQty;
          if (filterStockOperator === "<") return p.stokSaatIni < targetQty;
          if (filterStockOperator === ">") return p.stokSaatIni > targetQty;
          if (filterStockOperator === "<=") return p.stokSaatIni <= targetQty;
          if (filterStockOperator === ">=") return p.stokSaatIni >= targetQty;
          return true;
        });
      }
    }

    // 9. Sort
    if (sortConfig !== null) {
      baseProducts.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        const sA = String(aVal).toLowerCase();
        const sB = String(bVal).toLowerCase();
        if (sA < sB) return sortConfig.direction === "asc" ? -1 : 1;
        if (sA > sB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return baseProducts;
  }, [
    products,
    productStats,
    searchInventory,
    sortConfig,
    filterKondisi,
    filterSuppliers,
    filterStockOperator,
    filterStockQty
  ]);

  const filteredSales = React.useMemo(() => {
    let result = [...sales];
    if (salesSearch) {
      const q = salesSearch.toLowerCase().trim();
      result = result.filter(s => 
        (s.namaBarang && s.namaBarang.toLowerCase().includes(q)) ||
        (s.kodeBarang && s.kodeBarang.toLowerCase().includes(q)) ||
        (s.noPesanan && s.noPesanan.toLowerCase().includes(q)) ||
        (s.noResi && s.noResi.toLowerCase().includes(q)) ||
        (s.channel && s.channel.toLowerCase().includes(q)) ||
        (s.namaEkspedisi && s.namaEkspedisi.toLowerCase().includes(q))
      );
    }
    return result;
  }, [sales, salesSearch]);

  const paginatedSales = React.useMemo(() => {
    if (salesLimit === "all") return filteredSales;
    const startIndex = (salesPage - 1) * salesLimit;
    return filteredSales.slice(startIndex, startIndex + salesLimit);
  }, [filteredSales, salesPage, salesLimit]);

  const filteredSalesDS = React.useMemo(() => {
    let result = [...salesDS];
    if (salesDSSearch) {
      const q = salesDSSearch.toLowerCase().trim();
      result = result.filter(s => 
        (s.namaProduk && s.namaProduk.toLowerCase().includes(q)) ||
        (s.noPesanan && s.noPesanan.toLowerCase().includes(q)) ||
        (s.noResi && s.noResi.toLowerCase().includes(q)) ||
        (s.channel && s.channel.toLowerCase().includes(q)) ||
        (s.namaPelanggan && s.namaPelanggan.toLowerCase().includes(q)) ||
        (s.kodeSupplier && s.kodeSupplier.toLowerCase().includes(q))
      );
    }
    return result;
  }, [salesDS, salesDSSearch]);

  const paginatedSalesDS = React.useMemo(() => {
    if (salesDSLimit === "all") return filteredSalesDS;
    const startIndex = (salesDSPage - 1) * salesDSLimit;
    return filteredSalesDS.slice(startIndex, startIndex + salesDSLimit);
  }, [filteredSalesDS, salesDSPage, salesDSLimit]);

  const filteredIncomingGoods = React.useMemo(() => {
    let result = [...incomingGoods];
    if (incomingSearch) {
      const q = incomingSearch.toLowerCase().trim();
      result = result.filter(g => 
        (g.namaBarang && g.namaBarang.toLowerCase().includes(q)) ||
        (g.kodeBarang && g.kodeBarang.toLowerCase().includes(q)) ||
        (g.supplier && g.supplier.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'object' && val !== null) {
            if (typeof val.toDate === 'function') return val.toDate().getTime();
            if ('seconds' in val) return val.seconds * 1000;
        }
        const date = new Date(val);
        const time = date.getTime();
        return isNaN(time) ? 0 : time;
      };

      const t1 = Math.floor(getTimestamp(a?.tanggal) / 60000);
      const t2 = Math.floor(getTimestamp(b?.tanggal) / 60000);

      if (t2 !== t1) {
        return t2 - t1;
      }
      
      // If same minute, sort by kodeBarang (ascending)
      const codeA = (a?.kodeBarang || "").toLowerCase();
      const codeB = (b?.kodeBarang || "").toLowerCase();
      
      return codeA.localeCompare(codeB);
    });
  }, [incomingGoods, incomingSearch]);

  const paginatedIncomingGoods = React.useMemo(() => {
    if (incomingLimit === "all") return filteredIncomingGoods;
    const startIndex = (incomingPage - 1) * incomingLimit;
    return filteredIncomingGoods.slice(startIndex, startIndex + incomingLimit);
  }, [filteredIncomingGoods, incomingPage, incomingLimit]);

  const virtualizedSales = React.useMemo(() => {
    const start = Math.min(salesStartIndex, Math.max(0, paginatedSales.length - VISIBLE_ROWS_COUNT));
    const end = Math.min(paginatedSales.length, start + VISIBLE_ROWS_COUNT + 10);
    return {
      slice: paginatedSales.slice(start, end),
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (paginatedSales.length - end) * ROW_HEIGHT)
    };
  }, [paginatedSales, salesStartIndex]);

  const virtualizedSalesDS = React.useMemo(() => {
    const start = Math.min(salesDSStartIndex, Math.max(0, paginatedSalesDS.length - VISIBLE_ROWS_COUNT));
    const end = Math.min(paginatedSalesDS.length, start + VISIBLE_ROWS_COUNT + 10);
    return {
      slice: paginatedSalesDS.slice(start, end),
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (paginatedSalesDS.length - end) * ROW_HEIGHT)
    };
  }, [paginatedSalesDS, salesDSStartIndex]);

  const virtualizedIncomingGoods = React.useMemo(() => {
    const start = Math.min(incomingStartIndex, Math.max(0, paginatedIncomingGoods.length - VISIBLE_ROWS_COUNT));
    const end = Math.min(paginatedIncomingGoods.length, start + VISIBLE_ROWS_COUNT + 10);
    return {
      slice: paginatedIncomingGoods.slice(start, end),
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (paginatedIncomingGoods.length - end) * ROW_HEIGHT)
    };
  }, [paginatedIncomingGoods, incomingStartIndex]);

  const virtualizedProducts = React.useMemo(() => {
    const start = Math.min(inventoryStartIndex, Math.max(0, sortedAndFilteredProducts.length - VISIBLE_ROWS_COUNT));
    const end = Math.min(sortedAndFilteredProducts.length, start + VISIBLE_ROWS_COUNT + 10);
    return {
      slice: sortedAndFilteredProducts.slice(start, end),
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (sortedAndFilteredProducts.length - end) * ROW_HEIGHT)
    };
  }, [sortedAndFilteredProducts, inventoryStartIndex]);

  interface DraftSale {
    id: string;
    tanggalOrder: string;
    channel: string;
    noPesanan: string;
    noResi: string;
    namaEkspedisi: string;
    jenisBarang: string;
    qty: number | "";
    totalPenjualan: number;
    productId?: string;
  }
  const [draftSales, setDraftSales] = useState<DraftSale[]>(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: Date.now() + "-" + i,
      tanggalOrder: "",
      channel: "",
      noPesanan: "",
      noResi: "",
      namaEkspedisi: "",
      jenisBarang: "",
      qty: "",
      totalPenjualan: 0,
    }));
  });

  const [history, setHistory] = useState<DraftSale[][]>([]);

  const pushToHistory = (currentData: DraftSale[]) => {
    setHistory((prev) =>
      [JSON.parse(JSON.stringify(currentData)), ...prev].slice(0, 30),
    );
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setDraftSales(last);
    setHistory(rest);
  };

  const handlePasteSales = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text");

    // Help clean up numeric strings
    const parseIndoNumber = (val: string) => {
      if (!val) return 0;
      // Remove Rp, space, and thousand separator (.)
      let clean = val.replace(/Rp/i, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    };

    // Try splitting by tabs first (standard for Excel/Sheets)
    let rows = paste.split(/\r?\n/).filter((r) => r.trim() !== "");
    let newDrafts: DraftSale[] = [];

    rows.forEach((row, idx) => {
      // Try tab split first
      let cols = row.split("\t");

      // Fallback: if only 1 column found but it's a long string, try multiple spaces
      if (cols.length < 2 && row.includes("  ")) {
        cols = row.split(/ {2,}/); // 2 or more spaces
      }
      // Last resort fallback for single space if it has many segments (risky but better than nothing)
      if (cols.length < 2 && row.split(" ").length >= 7) {
        cols = row.split(" ");
      }

      if (cols.length >= 2) {
        newDrafts.push({
          id:
            Date.now() +
            "-" +
            idx +
            "-" +
            Math.random().toString(36).substr(2, 5),
          tanggalOrder: normalizeOrderDate(cols[0]?.trim() || ""),
          channel: cols[1]?.trim() || "",
          noPesanan: cols[2]?.trim() || "",
          noResi: cols[3]?.trim() || "",
          namaEkspedisi: cols[4]?.trim() || "",
          jenisBarang: cols[5]?.trim() || "",
          qty: parseIndoNumber(cols[6]) || 1,
          totalPenjualan: parseIndoNumber(cols[7]) || 0,
        });
      }
    });

    if (newDrafts.length > 0) {
      e.preventDefault();
      pushToHistory(draftSales);
      setDraftSales((prev) => {
        const result = [...prev];
        let pasteIdx = 0;

        // Try to fill empty rows first
        for (let i = 0; i < result.length && pasteIdx < newDrafts.length; i++) {
          const isEmpty =
            !result[i].tanggalOrder &&
            !result[i].noPesanan &&
            !result[i].jenisBarang;
          if (isEmpty) {
            result[i] = { ...newDrafts[pasteIdx], id: result[i].id }; // Keep original ID if possible or just use new one
            pasteIdx++;
          }
        }

        // If there's still data left to paste, append it
        if (pasteIdx < newDrafts.length) {
          return [...result, ...newDrafts.slice(pasteIdx)];
        }

        return result;
      });
    }
  };

  const handleUpdateDraft = (
    id: string,
    field: keyof DraftSale,
    value: any,
  ) => {
    pushToHistory(draftSales);
    setDraftSales((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleRemoveDraftRow = (id: string) => {
    pushToHistory(draftSales);
    setDraftSales((prev) => prev.filter((d) => d.id !== id));
  };

  const findMatchedProduct = (jenisBarang: string, productId?: string) => {
    if (productId) return products.find((p) => p.id === productId);
    if (!jenisBarang) return undefined;
    const search = jenisBarang.trim().toLowerCase();

    // 1. Exact match Nama
    let match = products.find(
      (p) => p.namaBarang?.trim().toLowerCase() === search,
    );
    if (match) return match;

    // 2. Exact match Kode
    match = products.find((p) => p.kodeBarang?.trim().toLowerCase() === search);
    if (match) return match;

    // 3. Partial match
    match = products.find((p) => {
      const nama = p.namaBarang?.trim().toLowerCase();
      if (!nama || nama.length < 3) return false;
      return search.includes(nama) || nama.includes(search);
    });
    return match;
  };

  const handleSaveDraftSales = async () => {
    if (draftSales.length === 0) return;

    const unmatched = draftSales.filter(
      (d) => d.jenisBarang && !findMatchedProduct(d.jenisBarang, d.productId),
    );
    if (unmatched.length > 0) {
      if (
        !confirm(
          `Ada ${unmatched.length} baris yang tidak ditemukan di master data Stok (!! TIDAK ADA !!). Tetap simpan sebagai data Umum?`,
        )
      ) {
        return;
      }
    }

    let successCount = 0;
    for (const draft of draftSales) {
      if (!draft.jenisBarang) continue;

      const product = findMatchedProduct(draft.jenisBarang, draft.productId);

      if (product) {
        try {
          await processSale(product, Number(draft.qty) || 1, {
            tanggalOrder: normalizeOrderDate(draft.tanggalOrder || new Date()),
            channel: draft.channel,
            noPesanan: draft.noPesanan,
            noResi: draft.noResi,
            namaEkspedisi: draft.namaEkspedisi,
            totalHarga: draft.totalPenjualan,
          });
          successCount++;
        } catch (e) {
          console.error("Sale error", e);
        }
      } else {
        // imported record without matching product
        try {
          await addSaleRecord(
            "UNKNOWN",
            draft.jenisBarang,
            Number(draft.qty) || 1,
            draft.totalPenjualan,
            {
              tanggalOrder: normalizeOrderDate(draft.tanggalOrder || new Date()),
              channel: draft.channel,
              noPesanan: draft.noPesanan,
              noResi: draft.noResi,
              namaEkspedisi: draft.namaEkspedisi,
            },
          );
          successCount++;
        } catch (e) {
          console.error("Sale error", e);
        }
      }
    }

    alert(`Berhasil menyimpan ${successCount} data penjualan!`);
    setDraftSales(() => {
      return Array.from({ length: 100 }, (_, i) => ({
        id: Date.now() + "-" + i,
        tanggalOrder: "",
        channel: "",
        noPesanan: "",
        noResi: "",
        namaEkspedisi: "",
        jenisBarang: "",
        qty: 1,
        totalPenjualan: 0,
      }));
    });
  };

  const prepareExportTextForDS = (ds: any) => {
    const resi = (ds.noResi || "").trim();
    const nama = (ds.namaPelanggan || "").trim();
    const alamat = (ds.alamatPelanggan || "").trim();
    const pesanan = `${(ds.namaProduk || "").trim()}`;

    const formatted = `${resi}\nNama: ${nama}\nAlamat: ${alamat}\nPESANAN:\n${pesanan}\nPengirim: Zendiix`;

    setExportDSText(formatted);
    setIsExportDSModalOpen(true);
  };

  const handleExportLastDropship = () => {
    // 1. Get complete items in salesDS
    const completeDS = salesDS.filter((s) => (
      s.noResi && s.noResi.trim() &&
      s.namaPelanggan && s.namaPelanggan.trim() &&
      s.alamatPelanggan && s.alamatPelanggan.trim() &&
      s.namaProduk && s.namaProduk.trim()
    ));

    if (completeDS.length === 0) {
      alert("Tidak ada baris dengan data lengkap (Resi, Nama, Alamat, Pesanan) di transaksi Dropship.");
      return;
    }

    // 2. Sort complete items descending by order date or original date to get the absolute last (newest) record
    const sortedDS = [...completeDS].sort((a, b) => {
      const getMs = (item: any) => {
        if (item.tanggal) {
          if (typeof item.tanggal.seconds === "number") return item.tanggal.seconds * 1000;
          const dObj = new Date(item.tanggal);
          if (!isNaN(dObj.getTime())) return dObj.getTime();
        }
        if (item.tanggalOrder) {
          // If in dd/mm/yyyy format we should convert it or parse it
          const parts = item.tanggalOrder.split("/");
          if (parts.length === 3) {
            // Assume dd/mm/yyyy
            const dObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(dObj.getTime())) return dObj.getTime();
          }
          const dObj = new Date(item.tanggalOrder);
          if (!isNaN(dObj.getTime())) return dObj.getTime();
        }
        return 0;
      };
      return getMs(b) - getMs(a);
    });

    // 3. Take the last entry
    const lastDS = sortedDS[0];

    // 4. Construct formated text:
    prepareExportTextForDS(lastDS);
  };

  // Dropship Sales states and handlers
  interface DraftSaleDS {
    id: string;
    kodeSupplier: string;
    tanggalOrder: string;
    channel: string;
    noPesanan: string;
    noResi: string;
    namaPelanggan: string;
    alamatPelanggan: string;
    namaProduk: string;
    qty: number | "";
    hpp: number;
    totalPenjualan: number;
    ongkosKirim: number;
    laba: number;
  }

  const [draftSalesDS, setDraftSalesDS] = useState<DraftSaleDS[]>(() => {
    return Array.from({ length: 1 }, (_, i) => ({
      id: Date.now() + "-ds-" + i,
      kodeSupplier: "",
      tanggalOrder: "",
      channel: "",
      noPesanan: "",
      noResi: "",
      namaPelanggan: "",
      alamatPelanggan: "",
      namaProduk: "",
      qty: "",
      hpp: 0,
      totalPenjualan: 0,
      ongkosKirim: 0,
      laba: 0,
    }));
  });

  const [historyDS, setHistoryDS] = useState<DraftSaleDS[][]>([]);
  const [pasteInputText, setPasteInputText] = useState("");

  const handleManualParseDS = (text: string) => {
    if (!text.trim()) return;
    
    // Parse using Papa.parse
    const result = Papa.parse<string[]>(text, { 
      header: false, 
      skipEmptyLines: true,
      delimiter: text.includes("\t") ? "\t" : ",",
    });

    if (!result.data || result.data.length === 0) return;

    const parseIndoNumber = (val: string) => {
      if (!val) return 0;
      let clean = val.toString().replace(/Rp/i, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    };

    let newDrafts: DraftSaleDS[] = [];
    let rowsToProcess = result.data;

    if (rowsToProcess.length > 0) {
      const firstRowStr = rowsToProcess[0].join(" ").toLowerCase();
      if (
        firstRowStr.includes("kode supplier") || 
        firstRowStr.includes("supplier") || 
        firstRowStr.includes("tgl. order") ||
        firstRowStr.includes("channel") ||
        firstRowStr.includes("no. pesanan")
      ) {
        rowsToProcess = rowsToProcess.slice(1);
      }
    }

    rowsToProcess.forEach((cols, idx) => {
      if (cols.length >= 2) {
        const qtyVal = parseIndoNumber(cols[7]) || 1;
        const hppVal = parseIndoNumber(cols[8]) || 0;
        const totalPenjualanVal = parseIndoNumber(cols[9]) || 0;
        let labaVal = parseIndoNumber(cols[11]) || 0;
        
        if (labaVal === 0 && totalPenjualanVal > 0) {
          labaVal = totalPenjualanVal - (hppVal * qtyVal);
        }

        let matchedSupplier = "";
        for (const col of cols) {
          if (col) {
            const cleanCol = col.trim().toUpperCase();
            const found = DROPSHIP_SUPPLIERS.find(s => s.toUpperCase() === cleanCol);
            if (found) {
              matchedSupplier = found;
              break;
            }
          }
        }
        if (!matchedSupplier) {
          matchedSupplier = findSupplierForProduct(cols[6] || "");
        }

        newDrafts.push({
          id: Date.now() + "-ds-paste-" + idx + "-" + Math.random().toString(36).substring(2, 7),
          kodeSupplier: matchedSupplier,
          tanggalOrder: normalizeOrderDate(cols[0]?.trim() || ""),
          channel: cols[1]?.trim() || "",
          noPesanan: cols[2]?.trim() || "",
          noResi: cols[3]?.trim() || "",
          namaPelanggan: cols[4]?.trim() || "",
          alamatPelanggan: cols[5] || "",
          namaProduk: cols[6] || "",
          qty: qtyVal,
          hpp: hppVal,
          totalPenjualan: totalPenjualanVal,
          ongkosKirim: parseIndoNumber(cols[10]) || 0,
          laba: labaVal,
        });
      }
    });

    if (newDrafts.length > 0) {
      pushToHistoryDS(draftSalesDS);
      setDraftSalesDS((prev) => {
        const res = [...prev];
        let pasteIdx = 0;

        for (let i = 0; i < res.length && pasteIdx < newDrafts.length; i++) {
          const isEmpty =
            !res[i].tanggalOrder &&
            !res[i].noPesanan &&
            !res[i].namaProduk;
          if (isEmpty) {
            const existingSupplier = res[i].kodeSupplier;
            res[i] = { 
              ...newDrafts[pasteIdx], 
              id: res[i].id, 
              kodeSupplier: existingSupplier || newDrafts[pasteIdx].kodeSupplier 
            };
            pasteIdx++;
          }
        }

        if (pasteIdx < newDrafts.length) {
          return [...res, ...newDrafts.slice(pasteIdx)];
        }
        return res;
      });
      setPasteInputText("");
    } else {
      alert("Format teks tidak dapat dideteksi. Pastikan baris data memiliki setidaknya 2 kolom atau dicopy dari tabel spreadsheet.");
    }
  };

  const pushToHistoryDS = (currentData: DraftSaleDS[]) => {
    setHistoryDS((prev) =>
      [JSON.parse(JSON.stringify(currentData)), ...prev].slice(0, 30),
    );
  };

  const handleUndoDS = () => {
    if (historyDS.length === 0) return;
    const [last, ...rest] = historyDS;
    setDraftSalesDS(last);
    setHistoryDS(rest);
  };

  const handlePasteSalesDS = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text");
    
    // Parse using Papa.parse
    const result = Papa.parse<string[]>(paste, { 
      header: false, 
      skipEmptyLines: true,
      delimiter: paste.includes("\t") ? "\t" : ",",
    });

    if (!result.data || result.data.length === 0) return;
 
    // Help clean up numeric strings
    const parseIndoNumber = (val: string) => {
      if (!val) return 0;
      // Remove Rp, space, and thousand separator (.)
      let clean = val.toString().replace(/Rp/i, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    };

    let newDrafts: DraftSaleDS[] = [];
    let rowsToProcess = result.data;

    if (rowsToProcess.length > 0) {
      const firstRowStr = rowsToProcess[0].join(" ").toLowerCase();
      if (
        firstRowStr.includes("kode supplier") || 
        firstRowStr.includes("supplier") || 
        firstRowStr.includes("tgl. order") ||
        firstRowStr.includes("channel") ||
        firstRowStr.includes("no. pesanan")
      ) {
        rowsToProcess = rowsToProcess.slice(1);
      }
    }

    rowsToProcess.forEach((cols, idx) => {
      if (cols.length >= 2) {
        // Shifted indices: cols[0] is Tgl Order, cols[1] is Channel, etc.
        const qtyVal = parseIndoNumber(cols[7]) || 1;
        const hppVal = parseIndoNumber(cols[8]) || 0;
        const totalPenjualanVal = parseIndoNumber(cols[9]) || 0;
        let labaVal = parseIndoNumber(cols[11]) || 0;
        
        if (labaVal === 0 && totalPenjualanVal > 0) {
          labaVal = totalPenjualanVal - (hppVal * qtyVal);
        }

        // Auto-detect supplier code
        let matchedSupplier = "";
        for (const col of cols) {
          if (col) {
            const cleanCol = col.trim().toUpperCase();
            const found = DROPSHIP_SUPPLIERS.find(s => s.toUpperCase() === cleanCol);
            if (found) {
              matchedSupplier = found;
              break;
            }
          }
        }
        if (!matchedSupplier) {
          matchedSupplier = findSupplierForProduct(cols[6] || "");
        }

        newDrafts.push({
          id: Date.now() + "-ds-paste-" + idx + "-" + Math.random().toString(36).substring(2, 7),
          kodeSupplier: matchedSupplier, // Auto-detected from columns or products catalog
          tanggalOrder: normalizeOrderDate(cols[0]?.trim() || ""),
          channel: cols[1]?.trim() || "",
          noPesanan: cols[2]?.trim() || "",
          noResi: cols[3]?.trim() || "",
          namaPelanggan: cols[4]?.trim() || "",
          alamatPelanggan: (cols[5] || ""), // Keep newlines for address
          namaProduk: (cols[6] || ""), // Keep newlines for products
          qty: qtyVal,
          hpp: hppVal,
          totalPenjualan: totalPenjualanVal,
          ongkosKirim: parseIndoNumber(cols[10]) || 0,
          laba: labaVal,
        });
      }
    });

    if (newDrafts.length > 0) {
      e.preventDefault();
      pushToHistoryDS(draftSalesDS);
      setDraftSalesDS((prev) => {
        const res = [...prev];
        let pasteIdx = 0;

        for (let i = 0; i < res.length && pasteIdx < newDrafts.length; i++) {
          const isEmpty =
            !res[i].tanggalOrder &&
            !res[i].noPesanan &&
            !res[i].namaProduk;
          if (isEmpty) {
            // Keep the pre-selected supplier if it exists
            const existingSupplier = res[i].kodeSupplier;
            res[i] = { 
              ...newDrafts[pasteIdx], 
              id: res[i].id, 
              kodeSupplier: existingSupplier || newDrafts[pasteIdx].kodeSupplier 
            };
            pasteIdx++;
          }
        }

        if (pasteIdx < newDrafts.length) {
          return [...res, ...newDrafts.slice(pasteIdx)];
        }
        return res;
      });
    }
  };

  const handleUpdateDraftDS = (
    id: string,
    field: keyof DraftSaleDS,
    value: any,
  ) => {
    pushToHistoryDS(draftSalesDS);
    setDraftSalesDS((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, [field]: value };
        if (field === "qty" || field === "hpp" || field === "totalPenjualan" || field === "ongkosKirim") {
          const q = Number(updated.qty) || 0;
          const h = Number(updated.hpp) || 0;
          const tp = Number(updated.totalPenjualan) || 0;
          const ok = Number(updated.ongkosKirim) || 0;
          updated.laba = tp - (h * q) - ok;
        }
        return updated;
      }),
    );
  };

  const handleAddRowDS = () => {
    pushToHistoryDS(draftSalesDS);
    setDraftSalesDS((prev) => [
      ...prev,
      {
        id: Date.now() + "-ds-manual-" + Math.random().toString(36).substring(2, 7),
        kodeSupplier: "",
        tanggalOrder: "",
        channel: "",
        noPesanan: "",
        noResi: "",
        namaPelanggan: "",
        alamatPelanggan: "",
        namaProduk: "",
        qty: "",
        hpp: 0,
        totalPenjualan: 0,
        ongkosKirim: 0,
        laba: 0,
      },
    ]);
  };

  const [showResetConfirmDS, setShowResetConfirmDS] = useState(false);

  const confirmResetDS = () => {
    pushToHistoryDS(draftSalesDS);
    const newId = Date.now() + "-ds-reset";
    setDraftSalesDS([
      {
        id: newId,
        kodeSupplier: "",
        tanggalOrder: "",
        channel: "",
        noPesanan: "",
        noResi: "",
        namaPelanggan: "",
        alamatPelanggan: "",
        namaProduk: "",
        qty: "",
        hpp: 0,
        totalPenjualan: 0,
        ongkosKirim: 0,
        laba: 0,
      },
    ]);
    setShowResetConfirmDS(false);
  };

  const handleRemoveDraftRowDS = (id: string) => {
    pushToHistoryDS(draftSalesDS);
    setDraftSalesDS((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveDraftSalesDS = async () => {
    const validDrafts = draftSalesDS.filter(
      (d) => d.namaProduk.trim() && d.totalPenjualan
    );
    if (validDrafts.length === 0) {
      alert("Tidak ada baris valid untuk disimpan. Pastikan nama produk dan total penjualan terisi.");
      return;
    }

    // Auto-detect or validate supplier codes
    for (const draft of validDrafts) {
      if (!draft.kodeSupplier) {
        const detected = findSupplierForProduct(draft.namaProduk);
        if (detected) {
          draft.kodeSupplier = detected;
        } else {
          alert(`Baris produk "${draft.namaProduk}" belum memilih Kode Supplier. Silakan tentukan supplier terlebih dahulu.`);
          return;
        }
      }
    }

    let successCount = 0;
    for (const draft of validDrafts) {
      try {
        await addSaleDSRecord({
          kodeSupplier: draft.kodeSupplier,
          tanggalOrder: normalizeOrderDate(draft.tanggalOrder || new Date()),
          channel: draft.channel,
          noPesanan: draft.noPesanan,
          noResi: draft.noResi,
          namaPelanggan: draft.namaPelanggan,
          alamatPelanggan: draft.alamatPelanggan,
          namaProduk: draft.namaProduk,
          qty: Number(draft.qty) || 1,
          hpp: Number(draft.hpp) || 0,
          totalPenjualan: Number(draft.totalPenjualan) || 0,
          ongkosKirim: Number(draft.ongkosKirim) || 0,
          laba: Number(draft.laba) || 0,
        });
        successCount++;
      } catch (e) {
        console.error("Failed to add dropship sale record", e);
      }
    }

    alert(`Berhasil menyimpan ${successCount} data penjualan Dropship (DS)!`);
    
    // Automatically prepare export for the last saved record
    if (validDrafts.length > 0) {
      prepareExportTextForDS(validDrafts[validDrafts.length - 1]);
    }

    setDraftSalesDS(() => {
      return Array.from({ length: 1 }, (_, i) => ({
        id: Date.now() + "-ds-" + i,
        kodeSupplier: "",
        tanggalOrder: "",
        channel: "",
        noPesanan: "",
        noResi: "",
        namaPelanggan: "",
        alamatPelanggan: "",
        namaProduk: "",
        qty: "",
        hpp: 0,
        totalPenjualan: 0,
        ongkosKirim: 0,
        laba: 0,
      }));
    });
    setHistoryDS([]);
  };

  // Advertising (Iklan) states and handlers
  interface DraftIklan {
    id: string;
    tanggal: string;
    totalPembayaran: number | "";
    noPesanan: string;
  }

  const handleOpenIklanModal = (iklan: Partial<Iklan> = {}) => {
    setEditingIklan(iklan);
    setIsIklanModalOpen(true);
  };

  const handlePasteInIklanModal = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const parts = paste.split(/\t+/).map(p => p.trim()).filter(Boolean);
    
    if (parts.length >= 2) {
      const tanggal = parts[0];
      const rawPembayaran = parts[1];
      // Remove 'Rp' and thousand separator dots, and handle comma for decimal if necessary
      const pembayaranStr = rawPembayaran.replace(/Rp|\./g, "").replace(",", ".").trim();
      const pembayaran = Number(pembayaranStr);
      const noPesanan = parts[2] ? parts[2] : "";
      
      setEditingIklan(prev => ({
        ...prev,
        tanggal,
        totalPembayaran: isNaN(pembayaran) ? "" : pembayaran,
        noPesanan
      }));
    }
  };

  const handleSaveIklan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIklan.tanggal || !editingIklan.totalPembayaran) return;

    const data = {
      tanggal: editingIklan.tanggal,
      totalPembayaran: Number(editingIklan.totalPembayaran),
      noPesanan: editingIklan.noPesanan || "",
    };

    if (editingIklan.id) {
      await updateIklan({ id: editingIklan.id, ...data });
    } else {
      await addIklanRecord(data);
    }
    setIsIklanModalOpen(false);
    setEditingIklan({});
  };

  const [iklanToDelete, setIklanToDelete] = useState<Iklan | null>(null);
  const handleDeleteIklanLocal = async () => {
    if (iklanToDelete) {
      await deleteIklan(iklanToDelete);
      setIklanToDelete(null);
    }
  };

  const handleOpenWeeklyModal = (weekly: Partial<WeeklySale> = {}) => {
    setEditingWeekly(weekly);
    setIsWeeklyModalOpen(true);
  };

  const handleSaveWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWeekly.tahun === undefined || editingWeekly.bulan === undefined || editingWeekly.minggu === undefined) return;

    const data: Omit<WeeklySale, "id" | "createdAt"> = {
      tahun: Number(editingWeekly.tahun),
      bulan: Number(editingWeekly.bulan),
      minggu: Number(editingWeekly.minggu),
      tanggalStart: Number(editingWeekly.tanggalStart) || 0,
      tanggalEnd: Number(editingWeekly.tanggalEnd) || 0,
      profit: Number(editingWeekly.profit) || 0,
      profitDS: Number(editingWeekly.profitDS) || 0,
      totalProfit: (Number(editingWeekly.profit) || 0) + (Number(editingWeekly.profitDS) || 0) - (Number(editingWeekly.iklan) || 0),
      iklan: Number(editingWeekly.iklan) || 0,
      roi: Number(editingWeekly.roi) || 0,
      hpp: Number(editingWeekly.hpp) || 0,
    };

    if (editingWeekly.id) {
      await updateWeeklySale({ id: editingWeekly.id, ...data } as WeeklySale);
    } else {
      await addWeeklySaleRecord(data);
    }
    setIsWeeklyModalOpen(false);
    setEditingWeekly({});
  };

  const [draftIklan, setDraftIklan] = useState<DraftIklan[]>(() => []); // Initially empty now

  const [historyIklan, setHistoryIklan] = useState<DraftIklan[][]>([]);

  const pushToHistoryIklan = (currentData: DraftIklan[]) => {
    setHistoryIklan((prev) =>
      [JSON.parse(JSON.stringify(currentData)), ...prev].slice(0, 30)
    );
  };

  const handleUndoIklan = () => {
    if (historyIklan.length === 0) return;
    const [last, ...rest] = historyIklan;
    setDraftIklan(last);
    setHistoryIklan(rest);
  };

  const handlePasteIklan = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text");
    const result = Papa.parse<string[]>(paste, {
      header: false,
      skipEmptyLines: true,
      delimiter: paste.includes("\t") ? "\t" : ",",
    });

    if (!result.data || result.data.length === 0) return;

    const parseIndoNumber = (val: string) => {
      if (!val) return 0;
      const clean = val.toString().replace(/\./g, "").replace(/,/g, ".").trim();
      const num = Number(clean);
      return isNaN(num) ? 0 : num;
    };

    let newDrafts: DraftIklan[] = [];
    let rowsToProcess = result.data;

    // Check header
    if (rowsToProcess.length > 0) {
      const firstRowStr = rowsToProcess[0].join(" ").toLowerCase();
      if (
        firstRowStr.includes("tanggal") ||
        firstRowStr.includes("tgl") ||
        firstRowStr.includes("total pembayaran") ||
        firstRowStr.includes("no.pesanan") ||
        firstRowStr.includes("pesanan")
      ) {
        rowsToProcess = rowsToProcess.slice(1);
      }
    }

    rowsToProcess.forEach((cols, idx) => {
      if (cols.length >= 2) {
        newDrafts.push({
          id: Date.now() + "-iklan-paste-" + idx + "-" + Math.random().toString(36).substring(2, 7),
          tanggal: cols[0]?.trim() || "",
          totalPembayaran: parseIndoNumber(cols[1]) || 0,
          noPesanan: cols[2]?.trim() || "",
        });
      }
    });

    if (newDrafts.length > 0) {
      e.preventDefault();
      pushToHistoryIklan(draftIklan);
      setDraftIklan((prev) => {
        const res = [...prev];
        let pasteIdx = 0;

        for (let i = 0; i < res.length && pasteIdx < newDrafts.length; i++) {
          const isEmpty = !res[i].tanggal && !res[i].totalPembayaran && !res[i].noPesanan;
          if (isEmpty) {
            res[i] = { ...newDrafts[pasteIdx], id: res[i].id };
            pasteIdx++;
          }
        }

        if (pasteIdx < newDrafts.length) {
          return [...res, ...newDrafts.slice(pasteIdx)];
        }
        return res;
      });
    }
  };

  const handleUpdateDraftIklan = (id: string, field: keyof DraftIklan, value: any) => {
    pushToHistoryIklan(draftIklan);
    setDraftIklan((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleRemoveDraftRowIklan = (id: string) => {
    pushToHistoryIklan(draftIklan);
    setDraftIklan((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveDraftIklan = async () => {
    const validDrafts = draftIklan.filter((d) => d.tanggal.trim() && d.totalPembayaran);
    if (validDrafts.length === 0) {
      alert("Tidak ada baris valid untuk disimpan. Pastikan tanggal dan total pembayaran terisi.");
      return;
    }

    let successCount = 0;
    for (const draft of validDrafts) {
      try {
        await addIklanRecord({
          tanggal: draft.tanggal,
          totalPembayaran: Number(draft.totalPembayaran) || 0,
          noPesanan: draft.noPesanan,
        });
        successCount++;
      } catch (e) {
        console.error("Failed to add iklan record", e);
      }
    }

    alert(`Berhasil menyimpan ${successCount} data iklan!`);
    setDraftIklan(() => {
      return Array.from({ length: 100 }, (_, i) => ({
        id: Date.now() + "-iklan-" + i,
        tanggal: "",
        totalPembayaran: "",
        noPesanan: "",
      }));
    });
    setHistoryIklan([]);
  };



  const getWeeklyCalculations = () => {
    const parsedSales = sales.map((s) => {
      const d = s.tanggalOrder ? parseToDate(s.tanggalOrder) : parseToDate(s.tanggal);
      return {
        ...s,
        parsedDate: d,
        year: d ? d.getFullYear() : 0,
        month: d ? d.getMonth() + 1 : 0, // 1-12
        day: d ? d.getDate() : 0,
      };
    }).filter((s) => s.year === selectedReportYear);

    const parsedSalesDS = salesDS.map((s) => {
      const d = s.tanggalOrder ? parseToDate(s.tanggalOrder) : parseToDate(s.tanggal);
      return {
        ...s,
        parsedDate: d,
        year: d ? d.getFullYear() : 0,
        month: d ? d.getMonth() + 1 : 0, // 1-12
        day: d ? d.getDate() : 0,
      };
    }).filter((s) => s.year === selectedReportYear);

    const parsedIklanList = iklanList.map((i) => {
      const d = parseToDate(i.tanggal);
      return {
        ...i,
        parsedDate: d,
        year: d ? d.getFullYear() : 0,
        month: d ? d.getMonth() + 1 : 0, // 1-12
        day: d ? d.getDate() : 0,
      };
    }).filter((i) => i.year === selectedReportYear);

    return { parsedSales, parsedSalesDS, parsedIklanList };
  };

  // File Inputs
  const productFileInput = useRef<HTMLInputElement>(null);
  const saleFileInput = useRef<HTMLInputElement>(null);
  const incomingFileInput = useRef<HTMLInputElement>(null);
  const salesDSFileInput = useRef<HTMLInputElement>(null);
  const iklanFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authStat = localStorage.getItem("isAdminLoggedIn");
    if (authStat === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (activeTab === "form" && history.length > 0) {
          e.preventDefault();
          handleUndo();
        } else if (activeTab === "input_penjualan_ds" && historyDS.length > 0) {
          e.preventDefault();
          handleUndoDS();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, history, historyDS]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubIklan = subscribeToIklan(setIklanList);
      const unsubWeekly = subscribeToWeeklySales(setWeeklySalesList);
      return () => {
        unsubIklan();
        unsubWeekly();
      };
    } else {
      setSales([]);
      setIncomingGoods([]);
      setSalesDS([]);
      setIklanList([]);
      setWeeklySalesList([]);
    }
  }, [isAuthenticated]);



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordInput })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setIsAuthenticated(true);
          localStorage.setItem("isAdminLoggedIn", "true");
          setLoginError("");
        } else {
          setLoginError(data.error || "Password salah!");
        }
      })
      .catch(err => {
        console.error('Failed to login via API', err);
        setLoginError("Koneksi gagal / Server sedang sibuk.");
      });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAdminLoggedIn");
  };

  const handleCancelEdit = () => {
    setEditProductId(null);
    setNamaBarang("");
    setKodeBarang("");
    setSupplier("");
    setHargaBeli("");
    setHargaJual("");
    setStokAwal("");
    setStokBarang("");
    setColor("");
    setBc("");
    setKadarAir("");
    setImageUrl("");
    setDurasi("");
    setGDia("");
    setDiameter("");
    setRating("");
    setReviewsCount("");
    setAllowDualPower(true);
    setGroupName("");
    setIsProductModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang || !kodeBarang || !hargaBeli || !supplier || !stokAwal)
      return;
    // Note: stokBarang (Masuk) is optional, defaults to 0 if not provided

    const existingProduct = editProductId
      ? products.find((p) => p.id === editProductId)
      : products.find(
          (p) =>
            p.kodeBarang.toLowerCase() === kodeBarang.toLowerCase() ||
            p.namaBarang.toLowerCase() === namaBarang.toLowerCase(),
        );

    try {
      const payload = {
        id: editProductId || existingProduct?.id,
        kodeBarang,
        namaBarang,
        supplier,
        hargaBeli: Number(hargaBeli),
        hargaJual: existingProduct?.hargaJual || 0,
        stokAwal: Number(stokAwal),
        color,
        bc,
        kadarAir,
        imageUrl: imageUrl || undefined,
        durasi: durasi || undefined,
        gDia: gDia || undefined,
        diameter: diameter || undefined,
        rating: rating ? Number(rating) : undefined,
        reviewsCount: reviewsCount ? Number(reviewsCount) : undefined,
        allowDualPower: allowDualPower,
        groupName: groupName || undefined,
      };

      const resultId = await upsertProduct(payload);

      // Propagate series-level metadata to all other products sharing the same series name
      const otherVariants = products.filter(
        (p) => p.namaBarang.toLowerCase() === namaBarang.toLowerCase() && p.id !== (editProductId || existingProduct?.id || resultId)
      );
      if (otherVariants.length > 0) {
        for (const variant of otherVariants) {
          if (variant.id) {
            await upsertProduct({
              ...variant,
              imageUrl: imageUrl || undefined,
              durasi: durasi || undefined,
              gDia: gDia || undefined,
              diameter: diameter || undefined,
              rating: rating ? Number(rating) : undefined,
              reviewsCount: reviewsCount ? Number(reviewsCount) : undefined,
              allowDualPower: allowDualPower,
              groupName: groupName || undefined,
            });
          }
        }
      }

      // Reset form
      handleCancelEdit();
    } catch (e) {
      console.error("Failed to save product", e);
    }
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      alert("Tidak ada data produk untuk diexport.");
      return;
    }
    const csv = Papa.unparse({
      fields: [
        "Nama Barang",
        "Kode Barang",
        "Supplier",
        "Harga Beli",
        "Stok Awal",
        "Stok Masuk",
        "Terjual",
        "Stok Saat ini",
        "Color",
        "BC",
        "Kadar Air",
      ],
      data: products.map((p) => {
        const productSales = sales.filter((s) => s.productId === p.id);
        const totalTerjual = productSales.reduce((sum, s) => sum + s.qty, 0);
        const productIncoming = incomingGoods.filter(
          (ig) => ig.productId === p.id,
        );
        const totalMasuk = productIncoming.reduce((sum, ig) => sum + ig.qty, 0);
        const stokSaatIni = p.stokAwal + totalMasuk - totalTerjual;

        return [
          p.namaBarang,
          p.kodeBarang,
          p.supplier || "",
          p.hargaBeli,
          p.stokAwal,
          totalMasuk,
          totalTerjual,
          stokSaatIni,
          p.color || "",
          p.bc || "",
          p.kadarAir || "",
        ];
      }),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Data_Stok_Barang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const totalItems = data.filter((item: any) => {
          const itemKode = item.kodeBarang || item["Kode Barang"] || "";
          const itemNama =
            item.namaBarang ||
            item["Nama Barang"] ||
            item["Product Name"] ||
            "";
          return itemKode && itemNama;
        }).length;

        if (totalItems === 0) {
          alert("Tidak ada data yang valid untuk diimport.");
          return;
        }

        setImportProgress({ current: 0, total: totalItems });

        const parseNum = (val: any) => {
          if (!val && val !== 0) return 0;
          if (typeof val === "number") return val;
          let str = String(val).trim();
          // Remove dots or commas followed by exactly 3 digits (e.g., thousand separators in Indonesia: 17.000 or 1.500.000)
          str = str.replace(/[.,](\d{3})\b/g, "$1");
          const clean = str.replace(/[^0-9.-]+/g, "");
          return Number(clean) || 0;
        };

        const getVal = (item: any, ...keys: string[]) => {
          for (const key of keys) {
            if (
              item[key] !== undefined &&
              item[key] !== null &&
              String(item[key]).trim() !== ""
            )
              return item[key];
            // Try case-insensitive and trimmed key
            const foundKey = Object.keys(item).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase(),
            );
            if (
              foundKey &&
              item[foundKey] !== undefined &&
              item[foundKey] !== null &&
              String(item[foundKey]).trim() !== ""
            )
              return item[foundKey];
          }
          return undefined;
        };

        let count = 0;
        for (const item of data) {
          const itemKode =
            getVal(item, "kodeBarang", "Kode Barang", "ID Barang") || "";
          const itemNama =
            getVal(item, "namaBarang", "Nama Barang", "Product Name", "Nama") ||
            "";

          if (!itemKode || !itemNama) continue;

          const existingProduct = products.find(
            (p) =>
              p.kodeBarang.toLowerCase() === String(itemKode).toLowerCase() ||
              p.namaBarang.toLowerCase() === String(itemNama).toLowerCase(),
          );

          try {
            await upsertProduct({
              id: existingProduct?.id,
              kodeBarang: String(itemKode),
              namaBarang: String(itemNama),
              supplier: String(getVal(item, "supplier", "Supplier") || ""),
              hargaBeli: parseNum(
                getVal(item, "hargaBeli", "Harga Beli", "HPP"),
              ),
              hargaJual:
                parseNum(getVal(item, "hargaJual", "Harga Jual", "Price")) ||
                parseNum(getVal(item, "hargaBeli", "Harga Beli", "HPP")),
              stokAwal: parseNum(
                getVal(item, "Stok Awal", "stokAwal", "Stock"),
              ),
              color: String(getVal(item, "color", "Color", "Warna") || ""),
              bc: String(getVal(item, "bc", "BC") || ""),
              kadarAir: String(
                getVal(item, "kadarAir", "Kadar Air", "Kadar") || "",
              ),
              groupName: String(getVal(item, "groupName", "Group Name", "group_name") || ""),
            });
            count++;
            setImportProgress({ current: count, total: totalItems });
          } catch (e) {
            console.error("error row", e);
          }
        }

        setTimeout(() => {
          setImportProgress(null);
          alert(`Berhasil import ${count} produk!`);
          const el1 = document.getElementById(
            "csv-upload-products",
          ) as HTMLInputElement;
          const el2 = document.getElementById(
            "csv-upload-settings",
          ) as HTMLInputElement;
          if (el1) el1.value = "";
          if (el2) el2.value = "";
        }, 500);
      },
    });
  };

  const parseIndonesianDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    
    let cleanStr = dateStr.trim().replace(/\s+/g, ' ');
    
    // Attempt standard parse first
    const parsed = Date.parse(cleanStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    
    const indonesianMonths: { [key: string]: number } = {
      januari: 0, jan: 0,
      februari: 1, feb: 1,
      maret: 2, mar: 2,
      april: 3, apr: 3,
      mei: 4, may: 4,
      juni: 5, jun: 5,
      juli: 6, jul: 6,
      agustus: 7, agt: 7, agst: 7, agu: 7,
      oktober: 9, okt: 9,
      september: 8, sep: 8,
      november: 10, nov: 10,
      desember: 11, des: 11
    };

    // e.g. "13 Jun 2026" or "13 Juni 2026"
    const matches = cleanStr.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (matches) {
      const day = parseInt(matches[1], 10);
      const monthName = matches[2];
      const year = parseInt(matches[3], 10);
      
      if (indonesianMonths[monthName] !== undefined) {
        return new Date(year, indonesianMonths[monthName], day);
      }
    }

    // e.g. "DD/MM/YYYY" or "DD-MM-YYYY"
    const parts = cleanStr.split(/[-/.]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        if (y > 999) {
          return new Date(y, m - 1, d);
        } else if (d > 999) { // YYYY-MM-DD
          return new Date(d, m - 1, y);
        }
      }
    }

    return new Date();
  };

  const handleImportSales = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const totalItems = data.length;
        if (totalItems === 0) {
          alert("Tidak ada data yang valid untuk diimport.");
          return;
        }

        setImportProgress({ current: 0, total: totalItems });
        let count = 0;

        const parseNum = (val: any) => {
          if (!val && val !== 0) return 0;
          if (typeof val === "number") return val;
          let str = String(val).trim();
          str = str.replace(/[.,](\d{3})\b/g, "$1");
          const clean = str.replace(/[^0-9.-]+/g, "");
          return Number(clean) || 0;
        };

        const getVal = (item: any, ...keys: string[]) => {
          for (const key of keys) {
            if (
              item[key] !== undefined &&
              item[key] !== null &&
              String(item[key]).trim() !== ""
            )
              return item[key];
            const foundKey = Object.keys(item).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase(),
            );
            if (
              foundKey &&
              item[foundKey] !== undefined &&
              item[foundKey] !== null &&
              String(item[foundKey]).trim() !== ""
            )
              return item[foundKey];
          }
          return undefined;
        };

        for (const [index, item] of data.entries()) {
          const kodeBarang = String(
            getVal(item, "Kode Barang", "ID Barang") || "UNKNOWN",
          ).trim();
          const namaBarang = String(
            getVal(item, "Jenis Barang", "Nama Barang") || "Imported Sale",
          ).trim();
          const qty = parseNum(getVal(item, "Qty", "Jumlah"));
          const totalHarga = parseNum(
            getVal(item, "Total Penjualan", "Total Harga"),
          );
          const tanggalRaw = String(getVal(item, "Tgl. Order", "Tgl Order", "Tanggal Order", "Tanggal") || "");

          try {
            const baseDate = parseIndonesianDate(tanggalRaw);
            const offsetDate = new Date(baseDate.getTime() + index * 1000);
            await addSaleRecord(kodeBarang, namaBarang, qty, totalHarga, {
              tanggalOrder: String(
                getVal(item, "Tgl. Order", "Tanggal Order") || "",
              ),
              channel: String(getVal(item, "Channel") || ""),
              noPesanan: String(
                getVal(item, "No. Pesanan / Alamat", "No Pesanan") || "",
              ),
              noResi: String(getVal(item, "No Resi") || ""),
              namaEkspedisi: String(getVal(item, "Nama Ekspedisi") || ""),
              hpp: parseNum(getVal(item, "HPP")),
              totalHpp: parseNum(getVal(item, "Total HPP")),
              laba: parseNum(getVal(item, "Laba")),
              tanggal: offsetDate.toISOString(),
            });
            count++;
          } catch (err) {
            console.error("Sale import err", err);
          }
          setImportProgress((p) => ({ ...p, current: index + 1 }));
        }
        setImportProgress(null);
        alert(`Berhasil import ${count} riwayat penjualan!`);
        if (saleFileInput.current) saleFileInput.current.value = "";
      },
    });
  };

  const handleImportIklan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const totalItems = data.length;
        if (totalItems === 0) {
          alert("Tidak ada data yang valid untuk diimport.");
          return;
        }

        setImportProgress({ current: 0, total: totalItems });
        let count = 0;

        const parsePrice = (val: any) => {
          if (!val && val !== 0) return 0;
          if (typeof val === "number") return val;
          let str = String(val).trim();
          str = str.replace(/[Rp\s.]/g, "");
          str = str.replace(",", ".");
          return Number(str) || 0;
        };

        for (const [index, item] of data.entries()) {
          const tanggal = String(item["Tanggal"] || item["tanggal"] || "").trim();
          const totalPembayaran = parsePrice(item["Total Pembayaran"] || item["TotalPembayaran"] || item["total_pembayaran"] || item["totalPembayaran"]);
          const noPesanan = String(item["No.Pesanan"] || item["NoPesanan"] || item["no_pesanan"] || item["noPesanan"] || "").trim();

          if (tanggal && totalPembayaran) {
            try {
              await addIklanRecord({
                tanggal,
                totalPembayaran,
                noPesanan
              });
              count++;
            } catch (err) {
              console.error("Iklan import err", err);
            }
          }
          setImportProgress({ current: index + 1, total: totalItems });
        }

        alert(`Berhasil mengimport ${count} data pengeluaran iklan!`);
        setImportProgress({ current: 0, total: 0 });
        if (iklanFileInput.current) iklanFileInput.current.value = "";
      }
    });
  };

  const handleImportSalesDS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const totalItems = data.length;
        if (totalItems === 0) {
          alert("Tidak ada data yang valid untuk diimport.");
          return;
        }

        setImportProgress({ current: 0, total: totalItems });
        let count = 0;

        const parseNum = (val: any) => {
          if (!val && val !== 0) return 0;
          if (typeof val === "number") return val;
          let str = String(val).trim();
          str = str.replace(/[.,](\d{3})\b/g, "$1");
          const clean = str.replace(/[^0-9.-]+/g, "");
          return Number(clean) || 0;
        };

        const getVal = (item: any, ...keys: string[]) => {
          for (const key of keys) {
            if (
              item[key] !== undefined &&
              item[key] !== null &&
              String(item[key]).trim() !== ""
            )
              return item[key];
            const foundKey = Object.keys(item).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase(),
            );
            if (
              foundKey &&
              item[foundKey] !== undefined &&
              item[foundKey] !== null &&
              String(item[foundKey]).trim() !== ""
            )
              return item[foundKey];
          }
          return undefined;
        };

        for (const [index, item] of data.entries()) {
          const rawSupplier = String(getVal(item, "Kode Supplier", "ID Supplier", "kodeSupplier") || "").trim();
          const tanggalOrder = String(getVal(item, "Tgl. Order", "Tgl Order", "Tanggal Order", "Tanggal", "tanggalOrder") || "").trim();
          const channel = String(getVal(item, "Channel", "Kurir", "channel") || "").trim();
          const noPesanan = String(getVal(item, "No. Pesanan", "No Pesanan", "No. Pesanan / Alamat", "noPesanan") || "").trim();
          const noResi = String(getVal(item, "No Resi", "Resi", "No. Resi", "noResi") || "").trim();
          const namaPelanggan = String(getVal(item, "Nama Pelanggan", "Pelanggan", "Buyer", "namaPelanggan") || "").trim();
          const alamatPelanggan = String(getVal(item, "Alamat Pelanggan", "Alamat", "Address", "alamatPelanggan") || "").trim();
          const namaProduk = String(getVal(item, "Nama Produk", "Produk", "Barang", "namaProduk") || "Imported DS Sale").trim();
          
          const qty = parseNum(getVal(item, "Qty", "Jumlah", "qty")) || 1;
          const hpp = parseNum(getVal(item, "HPP", "Harga Modal", "hpp")) || 0;
          const totalPenjualan = parseNum(getVal(item, "Total Penjualan", "Omset", "Total Harga", "totalPenjualan")) || 0;
          const ongkosKirim = parseNum(getVal(item, "Ongkos Kirim", "Ongkir", "ongkosKirim")) || 0;
          
          let laba = parseNum(getVal(item, "Laba", "Profit", "laba"));
          if (!laba && laba !== 0) {
            laba = totalPenjualan - (hpp * qty) - ongkosKirim;
          }

          // Auto-detect supplier code if not provided
          let kodeSupplier = rawSupplier;
          if (!kodeSupplier) {
            kodeSupplier = findSupplierForProduct(namaProduk);
          }
          if (!kodeSupplier) {
            kodeSupplier = "S-LINA"; // Reasonable fallback default
          }

          try {
            const baseDate = parseIndonesianDate(tanggalOrder);
            const offsetDate = new Date(baseDate.getTime() + index * 1000);
            
            await addSaleDSRecord({
              kodeSupplier,
              tanggalOrder: normalizeOrderDate(tanggalOrder || offsetDate),
              channel,
              noPesanan,
              noResi,
              namaPelanggan,
              alamatPelanggan,
              namaProduk,
              qty,
              hpp,
              totalPenjualan,
              ongkosKirim,
              laba,
            });
            count++;
          } catch (err) {
            console.error("SaleDS import err", err);
          }
          setImportProgress((p) => ({ ...p, current: index + 1 }));
        }
        setImportProgress(null);
        alert(`Berhasil import ${count} riwayat penjualan DS!`);
        if (salesDSFileInput.current) salesDSFileInput.current.value = "";
      },
    });
  };

  const handleImportIncomingGoods = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const totalItems = data.length;
        if (totalItems === 0) {
          alert("Tidak ada data yang valid untuk diimport.");
          return;
        }

        setImportProgress({ current: 0, total: totalItems });
        let count = 0;

        const parseNum = (val: any) => {
          if (!val && val !== 0) return 0;
          if (typeof val === "number") return val;
          let str = String(val).trim();
          str = str.replace(/[.,](\d{3})\b/g, "$1");
          const clean = str.replace(/[^0-9.-]+/g, "");
          return Number(clean) || 0;
        };

        const getVal = (item: any, ...keys: string[]) => {
          for (const key of keys) {
            if (
              item[key] !== undefined &&
              item[key] !== null &&
              String(item[key]).trim() !== ""
            )
              return item[key];
            const foundKey = Object.keys(item).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase(),
            );
            if (
              foundKey &&
              item[foundKey] !== undefined &&
              item[foundKey] !== null &&
              String(item[foundKey]).trim() !== ""
            )
              return item[foundKey];
          }
          return undefined;
        };
        const productMap = new Map();
        for (const p of products) {
            if (p.namaBarang) productMap.set(p.namaBarang.toLowerCase(), p);
            if (p.kodeBarang) productMap.set(p.kodeBarang.toLowerCase(), p);
        }

        const preparedItems: any[] = [];
        for (const [index, item] of data.entries()) {
          const namaOrKode = String(
            getVal(item, "Jenis Barang", "Nama Barang", "namaBarang", "Kode Barang", "ID Barang") || "",
          ).trim();
          const qty = parseNum(getVal(item, "Qty", "Jumlah", "qty"));
          const tanggal = String(getVal(item, "Tgl. Order", "Tgl Order", "Tanggal") || "");

          if (!namaOrKode || !qty) {
            setImportProgress((p) => ({ ...p, current: index + 1 }));
            continue;
          }

          const product = productMap.get(namaOrKode.toLowerCase());

          if (product) {
            const parsedDate = parseIndonesianDate(tanggal);
            const offsetDate = new Date(parsedDate.getTime() + index * 1000);
            preparedItems.push({
                id: Math.random().toString(36).substring(2, 15),
                productId: product.id!,
                kodeBarang: product.kodeBarang,
                namaBarang: product.namaBarang,
                qty,
                supplier: product.supplier || null,
                tanggal: offsetDate.toISOString(),
            });
            count++;
          }
          if (index % 500 === 0) {
            setImportProgress((p) => ({ ...p, current: index + 1 }));
          }
        }

        // Send in batches of 50
        const batchSize = 50;
        const promises = [];
        for (let i = 0; i < preparedItems.length; i += batchSize) {
            const batch = preparedItems.slice(i, i + batchSize);
            promises.push(fetch('/api/incoming-goods/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch),
            }));
        }
        await Promise.all(promises);
        
        setImportProgress(null);
        alert(`Berhasil import ${count} data barang masuk!`);
        if (incomingFileInput.current) incomingFileInput.current.value = "";
      },
    });
  };

  const totalSales = sales.reduce((acc, sale) => acc + sale.totalHarga, 0);

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F4F6]">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900 mb-2">
            Login Admin
          </h1>
          <p className="text-slate-500 mb-8">
            Masukkan password untuk akses sistem
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={
                  hasCustomPassword
                    ? "Masukkan Password"
                    : "Password (admin)"
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-200"
            >
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden relative">
      {/* Dark overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r-2 border-slate-900 flex flex-col pt-0 z-50 transition-transform duration-300 transform 
        ${isMobileSidebarOpen ? "translate-x-0 animate-fade-in" : "-translate-x-full"} 
        md:relative md:translate-x-0 md:flex md:z-10 h-full
      `}>
        <div className="p-6 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white font-black text-xl shadow-[3px_3px_0px_0px_#0f172a]">
              Z
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              ZENDiiX
            </span>
          </div>
          {/* Close button on mobile sidebar */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 border-2 border-slate-900 bg-rose-50 hover:bg-rose-100 text-slate-950 md:hidden flex items-center justify-center shadow-[2px_2px_0px_0px_#0f172a] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#0f172a]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-none px-4 py-2 space-y-4">
          {/* Main Quick Links */}
          <div className="space-y-1.5">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-900 bg-amber-50 text-slate-800 hover:bg-amber-100 transition-all shadow-[2px_2px_0px_0px_#0f172a]"
            >
              <Eye className="w-5 h-5 text-[#B62A53]" />
              <span className="text-xs font-black uppercase tracking-widest text-left">
                Lihat Toko Utama
              </span>
            </Link>
          </div>

          {/* Group 1: Transaksi & Finansial */}
          <div className="space-y-1.5">
            <div className="px-2 pb-1 flex items-center justify-between border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                TRANSAKSI & LAPORAN
              </span>
            </div>
            
            <button
              onClick={() => { setActiveTab("form"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "form" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Input Penjualan
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("input_penjualan_ds"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "input_penjualan_ds" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Input Dropship (DS)
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("database_penjualan"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "database_penjualan" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Database Penjualan
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("penjualan_mingguan"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "penjualan_mingguan" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Laporan Penjualan Mingguan
              </span>
            </button>
          </div>

          {/* Group 2: Inventaris & Softlens */}
          <div className="space-y-1.5">
            <div className="px-2 pb-1 flex items-center justify-between border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PRODUK & INVENTARIS
              </span>
            </div>

            <button
              onClick={() => { setActiveTab("stok_barang"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "stok_barang" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <Package className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Data Stok & Barang
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("katalog"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "katalog" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Katalog & Spesifikasi Seri
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("reviews"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "reviews" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Kelola Review
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("barang_masuk"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "barang_masuk" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <ArrowDown className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Database Barang Masuk
              </span>
            </button>
          </div>

          {/* Group 3: Promosi & Marketing */}
          <div className="space-y-1.5">
            <div className="px-2 pb-1 flex items-center justify-between border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                MARKETING & PROMOSI
              </span>
            </div>

            <button
              onClick={() => { setActiveTab("iklan"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "iklan" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <Megaphone className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Database Iklan
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("branding"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "branding" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <Layout className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Branding & Banner
              </span>
            </button>
          </div>

          {/* Group 4: Sistem & DB */}
          <div className="space-y-1.5">
            <div className="px-2 pb-1 flex items-center justify-between border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                SISTEM UTILITY
              </span>
            </div>

            <button
              onClick={() => { setActiveTab("pengaturan"); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 transition-all ${activeTab === "pengaturan" ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"}`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-left">
                Pengaturan Database
              </span>
            </button>
          </div>
        </nav>
        <div className="p-4 border-t-2 border-slate-900">
          <div className="bg-green-50 border-2 border-green-700 p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_#15803d]">
            <div className="w-2.5 h-2.5 bg-green-500 border border-slate-900 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
              System Online
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b-2 border-slate-900 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10 gap-2">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] bg-indigo-50 hover:bg-indigo-100 md:hidden flex items-center justify-center transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#0f172a]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
            <div>
              <h1 className="text-sm sm:text-xl font-black text-slate-900 uppercase tracking-tighter truncate max-w-[180px] sm:max-w-[400px] md:max-w-none">
                Sistem Manajemen Penjualan
              </h1>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-500 truncate max-w-[180px] sm:max-w-[400px] md:max-w-none">
                Inventory & Real-time Transaction Ledger
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Admin Utama
              </p>
              <button
                onClick={handleLogout}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
            {/* Sign Out button only on mobile view */}
            <div className="sm:hidden text-right">
              <button
                onClick={handleLogout}
                className="text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-slate-900 bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#0f172a] md:shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
              <span className="font-black text-slate-900 uppercase">A</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        <div className="p-3 md:p-5 grid grid-cols-12 gap-4 flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {/* SALES FORM TAB */}
          {activeTab === "form" && (
            <section className="col-span-12 flex flex-col pt-2">
              <div
                className="bg-white border-2 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]"
                onPaste={handlePasteSales}
              >
                {/* Header Action Bar */}
                <div className="p-3 md:p-4 border-b-2 border-slate-900 flex flex-col xl:flex-row xl:items-center justify-between bg-slate-50 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
                      <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Input Transaksi Baru</span><span className="sm:hidden">Input Transaksi</span>
                    </h2>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleSaveDraftSales}
                        className="flex-1 sm:flex-none px-3 md:px-5 py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10px] md:text-xs transition-colors flex items-center justify-center gap-1.5 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] md:shadow-[2.5px_2.5px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[1.5px] active:translate-x-[1.5px] active:shadow-none"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className={`px-2.5 md:px-3.5 py-1.5 md:py-2 font-bold uppercase tracking-wider text-[10px] md:text-xs transition-colors flex items-center justify-center gap-1.5 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] md:shadow-[2.5px_2.5px_0px_0px_#0f172a] ${history.length === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-slate-300" : "bg-white hover:bg-slate-50 text-slate-900 active:translate-y-[1px] active:translate-x-[1px]"}`}
                      >
                         Undo
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 justify-between md:justify-end">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                        Paket
                      </span>
                      <span className="text-sm md:text-lg font-black text-slate-900 border-2 border-slate-900 px-2 md:px-3 py-0.5 bg-white font-mono shadow-[1.5px_1.5px_0px_0px_#0f172a]">
                        {
                          new Set(
                            draftSales
                              .filter(
                                (d) =>
                                  d.tanggalOrder.trim() ||
                                  d.noPesanan.trim() ||
                                  d.jenisBarang.trim(),
                              )
                              .map((d) => d.noResi.trim() || d.id),
                          ).size
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight text-right">
                        Laba
                      </span>
                      <span className="text-sm md:text-lg font-black text-green-700 border-2 border-green-700 px-2 md:px-3 py-0.5 bg-green-50 font-mono shadow-[1.5px_1.5px_0px_0px_#15803d]">
                        Rp{" "}
                        {draftSales
                          .reduce((acc, draft) => {
                            const product = findMatchedProduct(
                              draft.jenisBarang,
                              draft.productId,
                            );
                            if (!product) return acc;
                            const hpp = product.hargaBeli * (Number(draft.qty) || 1);
                            return acc + (draft.totalPenjualan - hpp);
                          }, 0)
                          .toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drafting Area */}
                <div className="flex-1 overflow-y-auto min-h-[180px]">
                  {/* Desktop Spreadsheet View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[780px] border-collapse table-auto">
                      <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[65px]">Tgl. Order</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[55px]">Channel</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[90px]">No Pesanan / Alamat</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[65px]">No Resi</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[65px]">Ekspedisi</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black w-[110px]">Jenis Barang</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black text-center w-6">Qty</th>
                          <th className="px-1 py-1.5 border-r border-slate-700 font-black text-right w-[65px]">Total Jual</th>
                          <th className="px-1 py-1.5 border-r border-slate-800 bg-slate-800 font-black w-[65px]">Kode</th>
                          <th className="px-1 py-1.5 border-r border-slate-800 bg-slate-800 font-black text-right w-[60px]">HPP</th>
                          <th className="px-1 py-1.5 border-r border-slate-800 bg-slate-800 font-black text-center w-6">Stok</th>
                          <th className="px-1 py-1.5 border-r border-slate-800 bg-slate-800 font-black text-right w-[65px]">Tot HPP</th>
                          <th className="px-1 py-1.5 bg-slate-800 font-black text-right w-[65px]">Laba</th>
                          <th className="px-1 py-1.5 font-black w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {draftSales.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="p-6 text-center bg-slate-50/50">
                              <div className="flex flex-col items-center justify-center gap-1.5 py-3">
                                <Plus className="w-6 h-6 text-indigo-500 stroke-[3px]" />
                                <p className="text-xs font-black text-indigo-900 uppercase tracking-widest leading-none">Antrian Transaksi Kosong</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                                  Silakan lakukan paste rincian pesanan untuk mengisi.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) :
                          draftSales.map((draft, idx) => {
                          const product = findMatchedProduct(draft.jenisBarang, draft.productId);
                          const hpp = product ? product.hargaBeli : 0;
                          let stokSaatIni = 0;
                          if (product) {
                            stokSaatIni = productStockMap[product.id || ""] ?? (product.kodeBarang ? productStockMap[product.kodeBarang.trim().toLowerCase()] : undefined) ?? product.stokAwal;
                          }
                          const totalHpp = hpp * (Number(draft.qty) || 1);
                          const laba = product ? draft.totalPenjualan - totalHpp : 0;
                          const bgColor = idx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                          const computedBg = idx % 2 === 0 ? "bg-indigo-50/10" : "bg-indigo-50/30";

                          return (
                            <tr key={draft.id} className="border-b border-slate-200 group text-[10px]">
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[65px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-medium text-slate-700" value={draft.tanggalOrder} onChange={(e) => handleUpdateDraft(draft.id, "tanggalOrder", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[55px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-medium text-slate-700" value={draft.channel} onChange={(e) => handleUpdateDraft(draft.id, "channel", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[90px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-medium text-slate-700" value={draft.noPesanan} onChange={(e) => handleUpdateDraft(draft.id, "noPesanan", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[65px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-medium text-slate-700" value={draft.noResi} onChange={(e) => handleUpdateDraft(draft.id, "noResi", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[65px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-medium text-slate-700" value={draft.namaEkspedisi} onChange={(e) => handleUpdateDraft(draft.id, "namaEkspedisi", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[110px]`}>
                                <input type="text" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] font-bold text-slate-900" value={draft.jenisBarang} onChange={(e) => handleUpdateDraft(draft.id, "jenisBarang", e.target.value)} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-6`}>
                                <input type="number" min="1" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] text-center font-bold text-slate-700" value={draft.qty} onChange={(e) => handleUpdateDraft(draft.id, "qty", e.target.value === "" ? "" : Number(e.target.value))} />
                              </td>
                              <td className={`${bgColor} border-r border-slate-200 p-0 relative w-[65px]`}>
                                <input type="number" min="0" step="1000" className="w-full h-full px-1 py-1 bg-transparent border-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500 text-[10px] text-right font-bold text-indigo-700" value={draft.totalPenjualan} onChange={(e) => handleUpdateDraft(draft.id, "totalPenjualan", Number(e.target.value))} />
                              </td>
                              <td className={`${computedBg} border-r border-slate-200 px-1 py-1 text-[10px] font-mono w-[65px] truncate ${!product ? "text-red-500 font-bold bg-red-50" : "text-slate-600"}`}>
                                {product ? product.kodeBarang : draft.jenisBarang ? "!! MISSING !!" : ""}
                              </td>
                              <td className={`${computedBg} border-r border-slate-200 px-1 py-1 text-[10px] text-right font-mono text-slate-600 w-[60px]`}>
                                {product ? hpp.toLocaleString("id-ID") : "-"}
                              </td>
                              <td className={`${computedBg} border-r border-slate-200 px-1 py-1 text-[10px] w-6 text-center font-mono font-bold ${product ? (stokSaatIni <= 0 ? "text-red-600 bg-red-50" : "text-indigo-600") : "text-slate-600"}`}>
                                {product ? stokSaatIni : "-"}
                              </td>
                              <td className={`${computedBg} border-r border-slate-200 px-1 py-1 text-[10px] text-right font-mono text-slate-600 w-[65px]`}>
                                {product ? totalHpp.toLocaleString("id-ID") : "-"}
                              </td>
                              <td className={`${computedBg} px-1 py-1 text-[10px] text-right font-bold ${laba > 0 ? "text-emerald-600" : laba < 0 ? "text-rose-600" : "text-slate-500"} font-mono w-[65px]`}>
                                {product ? laba.toLocaleString("id-ID") : "-"}
                              </td>
                              <td className={`${bgColor} px-1 py-1 text-center w-6`}>
                                <button onClick={() => handleRemoveDraftRow(draft.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 leading-none">
                                  &times;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden p-4 space-y-4 bg-slate-50">
                    {draftSales.length === 0 && (
                      <div className="p-12 text-center border-4 border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center gap-3">
                        <Plus className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Antrian Kosong</p>
                        <p className="text-[10px] text-slate-400 font-medium">Paste teks pesanan untuk mendeteksi otomatis</p>
                      </div>
                    )}
                    {draftSales.map((draft, idx) => {
                       const product = findMatchedProduct(draft.jenisBarang, draft.productId);
                       const hpp = product ? product.hargaBeli : 0;
                       let stokSaatIni = 0;
                       if (product) {
                         stokSaatIni = productStockMap[product.id || ""] ?? (product.kodeBarang ? productStockMap[product.kodeBarang.trim().toLowerCase()] : undefined) ?? product.stokAwal;
                       }
                       const totalHpp = hpp * (Number(draft.qty) || 1);
                       const laba = product ? draft.totalPenjualan - totalHpp : 0;

                       return (
                         <div key={draft.id} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[-2px] transition-transform">
                            <div className="bg-slate-900 p-3 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="bg-indigo-500 text-white w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-sm">
                                  {idx + 1}
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Draft Paket</span>
                              </div>
                              <button onClick={() => handleRemoveDraftRow(draft.id)} className="p-1.5 bg-rose-500 text-white border border-rose-600 rounded active:translate-y-[1px] transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" /> Tanggal
                                  </label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded focus:border-indigo-500 transition-colors outline-none" value={draft.tanggalOrder} onChange={(e) => handleUpdateDraft(draft.id, "tanggalOrder", e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                    <Type className="w-2.5 h-2.5" /> Channel
                                  </label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded focus:border-indigo-500 transition-colors outline-none" value={draft.channel} onChange={(e) => handleUpdateDraft(draft.id, "channel", e.target.value)} />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" /> No Resi / Ekspedisi
                                </label>
                                <div className="flex gap-2">
                                  <input type="text" placeholder="Resi" className="flex-1 bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded focus:border-indigo-500 transition-colors outline-none" value={draft.noResi} onChange={(e) => handleUpdateDraft(draft.id, "noResi", e.target.value)} />
                                  <input type="text" placeholder="Kurir" className="w-24 bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded focus:border-indigo-500 transition-colors outline-none" value={draft.namaEkspedisi} onChange={(e) => handleUpdateDraft(draft.id, "namaEkspedisi", e.target.value)} />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5" /> Rincian Barang
                                </label>
                                <textarea className="w-full bg-indigo-50/50 border border-indigo-200 p-3 text-xs font-black text-indigo-900 rounded focus:border-indigo-500 transition-colors outline-none resize-none" rows={2} value={draft.jenisBarang} onChange={(e) => handleUpdateDraft(draft.id, "jenisBarang", e.target.value)} />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quantity</label>
                                  <input type="number" className="w-full bg-slate-100 border border-slate-300 p-2.5 text-xs font-black text-center text-slate-900 rounded outline-none" value={draft.qty} onChange={(e) => handleUpdateDraft(draft.id, "qty", e.target.value === "" ? "" : Number(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">Harga Jual (Total)</label>
                                  <input type="number" className="w-full bg-indigo-50 border-2 border-indigo-200 p-2.5 text-xs font-black text-right text-indigo-700 rounded outline-none" value={draft.totalPenjualan} onChange={(e) => handleUpdateDraft(draft.id, "totalPenjualan", Number(e.target.value))} />
                                </div>
                              </div>

                              <div className="pt-3 flex flex-wrap gap-2 border-t-2 border-slate-100">
                                <div className={`flex-1 flex items-center gap-1.5 px-3 py-2 border-2 font-mono text-[10px] font-black uppercase rounded ${product ? "bg-slate-900 text-white border-slate-900" : "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"}`}>
                                  <Sparkles className={`w-3 h-3 ${!product && "text-rose-500"}`} />
                                  {product ? `Matched: ${product.kodeBarang}` : "Produk Tidak Dikenali"}
                                </div>
                                {product && (
                                  <div className="flex gap-2 w-full">
                                    <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-600 font-mono text-[10px] font-bold flex justify-between">
                                      <span>STOK:</span> <span className="text-slate-900 font-black">{stokSaatIni}</span>
                                    </div>
                                    <div className={`flex-1 px-3 py-2 border font-mono text-[10px] font-black rounded flex justify-between ${laba >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                                      <span>LABA:</span> <span>Rp {laba.toLocaleString("id-ID")}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "input_penjualan_ds" && (
            <section className="col-span-12 flex flex-col pt-8">
              <div
                className="bg-white border-2 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]"
                onPaste={handlePasteSalesDS}
              >
                {/* Header Action Bar */}
                <div className="p-4 md:p-5 border-b-2 border-slate-900 flex flex-col xl:flex-row xl:items-center justify-between bg-slate-50 gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full xl:w-auto">
                    <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none shrink-0">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" /> 
                      <span className="hidden sm:inline">Input Penjualan Dropship (DS)</span>
                      <span className="sm:hidden">Input DS</span>
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {/* Simpan DS Button */}
                      <button
                        onClick={handleSaveDraftSalesDS}
                        className="h-10 md:h-11 px-4 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] md:shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] md:hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                        <span>Simpan DS</span>
                      </button>

                      {/* Undo Button */}
                      <button
                        onClick={handleUndoDS}
                        disabled={historyDS.length === 0}
                        className={`h-10 md:h-11 px-4 md:px-5 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] md:shadow-[4px_4px_0px_0px_#0f172a] ${
                          historyDS.length === 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-slate-300"
                            : "bg-white hover:bg-slate-50 text-slate-900 hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] md:hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
                        }`}
                      >
                        <Undo className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                        <span>Undo</span>
                      </button>

                      {/* Tambah Baris Button */}
                      <button
                        onClick={handleAddRowDS}
                        className="h-10 md:h-11 px-4 md:px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] md:shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] md:hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                        <span>Tambah Baris</span>
                      </button>

                      {/* Reset Button (Custom Confirmation UI) */}
                      {showResetConfirmDS ? (
                        <div className="flex items-center gap-1.5 md:gap-2 animate-fadeIn">
                          <button
                            type="button"
                            onClick={confirmResetDS}
                            className="h-10 md:h-11 px-3 md:px-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer"
                          >
                            <span>Ya, Reset!</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmDS(false)}
                            className="h-10 md:h-11 px-3 md:px-4 bg-white text-slate-800 hover:bg-slate-100 font-extrabold uppercase tracking-wider text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer"
                          >
                            <span>Batal</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmDS(true)}
                          className="h-10 md:h-11 px-4 md:px-5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] md:shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[3px_3px_0px_0px_#0f172a] md:hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 justify-between md:justify-end">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">
                        Pesanan
                      </span>
                      <span className="text-lg md:text-2xl font-black text-slate-900 border-2 border-slate-900 px-3 md:px-4 py-0.5 md:py-1 bg-white font-mono shadow-[2px_2px_0px_0px_#0f172a]">
                        {
                          draftSalesDS.filter(
                            (d) =>
                              d.kodeSupplier.trim() ||
                              d.tanggalOrder.trim() ||
                              d.namaProduk.trim() ||
                              d.noPesanan.trim()
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight text-right">
                        Laba DS
                      </span>
                      <span className="text-lg md:text-2xl font-black text-green-700 border-2 border-green-700 px-3 md:px-4 py-0.5 md:py-1 bg-green-50 font-mono shadow-[2px_2px_0px_0px_#15803d]">
                        Rp{" "}
                        {draftSalesDS
                          .reduce((acc, draft) => acc + (Number(draft.laba) || 0), 0)
                          .toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drafting Area */}
                <div className="flex-1 overflow-y-auto min-h-[180px] bg-slate-50">
                  <div className="p-4 md:p-6">
                    <div className="w-full">
                      
                      {/* Right Area: Active Draft Items */}
                      <div className="w-full">
                        {draftSalesDS.length === 0 ? (
                          <div className="p-16 text-center border-4 border-dashed border-slate-300 rounded-2xl bg-white flex flex-col items-center justify-center gap-4 min-h-[350px]">
                            <Plus className="w-10 h-10 text-slate-300" />
                            <div>
                              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Antrian DS Kosong</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1 max-w-sm text-center">
                                Silakan langsung Paste (Ctrl+V) rincian data dropship Anda di mana saja pada halaman ini, atau klik tombol Tambah Baris di bar atas.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn">
                        {draftSalesDS.map((draft, idx) => {
                          const hppNum = draft.hpp || 0;
                          const qtyNum = Number(draft.qty) || 1;
                          const totalPenjualanNum = draft.totalPenjualan || 0;
                          const okNum = draft.ongkosKirim || 0;
                          const autoLaba = totalPenjualanNum - (hppNum * qtyNum) - okNum;

                          return (
                            <div key={draft.id} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[-2px] transition-transform flex flex-col justify-between">
                              <div>
                                <div className="bg-slate-900 p-3 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-indigo-500 text-white w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-sm">
                                      {idx + 1}
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Draft Dropship</span>
                                  </div>
                                  <button onClick={() => handleRemoveDraftRowDS(draft.id)} className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white border border-rose-600 rounded active:translate-y-[1px] transition-all cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1 col-span-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Supplier</label>
                                      <div className="relative group/select">
                                        <select 
                                          className="w-full bg-slate-50 border-2 border-slate-300 p-2 text-[10px] sm:text-[11px] font-black text-indigo-700 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer transition-all shadow-sm pr-7 uppercase tracking-widest"
                                          value={draft.kodeSupplier}
                                          onChange={(e) => handleUpdateDraftDS(draft.id, "kodeSupplier", e.target.value)}
                                        >
                                          <option value="" className="text-slate-400">Pilih...</option>
                                          {DROPSHIP_SUPPLIERS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="space-y-1 col-span-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tgl Order</label>
                                      <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded focus:border-indigo-500 outline-none" value={draft.tanggalOrder} onChange={(e) => handleUpdateDraftDS(draft.id, "tanggalOrder", e.target.value)} />
                                    </div>
                                    <div className="space-y-1 col-span-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Channel</label>
                                      <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded focus:border-indigo-500 outline-none" value={draft.channel} onChange={(e) => handleUpdateDraftDS(draft.id, "channel", e.target.value)} />
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">No Pesanan</label>
                                      <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded outline-none focus:border-indigo-500" value={draft.noPesanan} onChange={(e) => handleUpdateDraftDS(draft.id, "noPesanan", e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">No Resi</label>
                                      <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded outline-none focus:border-indigo-500" value={draft.noResi} onChange={(e) => handleUpdateDraftDS(draft.id, "noResi", e.target.value)} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                      <FileText className="w-2.5 h-2.5 text-indigo-500" /> Data Pelanggan
                                    </label>
                                    <div className="space-y-2">
                                      <input type="text" placeholder="Nama Pelanggan" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded outline-none focus:border-indigo-500" value={draft.namaPelanggan} onChange={(e) => handleUpdateDraftDS(draft.id, "namaPelanggan", e.target.value)} />
                                      <textarea placeholder="Alamat Lengkap" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-slate-900 rounded outline-none resize-none focus:border-indigo-500" rows={2} value={draft.alamatPelanggan} onChange={(e) => handleUpdateDraftDS(draft.id, "alamatPelanggan", e.target.value)} />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                      <Package className="w-2.5 h-2.5 text-indigo-500" /> Nama Produk DS
                                    </label>
                                    <textarea className="w-full bg-indigo-50/50 border border-indigo-200 p-2 text-xs font-black text-indigo-900 rounded outline-none resize-none whitespace-pre-wrap focus:border-indigo-500" rows={2} value={draft.namaProduk} onChange={(e) => handleUpdateDraftDS(draft.id, "namaProduk", e.target.value)} />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quantity</label>
                                      <input type="number" className="w-full bg-slate-100 border border-slate-300 p-2 text-xs font-black text-center text-slate-900 rounded focus:border-indigo-500" value={draft.qty} onChange={(e) => handleUpdateDraftDS(draft.id, "qty", e.target.value === "" ? "" : Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">HPP / Modal (Rp)</label>
                                      <input type="number" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-right text-slate-900 rounded focus:border-indigo-500" value={draft.hpp} onChange={(e) => handleUpdateDraftDS(draft.id, "hpp", Number(e.target.value))} />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Ongkir Cust (Rp)</label>
                                      <input type="number" className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-black text-right text-slate-900 rounded focus:border-indigo-500" value={draft.ongkosKirim} onChange={(e) => handleUpdateDraftDS(draft.id, "ongkosKirim", Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">Total Jual (Bersih)</label>
                                      <input type="number" className="w-full bg-indigo-50/50 border-2 border-indigo-200 p-2 text-xs font-black text-right text-indigo-700 rounded outline-none" value={draft.totalPenjualan} onChange={(e) => handleUpdateDraftDS(draft.id, "totalPenjualan", Number(e.target.value))} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 pt-3 flex justify-between items-center border-t-2 border-slate-100 bg-slate-50/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Laba DS</span>
                                <div className={`px-4 py-1.5 border-2 font-mono text-xs font-black rounded shadow-[2px_2px_0px_0px_#0f172a] ${autoLaba >= 0 ? "bg-emerald-50 border-emerald-900 text-emerald-950" : "bg-rose-50 border-rose-900 text-rose-955"}`}>
                                  Rp {autoLaba.toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="hidden">
                    {draftSalesDS.length === 0 && (
                      <div className="p-12 text-center border-4 border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center gap-3">
                        <Plus className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Antrian DS Kosong</p>
                        <p className="text-[10px] text-slate-400 font-medium text-center">Paste teks Dropship untuk deteksi otomatis</p>
                      </div>
                    )}
                    {draftSalesDS.map((draft, idx) => {
                       const hppNum = draft.hpp || 0;
                       const qtyNum = Number(draft.qty) || 1;
                       const totalPenjualanNum = draft.totalPenjualan || 0;
                       const okNum = draft.ongkosKirim || 0;
                       const autoLaba = totalPenjualanNum - (hppNum * qtyNum) - okNum;

                       return (
                         <div key={draft.id} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[-2px] transition-transform">
                            <div className="bg-slate-900 p-3 flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                 <div className="bg-indigo-500 text-white w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-sm">
                                   {idx + 1}
                                 </div>
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Draft Dropship</span>
                               </div>
                               <button onClick={() => handleRemoveDraftRowDS(draft.id)} className="p-1.5 bg-rose-500 text-white border border-rose-600 rounded active:translate-y-[1px] transition-all">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Supplier</label>
                                  <div className="relative group/select">
                                    <select 
                                      className="w-full bg-slate-50 border-2 border-slate-300 p-3 text-[11px] font-black text-indigo-700 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none appearance-none cursor-pointer transition-all shadow-sm pr-10 uppercase tracking-widest"
                                      value={draft.kodeSupplier}
                                      onChange={(e) => handleUpdateDraftDS(draft.id, "kodeSupplier", e.target.value)}
                                    >
                                      <option value="" className="text-slate-400">Pilih Supplier...</option>
                                      {DROPSHIP_SUPPLIERS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tgl Order</label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded focus:border-indigo-500 outline-none" value={draft.tanggalOrder} onChange={(e) => handleUpdateDraftDS(draft.id, "tanggalOrder", e.target.value)} />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">No Pesanan</label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded outline-none" value={draft.noPesanan} onChange={(e) => handleUpdateDraftDS(draft.id, "noPesanan", e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">No Resi</label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded outline-none" value={draft.noResi} onChange={(e) => handleUpdateDraftDS(draft.id, "noResi", e.target.value)} />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" /> Data Pelanggan
                                </label>
                                <div className="space-y-2">
                                  <input type="text" placeholder="Nama Pelanggan" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded outline-none" value={draft.namaPelanggan} onChange={(e) => handleUpdateDraftDS(draft.id, "namaPelanggan", e.target.value)} />
                                  <textarea placeholder="Alamat Lengkap" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-slate-900 rounded outline-none resize-none" rows={2} value={draft.alamatPelanggan} onChange={(e) => handleUpdateDraftDS(draft.id, "alamatPelanggan", e.target.value)} />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5" /> Nama Produk DS
                                </label>
                                <textarea className="w-full bg-indigo-50/50 border border-indigo-200 p-3 text-xs font-black text-indigo-900 rounded outline-none resize-none whitespace-pre-wrap" rows={3} value={draft.namaProduk} onChange={(e) => handleUpdateDraftDS(draft.id, "namaProduk", e.target.value)} />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quantity</label>
                                  <input type="number" className="w-full bg-slate-100 border border-slate-300 p-2.5 text-xs font-black text-center text-slate-900 rounded" value={draft.qty} onChange={(e) => handleUpdateDraftDS(draft.id, "qty", e.target.value === "" ? "" : Number(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">HPP / Modal (Rp)</label>
                                  <input type="number" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-right text-slate-900 rounded" value={draft.hpp} onChange={(e) => handleUpdateDraftDS(draft.id, "hpp", Number(e.target.value))} />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Ongkir Cust (Rp)</label>
                                  <input type="number" className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-black text-right text-slate-900 rounded" value={draft.ongkosKirim} onChange={(e) => handleUpdateDraftDS(draft.id, "ongkosKirim", Number(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">Total Jual (Bersih)</label>
                                  <input type="number" className="w-full bg-indigo-50 border-2 border-indigo-200 p-2.5 text-xs font-black text-right text-indigo-700 rounded outline-none" value={draft.totalPenjualan} onChange={(e) => handleUpdateDraftDS(draft.id, "totalPenjualan", Number(e.target.value))} />
                                </div>
                              </div>

                              <div className="pt-3 flex justify-between items-center border-t-2 border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Laba DS</span>
                                <div className={`px-4 py-2 border-2 font-mono text-xs font-black rounded shadow-[2px_2px_0px_0px_#0f172a] ${autoLaba >= 0 ? "bg-emerald-50 border-emerald-900 text-emerald-900" : "bg-rose-50 border-rose-900 text-rose-900"}`}>
                                  Rp {autoLaba.toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PRODUCT FORM MODAL */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md my-8 relative shadow-[16px_16px_0px_0px_#0f172a] flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
                    {editProductId ? (
                      <Pencil className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {editProductId ? "Edit Barang" : "Tambah Barang"}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 border-2 border-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-6 flex flex-col gap-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Kode Barang
                      </label>
                      <input
                        type="text"
                        required
                        value={kodeBarang}
                        onChange={(e) => setKodeBarang(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black uppercase tracking-tight"
                        placeholder="e.g. SL-IDOL-ROZE"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Nama Barang
                      </label>
                      <input
                        type="text"
                        required
                        value={namaBarang}
                        onChange={(e) => setNamaBarang(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black uppercase tracking-tight"
                        placeholder="e.g. Ocean Blue Series"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Group Name (Seri Master)
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black uppercase tracking-tight"
                        placeholder="e.g. Avenue, Macaron"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Warna
                        </label>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold uppercase tracking-tight"
                          placeholder="BLUE"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          BC
                        </label>
                        <input
                          type="text"
                          value={bc}
                          onChange={(e) => setBc(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-mono font-bold"
                          placeholder="8.6"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Air %
                        </label>
                        <input
                          type="text"
                          value={kadarAir}
                          onChange={(e) => setKadarAir(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-mono font-bold"
                          placeholder="42"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Harga Beli
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={hargaBeli}
                          onChange={(e) => setHargaBeli(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Supplier
                        </label>
                        <input
                          type="text"
                          required
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black uppercase tracking-tight"
                          placeholder="e.g. Supplier Utama"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Stok Awal
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={stokAwal}
                          onChange={(e) => setStokAwal(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 font-black font-mono shadow-[3px_3px_0px_0px_#0f172a]"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 border-slate-900 flex gap-4">
                      <button
                        type="submit"
                        className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
                      >
                        {editProductId ? "Update Barang" : "Simpan Barang"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SALE EDIT MODAL */}
          {isSaleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md my-8 relative shadow-[16px_16px_0px_0px_#0f172a] flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
                    <FileText className="w-5 h-5" /> Edit Transaksi
                  </h2>
                  <button
                    onClick={() => setIsSaleModalOpen(false)}
                    className="p-1 border-2 border-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 flex flex-col gap-6">
                  <form onSubmit={handleUpdateSaleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Channel
                      </label>
                      <input
                        type="text"
                        value={saleForm.channel || ""}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, channel: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-sm font-black uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        No Pesanan
                      </label>
                      <input
                        type="text"
                        value={saleForm.noPesanan || ""}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            noPesanan: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-sm font-black uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        No Resi
                      </label>
                      <input
                        type="text"
                        value={saleForm.noResi || ""}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, noResi: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-sm font-black uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Qty
                        </label>
                        <input
                          type="number"
                          readOnly
                          disabled
                          value={saleForm.qty || 0}
                          className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 text-sm font-black font-mono cursor-not-allowed"
                        />
                        <p className="text-[8px] text-slate-400 mt-1 uppercase">
                          * QTY TIDAK DAPAT DIUBAH DISINI UNTUK MENJAGA
                          INTEGRITAS STOK
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          Total Harga
                        </label>
                        <input
                          type="number"
                          value={saleForm.totalHarga || 0}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              totalHarga: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-sm font-black font-mono"
                        />
                      </div>
                    </div>
                    <div className="pt-6 border-t-2 border-slate-900 flex gap-4">
                      <button
                        type="submit"
                        className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
                      >
                        Update Transaksi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === "stok_barang" && (
            <section className="col-span-12 min-h-[500px] pt-8 min-w-0">
              <div className="bg-white border-2 border-slate-900 flex flex-col min-h-[500px] overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]">
                <div className="p-6 border-b-2 border-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-slate-50">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <Package className="w-6 h-6 border-2 border-slate-900 bg-indigo-100 p-0.5 shadow-[2px_2px_0px_0px_#0f172a]" />
                    Data Stok & Barang
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:flex lg:items-center">
                    <div className="relative w-full lg:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="CARI KODE / NAMA..."
                        value={localSearchInventory}
                        onChange={(e) => setLocalSearchInventory(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full h-10 bg-white border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a]"
                      />
                      {localSearchInventory && (
                        <button
                          onClick={() => {
                            setLocalSearchInventory("");
                            setSearchInventory("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const text = sortedAndFilteredProducts
                          .map((p) => `${p.stokSaatIni}\t${p.kodeBarang}`)
                          .join("\n");
                        setExportStockText(text);
                        setIsExportStockModalOpen(true);
                      }}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 w-full lg:w-auto"
                    >
                      <Download className="w-4 h-4 shrink-0" /> EXPORT STOK TEXT
                    </button>
                    <button
                      onClick={() => {
                        setEditProductId(null);
                        handleCancelEdit();
                        setIsProductModalOpen(true);
                      }}
                      className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 w-full lg:w-auto"
                    >
                      <Plus className="w-4 h-4 shrink-0" /> TAMBAH BARANG
                    </button>
                  </div>
                </div>

                {/* Advanced Filter Panel */}
                <div className="p-6 bg-slate-50 border-b-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold leading-relaxed shrink-0">
                  {/* Kondisi */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                      Kondisi Stok
                    </label>
                    <select
                      value={filterKondisi}
                      onChange={(e) => setFilterKondisi(e.target.value)}
                      className="w-full h-10 px-3 bg-white border-2 border-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="all">⚡ SEMUA KONDISI</option>
                      <option value="kosong">❌ STOK KOSONG (≤ 0)</option>
                      <option value="menipis">⚠️ STOK MENIPIS (1 - 2)</option>
                      <option value="aman">✅ STOK AMAN (&gt; 2)</option>
                      <option value="terlaris">🔥 TERLARIS (TERJUAL ≥ 10)</option>
                    </select>
                  </div>

                  {/* Supplier */}
                  <div className="space-y-1 relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                      Supplier
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                        className="w-full h-10 px-3 bg-white border-2 border-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600 flex items-center justify-between cursor-pointer text-left uppercase text-xs shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <span className="truncate pr-2">
                          {filterSuppliers.length === 0
                            ? "📦 SEMUA SUPPLIER"
                            : filterSuppliers.length === 1
                            ? `📦 ${filterSuppliers[0]}`
                            : `📦 TERPILIH (${filterSuppliers.length})`}
                        </span>
                        {isSupplierDropdownOpen ? (
                          <ChevronUp className="w-4 h-4 shrink-0 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0 text-slate-500" />
                        )}
                      </button>

                      {isSupplierDropdownOpen && (
                        <>
                          {/* Invisible backdrop to dismiss with tap outside */}
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsSupplierDropdownOpen(false);
                              setSupplierSearch("");
                            }} 
                          />
                          
                          {/* Dropdown menu */}
                          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] rounded-none overflow-hidden max-h-72 flex flex-col">
                            {/* Search */}
                            <div className="p-2 border-b border-slate-200">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Cari supplier..."
                                  value={supplierSearch}
                                  onChange={(e) => setSupplierSearch(e.target.value)}
                                  className="w-full text-[11px] font-bold pl-8 pr-2 py-1.5 bg-slate-50 border-2 border-slate-900 focus:outline-none focus:border-indigo-600 rounded-none uppercase"
                                />
                              </div>
                            </div>

                            {/* Actions Header */}
                            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-100 text-[10px] font-black border-b border-slate-900 text-slate-600 shrink-0">
                              <button
                                type="button"
                                onClick={() => setFilterSuppliers([...uniqueSuppliers])}
                                className="hover:text-indigo-600 uppercase cursor-pointer"
                              >
                                Pilih Semua
                              </button>
                              <span>|</span>
                              <button
                                type="button"
                                onClick={() => setFilterSuppliers([])}
                                className="hover:text-rose-600 uppercase cursor-pointer"
                              >
                                Bersihkan
                              </button>
                            </div>

                            {/* Elements List */}
                            <div className="overflow-y-auto max-h-48 divide-y divide-slate-100">
                              {uniqueSuppliers.filter(sup => 
                                sup.toLowerCase().includes(supplierSearch.toLowerCase().trim())
                              ).length === 0 ? (
                                <div className="p-3 text-center text-[11px] text-slate-400 font-bold">
                                  Tidak ada supplier
                                </div>
                              ) : (
                                uniqueSuppliers
                                  .filter(sup => sup.toLowerCase().includes(supplierSearch.toLowerCase().trim()))
                                  .map((sup) => {
                                    const isChecked = filterSuppliers.includes(sup);
                                    return (
                                      <button
                                        key={sup}
                                        type="button"
                                        onClick={() => {
                                          if (isChecked) {
                                            setFilterSuppliers(filterSuppliers.filter((s) => s !== sup));
                                          } else {
                                            setFilterSuppliers([...filterSuppliers, sup]);
                                          }
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-left hover:bg-slate-50 transition-colors uppercase outline-none"
                                      >
                                        <span className="truncate pr-2">{sup}</span>
                                        <div className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center shrink-0 ${isChecked ? "bg-indigo-600" : "bg-white"}`}>
                                          {isChecked && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                                        </div>
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock values filter with operator */}
                  <div className="space-y-1 sm:col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                      Filter Angka Stok Barang
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={filterStockOperator}
                        onChange={(e) => {
                          setFilterStockOperator(e.target.value);
                          if (e.target.value === "all") setFilterStockQty("");
                        }}
                        className="w-1/2 h-10 px-3 bg-white border-2 border-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      >
                        <option value="all">🔢 SEMUA JUMLAH</option>
                        <option value="=">= (SAMA DENGAN)</option>
                        <option value="<">&lt; (KURANG DARI)</option>
                        <option value=">">&gt; (LEBIH DARI)</option>
                        <option value="<=">&le; (KURANG / SAMA DENGAN)</option>
                        <option value=">=">&ge; (LEBIH / SAMA DENGAN)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Masukkan angka..."
                        disabled={filterStockOperator === "all"}
                        value={filterStockQty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilterStockQty(val === "" ? "" : Number(val));
                        }}
                        className="w-1/2 h-10 px-3 bg-white border-2 border-slate-900 font-mono font-black focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Reset All Filters Button */}
                  <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-2 border-t border-slate-200 border-dashed">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterKondisi("all");
                        setFilterSuppliers([]);
                        setFilterStockOperator("all");
                        setFilterStockQty("");
                        setLocalSearchInventory("");
                        setSearchInventory("");
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black uppercase tracking-widest text-[10px] border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCcw className="w-3 h-3" /> RESET SEMUA FILTER
                    </button>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-x-auto overflow-y-auto min-w-0 max-h-[600px] relative scrollbar-thin"
                  onScroll={handleInventoryScroll}
                >
                  <table className="w-full text-left whitespace-nowrap min-w-[1200px] border-collapse table-auto">
                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-xs uppercase tracking-widest font-black">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-100 uppercase tracking-widest text-center border-r border-slate-700 w-[80px]">
                          AKSI
                        </th>
                        <SortableHeader
                          label="Nama Barang"
                          sortKey="namaBarang"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                        <SortableHeader
                          label="Stok Sekarang"
                          sortKey="stokSaatIni"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                          className="bg-indigo-900 border-r border-slate-700"
                        />
                        <SortableHeader
                          label="Kode Barang"
                          sortKey="kodeBarang"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                        <SortableHeader
                          label="Supplier"
                          sortKey="supplier"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                        <SortableHeader
                          label="Harga Beli"
                          sortKey="hargaBeli"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="right"
                        />
                        <SortableHeader
                          label="Stok Awal"
                          sortKey="stokAwal"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="Stok Barang"
                          sortKey="stokBarang"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="Terjual"
                          sortKey="terjual"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="Group Name"
                          sortKey="groupName"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="Warna"
                          sortKey="color"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="BC"
                          sortKey="bc"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                        <SortableHeader
                          label="Kadar Air"
                          sortKey="kadarAir"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          align="center"
                        />
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {sortedAndFilteredProducts.length === 0 ? (
                        <tr>
                          <td
                             className="px-6 py-4 pt-10 text-xs text-center text-slate-400 font-black uppercase tracking-widest"
                             colSpan={13}
                          >
                             Belum ada data barang.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {virtualizedProducts.topSpacerHeight > 0 && (
                            <tr style={{ height: `${virtualizedProducts.topSpacerHeight}px` }}>
                              <td colSpan={13} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedProducts.topSpacerHeight}px` }} />
                            </tr>
                          )}
                          {virtualizedProducts.slice.map((p: any, idx) => {
                            const absoluteIdx = inventoryStartIndex + idx;
                            const isLowStock = p.stokSaatIni <= 0;
                            const bgColor =
                              absoluteIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                            return (
                              <tr
                                key={p.id}
                                className={`${bgColor} hover:bg-slate-100 transition-colors border-b border-slate-200 group`}
                              >
                                <td className="px-6 py-4 text-center border-r border-slate-200">
                                  <button
                                    onClick={() => handleEditProduct(p)}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-transparent hover:border-slate-900 transition-all sm:opacity-80 group-hover:opacity-100 shadow-none hover:shadow-[2px_2px_0px_0px_#0f172a]"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-800 border-r border-slate-200">
                                  {p.namaBarang}
                                </td>
                                <td
                                  className={`px-6 py-4 text-sm text-center font-bold border-r border-slate-200 ${isLowStock ? "bg-rose-50 text-red-600" : "bg-indigo-50/30 text-indigo-600"}`}
                                >
                                  {p.stokSaatIni}
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-slate-900 border-r border-slate-200">
                                  {p.kodeBarang}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500 border-r border-slate-200">
                                  {p.supplier || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700 text-right font-mono border-r border-slate-200">
                                  {(p.hargaBeli || 0).toLocaleString("id-ID")}
                                </td>
                                <td className="px-6 py-4 text-sm text-center font-mono text-slate-600 border-r border-slate-200">
                                  {p.stokAwal}
                                </td>
                                <td className="px-6 py-4 text-sm text-center font-mono text-slate-600 border-r border-slate-200 font-bold">
                                  {p.stokBarang}
                                </td>
                                <td className="px-6 py-4 text-sm text-center font-bold text-slate-600 border-r border-slate-200">
                                  {p.terjual}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold font-mono text-slate-600 border-r border-slate-200 text-center">
                                  {p.groupName || "-"}
                                </td>
                                <td className="px-6 py-4 text-xs border-r border-slate-200 text-center">
                                  {p.color ? (
                                    <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                                      {p.color}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-600 border-r border-slate-200 text-center">
                                  {p.bc || "-"}
                                </td>
                                <td className="px-6 py-4 text-xs text-center font-mono text-slate-600">
                                  {p.kadarAir || "-"}
                                </td>
                              </tr>
                            );
                          })}
                          {virtualizedProducts.bottomSpacerHeight > 0 && (
                            <tr style={{ height: `${virtualizedProducts.bottomSpacerHeight}px` }}>
                              <td colSpan={13} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedProducts.bottomSpacerHeight}px` }} />
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 shrink-0">
                  <span>
                    Menampilkan {sortedAndFilteredProducts.length} produk
                    berdasarkan filter
                  </span>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border border-slate-200 rounded font-medium bg-white hover:bg-slate-50 text-slate-600">
                      Prev
                    </button>
                    <button className="px-2 py-1 border border-slate-200 rounded bg-white font-bold text-slate-900 shadow-sm">
                      1
                    </button>
                    <button className="px-2 py-1 border border-slate-200 rounded font-medium bg-white hover:bg-slate-50 text-slate-600">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* KATALOG TAB */}
          {activeTab === "katalog" && (
            <KatalogTab products={products} />
          )}

          {/* Database Penjualan TAB */}
          {activeTab === "database_penjualan" && (
            <section className="col-span-12 flex flex-col min-h-[500px] min-w-0">
              <div className="bg-white border-2 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]">
                <div className="p-6 border-b-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between shrink-0 bg-slate-50 gap-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <ShoppingBag className="w-5 h-5" /> Database Penjualan
                  </h2>
                  <div className="flex gap-2 border-2 border-slate-900 p-1 bg-white shadow-[2px_2px_0px_0px_#0f172a]">
                    <button
                      onClick={() => setDatabaseSubTab("regular")}
                      className={`px-4 py-2 font-black uppercase text-xs tracking-wider transition-colors ${databaseSubTab === "regular" ? "bg-slate-900 text-white animate-none" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      Transaksi Regular
                    </button>
                    <button
                      onClick={() => setDatabaseSubTab("dropship")}
                      className={`px-4 py-2 font-black uppercase text-xs tracking-wider transition-colors ${databaseSubTab === "dropship" ? "bg-slate-900 text-white animate-none" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      Transaksi Dropship (DS)
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-4 bg-slate-50 border-b-2 border-slate-900 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:max-w-2xl">
                    <div className="relative w-full sm:max-w-md">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={databaseSubTab === "regular" ? localSalesSearch : localSalesDSSearch}
                        onChange={(e) => {
                          if (databaseSubTab === "regular") {
                            setLocalSalesSearch(e.target.value);
                          } else {
                            setLocalSalesDSSearch(e.target.value);
                          }
                        }}
                        placeholder={
                          databaseSubTab === "regular"
                            ? "Cari No. Pesanan, Kode, Nama Barang, Resi, Kurir..."
                            : "Cari No. Pesanan, Produk, Resi, Pelanggan, Supplier..."
                        }
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-900 font-bold text-xs placeholder-slate-400 focus:outline-none focus:bg-slate-50 transition-colors"
                      />
                      {(databaseSubTab === "regular" ? localSalesSearch : localSalesDSSearch) && (
                        <button
                          onClick={() => {
                            if (databaseSubTab === "regular") {
                              setLocalSalesSearch("");
                              setSalesSearch("");
                            } else {
                              setLocalSalesDSSearch("");
                              setSalesDSSearch("");
                            }
                          }}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {databaseSubTab === "dropship" && (
                      <button
                        onClick={handleExportLastDropship}
                        className="w-full sm:w-auto h-8 whitespace-nowrap px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5 text-white" /> Export Data Terakhir
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Tampilkan:</span>
                    <div className="flex border-2 border-slate-900 divide-x-2 divide-slate-900 bg-white shadow-[2px_2px_0px_0px_#0f172a] text-xs font-black">
                      {([50, 100, 500, "all"] as const).map((limit) => {
                        const isSelected =
                          databaseSubTab === "regular"
                            ? salesLimit === limit
                            : salesDSLimit === limit;
                        return (
                          <button
                            key={limit}
                            onClick={() => {
                              if (databaseSubTab === "regular") {
                                setSalesLimit(limit);
                              } else {
                                setSalesDSLimit(limit);
                              }
                            }}
                            className={`px-3 py-1.5 uppercase transition-colors ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {limit === "all" ? "Semua" : limit}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {databaseSubTab === "regular" ? (
                  <div 
                    className="flex-1 overflow-x-auto overflow-y-auto min-w-0 max-h-[600px] relative scrollbar-thin"
                    onScroll={handleSalesScroll}
                  >
                    {/* Table View (Hidden on mobile) */}
                    <div className="hidden md:block overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left whitespace-nowrap min-w-[1600px] border-collapse table-auto">
                        <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] uppercase tracking-widest font-black">
                          <tr>
                            <th className="px-3 py-4 border-r border-slate-700">Tgl. Order</th>
                            <th className="px-3 py-4 border-r border-slate-700">Channel</th>
                            <th className="px-3 py-4 border-r border-slate-700">No. Pesanan / Alamat</th>
                            <th className="px-3 py-4 border-r border-slate-700">No Resi</th>
                            <th className="px-3 py-4 border-r border-slate-700">Nama Ekspedisi</th>
                            <th className="px-3 py-4 border-r border-slate-700">Jenis Barang</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-center">Qty</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right">Total Penjualan</th>
                            <th className="px-3 py-4 border-r border-slate-700">Kode Barang</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right">HPP</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-center">Stok Saat ini</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right">Total HPP</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right">Laba</th>
                            <th className="px-3 py-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                      <tbody className="bg-white">
                        {filteredSales.length === 0 ? (
                          <tr>
                            <td
                              className="px-6 py-4 pt-10 text-sm text-center text-slate-500"
                              colSpan={14}
                            >
                              {sales.length === 0
                                ? "Belum ada transaksi penjualan."
                                : "Tidak ada transaksi penjualan yang cocok dengan pencarian."}
                            </td>
                          </tr>
                        ) : (
                          <>
                            {virtualizedSales.topSpacerHeight > 0 && (
                              <tr style={{ height: `${virtualizedSales.topSpacerHeight}px` }}>
                                <td colSpan={14} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedSales.topSpacerHeight}px` }} />
                              </tr>
                            )}
                            {virtualizedSales.slice.map((s, idx) => {
                              const absoluteIdx = salesStartIndex + idx;
                              const bgColor =
                                absoluteIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                              const product = products.find(
                                (p) =>
                                  p.kodeBarang === s.kodeBarang ||
                                  p.id === s.productId,
                              );
                              return (
                                <tr
                                  key={s.id || idx}
                                  className={`${bgColor} hover:bg-slate-100 transition-colors border-b border-slate-200 group`}
                                >
                                  <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">
                                    {s.tanggalOrder ||
                                      (s.tanggal
                                        ? new Date(
                                            s.tanggal.seconds ? s.tanggal.seconds * 1000 : s.tanggal,
                                          ).toLocaleDateString("id-ID")
                                        : "-")}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">
                                    {s.channel || "-"}
                                  </td>
                                  <td
                                    className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200 truncate max-w-[150px]"
                                    title={s.noPesanan}
                                  >
                                    {s.noPesanan || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] font-mono text-slate-500 border-r border-slate-200">
                                    {s.noResi || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">
                                    {s.namaEkspedisi || "-"}
                                  </td>
                                  <td
                                    className="px-3 py-4 text-[11px] font-bold text-slate-900 border-r border-slate-200 truncate max-w-[200px]"
                                    title={s.namaBarang}
                                  >
                                    {s.namaBarang}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] text-center font-bold text-slate-900 border-r border-slate-200">
                                    {s.qty}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] font-bold text-slate-900 text-right border-r border-slate-200">
                                    {(s.totalHarga || 0).toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] font-mono text-slate-500 border-r border-slate-200">
                                    {s.kodeBarang || "-"}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] text-right font-mono text-slate-500 border-r border-slate-200">
                                    {(s.hpp || 0).toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] text-center font-black border-r border-slate-200 text-slate-600">
                                    {product 
                                      ? (productStockMap[product.id || ""] ?? (product.kodeBarang ? productStockMap[product.kodeBarang.trim().toLowerCase()] : undefined) ?? product.stokAwal)
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-4 text-[11px] text-right font-mono text-slate-500 border-r border-slate-200">
                                    {(s.totalHpp || 0).toLocaleString("id-ID")}
                                  </td>
                                  <td
                                    className={`px-3 py-4 text-[11px] font-black text-right border-r border-slate-200 ${s.laba && s.laba > 0 ? "text-green-700" : "text-slate-900"}`}
                                  >
                                    {(s.laba || 0).toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-3 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditSale(s)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-900 shadow-none transition-all"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          console.log("Setting sale to delete:", s);
                                          setSaleToDelete(s);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-900 shadow-none transition-all pointer-events-auto"
                                        title="Hapus Transaksi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                              {virtualizedSales.bottomSpacerHeight > 0 && (
                                <tr style={{ height: `${virtualizedSales.bottomSpacerHeight}px` }}>
                                  <td colSpan={14} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedSales.bottomSpacerHeight}px` }} />
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View (Regular) */}
                    <div className="block md:hidden p-4 space-y-4 bg-slate-50">
                       {filteredSales.length === 0 && (
                         <div className="text-center p-12 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3">
                           <Database className="w-8 h-8 text-slate-200" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Tidak Ditemukan</p>
                         </div>
                       )}
                       {virtualizedSales.slice.map((s, idx) => (
                         <div key={s.id || idx} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] active:translate-y-[-1px] transition-all" onClick={() => handleEditSale(s)}>
                            <div className="bg-slate-50 p-3 border-b-2 border-slate-900 flex justify-between items-center">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{s.tanggalOrder || (s.tanggal ? new Date(s.tanggal.seconds ? s.tanggal.seconds * 1000 : s.tanggal).toLocaleDateString("id-ID") : "-")}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.channel || "NO CHANNEL"}</span>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleEditSale(s); }} className="p-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:shadow-none hover:bg-slate-50 transition-all"><Pencil className="w-3.5 h-3.5 text-slate-700" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); setSaleToDelete(s); }} className="p-2 bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:shadow-none hover:bg-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                               </div>
                            </div>
                            <div className="p-4 space-y-4">
                               <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 space-y-1">
                                     <h3 className="text-sm font-black text-slate-900 uppercase leading-snug">{s.namaBarang}</h3>
                                     <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">SKU: {s.kodeBarang || "-"}</span>
                                       <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-200 px-1.5 py-0.5 rounded">Qty: {s.qty}</span>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Jual</div>
                                     <div className="text-lg font-black text-indigo-600 leading-none">Rp {(s.totalHarga || 0).toLocaleString("id-ID")}</div>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                  <div className="space-y-1">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Resi / Paket</p>
                                     <p className="text-[11px] font-black text-slate-800 font-mono truncate">{s.noResi || "-"}</p>
                                     <p className="text-[10px] font-bold text-slate-500 uppercase">{s.namaEkspedisi || "-"}</p>
                                  </div>
                                  <div className="text-right space-y-1">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profit (Laba)</p>
                                     <p className={`text-sm font-black font-mono ${(s.laba || 0) > 0 ? "text-emerald-600" : (s.laba || 0) < 0 ? "text-rose-600" : "text-slate-900"}`}>
                                       Rp {(s.laba || 0).toLocaleString("id-ID")}
                                     </p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">HPP: Rp {(s.hpp || 0).toLocaleString("id-ID")}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex-1 overflow-y-auto min-w-0 max-h-[600px] relative scrollbar-thin overflow-x-hidden"
                    onScroll={handleSalesDSScroll}
                  >
                    {/* Desktop View Dropship */}
                    <div className="hidden xl:block overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap min-w-[1600px] border-collapse table-auto text-xs font-bold text-slate-700">
                        <thead className="bg-[#0f172a] text-white sticky top-0 z-10 text-[9px] uppercase tracking-widest font-black">
                          <tr>
                            <th className="px-3 py-4 border-r border-slate-700">Tgl. Order</th>
                            <th className="px-3 py-4 border-r border-slate-700">Kode Supplier</th>
                            <th className="px-3 py-4 border-r border-slate-700">Channel</th>
                            <th className="px-3 py-4 border-r border-slate-700">No. Pesanan</th>
                            <th className="px-3 py-4 border-r border-slate-700">No Resi</th>
                            <th className="px-3 py-4 border-r border-slate-700">Pelanggan</th>
                            <th className="px-3 py-4 border-r border-slate-700">Alamat Pelanggan</th>
                            <th className="px-3 py-4 border-r border-slate-700">Nama Produk</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-center w-12">Qty</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right w-24">HPP</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right w-32">Total Penjualan</th>
                            <th className="px-3 py-4 border-r border-slate-700 text-right w-24">Ongkir</th>
                            <th className="px-3 py-4 text-right w-28 bg-slate-800">Laba DS</th>
                            <th className="px-3 py-4 text-center w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {filteredSalesDS.length === 0 ? (
                            <tr>
                              <td className="px-6 py-12 text-sm text-center text-slate-500" colSpan={14}>
                                {salesDS.length === 0 ? "Belum ada transaksi penjualan dropship (DS) tersimpan." : "Tidak ada transaksi dropship yang cocok dengan pencarian."}
                              </td>
                            </tr>
                          ) : (
                            <>
                              {virtualizedSalesDS.topSpacerHeight > 0 && (
                                <tr style={{ height: `${virtualizedSalesDS.topSpacerHeight}px` }}>
                                  <td colSpan={14} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedSalesDS.topSpacerHeight}px` }} />
                                </tr>
                              )}
                              {virtualizedSalesDS.slice.map((s, idx) => {
                                const absoluteIdx = salesDSStartIndex + idx;
                                const bgColor = absoluteIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                                return (
                                  <tr key={s.id || idx} className={`${bgColor} hover:bg-slate-100 transition-colors border-b border-slate-200 group`}>
                                    <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">{s.tanggalOrder || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-mono font-medium text-indigo-700 border-r border-slate-200">{s.kodeSupplier || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">{s.channel || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-mono text-slate-700 border-r border-slate-200 truncate max-w-[150px]">{s.noPesanan || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-mono text-slate-500 border-r border-slate-200 truncate max-w-[150px]">{s.noResi || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-medium text-slate-800 border-r border-slate-200">{s.namaPelanggan || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-medium text-slate-500 border-r border-slate-200 whitespace-pre-wrap max-w-[200px] leading-relaxed">{s.alamatPelanggan || "-"}</td>
                                    <td className="px-3 py-4 text-[11px] font-bold text-slate-900 border-r border-slate-200 whitespace-pre-wrap max-w-[220px] leading-relaxed">{s.namaProduk}</td>
                                    <td className="px-3 py-4 text-[11px] text-center font-bold text-slate-900 border-r border-slate-200">{s.qty}</td>
                                    <td className="px-3 py-4 text-[11px] text-right font-mono text-slate-500 border-r border-slate-200">{(s.hpp || 0).toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-4 text-[11px] text-right font-bold text-indigo-600 border-r border-slate-200">{(s.totalPenjualan || 0).toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-4 text-[11px] text-right font-mono text-slate-500 border-r border-slate-200">{(s.ongkosKirim || 0).toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-4 text-[11px] text-right font-bold font-mono text-emerald-600 border-r border-slate-200 bg-emerald-50/25">{(s.laba || 0).toLocaleString("id-ID")}</td>
                                    <td className="px-3 py-4 text-center">
                                      <button onClick={() => setSaleDSToDelete(s)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 border border-transparent hover:border-slate-300 transition-all shadow-none"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {virtualizedSalesDS.bottomSpacerHeight > 0 && (
                                <tr style={{ height: `${virtualizedSalesDS.bottomSpacerHeight}px` }}>
                                  <td colSpan={14} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedSalesDS.bottomSpacerHeight}px` }} />
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Dropship */}
                    <div className="block xl:hidden p-4 space-y-4 bg-slate-50">
                       {filteredSalesDS.length === 0 && (
                         <div className="text-center p-12 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3">
                           <ShoppingBag className="w-8 h-8 text-slate-200" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">DS Tidak Ditemukan</p>
                         </div>
                       )}
                       {virtualizedSalesDS.slice.map((s, idx) => (
                         <div key={s.id || idx} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[-1px] transition-all">
                            <div className="bg-slate-50 p-3 border-b-2 border-slate-900 flex justify-between items-center">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{s.tanggalOrder} • DS</span>
                                 <span className="text-[9px] font-bold text-indigo-700 font-mono uppercase">Supplier: {s.kodeSupplier || "-"}</span>
                               </div>
                               <button onClick={() => setSaleDSToDelete(s)} className="p-2 bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] active:shadow-none hover:bg-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                            </div>
                            <div className="p-4 space-y-4">
                               <div className="space-y-1">
                                  <h3 className="text-sm font-black text-slate-900 uppercase leading-snug whitespace-pre-wrap">{s.namaProduk}</h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded border border-slate-200">No. Pesanan: {s.noPesanan || "-"}</span>
                                    <span className="text-[10px] font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Qty: {s.qty}</span>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</p>
                                    <p className="text-[11px] font-black text-slate-800 leading-tight">{s.namaPelanggan || "-"}</p>
                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1 italic">{s.alamatPelanggan || "-"}</p>
                                 </div>
                                 <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Resi</p>
                                    <p className="text-[11px] font-black text-slate-800 font-mono">{s.noResi || "-"}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{s.channel || "Direct"}</p>
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
                                  <div className="space-y-1">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Keuangan</p>
                                     <div className="flex flex-col gap-0.5">
                                       <span className="text-[10px] font-bold text-slate-600">HPP: Rp {(s.hpp || 0).toLocaleString("id-ID")}</span>
                                       <span className="text-[10px] font-bold text-slate-600">Ongkir: Rp {(s.ongkosKirim || 0).toLocaleString("id-ID")}</span>
                                     </div>
                                  </div>
                                  <div className="text-right self-end">
                                     <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Profit DS</div>
                                     <div className="text-lg font-black text-emerald-600 leading-none">Rp {(s.laba || 0).toLocaleString("id-ID")}</div>
                                     <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Bruto: Rp {(s.totalPenjualan || 0).toLocaleString("id-ID")}</div>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Pagination Footer */}
                <div className="p-4 bg-slate-50 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black uppercase shrink-0">
                  <span className="text-slate-700 tracking-wider">
                    {(() => {
                      const limit = databaseSubTab === "regular" ? salesLimit : salesDSLimit;
                      const page = databaseSubTab === "regular" ? salesPage : salesDSPage;
                      const total = databaseSubTab === "regular" ? filteredSales.length : filteredSalesDS.length;
                      
                      if (total === 0) return "Tidak ada data tampil";
                      if (limit === "all") return `Menampilkan semua ${total.toLocaleString("id-ID")} data`;
                      
                      const start = (page - 1) * limit + 1;
                      const end = Math.min(page * limit, total);
                      return `Menampilkan ${start}-${end} dari ${total.toLocaleString("id-ID")} data`;
                    })()}
                  </span>
                  
                  {((databaseSubTab === "regular" ? salesLimit : salesDSLimit) !== "all") && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (databaseSubTab === "regular") {
                            setSalesPage(prev => Math.max(1, prev - 1));
                          } else {
                            setSalesDSPage(prev => Math.max(1, prev - 1));
                          }
                        }}
                        disabled={
                          databaseSubTab === "regular" ? salesPage === 1 : salesDSPage === 1
                        }
                        className="px-3 py-1.5 border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
                      >
                        Sebelumnya
                      </button>
                      
                      <button
                        onClick={() => {
                          if (databaseSubTab === "regular") {
                            const maxPage = Math.ceil(filteredSales.length / (salesLimit as number));
                            setSalesPage(prev => Math.min(maxPage, prev + 1));
                          } else {
                            const maxPage = Math.ceil(filteredSalesDS.length / (salesDSLimit as number));
                            setSalesDSPage(prev => Math.min(maxPage, prev + 1));
                          }
                        }}
                        disabled={
                          databaseSubTab === "regular"
                            ? salesPage >= Math.ceil(filteredSales.length / (salesLimit as number)) || filteredSales.length === 0
                            : salesDSPage >= Math.ceil(filteredSalesDS.length / (salesDSLimit as number)) || filteredSalesDS.length === 0
                        }
                        className="px-3 py-1.5 border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
                      >
                        Berikutnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Database Barang Masuk TAB */}
          {activeTab === "barang_masuk" && (
            <section className="col-span-12 flex flex-col min-h-[500px] min-w-0">
              <div className="bg-white border-2 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[8px_8px_0px_0px_#0f172a]">
                <div className="p-6 border-b-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between shrink-0 bg-slate-50 gap-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowDown className="w-5 h-5" /> Database Barang Masuk
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setIsIncomingTextModalOpen(true)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> TAMBAH VIA TEKS
                    </button>
                    <button
                      onClick={() => setIsIncomingModalOpen(true)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> TAMBAH DATA MASUK
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar for Incoming Goods */}
                <div className="p-4 bg-slate-50 border-b-2 border-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                  <div className="relative w-full sm:max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={localIncomingSearch}
                      onChange={(e) => setLocalIncomingSearch(e.target.value)}
                      placeholder="Cari Kode Barang, Nama Barang, Supplier..."
                      className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-900 font-bold text-xs placeholder-slate-400 focus:outline-none focus:bg-slate-50 transition-colors"
                    />
                    {localIncomingSearch && (
                      <button
                        onClick={() => {
                          setLocalIncomingSearch("");
                          setIncomingSearch("");
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Tampilkan:</span>
                    <div className="flex border-2 border-slate-900 divide-x-2 divide-slate-900 bg-white shadow-[2px_2px_0px_0px_#0f172a] text-xs font-black">
                      {([50, 100, 500, "all"] as const).map((limit) => {
                        const isSelected = incomingLimit === limit;
                        return (
                          <button
                            key={limit}
                            onClick={() => setIncomingLimit(limit)}
                            className={`px-3 py-1.5 uppercase transition-colors ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {limit === "all" ? "Semua" : limit}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-x-auto overflow-y-auto min-w-0 max-h-[600px] relative scrollbar-thin"
                  onScroll={handleIncomingScroll}
                >
                  <table className="w-full text-left whitespace-nowrap min-w-[1000px] border-collapse table-auto">
                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[10px] uppercase tracking-widest font-black">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-700">
                          Tgl. Input
                        </th>
                        <th className="px-6 py-4 border-r border-slate-700">
                          Kode Barang
                        </th>
                        <th className="px-6 py-4 border-r border-slate-700">
                          Nama Barang
                        </th>
                        <th className="px-6 py-4 border-r border-slate-700">
                          Supplier
                        </th>
                        <th className="px-6 py-4 border-r border-slate-700 text-center">
                          Qty Masuk
                        </th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredIncomingGoods.length === 0 ? (
                        <tr>
                          <td
                            className="px-6 py-4 pt-10 text-sm text-center text-slate-500"
                            colSpan={6}
                          >
                            {incomingGoods.length === 0
                              ? "Belum ada data barang masuk."
                              : "Tidak ada data barang masuk yang cocok dengan pencarian."}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {virtualizedIncomingGoods.topSpacerHeight > 0 && (
                            <tr style={{ height: `${virtualizedIncomingGoods.topSpacerHeight}px` }}>
                              <td colSpan={6} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedIncomingGoods.topSpacerHeight}px` }} />
                            </tr>
                          )}
                          {virtualizedIncomingGoods.slice.map((g, idx) => {
                            const absoluteIdx = incomingStartIndex + idx;
                            const bgColor =
                              absoluteIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                            return (
                              <tr
                                key={g.id || idx}
                                className={`${bgColor} hover:bg-slate-100 transition-colors border-b border-slate-200 group`}
                              >
                                <td className="px-6 py-4 text-xs font-medium text-slate-800 border-r border-slate-200">
                                  {g.tanggal
                                    ? new Date(
                                        g.tanggal.seconds ? g.tanggal.seconds * 1000 : g.tanggal,
                                      ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500 border-r border-slate-200">
                                  {g.kodeBarang}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 border-r border-slate-200">
                                  {g.namaBarang}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500 border-r border-slate-200">
                                  {g.supplier || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-center font-black text-indigo-700 border-r border-slate-200">
                                  {g.qty}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => setIncomingToDelete(g)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white border-2 border-transparent hover:border-slate-900 shadow-none transition-all group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {virtualizedIncomingGoods.bottomSpacerHeight > 0 && (
                            <tr style={{ height: `${virtualizedIncomingGoods.bottomSpacerHeight}px` }}>
                              <td colSpan={6} className="p-0 border-0 h-[0px]" style={{ height: `${virtualizedIncomingGoods.bottomSpacerHeight}px` }} />
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 bg-slate-50 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black uppercase shrink-0">
                  <span className="text-slate-700 tracking-wider">
                    {(() => {
                      const limit = incomingLimit;
                      const page = incomingPage;
                      const total = filteredIncomingGoods.length;
                      
                      if (total === 0) return "Tidak ada data tampil";
                      if (limit === "all") return `Menampilkan semua ${total.toLocaleString("id-ID")} data`;
                      
                      const start = (page - 1) * limit + 1;
                      const end = Math.min(page * limit, total);
                      return `Menampilkan ${start}-${end} dari ${total.toLocaleString("id-ID")} data`;
                    })()}
                  </span>
                  
                  {(incomingLimit !== "all") && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIncomingPage(prev => Math.max(1, prev - 1))}
                        disabled={incomingPage === 1}
                        className="px-3 py-1.5 border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
                      >
                        Sebelumnya
                      </button>
                      
                      <button
                        onClick={() => {
                          const maxPage = Math.ceil(filteredIncomingGoods.length / (incomingLimit as number));
                          setIncomingPage(prev => Math.min(maxPage, prev + 1));
                        }}
                        disabled={
                          incomingPage >= Math.ceil(filteredIncomingGoods.length / (incomingLimit as number)) || filteredIncomingGoods.length === 0
                        }
                        className="px-3 py-1.5 border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
                      >
                        Berikutnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Iklan (Advertisement Expenditures) TAB */}
          {activeTab === "iklan" && (
            <section className="col-span-12 flex flex-col min-h-[500px]">
              <div className="bg-white border-4 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[12px_12px_0px_0px_#0f172a]">
                
                {/* Section Header */}
                <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none font-sans">
                      <Megaphone className="w-8 h-8 border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0px_0px_#0f172a]" />
                      Database Pengeluaran Iklan
                    </h2>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-wider mt-1.5 leading-relaxed">
                      MENAMPILKAN SEMUA DATA PENGELUARAN IKLAN YANG TELAH TERSIMPAN DALAM DATABASE.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                      <input
                        type="text"
                        placeholder="Cari Tanggal / No Pesanan..."
                        value={searchIklanQuery}
                        onChange={(e) => setSearchIklanQuery(e.target.value)}
                        className="pl-11 pr-4 py-3 bg-white border-2 border-slate-900 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all w-full sm:w-64"
                      />
                    </div>
                    <button
                      onClick={() => handleOpenIklanModal()}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> TAMBAH IKLAN
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="flex-1 overflow-auto min-h-[400px]">
                  <table className="w-full text-left whitespace-nowrap min-w-[800px] border-collapse table-auto text-xs">
                    <thead className="bg-slate-900 text-white sticky top-0 z-10 font-black uppercase text-[10px] tracking-widest border-b-2 border-slate-950">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-700 text-center w-16">#</th>
                        <th className="px-6 py-4 border-r border-slate-700">Tanggal</th>
                        <th className="px-6 py-4 border-r border-slate-700 text-right">Total Pembayaran</th>
                        <th className="px-6 py-4 border-r border-slate-700">No. Pesanan</th>
                        <th className="px-6 py-4 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100 bg-white">
                      {(() => {
                        const sortedFiltered = iklanList
                          .slice()
                          .sort((a, b) => {
                            const da = parseToDate(a.tanggal) || new Date(0);
                            const db = parseToDate(b.tanggal) || new Date(0);
                            return db.getTime() - da.getTime();
                          })
                          .filter(iklan => 
                            iklan.tanggal.toLowerCase().includes(searchIklanQuery.toLowerCase()) ||
                            iklan.noPesanan?.toLowerCase().includes(searchIklanQuery.toLowerCase())
                          );
                        
                        const displayList = showFullIklan ? sortedFiltered : sortedFiltered.slice(0, 5);
                        
                        return (
                          <>
                            {displayList.map((iklan, index) => (
                              <tr key={iklan.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 border-r border-slate-100 text-center font-mono font-bold text-slate-400 bg-slate-50/50">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 border-r border-slate-100 font-bold text-slate-900">
                                  {iklan.tanggal}
                                </td>
                                <td className="px-6 py-4 border-r border-slate-100 text-right font-mono font-black text-emerald-700 text-sm">
                                  Rp {iklan.totalPembayaran.toLocaleString("id-ID")}
                                </td>
                                <td className="px-6 py-4 border-r border-slate-100 font-mono text-slate-500">
                                  {iklan.noPesanan || "-"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleOpenIklanModal(iklan)}
                                      className="p-2 bg-indigo-50 text-indigo-600 border-2 border-indigo-200 rounded hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setIklanToDelete(iklan)}
                                      className="p-2 bg-rose-50 text-rose-600 border-2 border-rose-200 rounded hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {sortedFiltered.length > 5 && (
                              <tr>
                                <td colSpan={5} className="p-0">
                                  <button
                                    onClick={() => setShowFullIklan(!showFullIklan)}
                                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-colors border-t border-slate-200"
                                  >
                                    {showFullIklan ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" /> SEMBUNYIKAN DATA LAMA
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" /> TAMPILKAN SEMUA DATA ({sortedFiltered.length} BARIS)
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                      {iklanList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Megaphone className="w-12 h-12 text-slate-200" />
                              <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Belum Ada Data Pengeluaran Iklan</p>
                              <button 
                                onClick={() => handleOpenIklanModal()}
                                className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                              >
                                Mulai Tambah Data
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <section className="col-span-12 flex flex-col pt-8">
              <AdminReviews />
            </section>
          )}

          {/* Penjualan Mingguan TAB */}
          {activeTab === "penjualan_mingguan" && (
            <section className="col-span-12 flex flex-col min-h-[500px]">
              <div className="bg-white border-4 border-slate-900 flex flex-col flex-1 overflow-hidden shadow-[12px_12px_0px_0px_#0f172a]">
                
                {/* Section Header */}
                <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none font-sans">
                      <Calendar className="w-8 h-8 border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0px_0px_#0f172a]" />
                      LAPORAN PENJUALAN MINGGUAN {selectedReportYear}
                    </h2>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-wider mt-1.5 leading-relaxed">
                      EVALUASI MINGGUAN: HARGA POKOK PRODUKSI, LABA KOTOR, BIAYA IKLAN, ROI & NET PROFITS
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">PILIH TAHUN:</span>
                    <select
                      value={selectedReportYear}
                      onChange={(e) => setSelectedReportYear(Number(e.target.value))}
                      className="px-4 py-2.5 bg-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all cursor-pointer"
                    >
                      {Array.from({ length: 9 }, (_, i) => 2026 + i).map((y) => (
                        <option key={y} value={y}>
                          TAHUN {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>


                {/* 12 Months Weekly Tables */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-12">
                  {(() => {
                    const { parsedSales, parsedSalesDS, parsedIklanList } = getWeeklyCalculations();

                    const indoMonths = [
                      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
                      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
                    ];

                    return indoMonths.map((mName, mIdx) => {
                      const mNum = mIdx + 1; // 1-12
                      const monthWeeks = WEEKS_DEFINITION.filter((w) => w.month === mNum);

                      // Arrays to save values for month sub-totals calculates
                      const weekRowsData: any[] = [];

                      monthWeeks.forEach((w) => {
                        // Filter sales for month weeks
                        const wkSales = parsedSales.filter(
                          (s) => s.month === mNum && s.day >= w.startDay && s.day <= w.endDay
                        );
                        const wkSalesDS = parsedSalesDS.filter(
                          (s) => s.month === mNum && s.day >= w.startDay && s.day <= w.endDay
                        );
                        const wkIklan = parsedIklanList.filter(
                          (i) => i.month === mNum && i.day >= w.startDay && i.day <= w.endDay
                        );

                        const manualEntry = weeklySalesList.find(
                          (ms) => ms.tahun === selectedReportYear && ms.bulan === mNum && ms.minggu === w.week
                        );

                        const regularHpp = wkSales.reduce((sum, curr) => sum + (curr.totalHpp || 0), 0);
                        const dropshipHpp = wkSalesDS.reduce((sum, curr) => sum + ((curr.hpp || 0) * (curr.qty || 1)), 0);

                        const profitVal = manualEntry ? manualEntry.profit : wkSales.reduce((sum, curr) => sum + (curr.laba || 0), 0);
                        const profitDSVal = manualEntry ? manualEntry.profitDS : wkSalesDS.reduce((sum, curr) => sum + (curr.laba || 0), 0);
                        const iklanVal = manualEntry ? manualEntry.iklan : wkIklan.reduce((sum, curr) => sum + (curr.totalPembayaran || 0), 0);
                        const hppVal = manualEntry ? manualEntry.hpp : (regularHpp + dropshipHpp);

                        const totalProfit = manualEntry ? manualEntry.totalProfit : (profitVal + profitDSVal - iklanVal);
                        const roi = manualEntry ? manualEntry.roi : (iklanVal ? (totalProfit / iklanVal) * 100 : 0);

                        weekRowsData.push({
                          id: manualEntry?.id,
                          week: w.week,
                          startDay: w.startDay,
                          endDay: w.endDay,
                          profit: profitVal,
                          profitDS: profitDSVal,
                          totalProfit,
                          iklan: iklanVal,
                          roi,
                          hpp: hppVal,
                        });
                      });

                      // Calculations for Monthly Aggregations
                      const sumProfit = weekRowsData.reduce((sum, r) => sum + r.profit, 0);
                      const sumProfitDS = weekRowsData.reduce((sum, r) => sum + r.profitDS, 0);
                      
                      // Monthly TOTAL PROFIT = Sum of Profit + Sum of Profit DS (before Ads reduction)
                      const monthTotalProfit = sumProfit + sumProfitDS;
                      
                      const sumIklan = weekRowsData.reduce((sum, r) => sum + r.iklan, 0);
                      const sumHpp = weekRowsData.reduce((sum, r) => sum + r.hpp, 0);
                      
                      // Monthly NETT = TOTAL PROFIT - TOTAL IKLAN
                      const monthNett = monthTotalProfit - sumIklan;
                      
                      // Monthly ROI = NETT / TOTAL IKLAN * 100%
                      const monthRoi = sumIklan > 0 ? (monthNett / sumIklan) * 100 : 0;

                      return (
                        <div key={mIdx} className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] overflow-hidden">
                          {/* Month Title Header */}
                          <div className="px-6 py-4 bg-slate-900 border-b-2 border-slate-950 text-white flex justify-between items-center">
                            <h3 className="text-sm font-black tracking-widest uppercase">
                              📊 BULAN {mName} {selectedReportYear}
                            </h3>
                            <span className="font-mono text-xs font-bold bg-indigo-500 text-white px-3 py-1 border-2 border-slate-950">
                              PROFIT: Rp {monthNett.toLocaleString("id-ID")}
                            </span>
                          </div>

                          {/* Table Detail */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap min-w-[900px] border-collapse table-auto text-xs">
                              <thead>
                                <tr className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider border-b-2 border-slate-900">
                                  <th className="px-4 py-3 border-r border-slate-900 text-center w-28">Minggu</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-center w-16">Tahun</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-center w-24">Bulan</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-center w-28">Tanggal</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-right">Profit</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-right">Profit DS</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-right bg-slate-700 text-white">Total Profit</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-right">Iklan</th>
                                  <th className="px-4 py-3 border-r border-slate-900 text-center w-24">ROI</th>
                                  <th className="px-4 py-3 text-right">HPP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-slate-950 font-medium">
                                {weekRowsData.map((row) => {
                                  return (
                                    <tr key={row.week} className="hover:bg-slate-50 transition-colors border-b border-slate-300">
                                      {/* Week column */}
                                      <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-900 text-center bg-slate-50">
                                        Minggu ke {row.week}
                                      </td>
                                      {/* Year column */}
                                      <td className="px-4 py-3 font-mono text-center text-slate-500 border-r border-slate-900">
                                        {selectedReportYear}
                                      </td>
                                      {/* Month column */}
                                      <td className="px-4 py-3 text-center text-slate-600 border-r border-slate-900 font-bold">
                                        {mName}
                                      </td>
                                      {/* Date column */}
                                      <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-900">
                                        {row.startDay.toString().padStart(2, "0")} s/d {row.endDay.toString().padStart(2, "0")}
                                      </td>
                                      
                                      {/* Profit column */}
                                      <td className="px-4 py-3 text-right border-r border-slate-900 font-mono">
                                        <div className="flex items-center justify-end gap-2 group/profit">
                                          <span>
                                            Rp {row.profit.toLocaleString("id-ID")}
                                          </span>
                                          <button
                                            onClick={() => handleOpenWeeklyModal({
                                              id: row.id,
                                              tahun: selectedReportYear,
                                              bulan: mNum,
                                              minggu: row.week,
                                              profit: row.profit,
                                              profitDS: row.profitDS,
                                              iklan: row.iklan,
                                              hpp: row.hpp,
                                              tanggalStart: row.startDay,
                                              tanggalEnd: row.endDay
                                            })}
                                            className="p-1 hover:bg-slate-200 rounded border border-slate-200 transition-all opacity-30 group-hover/profit:opacity-100"
                                            title="Edit Manual Data"
                                          >
                                            <Pencil className="w-3 h-3 text-slate-500" />
                                          </button>
                                        </div>
                                      </td>
                                      
                                      {/* Profit DS column */}
                                      <td className="px-4 py-3 text-right border-r border-slate-900 font-mono">
                                        <div className="flex items-center justify-end gap-2 group/profitds">
                                          <span>
                                            Rp {row.profitDS.toLocaleString("id-ID")}
                                          </span>
                                          <button
                                            onClick={() => handleOpenWeeklyModal({
                                              id: row.id,
                                              tahun: selectedReportYear,
                                              bulan: mNum,
                                              minggu: row.week,
                                              profit: row.profit,
                                              profitDS: row.profitDS,
                                              iklan: row.iklan,
                                              hpp: row.hpp,
                                              tanggalStart: row.startDay,
                                              tanggalEnd: row.endDay
                                            })}
                                            className="p-1 hover:bg-slate-200 rounded border border-slate-200 transition-all opacity-30 group-hover/profitds:opacity-100"
                                            title="Edit Manual Data"
                                          >
                                            <Pencil className="w-3 h-3 text-slate-500" />
                                          </button>
                                        </div>
                                      </td>
                                      
                                      {/* Total Profit column */}
                                      <td className="px-4 py-3 text-right border-r border-slate-900 font-mono font-black text-slate-900 bg-emerald-50/50">
                                        <div className="flex items-center justify-end gap-2 group/total">
                                          <span>
                                            Rp {row.totalProfit.toLocaleString("id-ID")}
                                          </span>
                                          <button
                                            onClick={() => handleOpenWeeklyModal({
                                              id: row.id,
                                              tahun: selectedReportYear,
                                              bulan: mNum,
                                              minggu: row.week,
                                              profit: row.profit,
                                              profitDS: row.profitDS,
                                              iklan: row.iklan,
                                              hpp: row.hpp,
                                              tanggalStart: row.startDay,
                                              tanggalEnd: row.endDay
                                            })}
                                            className="p-1 hover:bg-slate-200 rounded border border-slate-200 transition-all opacity-30 group-hover/total:opacity-100"
                                            title="Edit Manual Data"
                                          >
                                            <Pencil className="w-3 h-3 text-slate-500" />
                                          </button>
                                        </div>
                                      </td>
                                      
                                      {/* Iklan column */}
                                      <td className="px-4 py-3 text-right border-r border-slate-900 font-mono text-rose-600">
                                        <div className="flex items-center justify-end gap-2 group/iklan">
                                          <span>
                                            Rp {row.iklan.toLocaleString("id-ID")}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setActiveTab("iklan");
                                              setSearchIklanQuery(`${row.startDay.toString().padStart(2, '0')}/${mNum.toString().padStart(2, '0')}/${selectedReportYear}`);
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded border border-slate-200 transition-all opacity-30 group-hover/iklan:opacity-100"
                                            title="Edit Records for this Week"
                                          >
                                            <Pencil className="w-3 h-3 text-slate-500" />
                                          </button>
                                        </div>
                                      </td>
                                      
                                      {/* ROI column */}
                                      <td className={`px-4 py-3 text-center border-r border-slate-900 font-mono font-bold ${
                                        row.roi > 100 ? "text-emerald-600 bg-emerald-50/25" : row.roi > 0 ? "text-indigo-600" : "text-slate-400"
                                      }`}>
                                        {row.roi.toFixed(1)}%
                                      </td>
                                      
                                      {/* HPP column */}
                                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                                        Rp {row.hpp.toLocaleString("id-ID")}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Monthly Subtotals / Summary Row */}
                                <tr className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider select-none leading-none border-t-2 border-slate-950">
                                  <td colSpan={4} className="px-4 py-4 text-center tracking-widest border-r border-slate-700 bg-slate-950 text-indigo-300">
                                    TOTAL {mName}
                                  </td>
                                  <td className="px-4 py-4 text-right border-r border-slate-700 font-mono">
                                    Rp {sumProfit.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-4 text-right border-r border-slate-700 font-mono">
                                    Rp {sumProfitDS.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-4 text-right border-r border-slate-700 font-mono text-emerald-400 bg-emerald-950/40">
                                    Rp {monthTotalProfit.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-4 text-right border-r border-slate-700 font-mono text-rose-400">
                                    Rp {sumIklan.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-4 text-center border-r border-slate-700 font-mono text-amber-300 bg-slate-950">
                                    {monthRoi.toFixed(1)}%
                                  </td>
                                  <td className="px-4 py-4 text-right font-mono text-slate-400">
                                    Rp {sumHpp.toLocaleString("id-ID")}
                                  </td>
                                </tr>

                                {/* Final NETT Row block styled matching user image */}
                                <tr className="bg-emerald-950 text-white font-black text-xs border-t-2 border-slate-950">
                                  <td colSpan={4} className="px-4 py-3 bg-emerald-900 border-r border-slate-950 text-center tracking-widest uppercase font-black text-[10px]">
                                    TOTAL NET PROFIT ({mName})
                                  </td>
                                  <td colSpan={3} className="px-4 py-3 font-mono font-black text-emerald-400 border-r border-slate-950 text-center text-sm">
                                    NETT: Rp {monthNett.toLocaleString("id-ID")}
                                  </td>
                                  <td colSpan={3} className="px-4 py-3 font-mono font-black text-amber-400 text-center text-sm">
                                    ROI: {monthRoi.toFixed(1)}%
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </section>
          )}

          {/* Pengaturan TAB */}
          {activeTab === "pengaturan" && (
            <section className="col-span-12 max-w-6xl mx-auto w-full pt-8 pb-12 px-4">
              <div className="bg-white border-4 border-slate-900 flex flex-col md:flex-row min-h-[600px] overflow-hidden shadow-[12px_12px_0px_0px_#0f172a]">
                
                {/* SETTINGS SIDEBAR */}
                <div className="w-full md:w-64 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-slate-50 flex flex-col">
                  <div className="p-6 border-b-4 border-slate-900 bg-white">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
                      <Settings className="w-6 h-6" />
                      BACKEND
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">System & Database</p>
                  </div>
                  
                  <nav className="flex-1 p-4 space-y-2">
                    <button 
                      onClick={() => setPengaturanSubTab("sync")}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-2 font-black text-xs uppercase tracking-widest transition-all ${
                        pengaturanSubTab === "sync" 
                        ? "bg-indigo-600 text-white border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                      }`}
                    >
                      <RefreshCcw className="w-4 h-4" /> DATA SYNC
                    </button>
                    
                    <button 
                      onClick={() => setPengaturanSubTab("rules")}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-2 font-black text-xs uppercase tracking-widest transition-all ${
                        pengaturanSubTab === "rules" 
                        ? "bg-indigo-600 text-white border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                      }`}
                    >
                      <Table className="w-4 h-4" /> MAPPING RULES
                    </button>
                    
                    <button 
                      onClick={() => setPengaturanSubTab("maintenance")}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-2 font-black text-xs uppercase tracking-widest transition-all ${
                        pengaturanSubTab === "maintenance" 
                        ? "bg-rose-600 text-white border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:border-rose-900 hover:text-rose-600"
                      }`}
                    >
                      <Wrench className="w-4 h-4" /> MAINTENANCE
                    </button>
                  </nav>
                  
                  <div className="p-4 border-t-2 border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 p-3 bg-white border-2 border-slate-200 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">DB Connection Stable</span>
                    </div>
                  </div>
                </div>

                {/* SETTINGS CONTENT */}
                <div className="flex-1 flex flex-col bg-slate-50/30">
                  <div className="p-8 pb-4">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                      {pengaturanSubTab === "sync" && "SINKRONISASI DATA"}
                      {pengaturanSubTab === "rules" && "AUTO MAPPING RULES"}
                      {pengaturanSubTab === "maintenance" && "DATABASE MAINTENANCE"}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {pengaturanSubTab === "sync" && "Kelola perpindahan data melalui file CSV untuk stok dan penjualan."}
                      {pengaturanSubTab === "rules" && "Atur penggantian nama produk otomatis saat melakukan import data."}
                      {pengaturanSubTab === "maintenance" && "Tindakan kritis untuk pembersihan dan perbaikan database."}
                    </p>
                  </div>

                  <div className="p-8 pt-4 flex-1">
                    {pengaturanSubTab === "sync" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* STOK CARD */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-indigo-100 border-2 border-slate-900">
                               <Package className="w-5 h-5 text-indigo-600" />
                             </div>
                             <h4 className="font-black text-sm uppercase tracking-wider">Master Stok</h4>
                          </div>
                          <div className="space-y-3">
                            <button
                              onClick={handleExportProducts}
                              className="w-full py-3 bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold uppercase tracking-widest text-[10px] hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-3 h-3" /> Export CSV
                            </button>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleImportProducts}
                                className="hidden"
                                id="csv-upload-settings"
                              />
                              <label
                                htmlFor="csv-upload-settings"
                                className="cursor-pointer w-full py-3 bg-indigo-600 border-2 border-slate-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                              >
                                <UploadCloud className="w-3 h-3" /> Import Master
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* PENJUALAN CARD */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-emerald-100 border-2 border-slate-900">
                               <ShoppingBag className="w-5 h-5 text-emerald-600" />
                             </div>
                             <h4 className="font-black text-sm uppercase tracking-wider">Data Penjualan</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <input
                                type="file"
                                accept=".csv"
                                ref={saleFileInput}
                                onChange={handleImportSales}
                                className="hidden"
                                id="csv-upload-sales-settings"
                              />
                              <label
                                htmlFor="csv-upload-sales-settings"
                                className="cursor-pointer w-full py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                              >
                                <UploadCloud className="w-3 h-3" /> Import Regular
                              </label>
                            </div>
                            <div>
                              <input
                                type="file"
                                accept=".csv"
                                ref={salesDSFileInput}
                                onChange={handleImportSalesDS}
                                className="hidden"
                                id="csv-upload-sales-ds-settings"
                              />
                              <label
                                htmlFor="csv-upload-sales-ds-settings"
                                className="cursor-pointer w-full py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                              >
                                <UploadCloud className="w-3 h-3" /> Import Dropship
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* OPERATIONS CARD */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-amber-100 border-2 border-slate-900">
                               <ArrowDown className="w-5 h-5 text-amber-600" />
                             </div>
                             <h4 className="font-black text-sm uppercase tracking-wider">Barang Masuk</h4>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept=".csv"
                              ref={incomingFileInput}
                              onChange={handleImportIncomingGoods}
                              className="hidden"
                              id="csv-upload-incoming-settings"
                            />
                            <label
                              htmlFor="csv-upload-incoming-settings"
                              className="cursor-pointer w-full py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                            >
                              <UploadCloud className="w-3 h-3" /> Import Batch
                            </label>
                          </div>
                        </div>

                        {/* MARKETING CARD */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-rose-100 border-2 border-slate-900">
                               <Megaphone className="w-5 h-5 text-rose-600" />
                             </div>
                             <h4 className="font-black text-sm uppercase tracking-wider">Ads Expense</h4>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept=".csv"
                              ref={iklanFileInput}
                              onChange={handleImportIklan}
                              className="hidden"
                              id="csv-upload-iklan-settings"
                            />
                            <label
                              htmlFor="csv-upload-iklan-settings"
                              className="cursor-pointer w-full py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                            >
                              <UploadCloud className="w-3 h-3" /> Import Ads Log
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {pengaturanSubTab === "rules" && (
                      <div className="space-y-8">
                        {/* GLOBAL REPLACEMENT TABLE */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="mb-4 flex items-center justify-between">
                             <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                               <Sparkles className="w-4 h-4 text-emerald-600" />
                               Global Replacements
                             </h4>
                             <button 
                               onClick={() => setReplacementGlobal([...replacementGlobal, { old: "", new: "" }])}
                               className="px-3 py-1 bg-emerald-600 border-2 border-slate-900 text-white font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_#0f172a] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
                             >
                               <Plus className="w-3 h-3" /> Add Rule
                             </button>
                          </div>
                          
                          <div className="border-2 border-slate-900 overflow-hidden bg-slate-50 max-h-[300px] overflow-y-auto">
                             <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-black">
                                   <tr>
                                      <th className="px-3 py-2 border-r border-slate-700">Original Text</th>
                                      <th className="px-3 py-2 border-r border-slate-700">Mapped To</th>
                                      <th className="px-3 py-2 text-center w-12">Action</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {replacementGlobal.map((rep, idx) => (
                                     <tr key={idx} className="bg-white text-[11px]">
                                        <td className="px-3 py-1.5 border-r border-slate-200">
                                           <input 
                                             type="text"
                                             value={rep.old}
                                             onChange={(e) => {
                                               const newRep = [...replacementGlobal];
                                               newRep[idx].old = e.target.value;
                                               setReplacementGlobal(newRep);
                                             }}
                                             className="w-full bg-transparent border-none focus:outline-none font-bold"
                                           />
                                        </td>
                                        <td className="px-3 py-1.5 border-r border-slate-200">
                                           <input 
                                             type="text"
                                             value={rep.new}
                                             onChange={(e) => {
                                               const newRep = [...replacementGlobal];
                                               newRep[idx].new = e.target.value;
                                               setReplacementGlobal(newRep);
                                             }}
                                             className="w-full bg-transparent border-none focus:outline-none font-black text-indigo-700"
                                           />
                                        </td>
                                        <td className="px-3 py-1.5 text-center">
                                           <button onClick={() => setReplacementGlobal(replacementGlobal.filter((_, i) => i !== idx))} className="text-rose-600 p-1">
                                             <Trash2 className="w-3 h-3" />
                                           </button>
                                        </td>
                                     </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                        </div>

                        {/* KIM REPLACEMENT TABLE */}
                        <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#0f172a]">
                          <div className="mb-4 flex items-center justify-between">
                             <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                               <Package className="w-4 h-4 text-indigo-600" />
                               KIM Format Mapping
                             </h4>
                             <button 
                               onClick={() => setReplacementKim([...replacementKim, { old: "", new: "" }])}
                               className="px-3 py-1 bg-indigo-600 border-2 border-slate-900 text-white font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_#0f172a] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
                             >
                               <Plus className="w-3 h-3" /> Add Rule
                             </button>
                          </div>
                          
                          <div className="border-2 border-slate-900 overflow-hidden bg-slate-50 max-h-[300px] overflow-y-auto">
                             <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-black">
                                   <tr>
                                      <th className="px-3 py-2 border-r border-slate-700">KIM Text</th>
                                      <th className="px-3 py-2 border-r border-slate-700">Catalog Name</th>
                                      <th className="px-3 py-2 text-center w-12">Action</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {replacementKim.map((rep, idx) => (
                                     <tr key={idx} className="bg-white text-[11px]">
                                        <td className="px-3 py-1.5 border-r border-slate-200">
                                           <input 
                                             type="text"
                                             value={rep.old}
                                             onChange={(e) => {
                                               const newRep = [...replacementKim];
                                               newRep[idx].old = e.target.value;
                                               setReplacementKim(newRep);
                                             }}
                                             className="w-full bg-transparent border-none focus:outline-none font-bold"
                                           />
                                        </td>
                                        <td className="px-3 py-1.5 border-r border-slate-200">
                                           <input 
                                             type="text"
                                             value={rep.new}
                                             onChange={(e) => {
                                               const newRep = [...replacementKim];
                                               newRep[idx].new = e.target.value;
                                               setReplacementKim(newRep);
                                             }}
                                             className="w-full bg-transparent border-none focus:outline-none font-black text-indigo-700"
                                           />
                                        </td>
                                        <td className="px-3 py-1.5 text-center">
                                           <button onClick={() => setReplacementKim(replacementKim.filter((_, i) => i !== idx))} className="text-rose-600 p-1">
                                             <Trash2 className="w-3 h-3" />
                                           </button>
                                        </td>
                                     </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {pengaturanSubTab === "maintenance" && (
                      <div className="space-y-6">
                        <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-lg">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-rose-100 border-2 border-rose-600 rounded-full">
                               <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-black text-rose-600 uppercase tracking-widest mb-1">Pembersihan Database</h4>
                              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                Menghapus semua data stok dari database secara permanen. Pastikan Anda sudah mengeksport data sebagai backup sebelum melakukan tindakan ini.
                              </p>
                              <div className="mt-6">
                                <button
                                  onClick={() => setIsConfirmDeleteModalOpen(true)}
                                  className="px-8 py-3 bg-white border-2 border-rose-600 text-rose-600 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#e11d48] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#e11d48] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> KOSONGKAN DATABASE
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-slate-100 border-2 border-slate-200 rounded-lg">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">System Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white border-2 border-slate-200 p-3 rounded-md">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Total Products</p>
                              <p className="text-lg font-black text-slate-900">{products.length}</p>
                            </div>
                            <div className="bg-white border-2 border-slate-200 p-3 rounded-md">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Regular Sales</p>
                              <p className="text-lg font-black text-slate-900">{sales.length}</p>
                            </div>
                            <div className="bg-white border-2 border-slate-200 p-3 rounded-md">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Dropship Sales</p>
                              <p className="text-lg font-black text-slate-900">{salesDS.length}</p>
                            </div>
                            <div className="bg-white border-2 border-slate-200 p-3 rounded-md">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Input History</p>
                              <p className="text-lg font-black text-slate-900">{incomingGoods.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BRANDING & IDENTITY TAB (Integrated Banner Management) */}
          {activeTab === "branding" && (
            <section className="col-span-12 max-w-7xl mx-auto w-full pt-8 pb-12">
              <BrandingTab branding={branding} banners={banners} />
            </section>
          )}

          {/* SALE DELETE CONFIRM MODAL */}
          {saleToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS TRANSAKSI?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
                    <p className="text-xs font-medium text-slate-600">
                      Barang:{" "}
                      <span className="font-black">
                        {saleToDelete.namaBarang}
                      </span>
                      <br />
                      No Pesanan:{" "}
                      <span className="font-black">
                        {saleToDelete.noPesanan}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{saleToDelete.qty}</span>
                    </p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      Stok barang akan dikembalikan secara otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setSaleToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SALES DS DELETE CONFIRM MODAL */}
          {saleDSToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS TRANSAKSI DS?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus transaksi dropship ini?</p>
                    <p className="text-xs font-medium text-slate-600">
                      Produk:{" "}
                      <span className="font-black">
                        {saleDSToDelete.namaProduk}
                      </span>
                      <br />
                      No Pesanan:{" "}
                      <span className="font-black">
                        {saleDSToDelete.noPesanan}
                      </span>
                      <br />
                      Pelanggan:{" "}
                      <span className="font-black">
                        {saleDSToDelete.namaPelanggan}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{saleDSToDelete.qty}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setSaleDSToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDeleteDSConfirm}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INCOMING DELETE CONFIRM MODAL */}
          {incomingToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS RECORD MASUK?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>
                      Apakah Anda yakin ingin menghapus data barang masuk ini?
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      Barang:{" "}
                      <span className="font-black">
                        {incomingToDelete.namaBarang}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{incomingToDelete.qty}</span>
                    </p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      Stok barang akan dikurangi secara otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIncomingToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDeleteIncoming}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD INCOMING MODAL */}
          {isIncomingModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-lg shadow-[16px_16px_0px_0px_#0f172a] my-auto">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowDown className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    Tambah Barang Masuk
                  </h3>
                  <button
                    onClick={() => setIsIncomingModalOpen(false)}
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
                      onChange={(e) =>
                        setIncomingForm({
                          ...incomingForm,
                          productId: e.target.value,
                        })
                      }
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
                      value={incomingForm.qty}
                      onChange={(e) =>
                        setIncomingForm({
                          ...incomingForm,
                          qty: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a]"
                    />
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsIncomingModalOpen(false)}
                      className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-indigo-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      SIMPAN RECORD
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PASTE TEXT INCOMING MODAL */}
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
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">
                      Pilih Format Paste Teks
                    </label>
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
                                ? "Contoh:\nNORMAL sisse gray 10 Rp50000\nMINUS sisse blue 350 5 Rp60000"
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
                                          <div className="flex items-center gap-1.5 max-w-[320px]">
                                            <select
                                              value={
                                                item.overrideProductId || ""
                                              }
                                              onChange={(e) =>
                                                handleParsedItemOverrideChange(
                                                  idx,
                                                  e.target.value,
                                                )
                                              }
                                              className="flex-1 px-2 py-1.5 border-2 border-slate-900 bg-white font-bold font-mono text-[11px] focus:outline-none"
                                            >
                                              <option value="">
                                                -- OTOMATIS (AUTO-MATCH) --
                                              </option>
                                              <option value="new">
                                                🆕 PAKSA BUAT BARU DI KATALOG
                                              </option>
                                              {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                  {p.kodeBarang} -{" "}
                                                  {p.namaBarang}
                                                </option>
                                              ))}
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleParsedItemToggleEditMapping(
                                                  idx,
                                                )
                                              }
                                              className="px-2.5 py-1.5 text-xs font-black bg-slate-900 text-white border-2 border-slate-900 transition-all active:translate-y-[1px]"
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

          {/* WEEKLY SALE MANUAL MODAL */}
          {isWeeklyModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
              <div className="bg-white border-4 border-slate-900 w-full max-w-2xl shadow-[16px_16px_0px_0px_#0f172a] my-auto">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-indigo-50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <Pencil className="w-6 h-6 border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    Edit Data Manual Mingguan
                  </h3>
                  <button
                    onClick={() => setIsWeeklyModalOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 bg-slate-100 border-b-2 border-slate-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                   <span>Tahun: {editingWeekly.tahun}</span>
                   <span>Bulan: {editingWeekly.bulan}</span>
                   <span>Minggu: {editingWeekly.minggu}</span>
                </div>
                <form onSubmit={handleSaveWeekly} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Profit Regular (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.profit || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, profit: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 5000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Profit Dropship (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.profitDS || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, profitDS: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 2000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Iklan (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.iklan || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, iklan: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 1000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        HPP (Rp)
                      </label>
                      <input
                        type="text"
                        value={editingWeekly.hpp || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditingWeekly({ ...editingWeekly, hpp: val ? Number(val) : "" });
                        }}
                        placeholder="Contoh: 3000000"
                        className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-rose-500 uppercase">
                    * MENGEDIT DATA DI ATAS AKAN MENIMPA HASIL KALKULASI OTOMATIS DARI TRANSAKSI HARIAN UNTUK MINGGU INI.
                  </p>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsWeeklyModalOpen(false)}
                      className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-indigo-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      SIMPAN PERUBAHAN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* IKLAN ADD/EDIT MODAL */}
          {isIklanModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white border-4 border-slate-900 w-full max-w-lg shadow-[16px_16px_0px_0px_#0f172a] my-auto">
                <div className="p-6 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    <Megaphone className="w-6 h-6 border-2 border-slate-900 bg-emerald-100 p-1 shadow-[2px_2px_0px_0px_#0f172a]" />{" "}
                    {editingIklan.id ? "Edit Pengeluaran Iklan" : "Tambah Pengeluaran Iklan"}
                  </h3>
                  <button
                    onClick={() => setIsIklanModalOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onPaste={handlePasteInIklanModal} onSubmit={handleSaveIklan} className="p-8 space-y-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Tanggal (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 15/05/2026"
                      value={editingIklan.tanggal || ""}
                      onChange={(e) =>
                        setEditingIklan({
                          ...editingIklan,
                          tanggal: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Total Pembayaran (Rp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 150000"
                      value={editingIklan.totalPembayaran || ""}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/\D/g, "");
                        setEditingIklan({
                          ...editingIklan,
                          totalPembayaran: cleanVal ? Number(cleanVal) : "",
                        });
                      }}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      No. Pesanan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nomor pesanan..."
                      value={editingIklan.noPesanan || ""}
                      onChange={(e) =>
                        setEditingIklan({
                          ...editingIklan,
                          noPesanan: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-white border-2 border-slate-900 font-black font-mono shadow-[4px_4px_0px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsIklanModalOpen(false)}
                      className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-emerald-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                    >
                      SIMPAN DATA
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EXPORT DROPSHIP MODAL */}
          {isExportDSModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-lg p-6 md:p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-6 relative">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    📁 EXPORT DATA DROPSHIP TERAKHIR
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Format Data Transaksi Dropship Terakhir (DS)
                  </p>
                  
                  <div className="relative bg-slate-50 border-2 border-slate-900 p-4 rounded-none font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)] min-h-[140px] select-all">
                    {exportDSText}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportDSText);
                      setExportDSToast(true);
                      setTimeout(() => setExportDSToast(false), 2500);
                      setIsExportDSModalOpen(false);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setIsExportDSModalOpen(false)}
                    className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    TUTUP
                  </button>
                </div>

                {/* Copied Toast Alert */}
                {exportDSToast && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase tracking-widest border border-white shadow-lg rounded animate-bounce">
                    ✓ Copied to clipboard!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPORT STOCK TEXT MODAL */}
          {isExportStockModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-lg p-6 md:p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-6 relative">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-emerald-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    📦 EXPORT DATA STOK & BARANG (TEXT)
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Hanya menampilkan stok sekarang dan kode barang (sesuai filter aktif)
                  </p>
                  
                  <div className="relative bg-slate-50 border-2 border-slate-900 p-4 rounded-none font-mono text-xs text-slate-800 whitespace-pre leading-relaxed shadow-[inner_0_2px_4px_rgba(0,0,0,0.06)] max-h-72 overflow-y-auto select-all">
                    {exportStockText || "Tidak ada data produk yang sesuai filter."}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportStockText);
                      setExportStockToast(true);
                      setTimeout(() => setExportStockToast(false), 2500);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setIsExportStockModalOpen(false)}
                    className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-xs border-2 border-slate-900 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    TUTUP
                  </button>
                </div>

                {/* Copied Toast Alert */}
                {exportStockToast && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase tracking-widest border border-white shadow-lg rounded animate-bounce">
                    ✓ Copied to clipboard!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IKLAN DELETE CONFIRM MODAL */}
          {iklanToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS DATA IKLAN?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus data pengeluaran iklan ini?</p>
                    <div className="text-xs font-medium text-slate-600 space-y-1">
                      <p>Tanggal: <span className="font-black text-slate-900">{iklanToDelete.tanggal}</span></p>
                      <p>Total: <span className="font-black text-slate-900">Rp {iklanToDelete.totalPembayaran.toLocaleString("id-ID")}</span></p>
                      {iklanToDelete.noPesanan && <p>No Pesanan: <span className="font-black text-slate-900">{iklanToDelete.noPesanan}</span></p>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIklanToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDeleteIklanLocal}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM DELETE MODAL */}
          {isConfirmDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Trash2 className="w-8 h-8" /> PERINGATAN!
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>
                      Apakah Anda yakin ingin{" "}
                      <span className="text-rose-600 font-black">
                        MENGHAPUS SELURUH DATABASE
                      </span>
                      ?
                    </p>
                    <p className="text-xs text-rose-500">
                      Tindakan ini akan mengosongkan database stok, barang
                      masuk, penjualan, penjualan dropship (DS), iklan, dan penjualan mingguan. Data tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIsConfirmDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        await deleteAllProducts();
                        await deleteAllSales();
                        await deleteAllIncomingGoods();
                        await deleteAllSalesDS();
                        await deleteAllIklan();
                        await deleteAllWeeklySales();
                        setIsConfirmDeleteModalOpen(false);
                      } catch (e) {
                        console.error("Error deleting all data", e);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? "MENGHAPUS..." : "YA, HAPUS SEMUA"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* IMPORT PROGRESS MODAL */}
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
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [branding, setBranding] = useState<BrandingSettings>({
    announcementTexts: ["FLASH SALE! DISKON HINGGA 50% UNTUK SEMUA PRODUK"],
    logoText: "ZENDIIX",
    footerAboutText: "Zendiix adalah destinasi utama untuk koleksi softlens premium yang menggabungkan kenyamanan maksimal dengan estetika modern. Kami berkomitmen untuk memberikan kualitas terbaik bagi mata Anda.",
  });
  
  // Database health diagnostics
  const [dbError, setDbError] = useState<{ message: string; suggestedIp?: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/health-check')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'error') {
          setDbError({
            message: data.details || data.message,
            suggestedIp: data.suggestedIp || '34.96.48.15'
          });
        } else {
          setDbError(null);
        }
      })
      .catch(err => {
        console.error('Failed to run database health check:', err);
      });
  }, []);

  const handleCopyIp = () => {
    if (dbError?.suggestedIp) {
      navigator.clipboard.writeText(dbError.suggestedIp)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        })
        .catch(err => {
          console.error('Could not copy IP:', err);
        });
    }
  };

  const location = useLocation();

  useEffect(() => {
    const unsub = subscribeToProducts((loadedProducts) => {
      setProducts(loadedProducts);
      setLoadingProducts(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubB = subscribeToBanners(setBanners);
    return () => unsubB();
  }, []);

  useEffect(() => {
    const unsubBr = subscribeToBranding(setBranding);
    return () => unsubBr();
  }, []);

  useEffect(() => {
    if (branding) {
      if (branding.browserTitle) {
        document.title = branding.browserTitle;
      } else if (branding.logoText) {
        document.title = branding.logoText;
      }

      if (branding.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = branding.faviconUrl;
      }
    }
  }, [branding]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Troubleshooting Banner for Remote cPanel MySQL */}
      {dbError && !isDismissed && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 text-amber-900 p-4 md:p-6 shadow-sm z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-4 justify-between">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 font-bold shrink-0 self-start md:self-auto">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-600 inline" />
                  Masalah Koneksi Database MySQL cPanel Terdeteksi
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed max-w-4xl">
                  Aplikasi gagal menghubungi server MySQL Anda karena <span className="font-semibold text-red-700">Akses Ditolak (Remote Access Blocked)</span>. 
                  Hosting cPanel Anda membutuhkan izin agar server Cloud Run ini dapat membaca dan menulis data.
                </p>
                <div className="mt-3 bg-white/70 border border-amber-200/50 rounded-lg p-3 text-xs text-amber-900 font-mono space-y-2">
                  <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                    💡 Cara Mengatasi dalam 1 Menit:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-amber-900 leading-normal">
                    <li>Masuk ke akun <strong>cPanel</strong> Anda.</li>
                    <li>Cari dan pilih menu <strong>Remote MySQL</strong> (atau <strong>Basis Data MySQL Klien Jauh</strong>).</li>
                    <li>Masukkan IP berikut ke kolom <strong>Host</strong>: <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">{dbError.suggestedIp}</code> (atau gunakan tanda persen <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">%</code> agar aman dari IP dinamis).</li>
                    <li>Klik <strong>Add Host</strong> / <strong>Tambah Host</strong>. Segarkan kembali halaman ini!</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 self-stretch md:self-center shrink-0 items-stretch md:items-end lg:items-center">
              <button
                onClick={handleCopyIp}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer select-none"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin IP Server ({dbError.suggestedIp})
                  </>
                )}
              </button>
              
              <button
                onClick={() => setIsDismissed(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-800 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none"
                title="Sembunyikan peringatan sementara"
              >
                <X className="w-4 h-4" />
                Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Storefront products={products} banners={banners} branding={branding} isLoading={loadingProducts} />} />
          <Route path="/customer/reviews" element={<CustomerReviews branding={branding} dbError={dbError} />} />
          <Route path="/admin/*" element={<AppContent sharedProducts={products} sharedBanners={banners} sharedBranding={branding} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: string;
  sortConfig: { key: any; direction: "asc" | "desc" } | null;
  onSort: (k: any) => void;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      className={`px-6 py-4 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-700 ${
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left"
      } ${isActive ? "text-white" : "text-slate-200"} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`flex items-center gap-1 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}
      >
        {label}
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100" />
        )}
      </div>
    </th>
  );
}
