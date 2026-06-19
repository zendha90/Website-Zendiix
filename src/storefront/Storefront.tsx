import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  Phone,
  ArrowRight,
  Eye,
  Info,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Heart,
  ChevronDown,
  ChevronLeft,
  ShoppingBag as CartIcon,
  Instagram,
  Music
} from 'lucide-react';
import { Product, Sale, IncomingGood, subscribeToSales, subscribeToIncomingGoods, BrandingSettings } from '../services';

interface StorefrontProps {
  products: Product[];
  banners?: any[];
  branding?: BrandingSettings;
  isLoading?: boolean;
}

export interface ProductVariant {
  product: Product;
  color: string;
  power: string;
  stokBarang: number;
}

export interface GroupedSeries {
  seriesName: string;
  representativeProduct: Product;
  variants: ProductVariant[];
  colors: string[]; 
  allPowers: string[]; 
}

interface CartItem {
  cartId: string; // Unique composition ID: seriesName-color-powerL-powerR
  seriesName: string;
  color: string;
  powerL: string;
  powerR: string;
  qty: number;
  isDual: boolean;
  productL: Product; // actual variant model for Left Eye
  productR: Product; // actual variant model for Right Eye
  hargaJual: number;
  notSoftlens?: boolean;
}

// 1. DATA TRANSFORMERS - Helper parsers to group variants by Series (e.g., "Mini Bom")
const parsePowerFromProduct = (product: Product): string => {
  const name = product.namaBarang;
  
  // Decimals like -1.25, -1.50 or -1,25, -1,50
  const decMatch = name.match(/-\d+[,.]\d+/);
  if (decMatch) {
    return decMatch[0].replace(',', '.');
  }

  // Integers like -1, -2, -3
  const intMatch = name.match(/-\d+/);
  if (intMatch) {
    const val = parseFloat(intMatch[0]);
    return `-${Math.abs(val).toFixed(2)}`;
  }
  
  // plano keywords
  if (
    name.toLowerCase().includes('plano') || 
    name.toLowerCase().includes('normal') || 
    name.toLowerCase().includes('0.00') ||
    name.toLowerCase().includes('0,00')
  ) {
    return '0.00';
  }
  
  return '0.00'; 
};

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
  const additionalColors = [
    'brown', 'choco', 'coklat', 'grey', 'gray', 'abu', 'hazel', 
    'gold', 'blue', 'biru', 'green', 'hijau', 'olive', 'pink', 
    'rose', 'clear', 'black', 'hitam', 'nude', 'dark'
  ];
  additionalColors.forEach(c => {
    const r = new RegExp(`\\b${c}\\b`, 'i');
    name = name.replace(r, '');
  });

  // Clean remaining hyphens, brackets, commas, semicolons, and spaces
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/^[-–—\s,;.()\s[]]+|[-–—\s,;.()\s\]]+$/g, '');

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

