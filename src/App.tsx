import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  BarChart2,
  Newspaper,
  Sparkles,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Shield,
  Layers,
  Award,
  Bell,
  Scale,
  Calculator,
  PieChart,
} from 'lucide-react';
import { StockHeader } from './components/StockHeader';
import { MarketTickerBar } from './components/MarketTickerBar';
import { SectorDropdown } from './components/SectorDropdown';
import { FundamentalAnalysis } from './components/FundamentalAnalysis';
import { FinancialStatementsAnalysis } from './components/FinancialStatementsAnalysis';
import { InvestmentDecisionFramework } from './components/InvestmentDecisionFramework';
import { TechnicalChart } from './components/TechnicalChart';
import { PortfolioCapitalAllocation } from './components/PortfolioCapitalAllocation';
import { NewsAndMacroFeed } from './components/NewsAndMacroFeed';
import { AIInvestmentAdvice } from './components/AIInvestmentAdvice';
import { PortfolioModal } from './components/PortfolioModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { ToastNotification, ToastAlertItem } from './components/ToastNotification';
import {
  StockData,
  AIAnalysisResult,
  MacroEvent,
  PortfolioItem,
  PriceAlert,
  MarketIndex,
} from './types/stock';
import {
  getOrGenerateStock,
  INITIAL_MACRO_EVENTS,
  STOCKS_DATABASE,
} from './data/mockStockData';
import { fetchStockData, fetchLiveMarketIndices } from './services/stockService';

const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alt-1',
    symbol: 'FPT',
    stockName: 'Công ty Cổ phần FPT',
    targetPrice: 145000,
    condition: 'ABOVE',
    initialPrice: 135000,
    createdAt: '2026-10-12 09:15',
    triggered: false,
    note: 'Chốt lời đợt 1 khi chạm 145k',
    soundEnabled: true,
  },
  {
    id: 'alt-2',
    symbol: 'HPG',
    stockName: 'Tập đoàn Hòa Phát',
    targetPrice: 28500,
    condition: 'ABOVE',
    initialPrice: 27100,
    createdAt: '2026-10-12 09:30',
    triggered: false,
    note: 'Vượt kháng cự ngắn hạn 28.5k',
    soundEnabled: true,
  },
];

const playAlertChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Ignore autoplay restriction before user interaction
  }
};

