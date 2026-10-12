import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Share2,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Award,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { StockData } from '../types/stock';
import { SECTOR_GROUPS } from '../data/sectors';
import { searchStocksLive, SearchStockItem } from '../services/stockService';

interface StockHeaderProps {
  stock: StockData;
  onSelectSymbol: (symbol: string) => void;
  onRefresh: () => void;
  isAiLoading: boolean;
  isStockLoading?: boolean;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
  onOpenAiAdviceTab: () => void;
  onOpenDecisionTab?: () => void;
  onOpenAlertModal?: () => void;
  activeAlertsCount?: number;
}

const POPULAR_SYMBOLS = [
  { symbol: 'FPT', label: 'FPT (Công nghệ - Chuyển đổi số)' },
  { symbol: 'HPG', label: 'Hòa Phát (Thép xây dựng)' },
  { symbol: 'VNM', label: 'Vinamilk (Sữa & Tiêu dùng)' },
  { symbol: 'VCB', label: 'Vietcombank (Ngân hàng số 1)' },
  { symbol: 'MWG', label: 'Thế Giới Di Động (Bán lẻ)' },
  { symbol: 'TCB', label: 'Techcombank (Ngân hàng TMCP)' },
  { symbol: 'SSI', label: 'Chứng khoán SSI' },
  { symbol: 'DGC', label: 'Hóa chất Đức Giang' },
  { symbol: 'CTR', label: 'Viettel Construction' },
  { symbol: 'PVS', label: 'Dầu khí PTSC' },
  { symbol: 'KDH', label: 'Nhà Khang Điền' },
  { symbol: 'REE', label: 'Cơ Điện Lạnh REE' },
];

