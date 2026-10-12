import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Building2,
  Landmark,
  Cpu,
  Hammer,
  LineChart,
  ShoppingBag,
  FlaskConical,
  Globe,
  Layers,
  ArrowRight,
  TrendingUp,
  Search,
  Check,
} from 'lucide-react';
import { SECTOR_GROUPS, SectorItem } from '../data/sectors';
import { getOrGenerateStock } from '../data/mockStockData';

interface SectorDropdownProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const SectorDropdown: React.FC<SectorDropdownProps> = ({
  currentSymbol,
  onSelectSymbol,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectorId, setActiveSectorId] = useState<string>('banking');
  const [sectorSearch, setSectorSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect current stock's sector
  useEffect(() => {
    for (const sec of SECTOR_GROUPS) {
      if (sec.stocks.some((s) => s.symbol.toUpperCase() === currentSymbol.toUpperCase())) {
        setActiveSectorId(sec.id);
        break;
      }
    }
  }, [currentSymbol]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Landmark':
        return <Landmark className="w-4 h-4" />;
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4" />;
      case 'Hammer':
        return <Hammer className="w-4 h-4" />;
      case 'LineChart':
        return <LineChart className="w-4 h-4" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4" />;
      case 'FlaskConical':
        return <FlaskConical className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const selectedSector =
    SECTOR_GROUPS.find((s) => s.id === activeSectorId) || SECTOR_GROUPS[0];

  // Filter stocks in selected sector or all sectors if search is typed
  const displayedStocks = sectorSearch.trim()
    ? SECTOR_GROUPS.flatMap((sec) =>
        sec.stocks
          .filter(
            (st) =>
              st.symbol.toLowerCase().includes(sectorSearch.toLowerCase()) ||
              st.name.toLowerCase().includes(sectorSearch.toLowerCase()) ||
              sec.name.toLowerCase().includes(sectorSearch.toLowerCase())
          )
          .map((st) => ({ ...st, sectorName: sec.name }))
      )
    : selectedSector.stocks.map((st) => ({ ...st, sectorName: selectedSector.name }));

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all shadow-sm ${
          isOpen
            ? 'bg-slate-800 border-emerald-500 text-white ring-2 ring-emerald-500/20'
            : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-200'
        }`}
      >
        <Layers className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Lọc theo Ngành:</span>
        <span className="font-bold text-emerald-400">{selectedSector.shortName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Rich Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-[92vw] sm:w-[620px] max-w-[640px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header of Dropdown */}
          <div className="p-3.5 bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-white">Khám Phá Nhóm Cổ Phiếu Theo Ngành</div>
                <div className="text-[11px] text-slate-400">
                  Chọn ngành để xem các mã cổ phiếu tiêu biểu cùng phân khúc
                </div>
              </div>
            </div>

            {/* Quick Search inside Sector Menu */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã hoặc ngành..."
                value={sectorSearch}
                onChange={(e) => setSectorSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Two-Column Grid: Sectors List on Left, Constituent Stocks on Right */}
          <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[340px] max-h-[460px]">
            {/* Left: Sectors List (5 cols) */}
            <div className="sm:col-span-5 bg-slate-950/60 p-2 overflow-y-auto border-r border-slate-800 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Các nhóm ngành chính ({SECTOR_GROUPS.length})
              </div>
              {SECTOR_GROUPS.map((sec) => {
                const isSelected = sec.id === selectedSector.id && !sectorSearch.trim();
                const hasCurrentStock = sec.stocks.some(
                  (s) => s.symbol.toUpperCase() === currentSymbol.toUpperCase()
                );

                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSectorId(sec.id);
                      setSectorSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {getSectorIcon(sec.icon)}
                      </span>
                      <div className="truncate">
                        <div className="font-bold truncate flex items-center gap-1.5">
                          {sec.name}
                          {hasCurrentStock && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sec.stocks.length} mã • P/E ~{sec.averagePE}x
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Right: Stocks in Selected Sector (7 cols) */}
            <div className="sm:col-span-7 p-3 bg-slate-900 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Sector Description Box */}
                {!sectorSearch.trim() && (
                  <div className="p-2.5 bg-slate-850/80 rounded-xl border border-slate-800 mb-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-white mb-0.5">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        {getSectorIcon(selectedSector.icon)}
                        Ngành {selectedSector.name}
                      </span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        ROE ~{selectedSector.averageROE}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedSector.description}
                    </p>
                  </div>
                )}

                {/* Stocks Grid */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 px-1 mb-1">
                    {sectorSearch.trim()
                      ? `Kết quả tìm kiếm (${displayedStocks.length} mã):`
                      : `Các mã cổ phiếu trong ngành (${displayedStocks.length}):`}
                  </div>

                  {displayedStocks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Không tìm thấy mã nào phù hợp từ khóa.
                    </div>
                  ) : (
                    displayedStocks.map((st) => {
                      const stockInfo = getOrGenerateStock(st.symbol);
                      const isCurrent =
                        st.symbol.toUpperCase() === currentSymbol.toUpperCase();

                      return (
                        <button
                          key={st.symbol}
                          onClick={() => {
                            onSelectSymbol(st.symbol);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                            isCurrent
                              ? 'bg-emerald-950/50 border-emerald-500/50 text-white'
                              : 'bg-slate-850/60 hover:bg-slate-800 border-slate-800/80 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-sm text-emerald-400 group-hover:text-emerald-300">
                              {st.symbol}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                                {st.name}
                                {isCurrent && (
                                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                    Đang xem
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {st.subIndustry}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <div className="text-xs font-bold font-mono text-white">
                                {stockInfo.exchange === 'NASDAQ'
                                  ? `$${stockInfo.currentPrice}`
                                  : `${stockInfo.currentPrice.toLocaleString('vi-VN')} đ`}
                              </div>
                              <div
                                className={`text-[10px] font-bold ${
                                  stockInfo.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {stockInfo.change >= 0 ? '+' : ''}
                                {stockInfo.changePercent.toFixed(2)}%
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom hint */}
              <div className="pt-3 mt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                Bấm vào mã bất kỳ để tải biểu đồ & khuyến nghị AI ngay lập tức
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