export default function App() {
  const [currentSymbol, setCurrentSymbol] = useState<string>('FPT');
  const [stock, setStock] = useState<StockData>(() => getOrGenerateStock('FPT'));
  const [activeTab, setActiveTab] = useState<
    'fundamental' | 'financialStatements' | 'decision' | 'technical' | 'portfolio' | 'news' | 'aiAdvice'
  >('fundamental');

  // AI analysis cache per symbol
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, AIAnalysisResult>>({});
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Macro events
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>(INITIAL_MACRO_EVENTS);
  const [isMacroLoading, setIsMacroLoading] = useState<boolean>(false);

  // Watchlist & Portfolio
  const [watchlist, setWatchlist] = useState<string[]>(['FPT', 'HPG', 'VNM']);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try {
      const saved = localStorage.getItem('vnstock_portfolio');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'p-1',
        symbol: 'FPT',
        name: 'Công ty Cổ phần FPT',
        buyPrice: 128000,
        quantity: 1500,
        buyDate: '2026-08-15',
      },
      {
        id: 'p-2',
        symbol: 'HPG',
        name: 'Tập đoàn Hòa Phát',
        buyPrice: 26500,
        quantity: 5000,
        buyDate: '2026-09-01',
      },
      {
        id: 'p-3',
        symbol: 'VNM',
        name: 'Vinamilk',
        buyPrice: 65000,
        quantity: 2000,
        buyDate: '2026-07-10',
      },
      {
        id: 'p-4',
        symbol: 'VCB',
        name: 'Vietcombank',
        buyPrice: 88500,
        quantity: 1200,
        buyDate: '2026-06-20',
      },
    ];
  });
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  // Price Alert Monitoring System
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('vnstock_price_alerts');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to initial
    }
    return INITIAL_PRICE_ALERTS;
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastAlertItem[]>([]);

  // Persist alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vnstock_price_alerts', JSON.stringify(alerts));
    } catch {
      // Ignore storage error
    }
  }, [alerts]);

  // Real market data & index states
  const [isStockLoading, setIsStockLoading] = useState<boolean>(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);

  // Load Market Indices on mount + auto-refresh
  useEffect(() => {
    let isMounted = true;
    const loadIndices = async () => {
      const data = await fetchLiveMarketIndices();
      if (isMounted) setIndices(data);
    };
    loadIndices();
    const interval = setInterval(loadIndices, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update stock when symbol changes (Async Real Data with Cache)
  const loadStockData = useCallback(async (symbolToLoad: string) => {
    setIsStockLoading(true);
    try {
      const data = await fetchStockData(symbolToLoad);
      setStock(data);
    } catch (err) {
      console.error('Error loading real stock data:', err);
    } finally {
      setIsStockLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData(currentSymbol);
  }, [currentSymbol, loadStockData]);

  // Helper to trigger alert toast
  const triggerAlertToast = (alert: PriceAlert, triggerPrice: number) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const toastId = `toast-${alert.id}-${Date.now()}`;

    const newToast: ToastAlertItem = {
      id: toastId,
      alert,
      currentPrice: triggerPrice,
      timeStr,
    };

    if (alert.soundEnabled !== false) {
      playAlertChime();
    }

    setToasts((prev) => [newToast, ...prev]);

    // Mark alert as triggered
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              triggered: true,
              triggeredAt: `${now.toISOString().split('T')[0]} ${timeStr}`,
            }
          : a
      )
    );

    // Auto-dismiss after 9 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 9000);
  };

  // Price monitoring tick against active alerts
  useEffect(() => {
    const checkAlerts = () => {
      alerts.forEach((alt) => {
        if (alt.triggered) return;
        const currentTargetStock = getOrGenerateStock(alt.symbol);
        const curPrice = currentTargetStock.currentPrice;

        const isHit =
          alt.condition === 'ABOVE'
            ? curPrice >= alt.targetPrice
            : curPrice <= alt.targetPrice;

        if (isHit) {
          triggerAlertToast(alt, curPrice);
        }
      });
    };

    // Check immediately on alert list or current stock change
    checkAlerts();

    // Check periodically
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [alerts]);

  const handleAddAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      createdAt: `${now.toISOString().split('T')[0]} ${timeStr}`,
      triggered: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTriggerTestAlert = (alertId: string) => {
    const targetAlert = alerts.find((a) => a.id === alertId);
    if (!targetAlert) return;
    const testPrice = targetAlert.targetPrice;
    triggerAlertToast(targetAlert, testPrice);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch AI analysis lazily when on AI advice tab or when user requests
  useEffect(() => {
    if (activeTab === 'aiAdvice' && !aiAnalysisMap[stock.symbol] && !isAiLoading) {
      fetchAiAnalysis(stock);
    }
  }, [activeTab, stock.symbol]);

  const fetchAiAnalysis = async (targetStock: StockData) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: targetStock.symbol,
          name: targetStock.name,
          market: targetStock.exchange,
          sector: targetStock.sector,
          currentPrice: targetStock.currentPrice,
          pe: targetStock.pe,
          pb: targetStock.pb,
          roe: targetStock.roe,
          eps: targetStock.eps,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAiAnalysisMap((prev) => ({
          ...prev,
          [targetStock.symbol]: json.data,
        }));
      }
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRefreshMacro = async () => {
    setIsMacroLoading(true);
    try {
      const res = await fetch('/api/gemini/macro-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketTopic: 'VN-Index Macroeconomic updates' }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setMacroEvents(json.data);
      }
    } catch (err) {
      console.error('Error updating macro events:', err);
    } finally {
      setIsMacroLoading(false);
    }
  };

  const toggleWatchlist = () => {
    if (watchlist.includes(stock.symbol)) {
      setWatchlist(watchlist.filter((s) => s !== stock.symbol));
    } else {
      setWatchlist([...watchlist, stock.symbol]);
    }
  };

  const handleAddPortfolio = (item: Omit<PortfolioItem, 'id'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: `p-${Date.now()}`,
    };
    setPortfolio([...portfolio, newItem]);
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  };

  // Sync portfolio to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vnstock_portfolio', JSON.stringify(portfolio));
    } catch {
      // Ignore
    }
  }, [portfolio]);

  const currentAnalysis = aiAnalysisMap[stock.symbol] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">VNStock Insights</span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  AI CFA PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống Phân tích Định giá & Lời khuyên Đầu tư Chứng khoán
              </div>
            </div>
          </div>

          {/* Quick Portfolio & Sector Dropdown Bar */}
          <div className="flex items-center gap-2.5">
            <SectorDropdown
              currentSymbol={currentSymbol}
              onSelectSymbol={(sym) => setCurrentSymbol(sym)}
            />

            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold rounded-lg text-slate-200 transition-all shadow-sm"
              title="Quản lý và thiết lập cảnh báo giá"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Cảnh báo giá</span> ({alerts.filter((a) => !a.triggered).length})
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-3.5 py-2 border text-xs font-semibold rounded-lg transition-all shadow-sm ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/40'
                  : 'bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/40 text-emerald-300'
              }`}
              title="Quản lý quy mô vốn, phân bổ danh mục & tính khối lượng lệnh"
            >
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Quản Lý Vốn & Danh Mục</span> ({portfolio.length})
            </button>

            <button
              onClick={() => setIsPortfolioOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-all shadow-sm"
              title="Bảng so sánh hiệu suất YTD & PnL"
            >
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">So sánh nhanh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Market Indices & Connection Status Ticker */}
      <MarketTickerBar
        indices={indices}
        currentStock={stock}
        isLoading={isStockLoading}
        onRefreshCurrentStock={() => loadStockData(currentSymbol)}
        onSelectSymbol={(sym) => setCurrentSymbol(sym)}
      />

      {/* Stock Header with Ticker Search, Price & Day Range */}
      <StockHeader
        stock={stock}
        onSelectSymbol={(sym) => setCurrentSymbol(sym)}
        onRefresh={() => {
          loadStockData(currentSymbol);
          fetchAiAnalysis(stock);
        }}
        isAiLoading={isAiLoading}
        isStockLoading={isStockLoading}
        isInWatchlist={watchlist.includes(stock.symbol)}
        onToggleWatchlist={toggleWatchlist}
        onOpenAiAdviceTab={() => setActiveTab('aiAdvice')}
        onOpenDecisionTab={() => setActiveTab('decision')}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        activeAlertsCount={alerts.filter((a) => !a.triggered).length}
      />

      {/* Main Tab Navigation */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('fundamental')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'fundamental'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            1. Định Giá & Cơ Bản
          </button>

          <button
            onClick={() => setActiveTab('financialStatements')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'financialStatements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            2. Báo Cáo Tài Chính (KQKD, CĐKT, LCTT, DuPont)
          </button>

          <button
            onClick={() => setActiveTab('decision')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'decision'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-400" />
            3. Khung Quyết Định & Điểm 100đ
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'technical'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            4. Biểu Đồ Kỹ Thuật (Nến Nhật, RSI, MACD)
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PieChart className="w-4 h-4 text-amber-400" />
            5. Quản Lý Vốn & Danh Mục (CFA Pro)
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'news'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            6. Tin Tức & Vĩ Mô
          </button>

          <button
            onClick={() => setActiveTab('aiAdvice')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'aiAdvice'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            7. Khuyến Nghị AI & Q&A
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
        {activeTab === 'fundamental' && (
          <FundamentalAnalysis
            stock={stock}
            onOpenAiAdviceTab={() => setActiveTab('aiAdvice')}
            onOpenFinancialStatementsTab={() => setActiveTab('financialStatements')}
            onSelectSymbol={(sym) => setCurrentSymbol(sym)}
          />
        )}

        {activeTab === 'financialStatements' && (
          <FinancialStatementsAnalysis
            stock={stock}
            onOpenValuationTab={() => setActiveTab('fundamental')}
            onOpenAiAdviceTab={() => setActiveTab('aiAdvice')}
          />
        )}

        {activeTab === 'decision' && (
          <InvestmentDecisionFramework
            stock={stock}
            onOpenAiAdviceTab={() => setActiveTab('aiAdvice')}
          />
        )}

        {activeTab === 'technical' && <TechnicalChart stock={stock} />}

        {activeTab === 'portfolio' && (
          <PortfolioCapitalAllocation
            portfolio={portfolio}
            onAddStock={handleAddPortfolio}
            onRemoveStock={handleRemovePortfolio}
            onSelectStock={(sym) => {
              setCurrentSymbol(sym);
              setActiveTab('fundamental');
            }}
            currentStock={stock}
          />
        )}

        {activeTab === 'news' && (
          <NewsAndMacroFeed
            stock={stock}
            macroEvents={macroEvents}
            onRefreshMacro={handleRefreshMacro}
            isMacroLoading={isMacroLoading}
          />
        )}

        {activeTab === 'aiAdvice' && (
          <AIInvestmentAdvice
            stock={stock}
            aiAnalysis={currentAnalysis}
            isLoading={isAiLoading}
            onRefreshAnalysis={() => fetchAiAnalysis(stock)}
          />
        )}
      </main>

      {/* Portfolio / Watchlist Modal */}
      <PortfolioModal
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        portfolio={portfolio}
        onAddStock={handleAddPortfolio}
        onRemoveStock={handleRemovePortfolio}
        onSelectStock={(sym) => setCurrentSymbol(sym)}
        currentStock={stock}
      />

      {/* Price Alert Monitoring Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentStock={stock}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        onTriggerTestAlert={handleTriggerTestAlert}
        onSelectStock={(sym) => setCurrentSymbol(sym)}
      />

      {/* Floating Toast Notifications */}
      <ToastNotification
        toasts={toasts}
        onDismiss={handleDismissToast}
        onViewStock={(sym) => setCurrentSymbol(sym)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-6 px-4 lg:px-8 text-center mt-12 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 inline" />
          <span>VNStock Insights - Trợ lý phân tích chứng khoán & khuyến nghị đầu tư thế hệ mới</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-3xl mx-auto leading-relaxed">
          * Lưu ý: Mọi ước tính định giá, chỉ số kỹ thuật và khuyến nghị từ AI chỉ mang tính chất tham khảo cho quá trình nghiên cứu đầu tư. Nhà đầu tư cần chịu trách nhiệm hoàn toàn đối với các quyết định giao dịch và quản trị vốn cá nhân.
        </p>
      </footer>
    </div>
  );
}
