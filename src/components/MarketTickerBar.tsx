import React from 'react';
import {
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MarketIndex, StockData } from '../types/stock';

interface MarketTickerBarProps {
  indices: MarketIndex[];
  currentStock: StockData;
  isLoading: boolean;
  onRefreshCurrentStock: () => void;
  onSelectSymbol: (symbol: string) => void;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({
  indices,
  currentStock,
  isLoading,
  onRefreshCurrentStock,
  onSelectSymbol,
}) => {
  const isReal = currentStock.isRealData !== false;

  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 lg:px-8 py-2 text-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Market Indices Ticker */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white">Thị trường:</span>
          </div>

          {indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800/80 shrink-0"
              >
                <span className="font-bold text-slate-300">{idx.symbol}</span>
                <span className="font-mono font-bold text-white">
                  {idx.currentValue.toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isUp ? '+' : ''}
                  {idx.change.toFixed(2)} ({isUp ? '+' : ''}
                  {idx.changePercent.toFixed(2)}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Data Connection Status & Quick Refresh */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              {isReal ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold text-emerald-400 text-[11px]">
                    DỮ LIỆU THẬT
                  </span>
                  <span className="text-slate-500 text-[10px]">|</span>
                  <span className="text-slate-300 text-[11px] hidden sm:inline">
                    VNDIRECT FINFO & DCHART LIVE
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-amber-400 text-[11px]">
                    DỮ LIỆU DỰ PHÒNG
                  </span>
                </>
              )}
            </div>

            {currentStock.lastUpdated && (
              <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Sync: {currentStock.lastUpdated}</span>
              </div>
            )}
          </div>

          <button
            onClick={onRefreshCurrentStock}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-md text-[11px] font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Tải lại dữ liệu giá khớp và BCTC mới nhất từ sàn giao dịch"
          >
            <RefreshCw
              className={`w-3 h-3 text-emerald-400 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới realtime'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
