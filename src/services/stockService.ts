import { StockData, MarketIndex } from '../types/stock';
import { getOrGenerateStock } from '../data/mockStockData';

export interface SearchStockItem {
  symbol: string;
  name: string;
  floor: string;
  type: string;
}

const clientCache = new Map<string, { data: StockData; timestamp: number }>();
const CLIENT_CACHE_TTL = 30 * 1000; // 30 seconds client-side cache

/**
 * Fetch full real stock data from backend server connected to VNDirect FinInfo & DChart
 */
export async function fetchStockData(symbol: string): Promise<StockData> {
  const cleanSym = symbol.trim().toUpperCase();

  // Check client in-memory cache
  const cached = clientCache.get(cleanSym);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/market/stock/${cleanSym}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const realData: StockData = {
          ...json.data,
          isRealData: true,
          realDataSource: 'VNDIRECT FINFO & DCHART LIVE',
          lastUpdated: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        clientCache.set(cleanSym, { data: realData, timestamp: Date.now() });
        return realData;
      }
    }
  } catch (err) {
    console.warn(`[fetchStockData] Failed to fetch real data for ${cleanSym}, falling back:`, err);
  }

  // Graceful fallback to baseline procedurally generated stock data
  const fallback = getOrGenerateStock(cleanSym);
  fallback.isRealData = false;
  fallback.realDataSource = 'Dữ liệu Giả Lập / Dự Phòng (Offline Fallback)';
  fallback.lastUpdated = new Date().toLocaleTimeString('vi-VN');
  return fallback;
}

/**
 * Fetch live market indices (VN-INDEX, VN30, HNX)
 */
export async function fetchLiveMarketIndices(): Promise<MarketIndex[]> {
  try {
    const res = await fetch('/api/market/indices');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[fetchLiveMarketIndices] Failed to fetch live indices:', err);
  }

  // Fallback defaults
  return [
    {
      symbol: 'VNINDEX',
      name: 'VN-Index (Sở GD TP.HCM)',
      currentValue: 1285.5,
      change: 8.35,
      changePercent: 0.65,
      volume: 685400000,
      updatedTime: new Date().toLocaleDateString('vi-VN'),
    },
    {
      symbol: 'VN30',
      name: 'VN30 Index',
      currentValue: 1320.12,
      change: 11.2,
      changePercent: 0.86,
      volume: 312000000,
      updatedTime: new Date().toLocaleDateString('vi-VN'),
    },
    {
      symbol: 'HNX',
      name: 'HNX-Index',
      currentValue: 242.8,
      change: 1.45,
      changePercent: 0.6,
      volume: 78500000,
      updatedTime: new Date().toLocaleDateString('vi-VN'),
    },
  ];
}

/**
 * Search stocks across HOSE, HNX, UPCOM
 */
export async function searchStocksLive(query: string): Promise<SearchStockItem[]> {
  const cleanQ = query.trim().toUpperCase();
  if (!cleanQ) return [];

  try {
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // fallback
  }

  return [];
}
