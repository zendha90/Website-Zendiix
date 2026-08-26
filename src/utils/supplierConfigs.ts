// Supplier configuration interfaces and defaults

export interface ExportRule {
  id: string;
  namePattern: string;
  isDefault: boolean;
  unit: string;
  minusStockQtyType: "fixed" | "formula";
  minusStockFixedQty: number;
  minusStockFormulaTarget: number;
  stockZeroQty: number;
  stockOneQty: number;
  stockTwoQty: number;
}

export interface SupplierExportConfig {
  supplier: string;
  formatTemplate: "qty-unit-tab-code" | "qty-tab-code" | "code-tab-qty" | "code-tab-qty-unit" | "code-x-qty";
  rules: ExportRule[];
}

export interface ExportPreset {
  id: string;
  name: string;
  selectedSuppliers: string[];
  supplierConfigs: SupplierExportConfig[];
}

export const DEFAULT_SUPPLIER_EXPORT_CONFIGS: SupplierExportConfig[] = [
  {
    supplier: "S-KIM",
    formatTemplate: "qty-unit-tab-code",
    rules: [
      {
        id: "kim-clear",
        namePattern: "Clear",
        isDefault: false,
        unit: "botol",
        minusStockQtyType: "formula",
        minusStockFixedQty: 1,
        minusStockFormulaTarget: 4,
        stockZeroQty: 1,
        stockOneQty: 3,
        stockTwoQty: 4,
      },
      {
        id: "kim-normal",
        namePattern: "Normal",
        isDefault: false,
        unit: "pasang",
        minusStockQtyType: "fixed",
        minusStockFixedQty: 3,
        minusStockFormulaTarget: 3,
        stockZeroQty: 3,
        stockOneQty: 2,
        stockTwoQty: 0,
      },
      {
        id: "kim-default",
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
  }
];

export interface SupplierConfig {
  doubleUnits: string[];
  doubleKeywords: string[];
  unwantedWords?: string[];
}

export interface AllSupplierConfigs {
  akumaucantik: SupplierConfig;
  anna: SupplierConfig;
  shopee: SupplierConfig;
  sisse: SupplierConfig;
  kim: SupplierConfig;
}

export const DEFAULT_SUPPLIER_CONFIGS: AllSupplierConfigs = {
  akumaucantik: {
    doubleUnits: ["pasang", "psg"],
    doubleKeywords: ["maki", "matake", "emma", "veronica", "clear"],
  },
  anna: {
    doubleUnits: ["pasang"],
    doubleKeywords: [],
  },
  shopee: {
    doubleUnits: [],
    doubleKeywords: ["Matake", "Maki", "Mini Emma", "Trapezium"],
    unwantedWords: [
      "-1 LENS/BTL/BOX",
      "-1 LENS/BTL/BO",
      "|",
      "X2 CLEAR 12 BULAN,",
      "( ½ Pasang )",
      "( ½ pasang )",
    ],
  },
  sisse: {
    doubleUnits: [],
    doubleKeywords: [],
  },
  kim: {
    doubleUnits: [],
    doubleKeywords: ["TRAPZ"],
  },
};


export interface WeekDef {
  month: number;
  monthName: string;
  week: number;
  startDay: number;
  endDay: number;
}

export const WEEKS_DEFINITION: WeekDef[] = [
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

export const DROPSHIP_SUPPLIERS = ["S-KIM", "S-akumaucantik", "S-LINA"];
