import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowLeft,
  ShoppingBag as CartIcon,
  Instagram,
  Music,
  Camera,
  Upload,
  Home
} from 'lucide-react';
import { Product, Sale, IncomingGood, subscribeToSales, subscribeToIncomingGoods, BrandingSettings, Review, subscribeToReviews, addReview } from '../services';
import { LimelightNav } from '../components/ui/limelight-nav';

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
  computedMainImage: string;
  computedAllMainImages: string[];
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

// Pure, stable hashing function using a robust Mulberry32-inspired generator to ensure 100% deterministic layout stability
const getSeededValueForSeries = (seriesName: string, dateKey: string): number => {
  const combined = `${seriesName}_${dateKey}`;
  let h = 1779033703 ^ combined.length;
  for (let i = 0; i < combined.length; i++) {
    h = Math.imul(h ^ combined.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  // Convert integer hash to stable float in [0, 1)
  return (h >>> 0) / 4294967296;
};

export const Storefront: React.FC<StorefrontProps> = ({ products, banners = [], branding, isLoading = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isUrlChecked, setIsUrlChecked] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<GroupedSeries | null>(null);
  const selectedSeriesRef = useRef(selectedSeries);
  useEffect(() => {
    selectedSeriesRef.current = selectedSeries;
  }, [selectedSeries]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeColorFilter, setActiveColorFilter] = useState('All');
  const [activeDiameterFilter, setActiveDiameterFilter] = useState('All');
  const [activeWaterFilter, setActiveWaterFilter] = useState('All');
  const [activeBCFilter, setActiveBCFilter] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Date refresh trigger for daily randomization
  const [dateKey, setDateKey] = useState(new Date().toDateString());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentString = new Date().toDateString();
      if (currentString !== dateKey) {
        setDateKey(currentString);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dateKey]);
  
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
  const modalIsDualPower = useMemo(() => {
    if (!selectedSeries) return false;
    const isNotSoftlens = !!selectedSeries.representativeProduct.notSoftlens;
    return !isNotSoftlens && selectedSeries.representativeProduct.allowDualPower !== false;
  }, [selectedSeries]);

  const [selectedPowerL, setSelectedPowerL] = useState('0.00');
  const [selectedPowerR, setSelectedPowerR] = useState('0.00');
  const [buyQty, setBuyQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<{urls: string[], index: number} | null>(null);

  // Reset image index when modal series or color changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedSeries, modalColor]);

  // Reset select parameters when selectedSeries changes
  useEffect(() => {
    if (selectedSeries) {
      setModalColor(selectedSeries.colors[0] || 'Clear');
      setSelectedPowerL('0.00');
      setSelectedPowerR('0.00');
      setBuyQty(1);
    }
  }, [selectedSeries]);

  // Toast message notification state & automatic clear
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reviews state and submit reviews functionality
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewPhoto, setNewReviewPhoto] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const productReviews = useMemo(() => {
    if (!selectedSeries) return [];
    return reviews.filter(r => 
      r.productId?.toLowerCase() === selectedSeries.seriesName?.toLowerCase() ||
      r.productId?.toLowerCase().includes(selectedSeries.seriesName?.toLowerCase()) ||
      selectedSeries.seriesName?.toLowerCase().includes(r.productId?.toLowerCase())
    );
  }, [reviews, selectedSeries]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension 400px for nice quality yet extremely lightweight
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality to ensure it stays extremely small
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewReviewPhoto(compressedDataUrl);
        }
        setIsCompressingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async () => {
    if (!selectedSeries || !newReviewName.trim() || !newReviewComment.trim()) return;
    try {
      await addReview({
        productId: selectedSeries.seriesName,
        reviewerName: newReviewName.trim(),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        photoUrl: newReviewPhoto
      });
      setNewReviewName('');
      setNewReviewRating(5);
      setNewReviewComment('');
      setNewReviewPhoto('');
      setToastMessage("Terima kasih! Ulasan Anda telah terkirim.");
    } catch (err) {
      console.error(err);
      setToastMessage("Gagal mengirim ulasan.");
    }
  };

  // URL query synchronizer: updates "?product=SeriesName" search parameter dynamically
  useEffect(() => {
    if (isLoading || products.length === 0 || !isUrlChecked) return;

    const currentParam = searchParams.get('product') || searchParams.get('series');
    if (selectedSeries) {
      if (currentParam !== selectedSeries.seriesName) {
        setSearchParams(prev => {
          prev.set('product', selectedSeries.seriesName);
          return prev;
        }, { replace: true });
      }
    } else {
      if (currentParam !== null) {
        setSearchParams(prev => {
          prev.delete('product');
          prev.delete('series');
          return prev;
        }, { replace: true });
      }
    }
  }, [selectedSeries, searchParams, setSearchParams, isLoading, products, isUrlChecked]);

  const handleShare = (seriesName: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(seriesName)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setToastMessage('LINK PRODUK TERSALIN!');
        })
        .catch(() => {
          fallbackCopyText(shareUrl);
        });
    } else {
      fallbackCopyText(shareUrl);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textSelect(textArea);
    try {
      document.execCommand('copy');
      setToastMessage('LINK PRODUK TERSALIN!');
    } catch (err) {
      alert("Gagal menyalin link secara otomatis. Silakan salin link berikut: " + text);
    }
    document.body.removeChild(textArea);
  };

  const textSelect = (el: HTMLTextAreaElement) => {
    el.select();
    el.setSelectionRange(0, 99999);
  };

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
    const salesMap = new Map<string, number>();
    for (let i = 0; i < sales.length; i++) {
      const s = sales[i];
      if (s.productId) {
        salesMap.set(s.productId, (salesMap.get(s.productId) || 0) + s.qty);
      }
    }

    const incomingMap = new Map<string, number>();
    for (let i = 0; i < incomingGoods.length; i++) {
      const ig = incomingGoods[i];
      if (ig.productId) {
        incomingMap.set(ig.productId, (incomingMap.get(ig.productId) || 0) + ig.qty);
      }
    }

    return products.map(p => {
      const totalTerjual = salesMap.get(p.id!) || 0;
      const totalMasuk = incomingMap.get(p.id!) || 0;
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
          allPowers: [],
          computedMainImage: "",
          computedAllMainImages: []
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
      
      // Compute main image resolving logic
      let mainImg = "";
      let allMainImgs: string[] = [];
      const productWithSeriesImg = s.variants.find(v => v.product.seriesImageUrl !== undefined && splitImageUrls(v.product.seriesImageUrl).length > 0);
      if (productWithSeriesImg && productWithSeriesImg.product.seriesImageUrl) {
        allMainImgs = splitImageUrls(productWithSeriesImg.product.seriesImageUrl);
        mainImg = allMainImgs[0] || "";
      } else {
        // Fallback: try to find intersection of unique variant image lists to isolate the common "foto utama seri"
        const uniqueImageLists: string[][] = [];
        s.variants.forEach(v => {
          const list = splitImageUrls(v.product.imageUrl || "");
          if (list.length > 0) {
            const alreadyExists = uniqueImageLists.some(
              existing => existing.length === list.length && existing.every((val, idx) => val === list[idx])
            );
            if (!alreadyExists) {
              uniqueImageLists.push(list);
            }
          }
        });

        if (uniqueImageLists.length > 1) {
          let commonImages = uniqueImageLists[0];
          for (let i = 1; i < uniqueImageLists.length; i++) {
            commonImages = commonImages.filter(img => uniqueImageLists[i].includes(img));
          }
          if (commonImages.length > 0) {
            allMainImgs = commonImages;
            mainImg = commonImages[0];
          }
        } else if (uniqueImageLists.length === 1) {
          allMainImgs = uniqueImageLists[0];
          mainImg = allMainImgs[0] || "";
        }
        
        if (!mainImg && s.representativeProduct.imageUrl) {
          allMainImgs = splitImageUrls(s.representativeProduct.imageUrl);
          mainImg = allMainImgs[0] || "";
        }
      }
      s.computedMainImage = mainImg;
      s.computedAllMainImages = allMainImgs;
    });

    return Object.values(map);
  }, [productsWithStock]);

  // URL query receiver (auto open product on mount or list load)
  useEffect(() => {
    if (products.length > 0 && !isLoading && groupedSeriesList.length > 0) {
      const productParam = searchParams.get('product') || searchParams.get('series');
      if (productParam) {
        const decodedName = decodeURIComponent(productParam).trim().toLowerCase();
        const found = groupedSeriesList.find(s => s.seriesName.trim().toLowerCase() === decodedName);
        if (found) {
          // Only update state if it is different than currently selected to prevent looping
          const currentSelect = selectedSeriesRef.current;
          if (!currentSelect || currentSelect.seriesName.trim().toLowerCase() !== decodedName) {
            setSelectedSeries(found);
            setModalColor(found.colors[0] || 'Clear');
            setSelectedPowerL('0.00'); // Standard default normalization
            setSelectedPowerR('0.00');
            setBuyQty(1);
          }
        }
      } else {
        // If query parameters are removed (e.g. user goes back/dismisses), close the modal
        if (selectedSeriesRef.current) {
          setSelectedSeries(null);
        }
      }
      setIsUrlChecked(true);
    }
  }, [products, isLoading, groupedSeriesList, searchParams]);

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
    return [...filteredSeries]
      .map(item => ({ 
        item, 
        sortVal: getSeededValueForSeries(item.seriesName, dateKey) 
      }))
      .sort((a, b) => a.sortVal - b.sortVal)
      .map(item => item.item)
      .slice(0, 8);
  }, [filteredSeries, dateKey]);

  const handleToggleFav = (seriesName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(seriesName) ? prev.filter(name => name !== seriesName) : [...prev, seriesName]
    );
  };

  // 2. VARIANT PICKER / CART ACTION: Safely checks stocks & adds to cart state
  const handleAddToCart = () => {
    if (!selectedSeries) return;

    const isProductNotSoftlens = !!selectedSeries.representativeProduct.notSoftlens;

    // Retrieve active variants matching color & power
    let variantL = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && (isProductNotSoftlens || v.power === selectedPowerL)
    );
    let variantR = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && (isProductNotSoftlens || v.power === selectedPowerR)
    );

    // Fallback if exact matching variant key isn't in db yet (plano fallback)
    if (!variantL) {
      variantL = selectedSeries.variants[0];
    }
    if (!variantR) {
      variantR = variantL;
    }

    const price = (variantL && variantL.product && variantL.product.hargaJual)
      ? variantL.product.hargaJual
      : selectedSeries.representativeProduct.hargaJual;
    const finalPowerL = isProductNotSoftlens ? '0.00' : selectedPowerL;
    const finalIsDual = modalIsDualPower && !isProductNotSoftlens;
    const finalPowerR = finalIsDual ? selectedPowerR : finalPowerL;

    const cartId = isProductNotSoftlens
      ? `${selectedSeries.seriesName}-${modalColor}-notsoftlens`
      : finalIsDual
        ? `${selectedSeries.seriesName}-${modalColor}-${finalPowerL}-${finalPowerR}-dual`
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
      hargaJual: price * (finalIsDual ? 2 : 1),
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
      } else if (item.isDual) {
        powerDetails = `\n    └─ SPH Kiri (L): ${item.powerL}\n    └─ SPH Kanan (R): ${item.powerR}\n    *(Beli Paket 2 Box - Beda SPH)*`;
      } else {
        powerDetails = `\n    └─ SPH Minus: ${item.powerL}\n    *(Beli 1 Box)*`;
      }

      return `${index + 1}. Seri: ${item.seriesName}\n    └─ ${item.notSoftlens ? 'Variasi' : 'Warna'}: ${item.color}${powerDetails}\n    └─ Qty: ${item.qty} set x Rp ${item.hargaJual.toLocaleString()}\n    └─ Subtotal: Rp ${subtotal.toLocaleString()}`;
    }).join('\n\n');

    const totalBonus = totalCartPrice >= 400000 ? "Bonus: Free Shipping + Travel Kit Premium Case ✨" : "Bonus: Custom Mirror Contact Lens Case ✨";

    const msg = `Halo Zendiix Softlens! Saya ingin memesan produk berikut:\n\n${orderListText}\n\n======================\n*TOTAL ORDER: Rp ${totalCartPrice.toLocaleString()}*\n======================\n${totalBonus}\n\nMohon bantu diinfo no-rekening dan estimasi kirim ke alamat saya ya Sis! ❤️`;
    
    window.open(`https://wa.me/6282132612061?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // SPH Powers dynamic option list based on actual variants in the database for selected series & color
  const powerOptions = useMemo(() => {
    if (!selectedSeries || !modalColor) {
      return ['0.00'];
    }
    const matchingPowers = selectedSeries.variants
      .filter(v => v.color.toLowerCase() === modalColor.toLowerCase())
      .map(v => v.power);
    
    // De-duplicate
    const uniquePowers = Array.from(new Set(matchingPowers)) as string[];
    
    if (uniquePowers.length === 0) {
      return ['0.00'];
    }

    // Sort powers. Since powers are numeric string values (e.g. "-1.25", "0.00", "-0.50"),
    // sort based on numeric value descending (so 0.00 is first, then negative powers descending: -0.50, -0.75, -1.00, etc.)
    uniquePowers.sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numB - numA;
    });

    return uniquePowers;
  }, [selectedSeries, modalColor]);

  // Synchronize selectedPowerL and selectedPowerR with the dynamic powerOptions
  useEffect(() => {
    if (powerOptions && powerOptions.length > 0) {
      if (!powerOptions.includes(selectedPowerL)) {
        setSelectedPowerL(powerOptions[0]);
      }
      if (!powerOptions.includes(selectedPowerR)) {
        setSelectedPowerR(powerOptions[0]);
      }
    }
  }, [powerOptions, selectedPowerL, selectedPowerR]);

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

  const getPriceRangeDisplay = (series: GroupedSeries) => {
    const prices = series.variants.map(v => v.product.hargaJual || 0).filter(p => p > 0);
    if (prices.length === 0) {
      const repPrice = series.representativeProduct.hargaJual || 0;
      return `Rp ${repPrice.toLocaleString()}`;
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `Rp ${minPrice.toLocaleString()}`
      : `Rp ${minPrice.toLocaleString()} - Rp ${maxPrice.toLocaleString()}`;
  };

  // STOCK SYNC MONITOR - Checks the live database stock for currently selected parameters
  const activeStockStatus = useMemo(() => {
    if (!selectedSeries) return { available: false, count: 0, variantL: null, variantR: null };
    const isNotSoftlens = !!selectedSeries.representativeProduct.notSoftlens;

    const varL = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && (isNotSoftlens || v.power === selectedPowerL)
    );

    if (modalIsDualPower && !isNotSoftlens) {
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

  const modalSubtotal = useMemo(() => {
    if (!selectedSeries) return 0;
    const isNotSoftlens = !!selectedSeries.representativeProduct.notSoftlens;
    const varL = selectedSeries.variants.find(
      v => v.color.toLowerCase() === modalColor.toLowerCase() && (isNotSoftlens || v.power === selectedPowerL)
    );
    const price = (varL && varL.product && varL.product.hargaJual) 
      ? varL.product.hargaJual 
      : selectedSeries.representativeProduct.hargaJual;

    const multiplier = (modalIsDualPower && !isNotSoftlens) ? 2 : 1;
    return price * buyQty * multiplier;
  }, [selectedSeries, modalColor, selectedPowerL, modalIsDualPower, buyQty]);

  const currentActiveNavIndex = isCartOpen ? 2 : (isFilterVisible ? 1 : 0);

  const frontendNavItems = [
    {
      id: 'home',
      icon: <Home className="w-5 h-5" />,
      label: 'Beranda',
      onClick: () => {
        setIsCartOpen(false);
        setSelectedSeries(null);
        setActiveCategory('All');
        setActiveColorFilter('All');
        setActiveDiameterFilter('All');
        setActiveWaterFilter('All');
        setActiveBCFilter('All');
        setSearchQuery('');
        setIsFilterVisible(false);
        const top = document.querySelector('header');
        if (top) top.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      id: 'category',
      icon: <Search className="w-5 h-5" />,
      label: 'Kategori',
      onClick: () => {
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
      }
    },
    {
      id: 'cart',
      icon: (
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </span>
          )}
        </div>
      ),
      label: 'Keranjang',
      onClick: () => setIsCartOpen(prev => !prev)
    },
    {
      id: 'chat',
      icon: <Phone className="w-5 h-5 text-emerald-500" />,
      label: 'Chat CS',
      onClick: () => {
        setIsCartOpen(false);
        window.location.href = "https://wa.me/6282132612061";
      }
    }
  ];

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
            {selectedSeries ? (
              <button 
                onClick={() => setSelectedSeries(null)}
                className="flex items-center gap-1.5 text-slate-900 hover:text-slate-700 transition-colors font-extrabold text-[11px] uppercase tracking-wider"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Beranda</span>
              </button>
            ) : (
              /* Elegant Cosmetics Brand Branding with Mall/Boutique Gold Accent Badge */
              <div className="flex items-center gap-2 flex-shrink-0">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" width="128" height="32" className="h-8 w-auto object-contain" />
                ) : (
                  <span className="font-display text-2xl font-black tracking-tighter leading-none text-slate-950">
                    {branding?.logoText || "ZENDIIX"}
                  </span>
                )}
              </div>
            )}

            {selectedSeries ? (
              <div className="flex-1 text-center font-display text-xs font-black text-slate-950 truncate uppercase pr-4">
                {selectedSeries.seriesName} Detail
              </div>
            ) : !isFilterVisible ? (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Cari Seri atau Warna..."
                  className="w-full h-10 pl-9 pr-4 bg-neutral-100 text-neutral-800 rounded-md text-xs font-bold placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
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
              aria-label="Keranjang Belanja"
              className="relative w-11 h-11 hover:bg-neutral-50 rounded-full transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-10 scrollbar-none">
          
          {selectedSeries ? (() => {
            const stats = getSeriesStatistics(selectedSeries);
            const repProduct = selectedSeries.representativeProduct;
            const activeVariantByColor = selectedSeries.variants.find(
              v => v.color?.toLowerCase() === modalColor.toLowerCase() && v.product?.imageUrl
            );
            
            const displayImageUrls = (activeVariantByColor && activeVariantByColor.product?.imageUrl)
              ? splitImageUrls(activeVariantByColor.product.imageUrl)
              : (repProduct.imageUrl ? splitImageUrls(repProduct.imageUrl) : []);
            
            const currentImageUrl = displayImageUrls[activeImageIdx] || repProduct.imageUrl || `https://picsum.photos/seed/${selectedSeries.seriesName}/600/600`;
            const isNotSoftlens = !!repProduct.notSoftlens;
            const activeVar = selectedSeries.variants.find(
              v => v.color.toLowerCase() === modalColor.toLowerCase() && (isNotSoftlens || v.power === selectedPowerL)
            );
            const price = (activeVar && activeVar.product && activeVar.product.hargaJual) 
              ? activeVar.product.hargaJual 
              : repProduct.hargaJual;

            return (
              <div className="bg-white text-slate-900 min-h-screen pb-20">
                {/* Product Hero Image Gallery */}
                <div className="relative w-full aspect-square bg-[#F7F7F7] overflow-hidden group">
                  <img 
                    src={currentImageUrl}
                    alt={selectedSeries.seriesName}
                    width="480"
                    height="480"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                    {...{ fetchPriority: "high" } as any}
                  />
                  
                  {/* Float share button */}
                  <button
                    onClick={() => handleShare(selectedSeries.seriesName)}
                    aria-label="Bagikan & Salin Link Produk"
                    className="absolute right-4 top-4 bg-white/90 backdrop-blur-md w-11 h-11 p-2.5 rounded-full shadow-md text-slate-800 hover:bg-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                    title="Bagikan & Salin Link"
                  >
                    <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>

                {/* Thumbnails Gallery inside page */}
                {displayImageUrls.length > 1 && (
                  <div className="px-4 py-3 bg-neutral-50/50 border-b border-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-display mb-1.5 font-sans">Galeri Foto Lensa</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {displayImageUrls.map((thumbUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIdx(idx)}
                          aria-label={`Lihat gambar produk ke ${idx + 1}`}
                          className={`w-12 h-12 rounded overflow-hidden border transition-all shrink-0 flex items-center justify-center ${
                            activeImageIdx === idx 
                              ? 'border-slate-950 ring-2 ring-slate-950/20 scale-95' 
                              : 'border-neutral-200 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={thumbUrl} alt="" width="48" height="48" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Info Section */}
                <div className="p-4 space-y-4 font-sans">
                  <div className="space-y-1 text-left">
                    <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight leading-snug font-display">
                      {selectedSeries.seriesName} Series
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-950 font-sans">
                        Rp {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-400 line-through font-sans">
                        Rp {(price * 1.3).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Specs Section */}
                  {!selectedSeries.representativeProduct.hideSpecs && (
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-[10px] flex justify-between items-center text-center gap-2 font-semibold font-sans">
                      <div className="flex-1">
                        <span className="text-neutral-400 block text-[8px] font-bold uppercase tracking-wider mb-0.5 font-display">DIA</span>
                        <span className="font-bold text-slate-800">{stats.diameter}</span>
                      </div>
                      <span className="text-neutral-200">|</span>
                      <div className="flex-1">
                        <span className="text-neutral-400 block text-[8px] font-bold uppercase tracking-wider mb-0.5 font-display">BC</span>
                        <span className="font-bold text-slate-800">{stats.baseCurve}</span>
                      </div>
                      <span className="text-neutral-200">|</span>
                      <div className="flex-1">
                        <span className="text-neutral-400 block text-[8px] font-bold uppercase tracking-wider mb-0.5 font-display">Kadar Air</span>
                        <span className="font-bold text-slate-800">{stats.waterContent}</span>
                      </div>
                      <span className="text-neutral-200">|</span>
                      <div className="flex-1">
                        <span className="text-neutral-400 block text-[8px] font-bold uppercase tracking-wider mb-0.5 font-display">DURASI</span>
                        <span className="font-bold text-slate-800">{stats.duration || "6 Bulan"}</span>
                      </div>
                    </div>
                  )}

                  {/* Color Swatch Picker */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-display">
                      <span>{selectedSeries.representativeProduct.notSoftlens ? "Pilihan Variasi" : "Pilihan Warna"}</span>
                      <span className="text-slate-950 font-bold">{modalColor}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {selectedSeries.colors.map(col => {
                        const isActive = modalColor.toLowerCase() === col.toLowerCase();
                        return (
                          <button
                            key={col}
                            onClick={() => {
                              setModalColor(col);
                              setActiveImageIdx(0);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold border transition-all ${
                              isActive 
                                ? 'border-slate-950 bg-slate-50 text-slate-950 font-black shadow-inner scale-[1.02]' 
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-white shadow-xs shrink-0 block" 
                              style={{ backgroundColor: getColorHex(col) }}
                            />
                            <span>{col}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Selection Description block */}
                  {selectedSeries.representativeProduct.notSoftlens ? (
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs text-left font-sans">
                      <span className="text-[10px] font-bold text-slate-950 uppercase tracking-widest block mb-1.5 font-display">Deskripsi Detail Produk</span>
                      <p className="text-neutral-600 font-medium leading-relaxed font-sans whitespace-pre-wrap text-[11px]">
                        {selectedSeries.representativeProduct.description || "Tidak ada deskripsi detail untuk produk ini."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      {!modalIsDualPower ? (
                        <div className="space-y-1.5 text-left">
                          <span className="text-[10px] font-bold uppercase text-neutral-400 block font-display">Pilihan Ukuran SPH</span>
                          <div className="relative">
                            <select
                              value={selectedPowerL}
                              onChange={(e) => setSelectedPowerL(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg py-2.5 px-3 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 appearance-none"
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
                            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block font-display">Mata Kiri (Left)</span>
                            <div className="relative">
                              <select
                                value={selectedPowerL}
                                onChange={(e) => setSelectedPowerL(e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-lg py-2.5 px-3 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 appearance-none"
                              >
                                {powerOptions.map(pow => {
                                  const matchingVariant = selectedSeries.variants.find(
                                    v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === pow
                                  );
                                  const stockVal = matchingVariant?.stokBarang ?? 0;
                                  return (
                                    <option key={pow} value={pow}>
                                      L: {pow} {stockVal <= 0 ? '- [Stok Kosong]' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block font-display">Mata Kanan (Right)</span>
                            <div className="relative">
                              <select
                                value={selectedPowerR}
                                onChange={(e) => setSelectedPowerR(e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-lg py-2.5 px-3 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 appearance-none"
                              >
                                {powerOptions.map(pow => {
                                  const matchingVariant = selectedSeries.variants.find(
                                    v => v.color.toLowerCase() === modalColor.toLowerCase() && v.power === pow
                                  );
                                  const stockVal = matchingVariant?.stokBarang ?? 0;
                                  return (
                                    <option key={pow} value={pow}>
                                      R: {pow} {stockVal <= 0 ? '- [Stok Kosong]' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Description */}
                  {!selectedSeries.representativeProduct.notSoftlens && selectedSeries.representativeProduct.description && (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-[10px] text-left space-y-1 font-sans">
                      <span className="font-bold text-slate-800 uppercase block tracking-wider font-display">Deskripsi Seri</span>
                      <p className="text-neutral-600 leading-relaxed font-semibold whitespace-pre-wrap text-[11px] font-sans">{selectedSeries.representativeProduct.description}</p>
                    </div>
                  )}

                  {/* Quantity Row */}
                  <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-100 font-sans">
                    <div className="text-left font-sans">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 font-display">Jumlah Set</span>
                      <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-md py-0.5 px-2 w-max shadow-sm">
                        <button 
                          onClick={() => setBuyQty(p => Math.max(1, p - 1))}
                          className="text-sm font-black px-2 py-1 text-neutral-500 hover:text-slate-950 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-10 text-center text-slate-900">{buyQty}</span>
                        <button 
                          onClick={() => setBuyQty(p => p + 1)}
                          className="text-sm font-black px-2 py-1 text-neutral-500 hover:text-slate-950 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Status Stok Varian</span>
                      {activeStockStatus.available ? (
                        <div className="text-emerald-600 font-extrabold text-xs flex items-center gap-1 justify-end">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block" />
                          <span>Ready Stock</span>
                        </div>
                      ) : (
                        <div className="text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                          Stok Habis / Limit
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart CTA Checkout Action */}
                  <div className="pt-2 border-t border-neutral-100 space-y-3 font-sans">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase px-1">
                      <span>Total Bayar ({buyQty} Box):</span>
                      <span className="text-base font-black text-slate-950 font-sans">Rp {modalSubtotal.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!activeStockStatus.available}
                      className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
                        activeStockStatus.available 
                          ? 'bg-slate-950 text-white hover:bg-slate-900 shadow-slate-950/10' 
                          : 'bg-neutral-150 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Tambah ke Keranjang • Rp {modalSubtotal.toLocaleString()}</span>
                    </button>
                  </div>
                </div>

                {/* Product specific customer reviews section */}
                <div className="mt-6 border-t border-neutral-150 p-4 text-left font-sans">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider font-display">
                      Ulasan Pelanggan ({productReviews.length})
                    </h3>
                    {productReviews.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-slate-950">
                          {(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)}/5
                        </span>
                      </div>
                    )}
                  </div>

                  {productReviews.length === 0 ? (
                    <div className="text-center py-6 bg-neutral-50 rounded-xl border border-neutral-100/60 p-4 space-y-1">
                      <p className="text-xs text-neutral-500 font-bold">Belum ada ulasan untuk seri ini.</p>
                      <p className="text-[10px] text-neutral-400">Jadilah yang pertama untuk memberikan ulasan!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
                      {productReviews.map((review) => (
                        <div key={review.id} className="border-b border-neutral-100 pb-3 last:border-0 text-left font-sans font-medium">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-slate-900">{review.reviewerName}</span>
                            <span className="text-[9px] font-bold text-neutral-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-1.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-200'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-neutral-600 font-medium leading-relaxed">{review.comment}</p>
                          {review.photoUrl && (
                            <div 
                              className="mt-2 w-16 h-16 rounded-md overflow-hidden border border-neutral-100 bg-neutral-50 relative cursor-pointer"
                              onClick={() => setFullScreenImage({ urls: [review.photoUrl!], index: 0 })}
                            >
                              <img 
                                src={review.photoUrl} 
                                alt={`Ulasan dari ${review.reviewerName}`} 
                                width="64"
                                height="64"
                                loading="lazy"
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Form to Add a Review for this Product */}
                  <div className="mt-8 bg-neutral-50 border border-neutral-100/80 p-4 rounded-xl space-y-3 text-left">
                    <h4 className="text-[10px] font-extrabold text-slate-950 uppercase tracking-widest font-display">Tulis Ulasan Baru</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider block">Nama Anda</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Ranti"
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider block">Rating Bintang</label>
                        <select 
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950"
                        >
                          <option value={5}>🌟 5 Bintang</option>
                          <option value={4}>🌟 4 Bintang</option>
                          <option value={3}>🌟 3 Bintang</option>
                          <option value={2}>🌟 2 Bintang</option>
                          <option value={1}>🌟 1 Bintang</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider block">Tulis Ulasan Anda</label>
                      <textarea 
                        rows={2}
                        placeholder="Bagikan ulasan Anda mengenai warna dan kenyamanan lensa ini..."
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded p-2.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-bold text-neutral-400 uppercase tracking-wider block">Foto Ulasan (Opsional)</label>
                      {newReviewPhoto ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 bg-white shadow-xs group">
                          <img 
                            src={newReviewPhoto} 
                            alt="Preview ulasan" 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => setNewReviewPhoto('')}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-xs"
                            aria-label="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-lg p-3.5 cursor-pointer bg-white hover:border-slate-950 hover:bg-neutral-50 transition-all text-center">
                          <Camera className="w-4 h-4 text-neutral-400 mb-1" />
                          <span className="text-[9.5px] font-bold text-neutral-500">
                            {isCompressingPhoto ? "Memproses..." : "Ambil Foto / Upload"}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            disabled={isCompressingPhoto}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={!newReviewName.trim() || !newReviewComment.trim() || isCompressingPhoto}
                      className="w-full py-2 bg-slate-950 text-white hover:bg-slate-900 rounded font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kirim Ulasan
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
            <>
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
                            width="480"
                            height="600"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading={idx === 0 ? "eager" : "lazy"}
                            {...(idx === 0 ? { fetchPriority: "high" } as any : {})}
                          />
                        </a>
                      ) : (
                        <img 
                          src={slide.imageUrl} 
                          alt={`Promo Banner ${idx + 1}`} 
                          width="480"
                          height="600"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading={idx === 0 ? "eager" : "lazy"}
                          {...(idx === 0 ? { fetchPriority: "high" } as any : {})}
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
                    const imageSrc = series.computedMainImage || `https://picsum.photos/seed/${series.seriesName}/600/600`;
                    return (
                      <a 
                        key={index} 
                        href={`${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(series.seriesName)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedSeries(series);
                        }}
                        className="w-24 shrink-0 bg-neutral-50 p-1.5 border border-dashed border-neutral-200 rounded-md text-left cursor-pointer hover:border-neutral-400 hover:shadow-xs transition-all block text-neutral-900 leading-normal"
                      >
                        <div className="aspect-square bg-white rounded-md overflow-hidden relative mb-1">
                          <img src={imageSrc} alt={series.seriesName} width="96" height="96" loading="lazy" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleShare(series.seriesName);
                            }}
                            aria-label={`Salin Link Produk ${series.seriesName}`}
                            className="absolute top-1 left-1 p-1 bg-white/95 hover:bg-slate-900 hover:text-white text-neutral-700 rounded-full shadow-sm z-10 transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center border border-neutral-100"
                            title="Salin Link Produk"
                          >
                            <svg className="w-2.5 h-2.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </button>
                          <div className="absolute top-0 right-0 bg-slate-950 text-white text-[7px] font-bold px-1 rounded-bl">
                            -25%
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-neutral-800 line-clamp-1 block">{series.seriesName}</span>
                        <span className="text-[10px] font-extrabold text-slate-950 block">{getPriceRangeDisplay(series)}</span>
                      </a>
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
                  
                  const imageSrc = series.computedMainImage || `https://picsum.photos/seed/${series.seriesName}/600/600`;

                  return (
                    <a 
                      key={series.seriesName}
                      href={`${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(series.seriesName)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedSeries(series);
                      }}
                      className="group bg-white rounded-md overflow-hidden hover:shadow-md transition-all border border-neutral-100 relative cursor-pointer flex flex-col justify-between block text-neutral-900 leading-normal"
                    >
                      {/* Product square thumbnail */}
                      <div className="relative aspect-square bg-[#FAFAFA]">
                        <img 
                          src={imageSrc}
                          alt={series.seriesName}
                          width="220"
                          height="220"
                          loading="lazy"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />

                        {/* Copy/Share Link Alert Overlay Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShare(series.seriesName);
                          }}
                          aria-label={`Salin Link Produk ${series.seriesName}`}
                          className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-slate-900 hover:text-white text-neutral-700 rounded-full shadow-md z-10 transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center border border-neutral-100"
                          title="Salin Link Produk"
                        >
                          <svg className="w-3.2 h-3.2 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </button>

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
                            {series.seriesName}
                          </h4>

                          {/* Softlens parameters dot swatches block */}
                          <div className="flex items-center gap-1.5 my-1.5 justify-start">
                            <div className="flex items-center -space-x-1 shrink-0">
                              {series.colors.slice(0, 3).map(col => (
                                <span 
                                  key={col}
                                  className="w-2.5 h-2.5 rounded-full border border-white shadow-inner shrink-0 block"
                                  style={{ backgroundColor: getColorHex(col) }}
                                  title={col}
                                />
                              ))}
                            </div>
                            <span className="text-[8px] font-bold text-neutral-400 truncate">
                              {series.colors.length} Pilihan Warna
                            </span>
                          </div>
                        </div>

                        <div>

                          {/* Cosmetics Price Tag */}
                          <div className="flex items-center justify-between pt-1 border-t border-neutral-50">
                            <div className="flex flex-col text-left">
                              <span className="text-[7.5px] font-bold text-neutral-400 leading-none">HARGA BOX</span>
                              <span className="text-xs font-black text-slate-900">{getPriceRangeDisplay(series)}</span>
                            </div>
                            <span className="text-[8.5px] font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded tracking-tighter">
                              Beli
                            </span>
                          </div>
                        </div>

                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* BEST REVIEW */}
          <section className="p-2 mt-4 text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2 mb-3">BEST REVIEW</h3>
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const pinnedReviews = reviews.filter(r => r.isPinned);
                if (pinnedReviews.length > 0) {
                  return pinnedReviews.slice(0, 4);
                }
                // Fallback to highest rated reviews if none are pinned
                if (reviews.length > 0) {
                  return [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 4);
                }
                // Default fallback if database is empty/offline
                return [
                  { id: "r1", reviewerName: "Rara Amelia", rating: 5, comment: "Softlens paling nyaman yang pernah aku pakai! Gak gampang kering sama sekali.", photoUrl: "https://picsum.photos/seed/re1/300/300" },
                  { id: "r2", reviewerName: "Indah Permata", rating: 5, comment: "Warnanya natural banget di mata, kelihatan anggun dan mewah. Pengiriman cepat!", photoUrl: "https://picsum.photos/seed/re2/300/300" },
                  { id: "r3", reviewerName: "Siti Rahma", rating: 5, comment: "Sangat recommended untuk mata sensitif. Rapi dan dapat bonus case lucu.", photoUrl: "https://picsum.photos/seed/re3/300/300" },
                  { id: "r4", reviewerName: "Zahra A.", rating: 5, comment: "Zendiix softlens emang juara. Udah langganan beli di sini dan selalu puas.", photoUrl: "https://picsum.photos/seed/re4/300/300" }
                ];
              })().map((rev) => (
                <div key={rev.id} className="bg-white rounded-md overflow-hidden border border-neutral-100 flex flex-col justify-between">
                  <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                     {rev.photoUrl ? (
                       <img 
                         src={rev.photoUrl} 
                         alt={`Ulasan dari ${rev.reviewerName}`} 
                         width="150"
                         height="150"
                         loading="lazy"
                         className="w-full h-full object-cover"
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-neutral-400 text-[10px] font-bold">
                         Rating ⭐ {rev.rating}
                       </div>
                     )}
                  </div>
                  <div className="p-2 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[8px] font-black uppercase">
                          {rev.reviewerName.slice(0, 2)}
                        </div>
                        <span className="text-[9.5px] font-extrabold text-slate-800 truncate block max-w-[80px]">{rev.reviewerName}</span>
                      </div>
                      {rev.comment && (
                        <p className="text-[9.5px] text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>

                    {(() => {
                      const defaultProductId1 = groupedSeriesList[0]?.seriesName || "Zendiix Pearl";
                      const defaultProductId2 = groupedSeriesList[1]?.seriesName || groupedSeriesList[0]?.seriesName || "Aura";
                      const reviewProductId = (rev as any).productId || (rev.id === "r1" || rev.id === "r3" ? defaultProductId1 : defaultProductId2);
                      const foundSeries = groupedSeriesList.find(s => s.seriesName.trim().toLowerCase() === reviewProductId?.trim().toLowerCase());
                      
                      if (!foundSeries) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeries(foundSeries);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="mt-2.5 flex items-center gap-1 p-1 bg-neutral-50 hover:bg-neutral-100/90 active:scale-95 rounded text-[8.5px] font-bold text-slate-900 border border-neutral-100 transition-all max-w-full text-left truncate cursor-pointer font-sans"
                        >
                          <span className="text-neutral-400 shrink-0">Lensa:</span>
                          <span className="truncate flex-1 font-extrabold uppercase text-slate-800">{foundSeries.seriesName}</span>
                          <span className="text-slate-900 text-[7px] font-black shrink-0 px-1 py-0.2 bg-white rounded border border-neutral-200/60 shadow-3xs ml-1">LIHAT</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
            <button
               onClick={() => {
                window.history.pushState({}, "", "/customer/reviews");
                window.dispatchEvent(new PopStateEvent("popstate"));
               }}
               className="w-full mt-4 py-3 border-2 border-neutral-200 text-xs font-black uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2 hover:bg-neutral-50 transition-all"
            >
              Lihat Review Lainnya <ChevronRight className="w-4 h-4" />
            </button>
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
                    width="50"
                    height="16"
                    loading="lazy"
                    className="h-4 object-contain"
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" 
                    alt="BCA" 
                    width="50"
                    height="14"
                    loading="lazy"
                    className="h-3.5 object-contain"
                  />
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" 
                    alt="Mandiri" 
                    width="50"
                    height="14"
                    loading="lazy"
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
            </>
          )}

        </main>

        {/* 3. PERSISTENT SHOPEE-STYLE BOTTOM SHEETS VARIANT SELECTOR */}
        <AnimatePresence>
          {/* Disabled in favor of full inline page view detail route */}
          {false && selectedSeries && (() => {
            const stats = getSeriesStatistics(selectedSeries);
            const repProduct = selectedSeries.representativeProduct;
            const activeVariantByColor = selectedSeries.variants.find(
              v => v.color?.toLowerCase() === modalColor.toLowerCase() && v.product?.imageUrl
            );
            
            // If color is selected, show its variations (which includes color images + main images)
            // If no color selected, ONLY show main series images
            const displayImageUrls = (activeVariantByColor && activeVariantByColor.product?.imageUrl)
              ? splitImageUrls(activeVariantByColor.product.imageUrl)
              : selectedSeries.computedAllMainImages;
            
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
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 truncate uppercase font-display">{selectedSeries.seriesName} Series</h4>
                        <button
                          onClick={() => handleShare(selectedSeries.seriesName)}
                          className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                          title="Bagikan & Salin Link"
                        >
                          <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </button>
                      </div>
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
                              onClick={() => {
                                setModalColor(col);
                                setActiveImageIdx(0);
                              }}
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
                            ) : item.isDual ? (
                              <div className="text-[8.5px] text-neutral-500 font-bold mt-0.5 space-y-0.5">
                                <div>SPH Kiri (L): <span className="text-slate-900 font-black">{item.powerL}</span></div>
                                <div>SPH Kanan (R): <span className="text-slate-900 font-black">{item.powerR}</span></div>
                                <span className="inline-block bg-slate-900 text-white text-[7.5px] font-black px-1 py-0.2 rounded uppercase mt-0.5 tracking-wider">Beda SPH (2 Box)</span>
                              </div>
                            ) : (
                              <div className="text-[8.5px] text-neutral-400 font-bold mt-0.5">
                                SPH: {item.powerL} <span className="inline-block bg-neutral-100 text-neutral-500 text-[7px] font-black px-1 py-0.2 rounded uppercase ml-1">1 Box</span>
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

        {/* Limelight Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[200] select-none">
          <LimelightNav 
            items={frontendNavItems}
            activeIndex={currentActiveNavIndex}
            className="w-full h-[58px] bg-white border-t border-neutral-200 shadow-lg rounded-none justify-around px-2"
            limelightClassName="bg-slate-900 shadow-[0_50px_15px_rgba(15,23,42,0.8)] h-[4px] w-12"
            iconContainerClassName="p-3"
          />
        </div>

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

        {/* Global Copied/Share Notification Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 bg-neutral-900/95 backdrop-blur-sm text-white text-[11px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-2 border border-neutral-700 font-display"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};
