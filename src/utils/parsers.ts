import { Product } from "../services";
import { SupplierConfig } from "./supplierConfigs";

export function parseProductName(name: string) {
  const clean = name.trim();
  
  // Match the power suffix at the end of the string:
  // e.g. "-10,00", "Plano", "-1.50", "+2.00", etc.
  const powerRegex = /([-+–—−]?\s*\d+(?:[.,]\d+)?|normal|plano)$/i;
  const match = clean.match(powerRegex);
  
  if (match) {
    const powerStr = match[1].toLowerCase().trim();
    // Strip the matched power from the end of the string
    let baseName = clean.substring(0, clean.length - match[0].length).trim();
    
    // Also strip any trailing separators from baseName (like space, hyphen, plus)
    baseName = baseName.replace(/[-+–—−\s]+$/, "").trim();
    
    let power = 0;
    if (powerStr === "normal" || powerStr === "plano") {
      power = 0;
    } else {
      const cleanPowerStr = powerStr
        .replace(/\s+/g, "")
        .replace(/[–—−]/g, "-")
        .replace(",", ".");
      power = parseFloat(cleanPowerStr);
    }
    return { baseName, power };
  }
  
  return { baseName: clean, power: 0 };
}


export function applyGlobalReplacements(name: string, replacements: { old: string; new: string }[]) {
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

export function parseFormatAkumaucantik(text: string, replacements: { old: string; new: string }[], config: SupplierConfig) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];

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
    const match = cleanLine.match(/^(\d+)\s*(pasang|psg|botol|btl)?\s*(.+)$/i);
    if (!match) continue;

    let qty = parseInt(match[1], 10);
    const unit = match[2] ? match[2].toLowerCase() : "";
    let name = match[3].trim();

    let isAlreadyDoubled = false;
    
    // Check dynamic unit and dynamic keyword double trigger
    const isDoubleUnit = config.doubleUnits.some(
      (u) => u.toLowerCase().trim() === unit
    );
    const hasDoubleKeyword = config.doubleKeywords.some(
      (kw) => name.toLowerCase().includes(kw.toLowerCase().trim())
    );

    if (isDoubleUnit && hasDoubleKeyword) {
      qty *= 2;
      isAlreadyDoubled = true;
    }

    // Apply replacements
    name = applyGlobalReplacements(name, replacements);

    list.push({ rawName: name, qty, detectedUnit: unit, isAlreadyDoubled });
  }
  return list;
}

export function parseFormatKim(text: string, replacementsKim: { old: string; new: string }[], replacementsGlobal: { old: string; new: string }[], config: SupplierConfig) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];
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
        
        let isAlreadyDoubled = false;
        // Check dynamic doubling keywords for KIM
        const shouldDouble = config.doubleKeywords.some(
          (kw) => finalName.toUpperCase().includes(kw.toUpperCase().trim())
        );

        if (shouldDouble) {
          qty *= 2;
          isAlreadyDoubled = true;
        }

        // Apply KIM replacements first
        finalName = applyGlobalReplacements(finalName, replacementsKim);
        // Apply Global replacements second
        finalName = applyGlobalReplacements(finalName, replacementsGlobal);

        list.push({ rawName: finalName, qty, isAlreadyDoubled });
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