export const StockHeader: React.FC<StockHeaderProps> = ({
  stock,
  onSelectSymbol,
  onRefresh,
  isAiLoading,
  isInWatchlist,
  onToggleWatchlist,
  onOpenAiAdviceTab,
  onOpenDecisionTab,
  onOpenAlertModal,
  activeAlertsCount,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<SearchStockItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search on live stock universe
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 1) {
      setLiveSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStocksLive(q);
        setLiveSearchResults(results);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
      setShowDropdown(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const isPositive = stock.change >= 0;
  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const currencySymbol = isUS ? '$' : 'đ';

  const formatPrice = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Calculate day range progress
  const dayRangeSpread = stock.dayHigh - stock.dayLow;
  const dayProgress =
    dayRangeSpread > 0
      ? Math.min(100, Math.max(0, ((stock.currentPrice - stock.dayLow) / dayRangeSpread) * 100))
      : 50;

  // Calculate 52-week range progress
  const week52Spread = stock.week52High - stock.week52Low;
  const week52Progress =
    week52Spread > 0
      ? Math.min(100, Math.max(0, ((stock.currentPrice - stock.week52Low) / week52Spread) * 100))
      : 50;

  // Find peer stocks in the same sector
  const currentSector = SECTOR_GROUPS.find((sec) =>
    sec.stocks.some((s) => s.symbol.toUpperCase() === stock.symbol.toUpperCase())
  );
  const peerStocks = currentSector
    ? currentSector.stocks
        .filter((s) => s.symbol.toUpperCase() !== stock.symbol.toUpperCase())
        .slice(0, 5)
    : [];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-5">
      {/* Top Bar: Search & Quick Pickers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập mã chứng khoán (FPT, HPG, VCB, NVDA...)"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-24 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded text-white transition-colors"
              >
                Phân tích
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-700/50">
              <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/80 flex items-center justify-between">
                <span>
                  {liveSearchResults.length > 0
                    ? `Kết quả tìm kiếm trực tiếp (${liveSearchResults.length})`
                    : 'Mã nổi bật trên thị trường'}
                </span>
                {isSearching && (
                  <span className="text-[11px] text-emerald-400 animate-pulse font-normal lowercase">
                    đang tìm...
                  </span>
                )}
              </div>
              {searchInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSymbol(searchInput.trim().toUpperCase());
                    setSearchInput('');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 font-bold border-b border-slate-700/60 flex items-center justify-between text-xs transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Tải dữ liệu thật cho mã "{searchInput.trim().toUpperCase()}" (HOSE / HNX / UPCOM)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-mono shadow-xs">
                    Nhấn Enter ↵
                  </span>
                </button>
              )}
              <div className="max-h-60 overflow-y-auto">
                {liveSearchResults.length > 0 ? (
                  liveSearchResults.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        onSelectSymbol(item.symbol);
                        setSearchInput('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/70 flex items-center justify-between transition-colors text-sm border-b border-slate-700/30 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{item.symbol}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                          {item.floor}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 truncate max-w-[200px] sm:max-w-xs text-right">
                        {item.name}
                      </span>
                    </button>
                  ))
                ) : (
                  POPULAR_SYMBOLS.filter(
                    (s) =>
                      !searchInput ||
                      s.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
                      s.label.toLowerCase().includes(searchInput.toLowerCase())
                  ).map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        onSelectSymbol(item.symbol);
                        setSearchInput('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/70 flex items-center justify-between transition-colors text-sm"
                    >
                      <span className="font-bold text-emerald-400">{item.symbol}</span>
                      <span className="text-xs text-slate-300">{item.label}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="p-2 bg-slate-900/80 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 border-t border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hỗ trợ tra cứu & tải dữ liệu thật cho hơn 1.600 mã niêm yết trên HOSE, HNX, UPCoM
              </div>
            </div>
          )}
        </div>

        {/* Popular Ticker Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Top theo dõi:
          </span>
          {POPULAR_SYMBOLS.slice(0, 6).map((item) => (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors shrink-0 ${
                stock.symbol === item.symbol
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {item.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
        {/* Left: Symbol, Name, Exchange, Sector */}
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{stock.symbol}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
              {stock.exchange}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded">
              {stock.sector}
            </span>
            {stock.isRealData !== false ? (
              <span
                className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/80 shadow-sm"
                title="Dữ liệu giá khớp, khối lượng và BCTC kết nối trực tiếp từ sàn qua VNDirect FinInfo"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                VNDIRECT FINFO LIVE
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Dữ liệu dự phòng
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-emerald-400/90 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Thị trường mở cửa
            </span>
          </div>
          <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 inline" />
            {stock.name}
            <span className="text-slate-400 text-xs">| {stock.industry}</span>
          </p>

          {/* Quick peer comparison in the same industry */}
          {peerStocks.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-xs flex-wrap">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                Cùng ngành ({currentSector?.shortName}):
              </span>
              {peerStocks.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => onSelectSymbol(p.symbol)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 transition-colors"
                  title={`${p.name} - ${p.subIndustry}`}
                >
                  {p.symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Live Price, Change, Day Range */}
        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
          <div>
            <div className="text-3xl font-black tracking-tight text-white">
              {formatPrice(stock.currentPrice)}
            </div>
            <div
              className={`flex items-center gap-1.5 text-sm font-bold mt-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {stock.change.toLocaleString('vi-VN')} {currencySymbol} ({isPositive ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Day Range Mini Meter */}
          <div className="w-36 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Thấp: {formatPrice(stock.dayLow)}</span>
              <span>Cao: {formatPrice(stock.dayHigh)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${dayProgress}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-center text-slate-400">Biên độ trong ngày</div>
          </div>

          {/* 52-Week Range Mini Meter */}
          <div className="w-36 text-xs text-slate-400 space-y-1 hidden sm:block">
            <div className="flex justify-between text-[11px]">
              <span>52T Thấp: {formatPrice(stock.week52Low)}</span>
              <span>Cao: {formatPrice(stock.week52High)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${week52Progress}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-center text-slate-400">Biên độ 52 tuần</div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleWatchlist}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isInWatchlist
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isInWatchlist ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                Đã theo dõi
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-slate-400" />
                Lưu vào danh mục
              </>
            )}
          </button>

          {onOpenAlertModal && (
            <button
              onClick={onOpenAlertModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/90 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold rounded-lg shadow-sm transition-all"
              title="Đặt cảnh báo giá mục tiêu & chuông thông báo"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Cảnh báo giá</span>
              {typeof activeAlertsCount === 'number' && activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-bold">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenDecisionTab}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
            title="Xem Khung Quyết Định Đầu Tư & Chấm Điểm 100đ"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Điểm 100đ: {stock.scorecard?.totalScore ?? 80}</span>
          </button>

          <button
            onClick={onOpenAiAdviceTab}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            Khuyến nghị AI
          </button>

          <button
            onClick={onRefresh}
            title="Làm mới dữ liệu"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            title="Chia sẻ liên kết"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors relative"
          >
            <Share2 className="w-4 h-4" />
            {copySuccess && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded shadow">
                Đã sao chép!
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
