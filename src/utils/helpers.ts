import { Product } from "../services";

export const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
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

export const parseToDate = (tStr: any): Date | null => {
  if (!tStr) return null;
  if (typeof tStr === "object" && tStr.seconds) {
    return new Date(tStr.seconds * 1000);
  }
  if (tStr instanceof Date) return tStr;
  const sStr = String(tStr).trim();
  if (!sStr) return null;

  const cleanStr = sStr.replace(/\s+/g, ' ');

  const indonesianMonths: { [key: string]: number } = {
    januari: 0, jan: 0, january: 0,
    februari: 1, feb: 1, february: 1,
    maret: 2, mar: 2, march: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5, june: 5,
    juli: 6, jul: 6, july: 6,
    agustus: 7, agt: 7, agst: 7, agu: 7, aug: 7, august: 7,
    oktober: 9, okt: 9, oct: 9, october: 9,
    september: 8, sep: 8, sept: 8,
    november: 10, nov: 10, nop: 10,
    desember: 11, des: 11, dec: 11, december: 11
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

export const formatToIndoDateStr = (date: Date): string => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const parseTimeString = (timeStr: string): { hour: number; minute: number; second: number } => {
  if (!timeStr) return { hour: 0, minute: 0, second: 0 };
  const parts = timeStr.split(":").map((p) => parseInt(p, 10) || 0);
  return {
    hour: parts[0] || 0,
    minute: parts[1] || 0,
    second: parts[2] || 0,
  };
};

export const getCombinedDateTime = (dateStr: string, timeStr?: string): Date => {
  const date = parseToDate(dateStr) || new Date();
  if (timeStr) {
    const { hour, minute, second } = parseTimeString(timeStr);
    date.setHours(hour, minute, second, 0);
  }
  return date;
};

export const normalizeOrderDate = (dateStr: any): string => {
  if (!dateStr) return "";
  const d = parseToDate(dateStr);
  if (d && !isNaN(d.getTime())) {
    return formatToIndoDateStr(d);
  }
  return String(dateStr).trim();
};

export const getRecordTimestamp = (item: any): number => {
  if (!item) return 0;

  let orderTime = 0;
  if (item.tanggalOrder) {
    const dOrder = parseToDate(item.tanggalOrder);
    if (dOrder && !isNaN(dOrder.getTime())) {
      orderTime = dOrder.getTime();
    }
  }

  let dbTime = 0;
  if (item.tanggal) {
    const dDb = parseToDate(item.tanggal);
    if (dDb && !isNaN(dDb.getTime())) {
      dbTime = dDb.getTime();
    }
  } else if (item.createdAt) {
    const dDb = parseToDate(item.createdAt);
    if (dDb && !isNaN(dDb.getTime())) {
      dbTime = dDb.getTime();
    }
  }

  if (orderTime > 0) {
    if (dbTime > 0) {
      const timeOfDay = dbTime % 86400000;
      return orderTime + timeOfDay;
    }
    return orderTime;
  }

  return dbTime;
};




const GENERIC_MATCH_WORDS = new Set([
  "softlens", "softlen", "soflens", "lens", "lensa", "kontak", "contact", "sl",
  "warna", "color", "minus", "min", "plus",
  "btl", "botol", "box", "kotak", "psg", "pasang", "pcs", "pc", "item",
  "barang", "diskon", "original", "ori", "cod", "natural", "series",
  "by", "ctk", "irislab", "exoticon", "dreamcolor", "jisseo"
]);

export function normalizeLensTokens(str: string): string[] {
  if (!str) return [];
  let s = str.toLowerCase();
  
  // 1. Power normalizations (0.00, 0,00, 00, plano, normal)
  s = s.replace(/[-–—]?0[\.,]00\b|[-–—]?000\b|\b0\s+00\b|\bplano\b/g, " normal ");
  
  // 2. Minus power standardization (e.g. -3.50, -3,50, 3.50 -> min350)
  s = s.replace(/[-–—](\d+)[\.,](\d{2})\b/g, " min$1$2 ");
  s = s.replace(/(\d+)[\.,](\d{2})\b/g, " min$1$2 ");
  s = s.replace(/[-–—](\d+)\b/g, " min$1 ");

  // 3. Standardize acronyms, variants, and synonyms
  s = s.replace(/\bgrey\b/g, "gray");
  s = s.replace(/\bchoco\b/g, "chocolate");
  s = s.replace(/\bi\s*[-_]?\s*dol\b/g, "idol");
  s = s.replace(/\bsoftlen\b|\bsoflens\b|\blenses\b|\bcontact\s*lens\b/g, "softlens");
  s = s.replace(/\bblak\b/g, "black");
  s = s.replace(/\bcharcol\b/g, "charcoal");
  s = s.replace(/\bocen\b/g, "ocean");
  s = s.replace(/\bambur\b/g, "amber");
  
  // 4. Clean separators
  s = s.replace(/[^a-z0-9]+/g, " ");
  
  return s.trim().split(/\s+/).filter(w => w.length > 0);
}

export function findAutoMatch(
  rawName: string,
  productList: Product[],
): Product | undefined {
  if (!rawName) return undefined;
  
  const cleanRaw = rawName.toLowerCase().trim();
  const slugRaw = cleanRaw.replace(/[^a-z0-9]/g, "");

  // Helper to extract ml volumes
  const getMlValues = (str: string): number[] => {
    const matches = [...str.matchAll(/(\d+)\s*ml\b/gi)];
    return matches.map(m => parseInt(m[1], 10));
  };

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

  // 4. Normalized Token Matching with Power Verification & Volume Checking
  const inputTokens = normalizeLensTokens(rawName);
  if (inputTokens.length === 0) return undefined;

  const inputDistinctive = inputTokens.filter(w => !GENERIC_MATCH_WORDS.has(w));
  const inputPowerTokens = inputTokens.filter(w => w === "normal" || w.startsWith("min") || /^\d+$/.test(w));
  const inputHasMl = /\d+ml\b|\bml\b/i.test(cleanRaw);
  const inputMls = getMlValues(cleanRaw);

  let bestMatch: Product | undefined = undefined;
  let bestScore = 0;
  let minLengthDiff = 999;

  for (const p of productList) {
    const pName = p.namaBarang || "";
    const pCode = p.kodeBarang || "";
    const pFullName = pCode + " " + pName;
    const pTokens = normalizeLensTokens(pFullName);
    const pTokenSet = new Set(pTokens);
    const pDistinctive = pTokens.filter(w => !GENERIC_MATCH_WORDS.has(w));
    const pPowerTokens = pTokens.filter(w => w === "normal" || w.startsWith("min") || /^\d+$/.test(w));
    const productHasMl = /\d+ml\b|\bml\b/i.test(pFullName);
    const productMls = getMlValues(pFullName);

    // Liquid volume constraint: Keep liquids with liquids, lenses with lenses
    if (inputHasMl && !productHasMl) continue;
    if (!inputHasMl && productHasMl) continue;
    if (inputMls.length > 0 && productMls.length > 0) {
      if (!productMls.some(m => inputMls.includes(m))) continue;
    }

    // Distinctive keywords check (e.g. idol, roze, charcoal, neverland, desire)
    let matchedDistinctive = 0;
    for (const idw of inputDistinctive) {
      if (pTokenSet.has(idw)) {
        matchedDistinctive++;
      } else {
        if (idw.length >= 3 && pDistinctive.some(pw => pw.includes(idw) || idw.includes(pw))) {
          matchedDistinctive += 0.8;
        }
      }
    }

    // Must match at least 1 distinctive keyword if present
    if (inputDistinctive.length > 0 && matchedDistinctive < 1) {
      continue;
    }

    // Power verification (Normal vs Normal, -3.50 vs -3.50)
    let powerBonus = 0;
    let powerMismatch = false;
    if (inputPowerTokens.length > 0 && pPowerTokens.length > 0) {
      const hasPowerMatch = inputPowerTokens.some(ip => pPowerTokens.includes(ip));
      if (hasPowerMatch) {
        powerBonus += 5; // Strong bonus for power alignment
      } else {
        powerMismatch = true;
      }
    }

    // Prevent matching different powers (e.g. Normal must not match -3.50)
    if (powerMismatch) {
      continue;
    }

    let score = matchedDistinctive * 4 + powerBonus;

    // Penalty for extra unmatched distinctive words in candidate
    for (const pdw of pDistinctive) {
      if (!inputDistinctive.includes(pdw)) {
        const isPartial = inputDistinctive.some(idw => idw.length >= 3 && (pdw.includes(idw) || idw.includes(pdw)));
        if (!isPartial) {
          score -= 3;
        }
      }
    }

    // Penalty for unmatched distinctive words from input
    for (const idw of inputDistinctive) {
      if (!pTokenSet.has(idw)) {
        const isPartial = pDistinctive.some(pdw => pdw.length >= 3 && (pdw.includes(idw) || idw.includes(pdw)));
        if (!isPartial) {
          score -= 3;
        }
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

  if (bestScore >= 3) {
    return bestMatch;
  }

  return undefined;
}

export const exportToCsv = (filename: string, rows: any[][]) => {
  const processRow = (row: any[]) => {
    let finalVal = "";
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? "" : String(row[j]);
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      let result = innerValue.replace(/"/g, '""');
      if (result.includes(",") || result.includes("\n") || result.includes('"')) {
        result = '"' + result + '"';
      }
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };
  let csvFile = "";
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }
  const blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportDSReceiptsToCSV = (salesDSList: any[], filename = "laporan-dropship.csv") => {
  const headers = ["No Resi", "Supplier", "Nama Barang", "Qty", "Harga Beli", "Harga Jual", "Total HPP", "Total Penjualan", "Laba", "Tanggal"];
  const rows = salesDSList.map(s => [
    s.noResi || "",
    s.supplier || "",
    s.namaBarang || "",
    s.qty || 1,
    s.hargaBeli || 0,
    s.hargaJual || 0,
    (s.hargaBeli || 0) * (s.qty || 1),
    (s.hargaJual || 0) * (s.qty || 1),
    s.laba || 0,
    s.tanggal || "",
  ]);
  exportToCsv(filename, [headers, ...rows]);
};

export const WEEKS_DEFINITION: { week: number; month: number; startDay: number; endDay: number; label: string }[] = [];
for (let m = 1; m <= 12; m++) {
  const daysInMonth = new Date(2026, m, 0).getDate();
  WEEKS_DEFINITION.push(
    { week: 1, month: m, startDay: 1, endDay: 7, label: "Minggu 1 (Tgl 1 - 7)" },
    { week: 2, month: m, startDay: 8, endDay: 14, label: "Minggu 2 (Tgl 8 - 14)" },
    { week: 3, month: m, startDay: 15, endDay: 21, label: "Minggu 3 (Tgl 15 - 21)" },
    { week: 4, month: m, startDay: 22, endDay: 28, label: "Minggu 4 (Tgl 22 - 28)" },
  );
  if (daysInMonth > 28) {
    WEEKS_DEFINITION.push(
      { week: 5, month: m, startDay: 29, endDay: daysInMonth, label: "Minggu 5 (Tgl 29 - " + daysInMonth + ")" }
    );
  }
}