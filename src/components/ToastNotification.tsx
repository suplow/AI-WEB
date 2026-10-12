import React from 'react';
import {
  BellRing,
  TrendingUp,
  TrendingDown,
  X,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PriceAlert } from '../types/stock';

export interface ToastAlertItem {
  id: string;
  alert: PriceAlert;
  currentPrice: number;
  timeStr: string;
}

interface ToastNotificationProps {
  toasts: ToastAlertItem[];
  onDismiss: (id: string) => void;
  onViewStock: (symbol: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
  onViewStock,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((item) => {
        const { alert, currentPrice, timeStr } = item;
        const isAbove = alert.condition === 'ABOVE';
        const isUS = alert.symbol === 'AAPL' || alert.symbol === 'NVDA' || alert.symbol === 'TSLA';
        const formatMoney = (val: number) => {
          if (isUS) return `$${val.toLocaleString('en-US')}`;
          return `${val.toLocaleString('vi-VN')} đ`;
        };

        return (
          <div
            key={item.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 backdrop-blur-md ${
              isAbove
                ? 'bg-emerald-950/95 border-emerald-500/80 text-white shadow-emerald-950/50'
                : 'bg-rose-950/95 border-rose-500/80 text-white shadow-rose-950/50'
            }`}
          >
            {/* Header: Badge & Close */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1.5 rounded-lg text-white ${
                    isAbove ? 'bg-emerald-600 animate-bounce' : 'bg-rose-600 animate-bounce'
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  {isAbove ? 'Khớp Mục Tiêu Tăng Giá' : 'Khớp Ngưỡng Cảnh Báo Giảm'}
                </span>
              </div>
              <button
                onClick={() => onDismiss(item.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Alert Content */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    {alert.symbol}
                  </span>
                  <span className="text-xs text-slate-300 truncate max-w-[140px]">
                    {alert.stockName}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-bold ${
                    isAbove ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isAbove ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatMoney(currentPrice)}</span>
                </div>
              </div>

              <div className="text-xs text-slate-200 leading-snug">
                Thị giá đã {isAbove ? 'chạm hoặc vượt' : 'rơi xuống dưới'} mức giá mục tiêu{' '}
                <strong className="text-white underline font-mono">
                  {formatMoney(alert.targetPrice)}
                </strong>
                {alert.note && <span className="block italic text-[11px] text-slate-300 mt-0.5">"{alert.note}"</span>}
              </div>

              {/* Action row */}
              <div className="pt-2 flex items-center justify-between border-t border-white/15 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" /> {timeStr}
                </span>
                <button
                  onClick={() => {
                    onViewStock(alert.symbol);
                    onDismiss(item.id);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-md transition-colors"
                >
                  <span>Xem phân tích {alert.symbol}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
