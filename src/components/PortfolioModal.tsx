import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Layers,
  ArrowRight,
  BarChart2,
  CheckSquare,
  Square,
  HelpCircle,
  Award,
  ShieldCheck,
  Scale,
  Percent,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PortfolioItem, StockData } from '../types/stock';
import { getOrGenerateStock } from '../data/mockStockData';
import { searchStocksLive, SearchStockItem, fetchStockData } from '../services/stockService';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioItem[];
  onAddStock: (item: Omit<PortfolioItem, 'id'>) => void;
  onRemoveStock: (id: string) => void;
  onSelectStock: (symbol: string) => void;
  currentStock: StockData;
  onOpenCompare?: (selectedSymbols: string[]) => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  onAddStock,
  onRemoveStock,
  onSelectStock,
  currentStock,
  onOpenCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'compare'>('holdings');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState(currentStock.symbol);
  const [formPrice, setFormPrice] = useState(currentStock.currentPrice.toString());
  const [formQuantity, setFormQuantity] = useState('1000');
  const [formSearchResults, setFormSearchResults] = useState<SearchStockItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search autocomplete for adding ANY ticker
  React.useEffect(() => {
    const q = formSymbol.trim();
    if (q.length < 1) {
      setFormSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStocksLive(q);
        setFormSearchResults(results);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [formSymbol]);

  const handleSelectTicker = async (symbolToSelect: string) => {
    const sym = symbolToSelect.toUpperCase();
    setFormSymbol(sym);
    setFormSearchResults([]);
    try {
      const data = await fetchStockData(sym);
      setFormPrice(data.currentPrice.toString());
    } catch {
      const fb = getOrGenerateStock(sym);
      setFormPrice(fb.currentPrice.toString());
    }
  };

  // Selected symbols for comparison (defaults to all portfolio symbols or first 4)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    return portfolio.map((p) => p.symbol);
  });

  // Compare view mode: 'performance' | 'fundamentals'
  const [compareMetricMode, setCompareMetricMode] = useState<'performance' | 'fundamentals'>('performance');

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol.trim() || !formPrice || !formQuantity) return;

    const sym = formSymbol.trim().toUpperCase();
    let stockName = `Cổ phiếu ${sym}`;
    try {
      const live = await fetchStockData(sym);
      stockName = live.name || stockName;
    } catch {
      const stock = getOrGenerateStock(sym);
      stockName = stock.name;
    }

    onAddStock({
      symbol: sym,
      name: stockName,
      buyPrice: parseFloat(formPrice),
      quantity: parseInt(formQuantity, 10),
      buyDate: new Date().toISOString().split('T')[0],
    });

    if (!selectedSymbols.includes(sym)) {
      setSelectedSymbols((prev) => [...prev, sym]);
    }

    setShowAddForm(false);
  };

  const toggleSelectSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const selectAll = () => {
    setSelectedSymbols(portfolio.map((p) => p.symbol));
  };

  const deselectAll = () => {
    setSelectedSymbols([]);
  };

  // Calculate portfolio totals
  let totalCost = 0;
  let totalCurrentValue = 0;

  const enrichedItems = portfolio.map((item) => {
    const liveStock = getOrGenerateStock(item.symbol);
    const itemCost = item.buyPrice * item.quantity;
    const itemValue = liveStock.currentPrice * item.quantity;
    const pnl = itemValue - itemCost;
    const pnlPercent = itemCost > 0 ? (pnl / itemCost) * 100 : 0;

    totalCost += itemCost;
    totalCurrentValue += itemValue;

    // Estimate YTD return from 1Y history
    const history1Y = liveStock.history?.['1Y'] || [];
    let ytdReturn = liveStock.profitGrowth || 15.2;
    if (history1Y.length > 0) {
      const startPrice = history1Y[0].close;
      const endPrice = liveStock.currentPrice;
      if (startPrice > 0) {
        ytdReturn = parseFloat((((endPrice - startPrice) / startPrice) * 100).toFixed(1));
      }
    }

    return {
      ...item,
      currentPrice: liveStock.currentPrice,
      pe: liveStock.pe,
      roe: liveStock.roe,
      pb: liveStock.pb,
      eps: liveStock.eps,
      netMargin: liveStock.netMargin,
      dividendYield: liveStock.dividendYield,
      debtEquity: liveStock.debtEquity,
      itemCost,
      itemValue,
      pnl,
      pnlPercent,
      ytdReturn,
      sector: liveStock.sector || liveStock.industry,
      status: liveStock.valuation.status,
    };
  });

  const totalPnL = totalCurrentValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Filtered stocks for comparison tab
  const comparedStocks = enrichedItems.filter((item) => selectedSymbols.includes(item.symbol));

  // Max values for visual comparative meters
  const maxYtd = Math.max(...comparedStocks.map((s) => Math.abs(s.ytdReturn)), 25);
  const maxPnlPct = Math.max(...comparedStocks.map((s) => Math.abs(s.pnlPercent)), 20);
  const maxRoe = Math.max(...comparedStocks.map((s) => s.roe), 30);
  const maxPe = Math.max(...comparedStocks.map((s) => s.pe), 25);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Danh Mục & So Sánh Hiệu Suất Đầu Tư</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                  {portfolio.length} Mã
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quản lý các vị thế nắm giữ, so sánh hiệu suất lợi nhuận (YTD / PnL) và các chỉ số cơ bản quan trọng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Portfolio Summary Overview */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Navigation Tabs within Modal */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'holdings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Vị Thế Nắm Giữ ({enrichedItems.length})
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              So Sánh Danh Mục ({selectedSymbols.length}/{enrichedItems.length})
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Tổng vốn: </span>
              <span className="text-slate-200 font-bold">
                {totalCost.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div>
              <span className="text-slate-400">Lãi/Lỗ: </span>
              <span
                className={`font-bold ${
                  totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalPnL >= 0 ? '+' : ''}
                {totalPnLPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'holdings' ? (
            /* TAB 1: HOLDINGS LIST & ADD FORM */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">
                  Danh sách mã đang nắm giữ trong danh mục:
                </span>
                <div className="flex items-center gap-2">
                  {enrichedItems.length > 1 && (
                    <button
                      onClick={() => setActiveTab('compare')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      So Sánh Hiệu Suất ({enrichedItems.length} mã)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFormSymbol(currentStock.symbol);
                      setFormPrice(currentStock.currentPrice.toString());
                      setShowAddForm(!showAddForm);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm mã {currentStock.symbol}
                  </button>
                </div>
              </div>

              {/* Add Position Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddSubmit}
                  className="bg-slate-850/90 border border-slate-700/80 rounded-xl p-4 space-y-3 text-xs shadow-inner"
                >
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Thêm vị thế mới vào danh mục giả lập:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <label className="text-slate-400 block mb-1">Mã chứng khoán:</label>
                      <input
                        type="text"
                        placeholder="Gõ mã (SSI, DGC, CTR...)"
                        value={formSymbol}
                        onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                        required
                      />
                      {formSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                          {formSearchResults.map((item) => (
                            <div
                              key={item.symbol}
                              onClick={() => handleSelectTicker(item.symbol)}
                              className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs border-b border-slate-900 last:border-b-0"
                            >
                              <div>
                                <span className="font-bold text-emerald-400">{item.symbol}</span>
                                <span className="text-slate-400 ml-2">{item.name}</span>
                              </div>
                              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                                {item.floor}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Giá mua (VND/USD):</label>
                      <input
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Số lượng cổ phiếu:</label>
                      <input
                        type="number"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                    >
                      Xác nhận thêm
                    </button>
                  </div>
                </form>
              )}

              {/* Positions List */}
              {enrichedItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                  <Briefcase className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Chưa có mã chứng khoán nào trong danh mục giả lập.</p>
                  <p className="text-slate-500">Hãy nhấn nút 'Thêm mã' để bắt đầu theo dõi hiệu suất đầu tư!</p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 text-xs">
                  {enrichedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-850/50 hover:bg-slate-800/70 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            onSelectStock(item.symbol);
                            onClose();
                          }}
                          className="font-extrabold text-sm text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          {item.symbol}
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <div>
                          <div className="text-slate-200 font-semibold">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.quantity.toLocaleString('vi-VN')} CP @ {item.buyPrice.toLocaleString('vi-VN')} đ • Giá hiện tại:{' '}
                            <span className="text-slate-200">{item.currentPrice.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right font-mono">
                          <div className="text-slate-200 font-bold">
                            {item.itemValue.toLocaleString('vi-VN')} đ
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.pnl >= 0 ? '+' : ''}
                            {item.pnl.toLocaleString('vi-VN')} đ ({item.pnl >= 0 ? '+' : ''}
                            {item.pnlPercent.toFixed(1)}%)
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveStock(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Xóa khỏi danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: SO SÁNH DANH MỤC (PORTFOLIO COMPARISON) */
            <div className="space-y-5">
              {/* Filter / Multi-Select Bar */}
              <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <span>Chọn các mã trong danh mục để so sánh:</span>
                    <span className="text-slate-400 font-normal">
                      ({selectedSymbols.length}/{enrichedItems.length} mã đã chọn)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={selectAll}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={deselectAll}
                      className="text-slate-400 hover:underline"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Checkbox Chips for Each Portfolio Stock */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {enrichedItems.map((item) => {
                    const isSelected = selectedSymbols.includes(item.symbol);
                    return (
                      <button
                        key={item.symbol}
                        onClick={() => toggleSelectSymbol(item.symbol)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{item.symbol}</span>
                        <span
                          className={`text-[10px] font-mono ${
                            item.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({item.pnlPercent >= 0 ? '+' : ''}
                          {item.pnlPercent.toFixed(1)}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metric Focus Switcher (Performance vs Fundamentals) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg border border-slate-700/60 text-xs">
                  <button
                    onClick={() => setCompareMetricMode('performance')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                      compareMetricMode === 'performance'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Hiệu Suất Lợi Nhuận (YTD & PnL)
                  </button>
                  <button
                    onClick={() => setCompareMetricMode('fundamentals')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                      compareMetricMode === 'fundamentals'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Chỉ Số Cơ Bản (ROE, P/E, Margin)
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 hidden sm:block">
                  {comparedStocks.length} cổ phiếu đang được đối chiếu
                </div>
              </div>

              {comparedStocks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 border border-slate-800 rounded-xl">
                  Vui lòng chọn ít nhất 1 mã chứng khoán phía trên để xem bảng so sánh.
                </div>
              ) : compareMetricMode === 'performance' ? (
                /* 1. PERFORMANCE COMPARISON TABLE & METERS */
                <div className="space-y-4">
                  {/* Performance Comparison Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-850 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Mã Cổ Phiếu</th>
                            <th className="py-3 px-3 text-right">Giá Vốn</th>
                            <th className="py-3 px-3 text-right">Thị Giá Hiện Tại</th>
                            <th className="py-3 px-3 text-right text-indigo-300">
                              Lợi Nhuận YTD (%)
                            </th>
                            <th className="py-3 px-3 text-right text-emerald-300">
                              Lãi/Lỗ Vị Thế (%)
                            </th>
                            <th className="py-3 px-3 text-right">Giá Trị Nắm Giữ</th>
                            <th className="py-3 px-3 text-right">Tỷ Trọng NAV</th>
                            <th className="py-3 px-4 text-center">Đánh Giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {comparedStocks.map((item) => {
                            const weightPercent =
                              totalCurrentValue > 0
                                ? ((item.itemValue / totalCurrentValue) * 100).toFixed(1)
                                : '0.0';

                            return (
                              <tr
                                key={item.symbol}
                                className="bg-slate-900/40 hover:bg-slate-850/60 text-slate-300 transition-colors"
                              >
                                <td className="py-3 px-4 font-sans">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        onSelectStock(item.symbol);
                                        onClose();
                                      }}
                                      className="font-black text-sm text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      {item.symbol}
                                    </button>
                                    <div className="truncate max-w-[140px] text-xs text-slate-300">
                                      {item.name}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-right text-slate-400">
                                  {item.buyPrice.toLocaleString('vi-VN')} đ
                                </td>

                                <td className="py-3 px-3 text-right font-bold text-white">
                                  {item.currentPrice.toLocaleString('vi-VN')} đ
                                </td>

                                {/* YTD Return */}
                                <td
                                  className={`py-3 px-3 text-right font-black ${
                                    item.ytdReturn >= 0 ? 'text-indigo-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.ytdReturn >= 0 ? '+' : ''}
                                  {item.ytdReturn}%
                                </td>

                                {/* Position PnL */}
                                <td
                                  className={`py-3 px-3 text-right font-black ${
                                    item.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.pnlPercent >= 0 ? '+' : ''}
                                  {item.pnlPercent.toFixed(1)}%
                                </td>

                                <td className="py-3 px-3 text-right text-slate-200 font-bold">
                                  {item.itemValue.toLocaleString('vi-VN')} đ
                                </td>

                                <td className="py-3 px-3 text-right font-semibold text-slate-300">
                                  {weightPercent}%
                                </td>

                                <td className="py-3 px-4 text-center font-sans">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      item.pnlPercent >= 15
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                    : item.pnlPercent >= 0
                                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                    }`}
                                  >
                                    {item.pnlPercent >= 15
                                      ? 'Siêu lợi nhuận'
                                      : item.pnlPercent >= 0
                                      ? 'Có lãi'
                                      : 'Đang lỗ'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Visual Bar Comparison for YTD & PnL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* YTD Return Bars */}
                    <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                          So Sánh Hiệu Suất Từ Đầu Năm (YTD Return)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Cao hơn là tốt hơn</span>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        {comparedStocks.map((item) => {
                          const pct = Math.min(100, Math.max(5, (Math.abs(item.ytdReturn) / maxYtd) * 100));

                          return (
                            <div key={item.symbol} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-200">{item.symbol}</span>
                                <span
                                  className={`font-mono font-bold ${
                                    item.ytdReturn >= 0 ? 'text-indigo-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.ytdReturn >= 0 ? '+' : ''}
                                  {item.ytdReturn}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    item.ytdReturn >= 0 ? 'bg-indigo-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Position PnL Return Bars */}
                    <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-emerald-400" />
                          Lãi / Lỗ Tạm Tính Theo Vị Thế Nắm Giữ
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Dựa trên giá mua</span>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        {comparedStocks.map((item) => {
                          const pct = Math.min(100, Math.max(5, (Math.abs(item.pnlPercent) / maxPnlPct) * 100));

                          return (
                            <div key={item.symbol} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-200">{item.symbol}</span>
                                <span
                                  className={`font-mono font-bold ${
                                    item.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.pnlPercent >= 0 ? '+' : ''}
                                  {item.pnlPercent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    item.pnlPercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 2. FUNDAMENTAL METRICS COMPARISON TABLE & METERS */
                <div className="space-y-4">
                  <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-850 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Mã Cổ Phiếu</th>
                            <th className="py-3 px-3 text-right text-emerald-300">ROE (%)</th>
                            <th className="py-3 px-3 text-right text-cyan-300">P/E (lần)</th>
                            <th className="py-3 px-3 text-right text-indigo-300">Biên Ròng (%)</th>
                            <th className="py-3 px-3 text-right">P/B (lần)</th>
                            <th className="py-3 px-3 text-right">Cổ Tức (%)</th>
                            <th className="py-3 px-3 text-right">Nợ D/E</th>
                            <th className="py-3 px-4 text-center">Trạng Thái Định Giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {comparedStocks.map((item) => (
                            <tr
                              key={item.symbol}
                              className="bg-slate-900/40 hover:bg-slate-850/60 text-slate-300 transition-colors"
                            >
                              <td className="py-3 px-4 font-sans">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      onSelectStock(item.symbol);
                                      onClose();
                                    }}
                                    className="font-black text-sm text-cyan-400 hover:underline cursor-pointer"
                                  >
                                    {item.symbol}
                                  </button>
                                  <div className="truncate max-w-[140px] text-xs text-slate-300">
                                    {item.name}
                                  </div>
                                </div>
                              </td>

                              {/* ROE */}
                              <td
                                className={`py-3 px-3 text-right font-black ${
                                  item.roe >= 20 ? 'text-emerald-400' : 'text-slate-200'
                                }`}
                              >
                                {item.roe}%
                              </td>

                              {/* P/E */}
                              <td className="py-3 px-3 text-right font-black text-cyan-400">
                                {item.pe}x
                              </td>

                              {/* Net Margin */}
                              <td className="py-3 px-3 text-right font-bold text-indigo-300">
                                {item.netMargin}%
                              </td>

                              {/* P/B */}
                              <td className="py-3 px-3 text-right text-slate-300">
                                {item.pb}x
                              </td>

                              {/* Dividend Yield */}
                              <td className="py-3 px-3 text-right font-bold text-emerald-400">
                                {item.dividendYield}%
                              </td>

                              {/* Debt / Equity */}
                              <td
                                className={`py-3 px-3 text-right ${
                                  item.debtEquity <= 1.0 ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {item.debtEquity}x
                              </td>

                              {/* Valuation Status */}
                              <td className="py-3 px-4 text-center font-sans">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.status.includes('Dưới')
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                      : item.status.includes('hợp lý')
                                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Visual Bar Comparison for Fundamentals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ROE Bars */}
                    <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-400" />
                          So Sánh Tỷ Suất Sinh Lời ROE (%)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Hiệu quả sử dụng vốn</span>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        {comparedStocks.map((item) => {
                          const pct = Math.min(100, Math.max(5, (item.roe / maxRoe) * 100));

                          return (
                            <div key={item.symbol} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-200">{item.symbol}</span>
                                <span className="font-mono text-emerald-400 font-bold">{item.roe}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* P/E Bars */}
                    <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-cyan-400" />
                          So Sánh Hệ Số Định Giá P/E (lần)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Thấp hơn là rẻ hơn</span>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        {comparedStocks.map((item) => {
                          const pct = Math.min(100, Math.max(5, (item.pe / maxPe) * 100));

                          return (
                            <div key={item.symbol} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-200">{item.symbol}</span>
                                <span className="font-mono text-cyan-400 font-bold">{item.pe}x</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
