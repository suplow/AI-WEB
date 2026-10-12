import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  X,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Layers,
} from 'lucide-react';
import { PriceAlert, StockData, AlertCondition } from '../types/stock';
import { getOrGenerateStock } from '../data/mockStockData';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock: StockData;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onDeleteAlert: (id: string) => void;
  onTriggerTestAlert: (alertId: string) => void;
  onSelectStock: (symbol: string) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  currentStock,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onTriggerTestAlert,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [symbol, setSymbol] = useState(currentStock.symbol);
  const [targetPrice, setTargetPrice] = useState(
    Math.round(currentStock.currentPrice * 1.05).toString()
  );
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [note, setNote] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const targetStock = getOrGenerateStock(symbol);
  const isUS = targetStock.exchange === 'NASDAQ' || targetStock.exchange === 'NYSE';
  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Quick preset helper
  const applyPreset = (multiplier: number, cond: AlertCondition, defaultNote: string) => {
    const calculated = Math.round(targetStock.currentPrice * multiplier);
    setTargetPrice(calculated.toString());
    setCondition(cond);
    setNote(defaultNote);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (!symbol.trim() || isNaN(priceNum) || priceNum <= 0) return;

    onAddAlert({
      symbol: symbol.toUpperCase().trim(),
      stockName: targetStock.name,
      targetPrice: priceNum,
      condition,
      initialPrice: targetStock.currentPrice,
      note: note.trim() || undefined,
      soundEnabled,
    });

    setActiveTab('list');
    setNote('');
  };

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hệ Thống Giám Sát Cảnh Báo Giá Tự Động</h2>
              <p className="text-xs text-slate-400">
                Đặt mức giá mục tiêu và nhận thông báo Toast thời gian thực khi thị giá khớp ngưỡng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 text-xs font-bold gap-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Đặt cảnh báo mới
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'list'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Danh sách cảnh báo ({alerts.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Stock Symbol Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Mã chứng khoán:
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => {
                      const newSym = e.target.value.toUpperCase();
                      setSymbol(newSym);
                      const s = getOrGenerateStock(newSym);
                      setTargetPrice(Math.round(s.currentPrice * 1.05).toString());
                    }}
                    placeholder="VD: FPT, HPG, VCB..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {targetStock.name} ({targetStock.exchange})
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Thị giá hiện tại:
                  </label>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm flex items-center justify-between">
                    <span>{formatMoney(targetStock.currentPrice)}</span>
                    <span
                      className={`text-xs ${
                        targetStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {targetStock.change >= 0 ? '+' : ''}
                      {targetStock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Condition (Above or Below) */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Điều kiện kích hoạt cảnh báo:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCondition('ABOVE')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                      condition === 'ABOVE'
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Giá Tăng Vượt Ngưỡng (&ge;)</div>
                      <div className="text-[10px] text-slate-400">Chốt lời / Đạt mục tiêu kỳ vọng</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('BELOW')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                      condition === 'BELOW'
                        ? 'bg-rose-950/80 border-rose-500/80 text-white ring-1 ring-rose-500'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Giá Giảm Thủng Ngưỡng (&le;)</div>
                      <div className="text-[10px] text-slate-400">Bắt đáy hỗ trợ / Quản trị cắt lỗ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Price input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    Mức giá mục tiêu ({isUS ? 'USD' : 'VND'}):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Khoảng cách: {(((parseFloat(targetPrice || '0') - targetStock.currentPrice) / targetStock.currentPrice) * 100).toFixed(1)}% so với thị giá
                  </span>
                </div>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Nhập giá mục tiêu..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Quick Presets Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Gợi ý mốc cảnh báo nhanh:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(1.05, 'ABOVE', 'Chốt lời ngắn hạn T+ (+5%)')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-semibold"
                  >
                    +5% (Chốt lời ngắn)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1.1, 'ABOVE', 'Đạt mục tiêu trung hạn (+10%)')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-semibold"
                  >
                    +10% (Mục tiêu kỳ vọng)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(0.95, 'BELOW', 'Kiểm tra vùng hỗ trợ (-5%)')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-semibold"
                  >
                    -5% (Thăm dò hỗ trợ)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(0.93, 'BELOW', 'Chạm điểm cắt lỗ kỷ luật (-7%)')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-rose-300 font-semibold"
                  >
                    -7% (Cắt lỗ chuẩn CFA)
                  </button>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Ghi chú nhắc nhở (tùy chọn):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Chốt lời 50% khối lượng, Nâng chặn lãi..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-slate-300 font-medium">Phát âm thanh chuông khi khớp giá (Chime alert)</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Kích hoạt cảnh báo
                </button>
              </div>
            </form>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Cảnh báo đang hoạt động ({activeAlerts.length}):</span>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm cảnh báo mới
                </button>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                  <div>Chưa có cảnh báo nào đang hoạt động.</div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs inline-block"
                  >
                    Tạo cảnh báo đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeAlerts.map((alt) => {
                    const st = getOrGenerateStock(alt.symbol);
                    const isAbove = alt.condition === 'ABOVE';
                    const diffPct = (
                      ((alt.targetPrice - st.currentPrice) / st.currentPrice) *
                      100
                    ).toFixed(1);

                    return (
                      <div
                        key={alt.id}
                        className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              onSelectStock(alt.symbol);
                              onClose();
                            }}
                            className="text-emerald-400 font-black text-sm hover:underline"
                          >
                            {alt.symbol}
                          </button>
                          <div>
                            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                              <span>Mục tiêu: {formatMoney(alt.targetPrice)}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isAbove
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {isAbove ? 'Giá tăng ≥' : 'Giá giảm ≤'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Thị giá: {formatMoney(st.currentPrice)} • Cách đích:{' '}
                              <strong className={Number(diffPct) > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                {Number(diffPct) > 0 ? `+${diffPct}%` : `${diffPct}%`}
                              </strong>
                              {alt.note && <span className="ml-1 text-slate-300 italic">("{alt.note}")</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onTriggerTestAlert(alt.id)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-700 text-slate-200 hover:text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Mô phỏng khớp giá để test Toast notification ngay"
                          >
                            <Play className="w-3 h-3" />
                            <span className="hidden sm:inline">Test Khớp</span>
                          </button>
                          <button
                            onClick={() => onDeleteAlert(alt.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Xóa cảnh báo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Triggered History */}
              {triggeredAlerts.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-slate-400 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Lịch sử các cảnh báo đã khớp ({triggeredAlerts.length}):
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {triggeredAlerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">{alt.symbol}</span>
                          <span className="text-slate-400">
                            Khớp mức {formatMoney(alt.targetPrice)}
                          </span>
                          {alt.triggeredAt && (
                            <span className="text-slate-500 font-mono">({alt.triggeredAt})</span>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteAlert(alt.id)}
                          className="text-slate-600 hover:text-rose-400 text-xs"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
