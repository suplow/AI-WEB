import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  PieChart,
  Calculator,
  Scale,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
  Coins,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  DollarSign,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  PortfolioItem,
  StockData,
  PortfolioCapitalSettings,
  AllocationStrategy,
  PositionSizingCalculation,
  RebalanceRecommendation,
} from '../types/stock';
import { searchStocksLive, SearchStockItem, fetchStockData } from '../services/stockService';
import { getOrGenerateStock } from '../data/mockStockData';

interface PortfolioCapitalAllocationProps {
  portfolio: PortfolioItem[];
  onAddStock: (item: Omit<PortfolioItem, 'id'>) => void;
  onRemoveStock: (id: string) => void;
  onSelectStock: (symbol: string) => void;
  currentStock: StockData;
  onClose?: () => void;
}

const STRATEGY_DESCRIPTIONS: Record<
  AllocationStrategy,
  {
    name: string;
    badge: string;
    cashPercent: number;
    description: string;
    suitability: string;
    rules: string[];
  }
> = {
  CONSERVATIVE: {
    name: 'Chiến Lược Phòng Thủ / Tích Sản',
    badge: 'An toàn cao',
    cashPercent: 35,
    description:
      'Ưu tiên bảo toàn vốn và dòng tiền cổ tức đều đặn. 35% tiền mặt dự phòng, 45% cổ phiếu trụ VN30/cổ tức cao, 20% cổ phiếu tăng trưởng bền vững.',
    suitability: 'Phù hợp nhà đầu tư bận rộn, tích sản dài hạn (>2 năm), không muốn chịu áp lực biến động thị trường.',
    rules: [
      'Duy trì tối thiểu 30-35% tiền mặt/trái phiếu gửi tiết kiệm',
      'Tập trung các mã ROE > 15%, P/E < 15, cổ tức tiền mặt đều đặn (FPT, VCB, VNM)',
      'Không vượt quá 20% NAV cho bất kỳ 1 mã cổ phiếu nào',
    ],
  },
  BALANCED: {
    name: 'Chiến Lược Cân Bằng (Core & Satellite)',
    badge: 'Khuyến nghị CFA',
    cashPercent: 20,
    description:
      'Mô hình chuẩn mực của các quỹ đầu tư lớn: 20% Tiền mặt, 55% Cổ phiếu Lõi chất lượng cao (Core), 25% Cổ phiếu Vệ tinh bứt phá theo chu kỳ (Satellite).',
    suitability: 'Phù hợp với đa số nhà đầu tư tìm kiếm tăng trưởng 18-25%/năm kèm kiểm soát rủi ro bài bản.',
    rules: [
      'Nhóm Lõi (Core): Nắm giữ dài hạn 2-3 mã đầu ngành tăng trưởng ổn định',
      'Nhóm Vệ tinh (Satellite): Tận dụng sóng chu kỳ ngành (Thép, Bán lẻ, Chứng khoán)',
      'Chặn lỗ nghiêm ngặt không quá -7% đến -8% cho phần cổ phiếu vệ tinh',
    ],
  },
  AGGRESSIVE: {
    name: 'Chiến Lược Tăng Trưởng Năng Động',
    badge: 'Lợi nhuận cao',
    cashPercent: 10,
    description:
      'Tối ưu hóa hiệu suất vốn trong chu kỳ kinh tế thuận lợi. 10% tiền mặt, 65% cổ phiếu Midcap tăng trưởng lợi nhuận bùng nổ, 25% giao dịch theo đà kỹ thuật.',
    suitability: 'Dành cho nhà đầu tư bám sát bảng điện, có kiến thức phân tích kỹ thuật và kỷ luật cắt lỗ thép.',
    rules: [
      'Ưu tiên cổ phiếu có EPS tăng trưởng >25% và có tín hiệu dòng tiền lớn xác nhận',
      'Tuân thủ tuyệt đối quy tắc cắt lỗ 2% NAV cho mỗi giao dịch',
      'Tái cân bằng và hạ tỷ trọng nhanh chóng khi VN-Index gãy đường hỗ trợ MA50',
    ],
  },
  BARBELL: {
    name: 'Chiến Lược Quả Tạ (Barbell Strategy)',
    badge: 'Nassim Taleb',
    cashPercent: 50,
    description:
      'Phương pháp quản trị rủi ro nổi tiếng của Nassim Nicholas Taleb: 50% tiền mặt/tài sản siêu an toàn + 50% đầu tư chọn lọc vào cơ hội có tiềm năng tăng giá bằng lần, không để vốn ở vùng rủi ro trung bình.',
    suitability: 'Dành cho giai đoạn thị trường biến động khó đoán hoặc tạo đáy vĩ mô phức tạp.',
    rules: [
      '50% tiền mặt giúp sống sót qua mọi cú sập thiên nga đen',
      '50% cổ phiếu nhắm vào các doanh nghiệp phục hồi mạnh mẽ sau khủng hoảng',
      'Biên an toàn cực lớn khi giải ngân',
    ],
  },
  CUSTOM: {
    name: 'Chiến Lược Tùy Chỉnh Cá Nhân',
    badge: 'Tự do',
    cashPercent: 20,
    description: 'Tự do phân bổ tỷ trọng tiền mặt và từng mã cổ phiếu theo kinh nghiệm và mục tiêu tài chính riêng của bạn.',
    suitability: 'Dành cho nhà đầu tư muốn tự chủ hoàn toàn cấu trúc danh mục.',
    rules: ['Khuyến nghị không tập trung quá 35% danh mục vào một mã bất kỳ'],
  },
};