export function parseFormatShopee(text: string, replacements: { old: string; new: string }[], config: SupplierConfig) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];

  let productName = "";
  let variation = "";
  let quantity = "";

  const specialProducts = config.doubleKeywords;
  const unwantedWords = config.unwantedWords || [];

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
        productName.toLowerCase().includes(sp.toLowerCase().trim()),
      );
      if (hasSpecial) {
        finalQty *= 2;
      }

      let rawName = `${productName} Variasi: ${variation}`;
      rawName = applyGlobalReplacements(rawName, replacements);

      list.push({
        rawName: rawName,
        qty: finalQty,
        isAlreadyDoubled: hasSpecial,
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
      // Replace all occurrences of word
      const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      cleanLine = cleanLine.replace(new RegExp(escaped, 'gi'), "").trim();
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

export function parseFormatSisse(text: string, replacements: { old: string; new: string }[], config: SupplierConfig) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];

  const doubleUnits = config.doubleUnits || [];
  const doubleKeywords = config.doubleKeywords || [];

  for (let line of lines) {
    let cleanLine = line.trim();
    if (!cleanLine) continue;

    // 1. Skip jika ada tanda silang (❌)
    if (/❌/.test(cleanLine)) continue;

    // 2. Bersihkan emoji centang / bullet point
    cleanLine = cleanLine.replace(/^[•\-\*]\s*/, "");
    cleanLine = cleanLine.replace(/✅|[\u2705\u2611\uFE0F\u2611]/g, "");
    cleanLine = cleanLine.replace(/\s+/g, " ").trim();
    if (!cleanLine) continue;

    // A. Format MINUS Legacy: MINUS [name] [power] [qty] [Rp...]
    if (/^MINUS\b/i.test(cleanLine)) {
      const match = cleanLine.match(/^MINUS\s+([\s\S]*?)\s+(\d+(?:\.\d+)?)\s+(\d+)(?:\s*Rp.*)?$/i);
      if (match) {
        let name = match[1].trim();
        let powerNum = parseFloat(match[2]);
        let minusValue = "";
        if (match[2].includes(".")) {
          minusValue = "-" + powerNum.toFixed(2);
        } else if (powerNum >= 50) {
          minusValue = "-" + (powerNum / 100).toFixed(2);
        } else {
          minusValue = "-" + powerNum.toFixed(2);
        }
        let qty = parseInt(match[3], 10);
        let finalName = `${name} ${minusValue}`.trim();
        finalName = applyGlobalReplacements(finalName, replacements);

        let isAlreadyDoubled = false;
        const shouldDouble = doubleKeywords.length > 0 && doubleKeywords.some(
          (kw) => kw && finalName.toLowerCase().includes(kw.toLowerCase().trim())
        );
        if (shouldDouble) {
          qty *= 2;
          isAlreadyDoubled = true;
        }

        list.push({ rawName: finalName, qty, detectedUnit: "btl", isAlreadyDoubled });
        continue;
      }
    }

    // B. Format NORMAL Legacy: NORMAL [name] [qty] [Rp...]
    if (/^NORMAL\b/i.test(cleanLine)) {
      const match = cleanLine.match(/^NORMAL\s+([\s\S]*?)\s+(\d+)(?:\s*Rp.*)?$/i);
      if (match) {
        let name = match[1].trim();
        let qty = parseInt(match[2], 10);
        let finalName = `${name} -0.00`.trim();
        finalName = applyGlobalReplacements(finalName, replacements);

        let isAlreadyDoubled = false;
        const shouldDouble = doubleKeywords.length > 0 && doubleKeywords.some(
          (kw) => kw && finalName.toLowerCase().includes(kw.toLowerCase().trim())
        );
        if (shouldDouble) {
          qty *= 2;
          isAlreadyDoubled = true;
        }

        list.push({ rawName: finalName, qty, detectedUnit: "btl", isAlreadyDoubled });
        continue;
      }
    }

    // C. Format Langsung / Direct: [qty][unit] [Nama Produk...]
    // e.g. "1psg Softlens JISSEO Idol Desire Ocean Blue -3.50"
    // e.g. "5psg Softlens JISSEO Idol Desire Amber Gray -0.00"
    // e.g. "3psg Softlens JISSEO Idol Desire Euro Gray -0.00"
    // e.g. "1 psg Softlens ...", "2 pasang ...", "10 btl ...", "1 ..."
    const directMatch = cleanLine.match(/^(\d+)\s*(pasang|psg|ps|pair|pairs|botol|btl|pcs|pc|box|kotak|x)?\s*(.+)$/i);
    if (directMatch) {
      let qty = parseInt(directMatch[1], 10);
      const unit = directMatch[2] ? directMatch[2].toLowerCase() : "";
      let name = directMatch[3].trim();

      // Bersihkan harga di ujung baris jika ada (e.g. Rp 50.000 atau @ 50000)
      name = name.replace(/\s*(?:@\s*|Rp\s*)[\d\.\,]+$/i, "").trim();

      let isAlreadyDoubled = false;
      const isDoubleUnit = doubleUnits.length > 0 && doubleUnits.some((u) => u && u.toLowerCase().trim() === unit);
      const hasDoubleKeyword = doubleKeywords.length > 0 && doubleKeywords.some(
        (kw) => kw && name.toLowerCase().includes(kw.toLowerCase().trim())
      );

      // Hanya double jika unit terdaftar di aturan doubleUnits Sisse
      if (isDoubleUnit) {
        if (doubleKeywords.length === 0 || hasDoubleKeyword) {
          qty *= 2;
          isAlreadyDoubled = true;
        }
      }

      name = applyGlobalReplacements(name, replacements);
      list.push({ rawName: name, qty, detectedUnit: unit, isAlreadyDoubled });
      continue;
    }

    // D. Fallback jika hanya nama produk tanpa awalan angka
    let fallbackName = applyGlobalReplacements(cleanLine, replacements);
    list.push({ rawName: fallbackName, qty: 1, isAlreadyDoubled: false });
  }

  return list;
}

export function parseFormatAnna(text: string, replacements: { old: string; new: string }[], config: SupplierConfig) {
  const lines = text.split(/\r?\n/);
  const list: { rawName: string; qty: number; detectedUnit?: string; isAlreadyDoubled?: boolean }[] = [];

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

    let isAlreadyDoubled = false;
    const shouldDouble = config.doubleUnits.some(
      (u) => u.toLowerCase().trim() === unit
    );

    if (shouldDouble) {
      qty *= 2;
      isAlreadyDoubled = true;
    }

    name = applyGlobalReplacements(name, replacements);

    list.push({ rawName: name, qty, detectedUnit: unit, isAlreadyDoubled });
  }

  return list;
}

export const GENERIC_MATCH_WORDS = new Set([
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