export const Storefront: React.FC<StorefrontProps> = ({ products, banners = [], branding, isLoading = false }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<GroupedSeries | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeColorFilter, setActiveColorFilter] = useState('All');
  const [activeDiameterFilter, setActiveDiameterFilter] = useState('All');
  const [activeWaterFilter, setActiveWaterFilter] = useState('All');
  const [activeBCFilter, setActiveBCFilter] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Custom Sliding Carousel state (4:5 portrait ratio)
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultBanners = useMemo(() => [
    { imageUrl: "/src/assets/images/hero_banner_zendiix_png_1781662668206.jpg", linkUrl: "" },
    { imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600", linkUrl: "" },
    { imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600", linkUrl: "" }
  ], []);

  const activeSlides = useMemo(() => {
    return banners && banners.length > 0 ? banners : defaultBanners;
  }, [banners, defaultBanners]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides]);

  // Reset slide if slides list changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeSlides.length]);

  // Variant picker selector states
  const [modalColor, setModalColor] = useState<string>('');
  const [modalIsDualPower, setModalIsDualPower] = useState(false);
  const [selectedPowerL, setSelectedPowerL] = useState('0.00');
  const [selectedPowerR, setSelectedPowerR] = useState('0.00');
  const [buyQty, setBuyQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<{urls: string[], index: number} | null>(null);

  // Reset image index when modal series or color changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedSeries, modalColor]);

  const defaultPromoTexts = [
    "✨ BELI 1 GRATIS 1 - Tingkatkan pesonamu dengan Zendiix!",
    "🚚 GRATIS ONGKIR dengan belanja minimal Rp 400.000!",
    "🎁 BONUS Case Cermin Premium setiap pembelian 2+ box!"
  ];

  const promoTexts = useMemo(() => {
    return branding?.announcementTexts && branding.announcementTexts.length > 0
      ? branding.announcementTexts
      : defaultPromoTexts;
  }, [branding]);

  const [promoIdx, setPromoIdx] = useState(0);

  const [sales, setSales] = useState<Sale[]>([]);
  const [incomingGoods, setIncomingGoods] = useState<IncomingGood[]>([]);

  useEffect(() => {
    if (promoTexts.length <= 1) {
      setPromoIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setPromoIdx(prev => (prev + 1) % promoTexts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [promoTexts]);

  useEffect(() => {
    const unsubS = subscribeToSales(setSales);
    const unsubI = subscribeToIncomingGoods(setIncomingGoods);
    return () => {
      unsubS();
      unsubI();
    };
  }, []);

  // Sync state and calculate dynamic stocks for each individual variant product
  const productsWithStock = useMemo(() => {
    return products.map(p => {
      const productSales = sales.filter(s => s.productId === p.id);
      const totalTerjual = productSales.reduce((sum, s) => sum + s.qty, 0);
      const productIncoming = incomingGoods.filter(ig => ig.productId === p.id);
      const totalMasuk = productIncoming.reduce((sum, ig) => sum + ig.qty, 0);
      const currentStock = (p.stokAwal || 0) + totalMasuk - totalTerjual;
      return { ...p, stokBarang: currentStock };
    });
  }, [products, sales, incomingGoods]);

  // Group dynamic product listings into master-series collections
  const groupedSeriesList = useMemo(() => {
    const map: { [seriesName: string]: GroupedSeries } = {};

    productsWithStock.forEach(p => {
      const seriesName = getSeriesNameFromProduct(p);
      const color = p.color || 'Clear';
      const power = parsePowerFromProduct(p);
      const stokBarang = p.stokBarang || 0;

      const variant: ProductVariant = {
        product: p,
        color,
        power,
        stokBarang
      };

      if (!map[seriesName]) {
        map[seriesName] = {
          seriesName,
          representativeProduct: p,
          variants: [],
          colors: [],
          allPowers: []
        };
      }

      map[seriesName].variants.push(variant);
      
      if (!map[seriesName].colors.some(c => c.toLowerCase() === color.toLowerCase())) {
        map[seriesName].colors.push(color);
      }

      if (!map[seriesName].allPowers.includes(power)) {
        map[seriesName].allPowers.push(power);
      }
    });

    Object.values(map).forEach(s => {
      s.allPowers.sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return numA - numB;
      });
      s.colors.sort();
    });

    return Object.values(map);
  }, [productsWithStock]);

  // Dynamic extraction of custom categories from series/representative products
  const availableCustomCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    groupedSeriesList.forEach(series => {
      const cc = series.representativeProduct.customCategory;
      if (cc) {
        cc.split(',').forEach(part => {
          const trimmed = part.trim();
          if (trimmed) {
            cats.add(trimmed);
          }
        });
      }
    });
    // Fallback defaults to keep design warm and clean if no custom categories are added yet
    if (cats.size <= 1) {
      cats.add('Natural');
      cats.add('Glam');
      cats.add('Daily');
      cats.add('Monthly');
    }
    return Array.from(cats);
  }, [groupedSeriesList]);

  // Extract all unique colors, diameters, water contents (kadar air), and BCs from products inside the series
  const extractedFilterOptions = useMemo(() => {
    const colors = new Set<string>();
    const diameters = new Set<string>();
    const waterContents = new Set<string>();
    const bcs = new Set<string>();

    productsWithStock.forEach(p => {
      if (p.color) colors.add(p.color.trim());
      if (p.diameter) diameters.add(p.diameter.trim());
      if (p.kadarAir) waterContents.add(p.kadarAir.trim());
      if (p.bc) bcs.add(p.bc.trim());
    });

    const sortedColors = Array.from(colors).sort();
    const sortedDiameters = Array.from(diameters).sort();
    const sortedWater = Array.from(waterContents).sort();
    const sortedBC = Array.from(bcs).sort();

    return {
      colors: ['All', ...sortedColors],
      diameters: ['All', ...sortedDiameters],
      waterContents: ['All', ...sortedWater],
      bcs: ['All', ...sortedBC]
    };
  }, [productsWithStock]);

  const colorsList = ['All', 'Brown', 'Gray', 'Hazel', 'Pink', 'Blue', 'Clear'];

  // Multi-tier filtering over the Grouped Series Catalog
  const filteredSeries = useMemo(() => {
    return groupedSeriesList.filter(series => {
      const rp = series.representativeProduct;
      const sName = series.seriesName.toLowerCase();
      
      const matchesSearch = sName.includes(searchQuery.toLowerCase()) || 
                           series.colors.some(col => col.toLowerCase().includes(searchQuery.toLowerCase()));
                             
      // Category matching
      let matchesCategory = activeCategory === 'All';
      if (!matchesCategory) {
        // Check if any product or series representative matches the selected custom category
        const customCats = rp.customCategory 
          ? rp.customCategory.toLowerCase().split(',').map(s => s.trim()) 
          : [];
        
        matchesCategory = customCats.includes(activeCategory.toLowerCase()) ||
          // Fallback legacy categories handling
          (activeCategory.toLowerCase() === 'daily' && (sName.includes('daily') || rp.durasi?.toLowerCase().includes('day'))) ||
          (activeCategory.toLowerCase() === 'monthly' && (sName.includes('monthly') || rp.durasi?.toLowerCase().includes('month'))) ||
          (activeCategory.toLowerCase() === 'glam' && sName.includes('glam')) ||
          (activeCategory.toLowerCase() === 'natural' && !sName.includes('glam'));
      }

      // Color matching
      const matchesColor = activeColorFilter === 'All' || 
                           series.colors.some(color => {
                             const pColor = color.toLowerCase();
                             return pColor.includes(activeColorFilter.toLowerCase()) ||
                             (activeColorFilter === 'Brown' && (pColor.includes('brown') || pColor.includes('choco') || pColor.includes('coklat'))) ||
                             (activeColorFilter === 'Gray' && (pColor.includes('gray') || pColor.includes('grey') || pColor.includes('abu'))) ||
                             (activeColorFilter === 'Blue' && pColor.includes('blue')) ||
                             (activeColorFilter === 'Hazel' && pColor.includes('hazel')) ||
                             (activeColorFilter === 'Pink' && pColor.includes('pink')) ||
                             (activeColorFilter === 'Clear' && pColor.length === 0);
                           });

      // Diameter matching
      const matchesDiameter = activeDiameterFilter === 'All' || 
                              (rp.diameter && rp.diameter.trim() === activeDiameterFilter.trim()) ||
                              series.variants.some(v => v.product.diameter && v.product.diameter.trim() === activeDiameterFilter.trim());

      // Kadar Air matching
      const matchesWater = activeWaterFilter === 'All' || 
                           (rp.kadarAir && rp.kadarAir.trim() === activeWaterFilter.trim()) ||
                           series.variants.some(v => v.product.kadarAir && v.product.kadarAir.trim() === activeWaterFilter.trim());

      // Base Curve (BC) matching
      const matchesBC = activeBCFilter === 'All' || 
                        (rp.bc && rp.bc.trim() === activeBCFilter.trim()) ||
                        series.variants.some(v => v.product.bc && v.product.bc.trim() === activeBCFilter.trim());

      return matchesSearch && matchesCategory && matchesColor && matchesDiameter && matchesWater && matchesBC;
    });
  }, [groupedSeriesList, searchQuery, activeCategory, activeColorFilter, activeDiameterFilter, activeWaterFilter, activeBCFilter]);

  const random8Products = useMemo(() => {
    return [...filteredSeries].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [filteredSeries]);

  const handleToggleFav = (seriesName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(seriesName) ? prev.filter(name => name !== seriesName) : [...prev, seriesName]
    );
  };

  // 2. VARIANT PICKER / CART ACTION: Safely checks stocks & adds to cart state
  const handleAddToCart = () => {
    if (!selectedSeries) return;

    // Retrieve active variants matching color & power
    let variantL = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === selectedPowerL
    );
    let variantR = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === selectedPowerR
    );

    // Fallback if exact matching variant key isn't in db yet (plano fallback)
    if (!variantL) {
      variantL = selectedSeries.variants[0];
    }
    if (!variantR) {
      variantR = variantL;
    }

    const price = selectedSeries.representativeProduct.hargaJual;
    const isProductNotSoftlens = !!selectedSeries.representativeProduct.notSoftlens;
    const finalPowerL = isProductNotSoftlens ? '0.00' : selectedPowerL;
    const finalPowerR = finalPowerL;
    const finalIsDual = false;

    const cartId = isProductNotSoftlens
      ? `${selectedSeries.seriesName}-${modalColor}-notsoftlens`
      : `${selectedSeries.seriesName}-${modalColor}-${finalPowerL}`;

    const cartItem: CartItem = {
      cartId,
      seriesName: selectedSeries.seriesName,
      color: modalColor,
      powerL: finalPowerL,
      powerR: finalPowerR,
      qty: buyQty,
      isDual: finalIsDual,
      productL: variantL.product,
      productR: variantR.product,
      hargaJual: price,
      notSoftlens: isProductNotSoftlens
    };

    setCart(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item => item.cartId === cartId ? { ...item, qty: item.qty + buyQty } : item);
      }
      return [...prev, cartItem];
    });

    setIsCartOpen(true);
    setSelectedSeries(null); // Dismiss checkout dialog
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const totalCartPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + (item.hargaJual * item.qty);
    }, 0);
  }, [cart]);

  // WhatsApp formatted ordering API Integration
  const handleCheckout = () => {
    if (cart.length === 0) return;

    let orderListText = cart.map((item, index) => {
      const subtotal = item.hargaJual * item.qty;

      let powerDetails = "";
      if (item.notSoftlens) {
        powerDetails = `\n    └─ Tipe: Aksesori / Non-Softlens`;
      } else {
        powerDetails = `\n    └─ SPH Minus: ${item.powerL}\n    *(Beli 1 Box)*`;
      }

      return `${index + 1}. Seri: ${item.seriesName}\n    └─ ${item.notSoftlens ? 'Variasi' : 'Warna'}: ${item.color}${powerDetails}\n    └─ Qty: ${item.qty} set x Rp ${item.hargaJual.toLocaleString()}\n    └─ Subtotal: Rp ${subtotal.toLocaleString()}`;
    }).join('\n\n');

    const totalBonus = totalCartPrice >= 400000 ? "Bonus: Free Shipping + Travel Kit Premium Case ✨" : "Bonus: Custom Mirror Contact Lens Case ✨";

    const msg = `Halo Zendiix Softlens! Saya ingin memesan produk premium berikut:\n\n${orderListText}\n\n======================\n*TOTAL ORDER: Rp ${totalCartPrice.toLocaleString()}*\n======================\n${totalBonus}\n\nMohon bantu diinfo no-rekening dan estimasi kirim ke alamat saya ya Sis! ❤️`;
    
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // SPH Powers default options list
  const powerOptions = useMemo(() => {
    const list = ['0.00'];
    for (let i = 0.5; i <= 8.0; i += 0.25) {
      if (i === 0.5 || i === 0.75 || i >= 1.0) {
        list.push(`-${i.toFixed(2)}`);
      }
    }
    return list;
  }, []);

  // Compute stats of representative items
  const getSeriesStatistics = (series: GroupedSeries) => {
    const p = series.representativeProduct;
    const idNum = parseInt(p.id?.replace(/\D/g, '') || '4');
    
    // Read dynamic database properties if edited by admin from backend
    const bcVal = p.bc || "8.6 mm";
    const waterVal = p.kadarAir || "43%";
    const diaVal = p.diameter || "14.2 mm";
    const gdiaVal = p.gDia || `${(11.9 + (idNum % 7) * 0.2).toFixed(1)} mm`;
    const durationVal = p.durasi || (idNum % 3 === 0 ? "1 Day (10p)" : (idNum % 3 === 1 ? "1 Month (2p)" : "3 Months (2p)"));

    return {
      gDia: gdiaVal.endsWith("mm") || gdiaVal.toLowerCase().includes("day") || gdiaVal.toLowerCase().includes("month") ? gdiaVal : `${gdiaVal} mm`,
      duration: durationVal,
      diameter: diaVal.endsWith("mm") ? diaVal : `${diaVal} mm`,
      waterContent: waterVal.endsWith("%") ? waterVal : `${waterVal}%`,
      baseCurve: bcVal.endsWith("mm") || bcVal.includes(".") ? bcVal : `${bcVal} mm`
    };
  };

  // STOCK SYNC MONITOR - Checks the live database stock for currently selected parameters
  const activeStockStatus = useMemo(() => {
    if (!selectedSeries) return { available: false, count: 0, variantL: null, variantR: null };

    const varL = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === selectedPowerL
    );

    if (modalIsDualPower) {
      const varR = selectedSeries.variants.find(
        v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === selectedPowerR
      );
      
      const stockL = varL?.stokBarang ?? 0;
      const stockR = varR?.stokBarang ?? 0;
      const combinedMinStock = Math.min(stockL, stockR);

      return {
        available: stockL > 0 && stockR > 0 && combinedMinStock >= buyQty,
        count: combinedMinStock,
        variantL: varL,
        variantR: varR
      };
    } else {
      const stockL = varL?.stokBarang ?? 0;
      return {
        available: stockL >= buyQty,
        count: stockL,
        variantL: varL,
        variantR: null
      };
    }
  }, [selectedSeries, modalColor, selectedPowerL, selectedPowerR, modalIsDualPower, buyQty]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800 antialiased selection:bg-slate-900 selection:text-white flex justify-center items-start">
      
      {/* Centered High-Fidelity Shopee Mobile Layout without device frames */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] flex flex-col relative pb-[65px] transition-all">
        
        {/* Top Shopee Style Notice Banner */}
        <div className="w-full bg-[#1F1F1F] text-white text-[9.5px] font-bold py-2 px-3 overflow-hidden flex items-center justify-center z-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={promoIdx}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 uppercase tracking-wider text-neutral-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{promoTexts[promoIdx]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Brand Elegant Sticky Header Bar with Enlarged Layout and Alignment */}
        <header className="sticky top-0 z-50 bg-white text-slate-900 px-4 py-4 border-b border-neutral-100 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-4">
            {/* Elegant Cosmetics Brand Branding with Mall/Boutique Gold Accent Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-display text-2xl font-black tracking-tighter leading-none text-slate-950">
                  {branding?.logoText || "ZENDIIX"}
                </span>
              )}
            </div>

            {/* Enlarged Top Search Input Box - Only visible in Beranda */}
            {!isFilterVisible ? (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Cari Seri atau Warna..."
                  className="w-full h-10 pl-9 pr-4 bg-neutral-100 text-neutral-800 rounded-md text-xs font-bold placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* enlarged Cart Button & Notif badge */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 hover:bg-neutral-50 rounded-full transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <ShoppingBag className="w-[22px] h-[22px] text-slate-900" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-slate-900 text-white text-[9.5px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center font-sans tracking-tighter shadow-md">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Phone Screen Viewport Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-10 scrollbar-none">
          
          {!isFilterVisible && (
            <>
              {/* Shopee-style Home Carousel Banner */}
              <div id="promo-banner-carousel" className="relative w-full aspect-[4/5] bg-neutral-900 overflow-hidden select-none">
                {/* Slides wrapper with custom transitional flex row */}
                <div 
                  className="flex w-full h-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {activeSlides.map((slide, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 relative">
                      {slide.linkUrl ? (
                        <a href={slide.linkUrl} className="block w-full h-full">
                          <img 
                            src={slide.imageUrl} 
                            alt={`Promo Banner ${idx + 1}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : (
                        <img 
                          src={slide.imageUrl} 
                          alt={`Promo Banner ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Elegant bottom shade */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent pointer-events-none" />

                {/* Left/Right manual click hotspots */}
                {activeSlides.length > 1 && (
                  <>
                    <button 
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all border border-white/10 active:scale-90 font-mono text-lg z-20"
                      aria-label="Previous slide"
                    >
                      ‹
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all border border-white/10 active:scale-90 font-mono text-lg z-20"
                      aria-label="Next slide"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Nav indicator bullets */}
                {activeSlides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                    {activeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentSlide === idx ? 'bg-white w-4' : 'bg-white/40'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Flash Sale Section (Essential Cosmetic Boutique Look & Feel) */}
              <div className="bg-white p-3 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] bg-neutral-100 px-2 py-0.5 rounded font-display">Special Offer</span>
                  </div>
                  <button 
                    onClick={() => { setActiveCategory('All'); }}
                    className="text-slate-900 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    Lihat Semua <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-none">
                  {filteredSeries.filter(s => s.representativeProduct.isFlashSale).slice(0, 4).map((series, index) => {
                    const imageSrc = splitImageUrls(series.representativeProduct.imageUrl)[0] || `https://picsum.photos/seed/${series.seriesName}/600/600`;
                    return (
                      <div 
                        key={index} 
                        onClick={() => {
                          setSelectedSeries(series);
                          setModalColor(series.colors[0] || 'Clear');
                          setModalIsDualPower(false);
                          setSelectedPowerL('0.00');
                          setSelectedPowerR('0.00');
                          setBuyQty(1);
                        }}
                        className="w-24 shrink-0 bg-neutral-50 p-1.5 border border-dashed border-neutral-200 rounded-md text-left cursor-pointer"
                      >
                        <div className="aspect-square bg-white rounded-md overflow-hidden relative mb-1">
                          <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                          <div className="absolute top-0 right-0 bg-slate-950 text-white text-[7px] font-bold px-1 rounded-bl">
                            -25%
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-neutral-800 line-clamp-1 block">{series.seriesName}</span>
                        <span className="text-[10px] font-extrabold text-slate-950 block">Rp {series.representativeProduct.hargaJual.toLocaleString()}</span>
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full mt-1 overflow-hidden relative">
                          <div className="absolute top-0 left-0 bg-slate-950 h-full" style={{ width: '65%' }} />
                        </div>
                        <span className="text-[6px] text-neutral-400 block mt-0.5 text-center font-bold">65% TERJUAL</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Interactive Specification Header Filters Panel (Shopee Mall Style Filters) */}
          {isFilterVisible && (
            <div id="filter-panel" className="bg-white mt-1.5 p-3 shadow-xs space-y-3.5 border-b border-neutral-100">
              
              {/* Category-Specific Box Search */}
              <div className="relative text-left">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
                <input 
                  type="text" 
                  placeholder="Cari Seri atau Warna..."
                  className="w-full h-10 pl-9 pr-12 bg-neutral-50 border border-neutral-250 focus:outline-none focus:ring-1 focus:ring-slate-950 rounded-md text-xs font-bold text-neutral-800 placeholder-neutral-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider py-1 px-1.5 hover:bg-neutral-150 rounded"
                  >
                    Batal
                  </button>
                )}
              </div>

              {/* Horizontal Categories Taps */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {availableCustomCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
                      activeCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-slate-950 text-white shadow-xs' 
                        : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Micro Filter Selector Inputs */}
              <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2">
                
                {/* DIA select */}
                <div className="relative text-left">
                  <select
                    value={activeDiameterFilter}
                    onChange={(e) => setActiveDiameterFilter(e.target.value)}
                    className="w-full h-8 pl-2 pr-7 bg-neutral-50 border border-neutral-200 focus:outline-none rounded text-[9px] font-bold text-neutral-700 uppercase appearance-none cursor-pointer"
                  >
                    {extractedFilterOptions.diameters.map(dia => (
                      <option key={dia} value={dia}>
                        {dia === 'All' ? 'Semua DIA' : `DIA: ${dia}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Water Content Select */}
                <div className="relative text-left">
                  <select
                    value={activeWaterFilter}
                    onChange={(e) => setActiveWaterFilter(e.target.value)}
                    className="w-full h-8 pl-2 pr-7 bg-neutral-50 border border-neutral-200 focus:outline-none rounded text-[9px] font-bold text-neutral-700 uppercase appearance-none cursor-pointer"
                  >
                    {extractedFilterOptions.waterContents.map(water => (
                      <option key={water} value={water}>
                        {water === 'All' ? 'Semua Water' : `Water: ${water}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Reset Filter Status */}
              {(activeCategory !== 'All' || activeColorFilter !== 'All' || activeDiameterFilter !== 'All' || activeWaterFilter !== 'All' || activeBCFilter !== 'All') && (
                <div className="flex items-center justify-between text-[9px] text-neutral-400 pt-1 font-bold">
                  <span>Filter Aktif Terpasang</span>
                  <button 
                    onClick={() => {
                      setActiveCategory('All');
                      setActiveColorFilter('All');
                      setActiveDiameterFilter('All');
                      setActiveWaterFilter('All');
                      setActiveBCFilter('All');
                    }}
                    className="text-slate-950 underline font-extrabold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TERLARIS MINGGU INI */}
          <section className="p-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2 mb-3">TERLARIS MINGGU INI</h3>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="bg-white rounded-md overflow-hidden border border-neutral-100 flex flex-col justify-between animate-pulse">
                    <div className="aspect-square bg-neutral-100 relative">
                      <div className="absolute top-1.5 left-1.5 bg-neutral-200 h-3 w-10 rounded"></div>
                    </div>
                    <div className="p-2 flex-grow flex flex-col justify-between h-20">
                      <div className="space-y-1">
                        <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
                        <div className="h-2.5 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-50">
                        <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
                        <div className="h-2 bg-neutral-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSeries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-200 max-w-sm mx-auto my-4">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-600 font-bold mb-0.5">Produk Tidak Ditemukan</p>
                <p className="text-[10px] text-neutral-400 px-4">Silakan ketik kata pencarian lain atau tekan tombol reset filter.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveColorFilter('All'); }}
                  className="mt-4 px-4 py-1.5 bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {random8Products.map((series, idx) => {
                  const stats = getSeriesStatistics(series);
                  const isAvailable = series.variants.some(v => v.stokBarang > 0);
                  const rating = series.representativeProduct.rating !== undefined ? Number(series.representativeProduct.rating) : (4.8 + ((idx % 3) * 0.1));
                  const reviews = series.representativeProduct.reviewsCount !== undefined ? Number(series.representativeProduct.reviewsCount) : (72 + (idx * 14));
                  const imageSrc = splitImageUrls(series.representativeProduct.imageUrl)[0] || `https://picsum.photos/seed/${series.seriesName}/600/600`;

                  return (
                    <div 
                      key={series.seriesName}
                      onClick={() => {
                        setSelectedSeries(series);
                        setModalColor(series.colors[0] || 'Clear');
                        setModalIsDualPower(false);
                        setSelectedPowerL('0.00');
                        setSelectedPowerR('0.00');
                        setBuyQty(1);
                      }}
                      className="group bg-white rounded-md overflow-hidden hover:shadow-md transition-all border border-neutral-100 relative cursor-pointer flex flex-col justify-between"
                    >
                      {/* Product square thumbnail */}
                      <div className="relative aspect-square bg-[#FAFAFA]">
                        <img 
                          src={imageSrc}
                          alt={series.seriesName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />

                        {/* Sold out overlay */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-white/75 backdrop-blur-[0.5px] flex items-center justify-center">
                            <span className="bg-neutral-900 text-white text-[8px] font-black px-2 py-0.5 rounded leading-none">
                              HABIS
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Title block */}
                          <h4 className="text-xs font-bold text-neutral-800 line-clamp-2 leading-tight uppercase tracking-tight mb-1 text-left font-display">
                            {series.seriesName} SERIES
                          </h4>

                          {/* Softlens parameters dot swatches block */}
                          <div className="flex items-center gap-1.5 my-1.5 justify-start">
                            <div className="flex items-center -space-x-1 shrink-0">
                              {series.colors.slice(0, 3).map(col => (
                                <span 
                                  key={col}
                                  className="w-2.5 h-2.5 rounded-full border border-white shadow-inner shrink-0 block"
                                  style={{ backgroundColor: getColorHex(col) }}
                                />
                              ))}
                            </div>
                            <span className="text-[8px] font-bold text-neutral-400 truncate">
                              {series.colors.length} Pilihan Warna
                            </span>
                          </div>
                        </div>

                        <div>
                          {/* Rating & Sold count */}
                          <div className="flex items-center justify-between text-[9px] text-neutral-400 mt-1 mb-2">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="w-2.5 h-2.5 fill-current shrink-0" />
                              <span className="font-extrabold text-slate-950">{rating.toFixed(1)}</span>
                            </div>
                            <span>{reviews}+ Terujal</span>
                          </div>

                          {/* Cosmetics Price Tag */}
                          <div className="flex items-center justify-between pt-1 border-t border-neutral-50">
                            <div className="flex flex-col text-left">
                              <span className="text-[7.5px] font-bold text-neutral-400 leading-none">HARGA BOX</span>
                              <span className="text-xs font-black text-slate-900">Rp {series.representativeProduct.hargaJual.toLocaleString()}</span>
                            </div>
                            <span className="text-[8.5px] font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded tracking-tighter">
                              Beli
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Persistent Footer */}
          <footer className="bg-white border-t border-neutral-100 py-10 px-6 mt-8">
            <div className="max-w-md mx-auto space-y-10 text-center">
              {/* Brand Message Section */}
              <div className="space-y-3">
                <h4 className="font-display text-xl font-bold tracking-tight text-slate-950 uppercase">Tentang {branding?.logoText || "Zendiix"}</h4>
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
                  &copy; 2026 Zendiix Softlens. All rights reserved.
                </p>
              </div>
            </div>
          </footer>


        </div>

        {/* 3. PERSISTENT SHOPEE-STYLE BOTTOM SHEETS VARIANT SELECTOR */}
        <AnimatePresence>
          {selectedSeries && (() => {
            const stats = getSeriesStatistics(selectedSeries);
            const repProduct = selectedSeries.representativeProduct;
            const activeVariantByColor = selectedSeries.variants.find(
              v => v.color?.toLowerCase() === modalColor.toLowerCase() && v.product?.imageUrl
            );
            const activeProductByColor = activeVariantByColor ? activeVariantByColor.product : repProduct;
            const displayImageStr = activeProductByColor.imageUrl || repProduct.imageUrl || `https://picsum.photos/seed/${selectedSeries.seriesName}/600/600`;
            const displayImageUrls = splitImageUrls(displayImageStr);
            const currentImageUrl = displayImageUrls[activeImageIdx] || displayImageUrls[0] || `https://picsum.photos/seed/${selectedSeries.seriesName}/600/600`;

            const price = repProduct.hargaJual;

            const bMultiplier = modalIsDualPower ? 2 : 1;
            const modalSubtotal = price * buyQty * bMultiplier;

            return (
              <div className="fixed inset-0 z-[150] flex flex-col justify-end items-center bg-black/60">
                {/* Overlay backdrop inside device container */}
                <div 
                  onClick={() => setSelectedSeries(null)}
                  className="absolute inset-0"
                />

                {/* Sliding Purchase Sheet */}
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative bg-white w-full sm:max-w-md rounded-t-2xl shadow-xl flex flex-col max-h-[85%] z-10 overflow-hidden"
                >
                  
                  {/* Slider Upper Drag Indicator Style */}
                  <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto my-2 shrink-0 pointer-events-none" />

                  {/* Header Variant Sheet containing image thumbnail, pricing */}
                  <div className="px-4 pb-3 pt-1 border-b border-neutral-100 flex gap-3 relative shrink-0">
                    
                    {/* Compact preview photo */}
                    <div 
                      className="w-24 h-24 bg-neutral-50 rounded-lg overflow-hidden border border-neutral-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setFullScreenImage({ urls: displayImageUrls, index: activeImageIdx })}
                    >
                      <img src={currentImageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex-1 mt-1 text-left min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 truncate uppercase mt-0.5 font-display">{selectedSeries.seriesName} Series</h4>
                      <p className="text-sm font-black text-slate-950 mt-0.5 animate-pulse">Rp {price.toLocaleString()}</p>
                      
                      {/* Live Selected parameters overview */}
                      <span className="text-[8.5px] font-bold text-neutral-400 block tracking-tight uppercase mt-0.5 truncate">
                        Pilihan: {modalColor ? `Warna ${modalColor}` : 'Belum memilih warna'} 
                        {!selectedSeries.representativeProduct.notSoftlens && (
                          ` | SPH: ${modalIsDualPower ? `L:${selectedPowerL} / R:${selectedPowerR}` : selectedPowerL}`
                        )}
                      </span>
                    </div>

                    <button 
                      onClick={() => setSelectedSeries(null)}
                      className="absolute top-2 right-4 p-1 hover:bg-neutral-100 rounded-full text-neutral-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Middle Scrollable Section */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left scrollbar-none">
                    
                    {/* Multiphoto indicator if available */}
                    {displayImageUrls.length > 1 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-display">Detail Foto Lensa</span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {displayImageUrls.map((thumbUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImageIdx(idx)}
                              className={`w-10 h-10 rounded overflow-hidden border shrink-0 ${
                                activeImageIdx === idx 
                                  ? 'border-slate-950 ring-1 ring-slate-950/40' 
                                  : 'border-neutral-200 opacity-80'
                              }`}
                            >
                              <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specifications mini sheet details */}
                    {!selectedSeries.representativeProduct.hideSpecs && (
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-[9px] flex justify-between items-center text-center gap-1 font-semibold">
                        <span className="flex-1">
                          <span className="text-neutral-400 block text-[7.5px] font-black uppercase tracking-tight">DIA</span>
                          <span className="font-bold text-neutral-700">{stats.diameter}</span>
                        </span>
                        <span className="text-neutral-200">|</span>
                        <span className="flex-1">
                          <span className="text-neutral-400 block text-[7.5px] font-black uppercase tracking-tight">BC</span>
                          <span className="font-bold text-neutral-700">{stats.baseCurve}</span>
                        </span>
                        <span className="text-neutral-200">|</span>
                        <span className="flex-1">
                          <span className="text-neutral-400 block text-[7.5px] font-black uppercase tracking-tight">Kadar Air</span>
                          <span className="font-bold text-neutral-700">{stats.waterContent}</span>
                        </span>
                      </div>
                    )}

                    {/* 1. COLOR SWATCH PICKER */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-display">
                        <span>{selectedSeries.representativeProduct.notSoftlens ? "Pilihan Variasi" : "Pilihan Warna"}</span>
                        <span className="text-slate-950 font-bold">{modalColor} Terpilih</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedSeries.colors.map(col => {
                          const isActive = modalColor.toLowerCase() === col.toLowerCase();
                          return (
                            <button
                              key={col}
                              onClick={() => setModalColor(col)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                isActive 
                                  ? 'border-slate-950 bg-slate-50 text-slate-950 font-black shadow-inner' 
                                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0 block" 
                                style={{ backgroundColor: getColorHex(col) }}
                              />
                              <span>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. PRODUCT SELECTION / DESCRIPTION */}
                    {selectedSeries.representativeProduct.notSoftlens ? (
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs text-left">
                        <span className="text-[9px] font-bold text-slate-950 uppercase tracking-widest block mb-1 font-display">Deskripsi Detail Produk</span>
                        <p className="text-neutral-600 font-medium leading-relaxed font-sans whitespace-pre-wrap text-[10px]">
                          {selectedSeries.representativeProduct.description || "Tidak ada deskripsi detail untuk produk ini."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* SPH POWER DROPDOWNS / GRID */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[9px] font-bold uppercase text-neutral-400 block font-display">Pilihan Ukuran Minus</span>
                          <div className="relative">
                            <select
                              value={selectedPowerL}
                              onChange={(e) => setSelectedPowerL(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded py-2 px-2.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 appearance-none"
                            >
                              {powerOptions.map(pow => {
                                const matchingVariant = selectedSeries.variants.find(
                                  v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === pow
                                );
                                const stockVal = matchingVariant?.stokBarang ?? 0;
                                return (
                                  <option key={pow} value={pow}>
                                    SPH: {pow} {stockVal <= 0 ? '- [Stok Kosong]' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. QUANTITY ROW & SYNC STATUS */}
                    <div className="flex items-center justify-between bg-neutral-50 p-3.5 rounded-xl border border-neutral-100">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 font-display">Jumlah Set</span>
                        <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-md py-0.5 px-2">
                          <button 
                            onClick={() => setBuyQty(p => Math.max(1, p - 1))}
                            className="text-xs font-black p-1 hover:text-slate-950"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-7 text-center">{buyQty}</span>
                          <button 
                            onClick={() => setBuyQty(p => p + 1)}
                            className="text-xs font-black p-1 hover:text-slate-950"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[8.5px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Status Stok Varian</span>
                        {activeStockStatus.available ? (
                          <div className="text-emerald-600 font-extrabold text-xs">
                            Ready
                          </div>
                        ) : (
                          <div className="text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                            Stok Habis / Limit
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Bottom Checkout Actions inside Variant Sheet */}
                  <div className="p-3 border-t border-neutral-100 bg-neutral-50 shrink-0 select-none">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 px-1 mb-2 font-bold uppercase">
                      <span>Total Bayar ({buyQty * (modalIsDualPower ? 2 : 1)} Box):</span>
                      <span className="text-sm font-black text-slate-950">Rp {modalSubtotal.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!activeStockStatus.available}
                      className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        activeStockStatus.available 
                          ? 'bg-slate-950 text-white hover:bg-slate-900 shadow-sm' 
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-200'
                      }`}
                    >
                      {activeStockStatus.available ? (
                        <>MASUKKAN KERANJANG</>
                      ) : (
                        'STOK HABIS'
                      )}
                    </button>
                  </div>

                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* Shopee Style Cart Drawer element */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-[120] flex justify-center bg-black/60">
              <div 
                onClick={() => setIsCartOpen(false)}
                className="absolute inset-0"
              />
              
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full sm:max-w-lg bg-white h-full shadow-2xl flex flex-col z-10"
              >
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-neutral-900" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">Keranjang ({cart.reduce((a, b) => a + b.qty, 0)})</h4>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 bg-neutral-200 text-neutral-700 rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-none">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <CartIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 font-bold mb-0.5">Keranjang Belanja Kosong</p>
                      <p className="text-[10px] text-neutral-400 px-4">Silakan pilih seri softlens cantik Anda dan tanyakan ke admin!</p>
                    </div>
                  ) : (
                    cart.map(item => {
                      const sub = item.hargaJual * item.qty;

                      return (
                        <div key={item.cartId} className="flex gap-3 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                          <img 
                            src={splitImageUrls(item.productL.imageUrl)[0] || `https://picsum.photos/seed/${item.seriesName}/150/150`}
                            alt={item.seriesName}
                            className="w-12 h-12 object-cover rounded border shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <h6 className="text-[10px] font-black text-neutral-800 line-clamp-1 truncate uppercase">{item.seriesName} SERIES</h6>
                            <p className="text-[9px] font-bold text-slate-900 mt-0.5">
                              {item.notSoftlens ? 'Variasi' : 'Warna'}: {item.color}
                            </p>
                            
                            {item.notSoftlens ? (
                              <div className="text-[8.5px] text-neutral-400 font-bold mt-0.5 uppercase tracking-wide">
                                Non-Softlens
                              </div>
                            ) : (
                              <div className="text-[8.5px] text-neutral-400 font-bold mt-0.5">
                                SPH: {item.powerL}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded py-0.5 px-1.5">
                                <button 
                                  onClick={() => updateCartQty(item.cartId, -1)}
                                  className="text-[9px] px-0.5 hover:text-slate-950 font-black"
                                >
                                  -
                                </button>
                                <span className="text-[10px] font-bold w-4 text-center">{item.qty}</span>
                                <button 
                                  onClick={() => updateCartQty(item.cartId, 1)}
                                  className="text-[9px] px-0.5 hover:text-slate-950 font-black"
                                >
                                  +
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(item.cartId)}
                                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-neutral-200 rounded transition-all select-none"
                              >
                                <Trash2 className="w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-between items-end shrink-0 min-w-[65px]">
                            <span className="text-[10px] font-bold text-neutral-400">
                              Rp {item.hargaJual.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black text-neutral-900">
                              Rp {sub.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-neutral-100 bg-neutral-50 space-y-3.5 mt-auto">
                  <div className="flex items-center justify-between text-left">
                    <span className="text-[9px] font-black uppercase text-neutral-400">Total Belanja</span>
                    <span className="text-sm font-black text-slate-950">Rp {totalCartPrice.toLocaleString()}</span>
                  </div>
                  
                  <p className="text-[8.5px] text-neutral-400 text-center leading-normal">
                    *Pesanan otomatis dikirim & diproses instan via CS Admin WhatsApp Zendiix.
                  </p>

                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`w-full py-2.5 rounded text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      cart.length > 0
                        ? 'bg-slate-950 hover:bg-slate-900 text-white'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-200 shadow-none'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Order via WhatsApp
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Shopee Classic Bottom Navigation Bar (Persistent across pages) */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[55px] bg-white border-t border-neutral-200 flex items-center justify-around z-[200] select-none shadow-lg">
          <button 
            type="button"
            onClick={() => {
              setIsCartOpen(false);
              setActiveCategory('All');
              setActiveColorFilter('All');
              setActiveDiameterFilter('All');
              setActiveWaterFilter('All');
              setActiveBCFilter('All');
              setSearchQuery('');
              setIsFilterVisible(false);
              const top = document.querySelector('header');
              if (top) top.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center gap-0.5 focus:outline-none"
          >
            <Sparkles className={`w-5 h-5 ${!isFilterVisible ? 'text-slate-900' : 'text-neutral-400'}`} />
            <span className={`text-[8.5px] font-bold ${!isFilterVisible ? 'text-slate-900' : 'text-neutral-400'}`}>Beranda</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setIsCartOpen(false);
              setIsFilterVisible(prev => {
                const nextVal = !prev;
                if (nextVal) {
                  setTimeout(() => {
                    const filterArea = document.getElementById('filter-panel');
                    if (filterArea) {
                      filterArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 150);
                }
                return nextVal;
              });
            }}
            className="flex flex-col items-center justify-center gap-0.5 focus:outline-none"
          >
            <Search className={`w-5 h-5 transition-colors ${isFilterVisible ? 'text-slate-900' : 'text-neutral-500'}`} />
            <span className={`text-[8.5px] font-bold transition-colors ${isFilterVisible ? 'text-slate-900' : 'text-neutral-500'}`}>Kategori</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsCartOpen(prev => !prev)}
            className="flex flex-col items-center justify-center gap-0.5 text-neutral-400 relative focus:outline-none"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-neutral-500" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </div>
            <span className="text-[8.5px] font-bold text-neutral-500">Keranjang</span>
          </button>

          <a 
            href="https://wa.me/6281234567890" 
            target="_blank" 
            rel="noreferrer"
            onClick={() => setIsCartOpen(false)}
            className="flex flex-col items-center justify-center gap-0.5 text-neutral-400 focus:outline-none"
          >
            <Phone className="w-5 h-5 text-emerald-500" />
            <span className="text-[8.5px] font-bold text-neutral-500">Chat CS</span>
          </a>
        </nav>

        {/* Full Screen Image Viewer */}
        {fullScreenImage && (
          <div className="fixed inset-0 z-[200] bg-transparent backdrop-blur-lg flex items-center justify-center animate-fade-in" onClick={() => setFullScreenImage(null)}>
            
            <button 
              className="absolute top-4 right-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/40 transition-all border border-white/50 backdrop-blur-md z-[210]"
              onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
            >
              <X className="w-6 h-6" />
            </button>
            
            {fullScreenImage.urls.length > 1 && (
            <>
                <button 
                    className="absolute left-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/40 transition-all border border-white/50 backdrop-blur-md"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setFullScreenImage(prev => prev ? {...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length} : null); 
                    }}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button 
                    className="absolute right-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/40 transition-all border border-white/50 backdrop-blur-md"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setFullScreenImage(prev => prev ? {...prev, index: (prev.index + 1) % prev.urls.length} : null); 
                    }}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </>
            )}
            
            <img src={fullScreenImage.urls[fullScreenImage.index]} alt="Full Screen" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" referrerPolicy="no-referrer" />
          </div>
        )}

      </div>

    </div>
  );
};