const DEFAULT_SETTINGS: PortfolioCapitalSettings = {
  totalCapital: 200000000, // 200 triệu VNĐ mặc định
  cashReserve: 40000000,   // 40 triệu VNĐ tiền mặt
  strategy: 'BALANCED',
  maxRiskPerTradePercent: 1.5, // Tối đa mất 1.5% NAV cho 1 lệnh
  maxSectorConcentration: 30, // Tối đa 30% cho 1 ngành
  targetAllocations: {
    FPT: 30,
    HPG: 25,
    VNM: 25,
  },
};

export const PortfolioCapitalAllocation: React.FC<PortfolioCapitalAllocationProps> = ({
  portfolio,
  onAddStock,
  onRemoveStock,
  onSelectStock,
  currentStock,
}) => {
  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'allocation' | 'holdings' | 'calculator' | 'rebalance'>('allocation');

  // Capital Settings State (persisted in localStorage)
  const [settings, setSettings] = useState<PortfolioCapitalSettings>(() => {
    try {
      const saved = localStorage.getItem('vnstock_portfolio_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('vnstock_portfolio_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Live prices dictionary for portfolio items
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; name: string; sector: string }>>({});
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Load real prices for all portfolio stocks
  useEffect(() => {
    let isMounted = true;
    const fetchAllPrices = async () => {
      setIsUpdatingPrices(true);
      const newPrices: Record<string, { price: number; name: string; sector: string }> = {};

      for (const item of portfolio) {
        try {
          const data = await fetchStockData(item.symbol);
          newPrices[item.symbol] = {
            price: data.currentPrice,
            name: data.name,
            sector: data.sector || 'Doanh nghiệp niêm yết',
          };
        } catch {
          const fallback = getOrGenerateStock(item.symbol);
          newPrices[item.symbol] = {
            price: fallback.currentPrice,
            name: fallback.name,
            sector: fallback.sector || 'Doanh nghiệp niêm yết',
          };
        }
      }

      if (isMounted) {
        setLivePrices(newPrices);
        setIsUpdatingPrices(false);
      }
    };

    if (portfolio.length > 0) {
      fetchAllPrices();
    }
    return () => {
      isMounted = false;
    };
  }, [portfolio]);

  // -------------------------------------------------------------
  // CALCULATIONS: Portfolio Stats & Capital Allocation
  // -------------------------------------------------------------
  const portfolioValuation = useMemo(() => {
    let totalStockValue = 0;
    let totalInvestedCost = 0;

    const enriched = portfolio.map((item) => {
      const live = livePrices[item.symbol] || {
        price: item.buyPrice,
        name: item.name,
        sector: 'Chưa phân loại',
      };
      const curPrice = live.price || item.buyPrice;
      const curValue = curPrice * item.quantity;
      const costValue = item.buyPrice * item.quantity;
      const pnl = curValue - costValue;
      const pnlPercent = costValue > 0 ? (pnl / costValue) * 100 : 0;

      totalStockValue += curValue;
      totalInvestedCost += costValue;

      return {
        ...item,
        currentPrice: curPrice,
        currentValue: curValue,
        costValue,
        pnl,
        pnlPercent,
        sector: live.sector,
        name: live.name || item.name,
      };
    });

    const totalPortfolioValue = totalStockValue + (settings.cashReserve || 0);
    const overallPnL = totalStockValue - totalInvestedCost;
    const overallPnLPercent = totalInvestedCost > 0 ? (overallPnL / totalInvestedCost) * 100 : 0;

    // Weight by Stock
    const enrichedWithWeights = enriched.map((item) => ({
      ...item,
      actualWeight: totalPortfolioValue > 0 ? (item.currentValue / totalPortfolioValue) * 100 : 0,
      stockWeight: totalStockValue > 0 ? (item.currentValue / totalStockValue) * 100 : 0,
    }));

    // Weight by Sector
    const sectorWeights: Record<string, { value: number; percent: number; stocks: string[] }> = {};
    for (const item of enrichedWithWeights) {
      const sec = item.sector || 'Khác';
      if (!sectorWeights[sec]) {
        sectorWeights[sec] = { value: 0, percent: 0, stocks: [] };
      }
      sectorWeights[sec].value += item.currentValue;
      sectorWeights[sec].stocks.push(item.symbol);
    }
    for (const sec in sectorWeights) {
      sectorWeights[sec].percent =
        totalPortfolioValue > 0 ? (sectorWeights[sec].value / totalPortfolioValue) * 100 : 0;
    }

    const cashWeight = totalPortfolioValue > 0 ? (settings.cashReserve / totalPortfolioValue) * 100 : 0;
    const stockWeightTotal = totalPortfolioValue > 0 ? (totalStockValue / totalPortfolioValue) * 100 : 0;

    return {
      enrichedItems: enrichedWithWeights,
      totalStockValue,
      totalInvestedCost,
      totalPortfolioValue,
      overallPnL,
      overallPnLPercent,
      sectorWeights,
      cashWeight,
      stockWeightTotal,
    };
  }, [portfolio, livePrices, settings.cashReserve]);

  // -------------------------------------------------------------
  // POSITION SIZING CALCULATOR STATE
  // -------------------------------------------------------------
  const [calcSymbol, setCalcSymbol] = useState<string>(currentStock.symbol);
  const [calcPrice, setCalcPrice] = useState<number>(currentStock.currentPrice);
  const [calcStopLoss, setCalcStopLoss] = useState<number>(Math.round(currentStock.currentPrice * 0.93));
  const [calcTargetPrice, setCalcTargetPrice] = useState<number>(Math.round(currentStock.currentPrice * 1.15));
  const [calcRiskPct, setCalcRiskPct] = useState<number>(settings.maxRiskPerTradePercent || 1.5);

  // Sync calculator when current stock changes
  useEffect(() => {
    setCalcSymbol(currentStock.symbol);
    setCalcPrice(currentStock.currentPrice);
    setCalcStopLoss(Math.round(currentStock.currentPrice * 0.93));
    setCalcTargetPrice(Math.round(currentStock.currentPrice * 1.15));
  }, [currentStock.symbol, currentStock.currentPrice]);

  // Run Position Sizing Math
  const sizingResult: PositionSizingCalculation = useMemo(() => {
    const nav = portfolioValuation.totalPortfolioValue || settings.totalCapital || 200000000;
    const maxLossAmount = (nav * calcRiskPct) / 100;
    const riskPerShare = Math.max(1, calcPrice - calcStopLoss);
    const rawShares = riskPerShare > 0 ? maxLossAmount / riskPerShare : 0;
    // Round down to standard lot 100 (HOSE / HNX rule)
    const recommendedShares = Math.max(100, Math.floor(rawShares / 100) * 100);
    const totalInvestmentValue = recommendedShares * calcPrice;
    const portfolioWeightPercent = nav > 0 ? (totalInvestmentValue / nav) * 100 : 0;

    const potentialGainPerShare = calcTargetPrice - calcPrice;
    const rrRatio =
      riskPerShare > 0
        ? `1 : ${(potentialGainPerShare / riskPerShare).toFixed(1)}`
        : 'N/A';

    const warnings: string[] = [];
    if (portfolioWeightPercent > (settings.maxSectorConcentration || 30)) {
      warnings.push(
        `Cảnh báo tỷ trọng: Lệnh này chiếm ${portfolioWeightPercent.toFixed(1)}% NAV, vượt quá ngưỡng an toàn khuyến nghị (${settings.maxSectorConcentration}%).`
      );
    }
    if (totalInvestmentValue > settings.cashReserve) {
      warnings.push(
        `Số dư tiền mặt khả dụng (${settings.cashReserve.toLocaleString('vi-VN')} đ) không đủ để giải ngân toàn bộ lệnh (${totalInvestmentValue.toLocaleString('vi-VN')} đ).`
      );
    }
    if (calcStopLoss >= calcPrice) {
      warnings.push('Mức giá cắt lỗ phải thấp hơn giá mua dự kiến.');
    }

    return {
      symbol: calcSymbol,
      stockName: currentStock.name,
      currentPrice: calcPrice,
      plannedBuyPrice: calcPrice,
      stopLossPrice: calcStopLoss,
      targetPrice: calcTargetPrice,
      riskPercentOfNav: calcRiskPct,
      riskPerShare,
      maxLossAmount: Math.round(maxLossAmount),
      recommendedShares,
      totalInvestmentValue,
      portfolioWeightPercent: Math.round(portfolioWeightPercent * 10) / 10,
      riskRewardRatio: rrRatio,
      warningNotes: warnings,
    };
  }, [
    calcSymbol,
    calcPrice,
    calcStopLoss,
    calcTargetPrice,
    calcRiskPct,
    portfolioValuation.totalPortfolioValue,
    settings.totalCapital,
    settings.cashReserve,
    settings.maxSectorConcentration,
    currentStock.name,
  ]);

  // -------------------------------------------------------------
  // REBALANCE RECOMMENDATIONS
  // -------------------------------------------------------------
  const rebalanceRecommendations: RebalanceRecommendation[] = useMemo(() => {
    const totalNav = portfolioValuation.totalPortfolioValue;
    if (totalNav <= 0) return [];

    const targetMap = settings.targetAllocations || {};
    const recs: RebalanceRecommendation[] = [];

    portfolioValuation.enrichedItems.forEach((item) => {
      const targetPct = targetMap[item.symbol] ?? (100 / Math.max(1, portfolio.length));
      const currentPct = item.actualWeight;
      const diffPct = currentPct - targetPct;
      const diffAmount = (Math.abs(diffPct) / 100) * totalNav;
      const shareDiff = Math.round(diffAmount / item.currentPrice / 100) * 100;

      if (Math.abs(diffPct) >= 3.0) {
        recs.push({
          symbol: item.symbol,
          stockName: item.name,
          currentValue: item.currentValue,
          currentWeight: Math.round(currentPct * 10) / 10,
          targetWeight: Math.round(targetPct * 10) / 10,
          diffWeight: Math.round(diffPct * 10) / 10,
          diffAmount: Math.round(diffAmount),
          actionType: diffPct > 0 ? 'SELL' : 'BUY',
          recommendedShares: shareDiff,
          urgency: Math.abs(diffPct) >= 8.0 ? 'HIGH' : 'MEDIUM',
          reason:
            diffPct > 0
              ? `Tỷ trọng vượt mục tiêu ${diffPct.toFixed(1)}% do tăng giá. Nên chốt lời bớt để bảo toàn thành quả và đưa danh mục về cân bằng.`
              : `Tỷ trọng đang thấp hơn mục tiêu ${Math.abs(diffPct).toFixed(1)}%. Có thể gom thêm quanh vùng hỗ trợ để tối ưu tỷ trọng chiến lược.`,
        });
      }
    });

    return recs;
  }, [portfolioValuation, settings.targetAllocations, portfolio.length]);

  // -------------------------------------------------------------
  // ADD STOCK MODAL / FORM STATE (SUPPORT ANY TICKER ON HOSE/HNX/UPCOM)
  // -------------------------------------------------------------
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('1000');
  const [formSearchResults, setFormSearchResults] = useState<SearchStockItem[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [isFetchingStockQuote, setIsFetchingStockQuote] = useState(false);

  // Search autocomplete for adding ANY ticker
  useEffect(() => {
    const q = formSymbol.trim();
    if (q.length < 1) {
      setFormSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearchingStock(true);
      try {
        const results = await searchStocksLive(q);
        setFormSearchResults(results);
      } catch {
        // ignore
      } finally {
        setIsSearchingStock(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [formSymbol]);

  // When a ticker is selected or typed, fetch its live price to autofill form
  const handleSelectTickerToAdd = async (symbolToSelect: string) => {
    const sym = symbolToSelect.toUpperCase();
    setFormSymbol(sym);
    setFormSearchResults([]);
    setIsFetchingStockQuote(true);
    try {
      const data = await fetchStockData(sym);
      setFormPrice(data.currentPrice.toString());
    } catch {
      const fb = getOrGenerateStock(sym);
      setFormPrice(fb.currentPrice.toString());
    } finally {
      setIsFetchingStockQuote(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol.trim() || !formPrice || !formQuantity) return;

    const sym = formSymbol.trim().toUpperCase();
    const buyPrice = parseFloat(formPrice);
    const quantity = parseInt(formQuantity, 10);

    onAddStock({
      symbol: sym,
      name: livePrices[sym]?.name || `Cổ phiếu ${sym}`,
      buyPrice,
      quantity,
      buyDate: new Date().toISOString().split('T')[0],
    });

    // Reset form
    setFormSymbol('');
    setFormPrice('');
    setFormQuantity('1000');
    setShowAddForm(false);
  };

  // Preset Capital Buttons
  const setPresetCapital = (amt: number) => {
    const strat = STRATEGY_DESCRIPTIONS[settings.strategy];
    const cash = Math.round((amt * strat.cashPercent) / 100);
    setSettings((prev) => ({
      ...prev,
      totalCapital: amt,
      cashReserve: cash,
    }));
  };

  const handleStrategyChange = (newStrategy: AllocationStrategy) => {
    const strat = STRATEGY_DESCRIPTIONS[newStrategy];
    const newCash = Math.round((settings.totalCapital * strat.cashPercent) / 100);
    setSettings((prev) => ({
      ...prev,
      strategy: newStrategy,
      cashReserve: newCash,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Portfolio NAV & Capital Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Quản Trị Vốn & Danh Mục Đầu Tư Chuẩn CFA
              </span>
              <span className="text-xs text-slate-400">
                • {STRATEGY_DESCRIPTIONS[settings.strategy].name}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Tổng Tài Sản Ròng (NAV):{' '}
              <span className="text-emerald-400 font-mono">
                {portfolioValuation.totalPortfolioValue.toLocaleString('vi-VN')} đ
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Cấu trúc phân bổ vốn bảo vệ tài sản, ngăn ngừa cháy tài khoản với quy tắc 2% rủi ro và giới hạn nồng độ ngành.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Giá trị Cổ phiếu</span>
              <span className="text-sm font-bold text-white font-mono">
                {portfolioValuation.totalStockValue.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                {portfolioValuation.stockWeightTotal.toFixed(1)}% NAV
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Tiền mặt Dự phòng</span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                {settings.cashReserve.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[10px] text-amber-400/80 block mt-0.5">
                {portfolioValuation.cashWeight.toFixed(1)}% NAV
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Lãi / Lỗ Danh Mục</span>
              <div
                className={`text-sm font-bold font-mono flex items-center gap-1 ${
                  portfolioValuation.overallPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {portfolioValuation.overallPnL >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {portfolioValuation.overallPnL >= 0 ? '+' : ''}
                {portfolioValuation.overallPnL.toLocaleString('vi-VN')} đ
              </div>
              <span
                className={`text-[10px] font-bold block mt-0.5 ${
                  portfolioValuation.overallPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {portfolioValuation.overallPnL >= 0 ? '+' : ''}
                {portfolioValuation.overallPnLPercent.toFixed(2)}%
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Số Mã Nắm Giữ</span>
              <span className="text-sm font-bold text-indigo-300 font-mono">
                {portfolio.length} Mã
              </span>
              <span className="text-[10px] text-indigo-400 block mt-0.5">
                {Object.keys(portfolioValuation.sectorWeights).length} Nhóm Ngành
              </span>
            </div>
          </div>
        </div>

        {/* Visual Allocation Bar (Cash vs Stocks) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-slate-300 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-emerald-400" />
              Thanh Tỷ Trọng Vốn Hiện Tại:
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Cổ phiếu: {portfolioValuation.stockWeightTotal.toFixed(1)}% | Tiền mặt:{' '}
              {portfolioValuation.cashWeight.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            {portfolioValuation.enrichedItems.map((item, idx) => {
              const colors = [
                'bg-emerald-500',
                'bg-blue-500',
                'bg-indigo-500',
                'bg-purple-500',
                'bg-amber-500',
                'bg-cyan-500',
                'bg-teal-500',
              ];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={item.id}
                  style={{ width: `${item.actualWeight}%` }}
                  className={`${color} h-full transition-all duration-300 relative group`}
                  title={`${item.symbol}: ${item.actualWeight.toFixed(1)}% (${item.currentValue.toLocaleString('vi-VN')} đ)`}
                />
              );
            })}
            <div
              style={{ width: `${portfolioValuation.cashWeight}%` }}
              className="bg-amber-400/80 h-full transition-all duration-300"
              title={`Tiền mặt: ${portfolioValuation.cashWeight.toFixed(1)}% (${settings.cashReserve.toLocaleString('vi-VN')} đ)`}
            />
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
            {portfolioValuation.enrichedItems.map((item, idx) => {
              const colors = [
                'bg-emerald-500',
                'bg-blue-500',
                'bg-indigo-500',
                'bg-purple-500',
                'bg-amber-500',
                'bg-cyan-500',
                'bg-teal-500',
              ];
              const dotColor = colors[idx % colors.length];
              return (
                <div key={item.id} className="flex items-center gap-1 text-slate-300 font-mono">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="font-bold text-white">{item.symbol}:</span>{' '}
                  {item.actualWeight.toFixed(1)}%
                </div>
              );
            })}
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="font-bold text-amber-300">Tiền mặt:</span>{' '}
              {portfolioValuation.cashWeight.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('allocation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'allocation'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Phân Bổ Vốn & Chiến Lược
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'calculator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Máy Tính Khối Lượng Lệnh (Quy Tắc 2%)
        </button>

        <button
          onClick={() => setActiveTab('holdings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'holdings'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Sổ Vị Thế & Thêm Mã Mới ({portfolio.length})
        </button>

        <button
          onClick={() => setActiveTab('rebalance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'rebalance'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Tái Cân Bằng Danh Mục
          {rebalanceRecommendations.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHÂN BỔ VỐN & CHIẾN LƯỢC ĐẦU TƯ */}
      {/* ========================================================================= */}
      {activeTab === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Strategy Selection & Capital Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Capital Size Customizer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Thiết Lập Quy Mô Vốn Đầu Tư (NAV)
                </h3>
                <span className="text-xs text-slate-400">Điều chỉnh số vốn bạn dự định giải ngân</span>
              </div>

              {/* Capital Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[50000000, 100000000, 200000000, 500000000, 1000000000, 2000000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPresetCapital(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      settings.totalCapital === amt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                    }`}
                  >
                    {amt >= 1000000000 ? `${amt / 1000000000} Tỷ` : `${amt / 1000000} Triệu`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tổng Vốn Đầu Tư (VND):
                  </label>
                  <input
                    type="number"
                    value={settings.totalCapital}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        totalCapital: Math.max(10000000, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Số Dư Tiền Mặt Dự Phòng (VND):
                  </label>
                  <input
                    type="number"
                    value={settings.cashReserve}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        cashReserve: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono font-bold text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Strategic Models Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Mô Hình Chiến Lược Phân Bổ Vốn
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chọn chiến lược tương ứng với khẩu vị rủi ro và khung thời gian đầu tư của bạn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(STRATEGY_DESCRIPTIONS) as AllocationStrategy[]).map((stratKey) => {
                  const s = STRATEGY_DESCRIPTIONS[stratKey];
                  const isSelected = settings.strategy === stratKey;
                  return (
                    <div
                      key={stratKey}
                      onClick={() => handleStrategyChange(stratKey)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {s.name}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {s.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                        <span>Tiền mặt khuyến nghị:</span>
                        <span className="font-bold text-amber-400 font-mono">{s.cashPercent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Strategy Deep-dive Guide */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
                  <Info className="w-4 h-4" />
                  Nguyên Tắc Vàng Khi Thực Thi {STRATEGY_DESCRIPTIONS[settings.strategy].name}:
                </div>
                <p className="text-xs text-slate-300 mb-3 italic">
                  "{STRATEGY_DESCRIPTIONS[settings.strategy].suitability}"
                </p>
                <div className="space-y-1.5">
                  {STRATEGY_DESCRIPTIONS[settings.strategy].rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sector & Concentration Risk Radar */}
          <div className="space-y-6">
            {/* Sector Concentration Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Kiểm Soát Nồng Độ Ngành
                </h3>
                <span className="text-[11px] text-slate-400">Trần: 30% NAV</span>
              </div>
              <p className="text-xs text-slate-400">
                Không để quá 30% NAV vào một nhóm ngành để tránh rủi ro sụt giảm dây chuyền khi ngành gặp khó khăn vĩ mô.
              </p>

              <div className="space-y-3">
                {Object.keys(portfolioValuation.sectorWeights).length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center">
                    Chưa có cổ phiếu nào trong danh mục
                  </div>
                ) : (
                  Object.entries(portfolioValuation.sectorWeights).map(([sector, data]) => {
                    const isExceeded = data.percent > (settings.maxSectorConcentration || 30);
                    return (
                      <div key={sector} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-200">{sector}</span>
                          <span
                            className={`font-mono font-bold ${
                              isExceeded ? 'text-rose-400 flex items-center gap-1' : 'text-slate-300'
                            }`}
                          >
                            {isExceeded && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            {data.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, data.percent)}%` }}
                            className={`h-full ${
                              isExceeded ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        {isExceeded && (
                          <span className="text-[10px] text-rose-400 block">
                            Cảnh báo: Tỷ trọng ngành vượt trần khuyến nghị 30%.
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CFA Risk Management Golden Rules */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                3 Quy Tắc Sống Còn Của Quỹ Đầu Tư
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-0.5">
                    1. Quy tắc 2% Rủi ro (2% Rule - Alexander Elder)
                  </span>
                  Không bao giờ để 1 lệnh cắt lỗ làm bốc hơi quá 2% tổng tài sản ròng NAV.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                  <span className="font-bold text-indigo-400 block mb-0.5">
                    2. Tỷ lệ Lợi Nhuận / Rủi Ro (R:R &gt;= 2:1)
                  </span>
                  Chỉ mở vị thế khi tiềm năng lợi nhuận tối thiểu gấp đôi khoảng giá cắt lỗ.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-0.5">
                    3. Luôn Giữ Tiền Mặt Dự Phòng
                  </span>
                  Cơ hội tuyệt vời nhất luôn xuất hiện trong những phiên thị trường hoảng loạn. Người có tiền mặt là người chiến thắng.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MÁY TÍNH KHỐI LƯỢNG MUA TỐI ƯU (POSITION SIZING & 2% RULE) */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase mb-1">
              <Calculator className="w-4 h-4" />
              Công Cụ Định Lượng Quản Trị Rủi Ro Cấp Tổ Chức
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Máy Tính Quy Mô Lệnh Tối Ưu (Optimal Position Sizing Calculator)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tính toán chính xác số lượng cổ phiếu cần mua (làm tròn lô 100 theo HOSE/HNX) dựa trên mức giá cắt lỗ và tỷ lệ chấp nhận rủi ro trên NAV. Tuyệt đối không mua theo cảm tính!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Inputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Thông Số Kế Hoạch Giao Dịch
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mã Cổ Phiếu Dự Kiến Mua:
                  </label>
                  <input
                    type="text"
                    value={calcSymbol}
                    onChange={(e) => setCalcSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giá Dự Kiến Mua (VND):
                  </label>
                  <input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => {
                      const p = Number(e.target.value) || 0;
                      setCalcPrice(p);
                      setCalcStopLoss(Math.round(p * 0.93));
                      setCalcTargetPrice(Math.round(p * 1.15));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mức Giá Cắt Lỗ (Stop Loss - VND):
                  </label>
                  <input
                    type="number"
                    value={calcStopLoss}
                    onChange={(e) => setCalcStopLoss(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-rose-500/50 rounded-xl px-3.5 py-2.5 text-rose-300 font-mono font-bold text-sm focus:border-rose-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-rose-400 block mt-1">
                    Khoảng lỗ: -{calcPrice > 0 ? (((calcPrice - calcStopLoss) / calcPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mục Tiêu Chốt Lời (Take Profit - VND):
                  </label>
                  <input
                    type="number"
                    value={calcTargetPrice}
                    onChange={(e) => setCalcTargetPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono font-bold text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-emerald-400 block mt-1">
                    Mục tiêu lãi: +{calcPrice > 0 ? (((calcTargetPrice - calcPrice) / calcPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Risk Tolerance Slider */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">
                    Mức Chấp Nhận Rủi Ro Tối Đa Trên NAV:
                  </span>
                  <span className="font-mono font-bold text-amber-400">{calcRiskPct}% NAV</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={calcRiskPct}
                  onChange={(e) => setCalcRiskPct(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5% (Siêu an toàn)</span>
                  <span>1.5% (Cân bằng chuẩn)</span>
                  <span>2.0% (Trần Elder)</span>
                  <span>4.0% (Rất cao)</span>
                </div>
              </div>
            </div>

            {/* Right Output: Results Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Kết Quả Tính Toán Tối Ưu
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Tỷ lệ R:R = {sizingResult.riskRewardRatio}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Big Recommended Quantity */}
                  <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/30">
                    <span className="text-xs text-indigo-300 block mb-1">
                      Số lượng cổ phiếu khuyến nghị nên mua (Lô 100):
                    </span>
                    <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
                      {sizingResult.recommendedShares.toLocaleString('vi-VN')}
                      <span className="text-sm font-normal text-slate-400">cổ phiếu</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Tổng số tiền mua</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {sizingResult.totalInvestmentValue.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Tỷ trọng trong NAV</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          sizingResult.portfolioWeightPercent > 30
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {sizingResult.portfolioWeightPercent}% NAV
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Mức lỗ tối đa nếu dính Stop Loss</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        -{sizingResult.maxLossAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Mức lãi tiềm năng tại Target</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        +
                        {(
                          (calcTargetPrice - calcPrice) *
                          sizingResult.recommendedShares
                        ).toLocaleString('vi-VN')}{' '}
                        đ
                      </span>
                    </div>
                  </div>

                  {/* Warning Messages if any */}
                  {sizingResult.warningNotes.length > 0 && (
                    <div className="space-y-1 pt-2">
                      {sizingResult.warningNotes.map((warn, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Quick Add to Portfolio */}
              <button
                onClick={() => {
                  onAddStock({
                    symbol: calcSymbol,
                    name: currentStock.name,
                    buyPrice: calcPrice,
                    quantity: sizingResult.recommendedShares,
                    buyDate: new Date().toISOString().split('T')[0],
                  });
                  setActiveTab('holdings');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm {calcSymbol} ({sizingResult.recommendedShares} CP) Vào Danh Mục Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SỔ VỊ THẾ & TRA CỨU THÊM BẤT KỲ MÃ NÀO TRÊN 3 SÀN HOSE/HNX/UPCOM */}
      {/* ========================================================================= */}
      {activeTab === 'holdings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Danh Sách Vị Thế Nắm Giữ Thực Tế ({portfolio.length} Mã)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Giá thị trường được cập nhật thời gian thực từ API sàn giao dịch chứng khoán
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Thêm Mã Mới (Bất Kỳ Mã Nào)
              </button>
            </div>
          </div>

          {/* Form to Add Any Listed Ticker */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm Vị Thế Mới Vào Danh Mục (Hỗ Trợ Toàn Bộ Sàn HOSE, HNX, UPCOM):
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
                {/* Symbol with Live Search Autocomplete */}
                <div className="relative">
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Mã Chứng Khoán:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Gõ mã (e.g. SSI, DGC, PVS, CTR...)"
                      value={formSymbol}
                      onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm uppercase focus:border-emerald-500 focus:outline-hidden"
                      required
                    />
                    {isSearchingStock && (
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-3.5" />
                    )}
                  </div>

                  {/* Search Autocomplete Results Dropdown */}
                  {formSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
                      {formSearchResults.map((item) => (
                        <div
                          key={item.symbol}
                          onClick={() => handleSelectTickerToAdd(item.symbol)}
                          className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-900 text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-emerald-400 font-mono">{item.symbol}</span>
                            <span className="text-slate-400 ml-2">{item.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400">
                            {item.floor}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Giá Vốn Mua (VND):
                  </label>
                  <input
                    type="number"
                    placeholder="Giá mua..."
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                  {isFetchingStockQuote && (
                    <span className="text-[10px] text-emerald-400 block mt-1">
                      Đang lấy thị giá thực tế từ sàn...
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Số Lượng Cổ Phiếu:
                  </label>
                  <input
                    type="number"
                    step="100"
                    placeholder="Lô 100..."
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Xác Nhận Thêm Vào Danh Mục
                </button>
              </div>
            </form>
          )}

          {/* Holdings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Mã CP</th>
                    <th className="py-3.5 px-4">Doanh Nghiệp & Ngành</th>
                    <th className="py-3.5 px-4 text-right">Khối Lượng</th>
                    <th className="py-3.5 px-4 text-right">Giá Vốn</th>
                    <th className="py-3.5 px-4 text-right">Giá Thị Trường</th>
                    <th className="py-3.5 px-4 text-right">Giá Trị Hiện Tại</th>
                    <th className="py-3.5 px-4 text-right">Tỷ Trọng NAV</th>
                    <th className="py-3.5 px-4 text-right">Lãi / Lỗ</th>
                    <th className="py-3.5 px-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {portfolioValuation.enrichedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Danh mục chưa có mã nào. Bấm "Thêm Mã Mới" để bắt đầu!
                      </td>
                    </tr>
                  ) : (
                    portfolioValuation.enrichedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onSelectStock(item.symbol)}
                            className="font-mono font-extrabold text-sm text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            {item.symbol}
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.sector}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {item.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {item.buyPrice.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {item.currentPrice.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                          {item.currentValue.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-300">
                          {item.actualWeight.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className={`font-mono font-bold ${
                              item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.pnl >= 0 ? '+' : ''}
                            {item.pnl.toLocaleString('vi-VN')} đ
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.pnl >= 0 ? '+' : ''}
                            {item.pnlPercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onRemoveStock(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Xóa vị thế này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TÁI CÂN BẰNG DANH MỤC (REBALANCING ENGINE) */}
      {/* ========================================================================= */}
      {activeTab === 'rebalance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase mb-1">
              <Scale className="w-4 h-4" />
              Công Cụ Tái Cân Bằng Danh Mục Định Kỳ (Rebalance Engine)
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Cân Bằng Tỷ Trọng Vàng Giữa Mục Tiêu vs Thực Tế
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Khi một cổ phiếu tăng giá mạnh, tỷ trọng của nó phình to khiến rủi ro danh mục tăng cao. Tái cân bằng giúp bạn tự động chốt lời mã đã tăng quá nhiều và tái đầu tư vào những mã đang ở vùng giá hấp dẫn.
            </p>
          </div>

          <div className="space-y-4">
            {rebalanceRecommendations.length === 0 ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Danh Mục Đang Ở Trạng Thái Cân Bằng Tốt!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Độ lệch tỷ trọng giữa các vị thế hiện tại và mục tiêu chiến lược đều nằm trong ngưỡng an toàn cho phép (&lt; 3.0%). Bạn không cần phải hành động gì ở thời điểm này.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300">
                  Gợi Ý Hành Động Tái Cân Bằng Khuyến Nghị:
                </span>
                {rebalanceRecommendations.map((rec) => (
                  <div
                    key={rec.symbol}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-white text-sm">
                          {rec.symbol}
                        </span>
                        <span className="text-xs text-slate-400">({rec.stockName})</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                            rec.actionType === 'SELL'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {rec.actionType === 'SELL' ? 'Chốt Lời Bớt' : 'Gom Thêm'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{rec.reason}</p>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Thực Tế / Mục Tiêu</span>
                        <span className="font-bold text-white">
                          {rec.currentWeight}% / {rec.targetWeight}%
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Khối Lượng Đề Xuất</span>
                        <span
                          className={`font-bold ${
                            rec.actionType === 'SELL' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {rec.actionType === 'SELL' ? '-' : '+'}
                          {rec.recommendedShares.toLocaleString('vi-VN')} CP
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Giá Trị Ước Tính</span>
                        <span className="font-bold text-slate-200">
                          {rec.diffAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
