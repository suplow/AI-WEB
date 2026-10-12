import React, { useState } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Layers,
  BarChart3,
  Scale,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  Printer,
  Clock,
  Briefcase,
} from 'lucide-react';
import { StockData, FinancialStatementPeriodData } from '../types/stock';

interface FinancialStatementsAnalysisProps {
  stock: StockData;
  onOpenValuationTab?: () => void;
  onOpenAiAdviceTab?: () => void;
}

export const FinancialStatementsAnalysis: React.FC<FinancialStatementsAnalysisProps> = ({
  stock,
  onOpenValuationTab,
  onOpenAiAdviceTab,
}) => {
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'income' | 'balance' | 'cashflow' | 'audit'>('overview');
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(2); // Default to latest full year (2025)

  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const currencyUnit = isUS ? 'Triệu USD' : 'Tỷ VND';

  const fs = stock.financialStatements;

  if (!fs) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p>Đang tải và đồng bộ dữ liệu Báo Cáo Tài Chính cho mã {stock.symbol}...</p>
      </div>
    );
  }

  // Robustly normalize periods list ensuring compliant income, balance, cashflow objects
  const rawList = periodType === 'annual'
    ? (fs.annual && fs.annual.length > 0 ? fs.annual : fs.quarterly || [])
    : (fs.quarterly && fs.quarterly.length > 0 ? fs.quarterly : fs.annual || []);

  const normalizedPeriodsList: FinancialStatementPeriodData[] = (rawList || []).map((p: any) => {
    const inc = p.income || p.incomeStatement || {};
    const bal = p.balance || p.balanceSheet || {};
    const cf = p.cashflow || p.cashFlow || {};

    const rev = inc.revenue || 0;
    const gross = inc.grossProfit || 0;
    const net = inc.netIncome || inc.netProfit || 0;
    const ebit = inc.operatingProfit || 0;

    return {
      period: p.period || 'Kỳ gần nhất',
      income: {
        period: p.period || 'Kỳ gần nhất',
        revenue: rev,
        cogs: inc.cogs || 0,
        grossProfit: gross,
        grossMargin: inc.grossMargin ?? (rev > 0 ? (gross / rev) * 100 : 25),
        operatingExpenses: inc.operatingExpenses || (inc.sellingExpense || 0) + (inc.adminExpense || 0),
        financialIncome: inc.financialIncome || 0,
        financialExpenses: inc.financialExpenses || inc.financialExpense || 0,
        interestExpense: inc.interestExpense || 0,
        operatingProfit: ebit,
        ebitda: inc.ebitda || Math.round(ebit * 1.25),
        profitBeforeTax: inc.profitBeforeTax || 0,
        netIncome: net,
        netMargin: inc.netMargin ?? (rev > 0 ? (net / rev) * 100 : 12),
        eps: inc.eps || 3000,
        growthYoYRevenue: inc.growthYoYRevenue ?? 15,
        growthYoYProfit: inc.growthYoYProfit ?? stock.profitGrowth ?? 18,
      },
      balance: {
        period: p.period || 'Kỳ gần nhất',
        currentAssets: bal.currentAssets || bal.totalCurrentAssets || 0,
        cashAndEquivalents: bal.cashAndEquivalents || 0,
        shortTermInvestments: bal.shortTermInvestments || 0,
        accountsReceivable: bal.accountsReceivable || 0,
        inventories: bal.inventories || bal.inventory || 0,
        otherCurrentAssets: bal.otherCurrentAssets || 0,
        nonCurrentAssets: bal.nonCurrentAssets || bal.totalNonCurrentAssets || 0,
        fixedAssets: bal.fixedAssets || 0,
        constructionInProgress: bal.constructionInProgress || 0,
        totalAssets: bal.totalAssets || 0,
        currentLiabilities: bal.currentLiabilities || 0,
        shortTermDebt: bal.shortTermDebt || 0,
        nonCurrentLiabilities: bal.nonCurrentLiabilities || bal.longTermDebt || 0,
        longTermDebt: bal.longTermDebt || 0,
        totalLiabilities: bal.totalLiabilities || 0,
        totalDebt: bal.totalDebt || (bal.shortTermDebt || 0) + (bal.longTermDebt || 0),
        equity: bal.equity || bal.ownerEquity || 0,
        charterCapital: bal.charterCapital || 0,
        retainedEarnings: bal.retainedEarnings || 0,
        totalResources: bal.totalResources || bal.totalAssets || 0,
      },
      cashflow: {
        period: p.period || 'Kỳ gần nhất',
        cfo: cf.cfo ?? cf.operatingCashFlow ?? 0,
        cfi: cf.cfi ?? cf.investingCashFlow ?? 0,
        capex: cf.capex ?? 0,
        cff: cf.cff ?? cf.financingCashFlow ?? 0,
        dividendPaid: cf.dividendPaid ?? 0,
        netCashFlow: cf.netCashFlow ?? cf.netChangeInCash ?? 0,
        freeCashFlow: cf.freeCashFlow ?? ((cf.cfo ?? cf.operatingCashFlow ?? 0) - (cf.capex ?? 0)),
        endingCash: cf.endingCash ?? cf.cashAtEnd ?? 0,
      },
    };
  });

  const fallbackPeriod: FinancialStatementPeriodData = {
    period: 'Kỳ gần nhất',
    income: {
      period: 'Kỳ gần nhất',
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      grossMargin: 25,
      operatingExpenses: 0,
      financialIncome: 0,
      financialExpenses: 0,
      interestExpense: 0,
      operatingProfit: 0,
      ebitda: 0,
      profitBeforeTax: 0,
      netIncome: 0,
      netMargin: 12,
      eps: 3000,
      growthYoYRevenue: 15,
      growthYoYProfit: stock.profitGrowth || 18,
    },
    balance: {
      period: 'Kỳ gần nhất',
      currentAssets: 0,
      cashAndEquivalents: 0,
      shortTermInvestments: 0,
      accountsReceivable: 0,
      inventories: 0,
      otherCurrentAssets: 0,
      nonCurrentAssets: 0,
      fixedAssets: 0,
      constructionInProgress: 0,
      totalAssets: 0,
      currentLiabilities: 0,
      shortTermDebt: 0,
      nonCurrentLiabilities: 0,
      longTermDebt: 0,
      totalLiabilities: 0,
      totalDebt: 0,
      equity: 0,
      charterCapital: 0,
      retainedEarnings: 0,
      totalResources: 0,
    },
    cashflow: {
      period: 'Kỳ gần nhất',
      cfo: 0,
      cfi: 0,
      capex: 0,
      cff: 0,
      dividendPaid: 0,
      netCashFlow: 0,
      freeCashFlow: 0,
      endingCash: 0,
    },
  };

  const periodsList: FinancialStatementPeriodData[] =
    normalizedPeriodsList.length > 0 ? normalizedPeriodsList : [fallbackPeriod];
  const currentPeriod: FinancialStatementPeriodData =
    periodsList[Math.min(selectedPeriodIdx, periodsList.length - 1)] || periodsList[0] || fallbackPeriod;

  const formatNumber = (val: number | undefined): string => {
    if (val === undefined || val === null) return '-';
    if (isUS) {
      return `$${val.toLocaleString('en-US')}`;
    }
    return val.toLocaleString('vi-VN');
  };

  const formatPercent = (val: number | undefined): string => {
    if (val === undefined || val === null) return '-';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Title, Period Type & Subtabs */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Phân Tích Báo Cáo Tài Chính Chuyên Sâu ({stock.symbol})
              </h2>
              {stock.isRealData !== false && (
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/80 flex items-center gap-1.5 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  BCTC Kiểm Toán Thực Tế (HOSE / HNX)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Đầy đủ 3 Báo Cáo Tài Chính Chuẩn Mực (KQKD, CĐKT, Dòng Tiền LCTT), Mô hình DuPont 3 nhân tố & Kiểm định Gian lận Piotroski 9/9
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Annual vs Quarterly Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setPeriodType('annual');
                  setSelectedPeriodIdx(Math.min(selectedPeriodIdx, fs.annual.length - 1));
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  periodType === 'annual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hàng Năm (Annual)
              </button>
              <button
                onClick={() => {
                  setPeriodType('quarterly');
                  setSelectedPeriodIdx(Math.min(selectedPeriodIdx, fs.quarterly.length - 1));
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  periodType === 'quarterly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hàng Quý (Quarterly)
              </button>
            </div>

            {/* Quick status pill */}
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                fs.auditVerdict.status === 'Rất lành mạnh'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : fs.auditVerdict.status === 'Ổn định'
                  ? 'bg-blue-950/70 border-blue-500/40 text-blue-300'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Sức khỏe BCTC: {fs.auditVerdict.status}
            </span>
          </div>
        </div>

        {/* 5 Functional Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'overview'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            1. Tổng Quan & DuPont (3 Nhân Tố)
          </button>

          <button
            onClick={() => setActiveSubTab('income')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'income'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            2. Kết Quả Kinh Doanh (Income Statement)
          </button>

          <button
            onClick={() => setActiveSubTab('balance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'balance'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            3. Cân Đối Kế Toán (Balance Sheet)
          </button>

          <button
            onClick={() => setActiveSubTab('cashflow')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'cashflow'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            4. Lưu Chuyển Tiền Tệ & Dòng Tiền Tự Do FCF
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            5. Kiểm Định Gian Lận & Piotroski 9/9
          </button>
        </div>
      </div>

      {/* 2. SUBTAB CONTENT */}

      {/* SUBTAB 1: OVERVIEW & DUPONT ANALYSIS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* DuPont Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    Mô Hình Phân Tích DuPont 3 Nhân Tố (DuPont ROE Decomposition)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tách bạch cốt lõi: ROE = Biên Lợi Nhuận Ròng × Vòng Quay Tổng Tài Sản × Đòn Bẩy Tài Chính
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Động lực chính:</span>
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-lg">
                  {fs.dupont.primaryDriver}
                </span>
              </div>
            </div>

            {/* DuPont Visual Equation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5">
              {/* Factor 1: Net Margin */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
                <div className="text-xs text-slate-400">1. Biên Lợi Nhuận Ròng (Margin)</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {fs.dupont.netMargin.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  LNST / Doanh thu thuần
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-2 bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                  Hiệu quả định giá & quản trị chi phí
                </div>
              </div>

              {/* Multiplier Symbol */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
                <div className="text-xs text-slate-400">2. Vòng Quay Tài Sản (Turnover)</div>
                <div className="text-2xl font-extrabold text-cyan-400 mt-1">
                  {fs.dupont.assetTurnover.toFixed(2)}x
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Doanh thu / Tổng tài sản bình quân
                </div>
                <div className="text-[10px] text-cyan-400/80 mt-2 bg-cyan-500/10 px-2 py-0.5 rounded inline-block">
                  Tốc độ luân chuyển dòng vốn
                </div>
              </div>

              {/* Factor 3: Financial Leverage */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
                <div className="text-xs text-slate-400">3. Đòn Bẩy Tài Chính (Leverage)</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">
                  {fs.dupont.equityMultiplier.toFixed(2)}x
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tổng tài sản / Vốn chủ sở hữu
                </div>
                <div className="text-[10px] text-amber-400/80 mt-2 bg-amber-500/10 px-2 py-0.5 rounded inline-block">
                  Mức độ sử dụng vốn vay nợ
                </div>
              </div>

              {/* Equals Result: ROE */}
              <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
                <div className="text-xs font-semibold text-blue-300">= Tỷ Suất Sinh Lời ROE</div>
                <div className="text-3xl font-black text-white mt-1">
                  {fs.dupont.calculatedROE.toFixed(1)}%
                </div>
                <div className="text-[11px] text-blue-200/80 mt-1">
                  Warren Buffett Benchmark ≥ 15%
                </div>
                <div className="text-[10px] text-emerald-300 font-semibold mt-2 bg-emerald-500/20 px-2 py-0.5 rounded inline-block">
                  {fs.dupont.calculatedROE >= 20 ? 'Rất xuất sắc' : fs.dupont.calculatedROE >= 15 ? 'Đạt chuẩn đầu tư' : 'Cần cải thiện'}
                </div>
              </div>
            </div>

            {/* DuPont Interpretation Box */}
            <div className="mt-4 p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Đánh giá cấu trúc sinh lời DuPont: </span>
                {fs.dupont.interpretation}
              </div>
            </div>
          </div>

          {/* Liquidity, Cash Cycle & Balance Strength Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liquidity & Solvency Ratios */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Khả Năng Thanh Toán & An Toàn Vốn</h3>
              </div>

              <div className="divide-y divide-slate-800/60 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Hệ số thanh toán hiện hành (Current Ratio)</div>
                    <div className="text-[11px] text-slate-400">Tài sản ngắn hạn / Nợ ngắn hạn (Chuẩn &gt; 1.0x)</div>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md ${
                      fs.healthMetrics.currentRatio >= 1.2
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : fs.healthMetrics.currentRatio >= 1.0
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {fs.healthMetrics.currentRatio.toFixed(2)}x
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Hệ số thanh toán nhanh (Quick Ratio)</div>
                    <div className="text-[11px] text-slate-400">(Tiền + ĐT ngắn hạn + Phải thu) / Nợ ngắn hạn</div>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md ${
                      fs.healthMetrics.quickRatio >= 1.0
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : fs.healthMetrics.quickRatio >= 0.7
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {fs.healthMetrics.quickRatio.toFixed(2)}x
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Khả năng chi trả lãi vay (Interest Coverage)</div>
                    <div className="text-[11px] text-slate-400">Lợi nhuận EBIT / Chi phí lãi vay (Chuẩn &gt; 3.0x)</div>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md ${
                      fs.healthMetrics.interestCoverage >= 5.0
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : fs.healthMetrics.interestCoverage >= 2.5
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {fs.healthMetrics.interestCoverage.toFixed(1)}x
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Tỷ lệ Nợ Vay Ròng / Vốn Chủ Sở Hữu (Net Debt / Equity)</div>
                    <div className="text-[11px] text-slate-400">(Tổng nợ vay - Tiền gửi) / Vốn CSH</div>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md ${
                      fs.healthMetrics.netDebtToEquity <= 0
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : fs.healthMetrics.netDebtToEquity <= 0.6
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {fs.healthMetrics.netDebtToEquity <= 0
                      ? 'Thặng dư tiền ròng (Net Cash)'
                      : `${fs.healthMetrics.netDebtToEquity.toFixed(2)}x`}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Efficiency & Cash Conversion Cycle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Hiệu Quả Hoạt Động & Chu Kỳ Tiền Mặt</h3>
              </div>

              <div className="divide-y divide-slate-800/60 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Số ngày thu tiền bình quân (DSO)</div>
                    <div className="text-[11px] text-slate-400">Thời gian trung bình thu hồi nợ từ khách hàng</div>
                  </div>
                  <span className="font-bold text-slate-200 px-2 py-0.5 bg-slate-800 rounded">
                    {fs.healthMetrics.dso} ngày
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Số ngày tồn kho bình quân (DIO)</div>
                    <div className="text-[11px] text-slate-400">Thời gian luân chuyển giải phóng hàng tồn kho</div>
                  </div>
                  <span className="font-bold text-slate-200 px-2 py-0.5 bg-slate-800 rounded">
                    {fs.healthMetrics.dio} ngày
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Số ngày trả tiền nhà cung cấp (DPO)</div>
                    <div className="text-[11px] text-slate-400">Chiếm dụng vốn lưu động từ bên bán hàng</div>
                  </div>
                  <span className="font-bold text-slate-200 px-2 py-0.5 bg-slate-800 rounded">
                    {fs.healthMetrics.dpo} ngày
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between bg-blue-950/20 px-2.5 rounded-lg -mx-1">
                  <div>
                    <div className="font-bold text-blue-300">Chu kỳ chuyển đổi tiền mặt (CCC)</div>
                    <div className="text-[11px] text-slate-400">CCC = DIO + DSO - DPO (Càng thấp càng tốt)</div>
                  </div>
                  <span className="font-extrabold text-blue-300 text-sm px-2.5 py-1 bg-blue-950 border border-blue-500/30 rounded-md">
                    {fs.healthMetrics.ccc} ngày
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Switch to Full Statements */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Khám phá chi tiết các Báo cáo kế toán</h4>
                <p className="text-[11px] text-slate-400">
                  Xem bảng số liệu so sánh nhiều kỳ của Kết Quả Kinh Doanh, Bảng Cân Đối Kế Toán & Lưu Chuyển Tiền Tệ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('income')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Xem Báo Cáo KQKD
              </button>
              <button
                onClick={() => setActiveSubTab('audit')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Kiểm định Piotroski 9/9
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INCOME STATEMENT (KQKD) */}
      {activeSubTab === 'income' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Báo Cáo Kết Quả Hoạt Động Kinh Doanh (Income Statement)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đơn vị tính: {currencyUnit} (Dữ liệu {periodType === 'annual' ? 'Hàng năm' : 'Hàng quý'})
                </p>
              </div>

              {/* Visual trend badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Tăng trưởng LNST:</span>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold rounded-lg">
                  {formatPercent(currentPeriod?.income?.growthYoYProfit ?? stock.profitGrowth)}
                </span>
              </div>
            </div>

            {/* Visual Growth Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800/60">
              {periodsList.map((p, idx) => (
                <div
                  key={p.period}
                  onClick={() => setSelectedPeriodIdx(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPeriodIdx === idx
                      ? 'bg-blue-950/40 border-blue-500/50 shadow'
                      : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">{p.period}</span>
                    {p.income.growthYoYRevenue !== undefined && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        +{p.income.growthYoYRevenue}%
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {formatNumber(p.income.revenue)} {isUS ? 'M' : 'tỷ'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>LNST:</span>
                    <span className="font-semibold text-emerald-400">
                      {formatNumber(p.income.netIncome)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Biên ròng: {p.income.netMargin.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Income Statement Detailed Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="py-3 px-3 font-semibold">Chỉ tiêu tài chính</th>
                    {periodsList.map((p) => (
                      <th key={p.period} className="py-3 px-3 text-right font-bold text-slate-200">
                        {p.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* Revenue */}
                  <tr className="bg-slate-850/40 font-bold text-white">
                    <td className="py-2.5 px-3">1. Doanh thu thuần</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2.5 px-3 text-right text-emerald-400">
                        {formatNumber(p.income.revenue)}
                      </td>
                    ))}
                  </tr>

                  {/* COGS */}
                  <tr className="text-slate-400">
                    <td className="py-2 px-3 pl-6">2. Giá vốn hàng bán (COGS)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-rose-400/90">
                        ({formatNumber(p.income.cogs)})
                      </td>
                    ))}
                  </tr>

                  {/* Gross Profit */}
                  <tr className="bg-slate-850/20 font-bold text-slate-200">
                    <td className="py-2 px-3">3. Lợi nhuận gộp</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-white">
                        {formatNumber(p.income.grossProfit)}
                      </td>
                    ))}
                  </tr>

                  {/* Gross Margin */}
                  <tr className="text-slate-400 text-[11px]">
                    <td className="py-1.5 px-3 pl-6 italic">Biên lợi nhuận gộp (%)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-1.5 px-3 text-right font-semibold text-cyan-400">
                        {p.income.grossMargin.toFixed(1)}%
                      </td>
                    ))}
                  </tr>

                  {/* SG&A Expenses */}
                  <tr className="text-slate-400">
                    <td className="py-2 px-3 pl-6">4. Chi phí bán hàng & Quản lý (SG&A)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-slate-300">
                        ({formatNumber(p.income.operatingExpenses)})
                      </td>
                    ))}
                  </tr>

                  {/* Financial Income */}
                  <tr className="text-slate-400">
                    <td className="py-2 px-3 pl-6">5. Doanh thu tài chính (Lãi tiền gửi)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-slate-300">
                        +{formatNumber(p.income.financialIncome)}
                      </td>
                    ))}
                  </tr>

                  {/* Financial Expenses & Interest */}
                  <tr className="text-slate-400">
                    <td className="py-2 px-3 pl-6">
                      6. Chi phí tài chính (trong đó lãi vay: {formatNumber(currentPeriod.income.interestExpense)})
                    </td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-slate-300">
                        ({formatNumber(p.income.financialExpenses)})
                      </td>
                    ))}
                  </tr>

                  {/* Operating Profit EBIT */}
                  <tr className="bg-slate-850/30 font-semibold text-slate-200">
                    <td className="py-2 px-3">7. Lợi nhuận thuần từ HĐKD (EBIT)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-blue-300">
                        {formatNumber(p.income.operatingProfit)}
                      </td>
                    ))}
                  </tr>

                  {/* EBITDA */}
                  <tr className="text-slate-400 text-[11px]">
                    <td className="py-1.5 px-3 pl-6 italic">Thu nhập trước lãi vay, thuế & khấu hao (EBITDA)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-1.5 px-3 text-right font-medium text-slate-300">
                        {formatNumber(p.income.ebitda)}
                      </td>
                    ))}
                  </tr>

                  {/* Profit Before Tax */}
                  <tr className="text-slate-300">
                    <td className="py-2 px-3">8. Tổng lợi nhuận trước thuế (EBT)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.income.profitBeforeTax)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Income */}
                  <tr className="bg-blue-950/40 font-extrabold text-white text-sm border-t-2 border-slate-700">
                    <td className="py-3 px-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      9. Lợi nhuận sau thuế của cổ đông mẹ (LNST)
                    </td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-3 px-3 text-right text-emerald-400">
                        {formatNumber(p.income.netIncome)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Margin */}
                  <tr className="text-slate-300 text-[11px]">
                    <td className="py-1.5 px-3 pl-6 italic">Biên lợi nhuận ròng (Net Margin %)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-1.5 px-3 text-right font-bold text-emerald-300">
                        {p.income.netMargin.toFixed(1)}%
                      </td>
                    ))}
                  </tr>

                  {/* EPS */}
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">Lãi cơ bản trên cổ phiếu (EPS)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right font-bold text-amber-300">
                        {formatNumber(p.income.eps)} đ
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BALANCE SHEET (CĐKT) */}
      {activeSubTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  Bảng Cân Đối Kế Toán (Balance Sheet)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đơn vị tính: {currencyUnit} (Nguyên tắc kế toán: Tổng Tài Sản = Tổng Nợ Phải Trả + Vốn Chủ Sở Hữu)
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Tỷ lệ Nợ / VCSH (D/E):</span>
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold rounded-lg">
                  {stock.debtEquity.toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Asset vs Equity Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-b border-slate-800/60">
              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">TỔNG TÀI SẢN</div>
                <div className="text-xl font-extrabold text-white mt-1">
                  {formatNumber(currentPeriod.balance.totalAssets)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Ngắn hạn: {formatNumber(currentPeriod.balance.currentAssets)} | Dài hạn:{' '}
                  {formatNumber(currentPeriod.balance.nonCurrentAssets)}
                </div>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">NỢ PHẢI TRẢ (LIABILITIES)</div>
                <div className="text-xl font-extrabold text-amber-400 mt-1">
                  {formatNumber(currentPeriod.balance.totalLiabilities)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Vay nợ tài chính: {formatNumber(currentPeriod.balance.totalDebt)} (
                  {Math.round(
                    (currentPeriod.balance.totalDebt / currentPeriod.balance.totalAssets) * 100
                  )}
                  % tài sản)
                </div>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">VỐN CHỦ SỞ HỮU (EQUITY)</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  {formatNumber(currentPeriod.balance.equity)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  LNST chưa phân phối: {formatNumber(currentPeriod.balance.retainedEarnings)}
                </div>
              </div>
            </div>

            {/* Balance Sheet Detailed Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="py-3 px-3 font-semibold">Khoản mục Bảng CĐKT</th>
                    {periodsList.map((p) => (
                      <th key={p.period} className="py-3 px-3 text-right font-bold text-slate-200">
                        {p.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* ASSETS SECTION */}
                  <tr className="bg-cyan-950/30 font-bold text-cyan-300">
                    <td colSpan={periodsList.length + 1} className="py-2.5 px-3">
                      A. TÀI SẢN NGẮN HẠN
                    </td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Tiền và các khoản tương đương tiền</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-emerald-400">
                        {formatNumber(p.balance.cashAndEquivalents)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">2. Đầu tư tài chính ngắn hạn (Tiền gửi có kỳ hạn)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.shortTermInvestments)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">3. Các khoản phải thu ngắn hạn khách hàng</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-amber-300">
                        {formatNumber(p.balance.accountsReceivable)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">4. Hàng tồn kho</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.inventories)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-850/20 font-bold text-slate-200">
                    <td className="py-2 px-3">TỔNG TÀI SẢN NGẮN HẠN</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.currentAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* NON-CURRENT ASSETS */}
                  <tr className="bg-cyan-950/30 font-bold text-cyan-300">
                    <td colSpan={periodsList.length + 1} className="py-2.5 px-3">
                      B. TÀI SẢN DÀI HẠN
                    </td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Tài sản cố định ròng (Máy móc, nhà xưởng)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.fixedAssets)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">2. Chi phí xây dựng cơ bản dở dang (Dự án mới)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-blue-300">
                        {formatNumber(p.balance.constructionInProgress)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-950/40 font-extrabold text-white border-t border-slate-700">
                    <td className="py-3 px-3">TỔNG TÀI SẢN</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-3 px-3 text-right text-cyan-400">
                        {formatNumber(p.balance.totalAssets)}
                      </td>
                    ))}
                  </tr>

                  {/* LIABILITIES SECTION */}
                  <tr className="bg-amber-950/30 font-bold text-amber-300">
                    <td colSpan={periodsList.length + 1} className="py-2.5 px-3">
                      C. NỢ PHẢI TRẢ (LIABILITIES)
                    </td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Vay nợ tài chính ngắn hạn</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-amber-300">
                        {formatNumber(p.balance.shortTermDebt)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">2. Vay nợ tài chính dài hạn</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-amber-300">
                        {formatNumber(p.balance.longTermDebt)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-850/20 font-bold text-slate-200">
                    <td className="py-2 px-3">TỔNG NỢ VAY TÀI CHÍNH (Debt)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-amber-400">
                        {formatNumber(p.balance.totalDebt)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-850/20 font-bold text-slate-200">
                    <td className="py-2 px-3">TỔNG NỢ PHẢI TRẢ (Total Liabilities)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.totalLiabilities)}
                      </td>
                    ))}
                  </tr>

                  {/* EQUITY SECTION */}
                  <tr className="bg-emerald-950/30 font-bold text-emerald-300">
                    <td colSpan={periodsList.length + 1} className="py-2.5 px-3">
                      D. VỐN CHỦ SỞ HỮU (EQUITY)
                    </td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Vốn góp của chủ sở hữu (Vốn điều lệ)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right">
                        {formatNumber(p.balance.charterCapital)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">2. Lợi nhuận sau thuế chưa phân phối</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-emerald-400">
                        {formatNumber(p.balance.retainedEarnings)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-950/40 font-extrabold text-white border-t border-slate-700">
                    <td className="py-3 px-3">TỔNG VỐN CHỦ SỞ HỮU</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-3 px-3 text-right text-emerald-400">
                        {formatNumber(p.balance.equity)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CASH FLOW & FREE CASH FLOW (LCTT & FCF) */}
      {activeSubTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Báo Cáo Lưu Chuyển Tiền Tệ & Dòng Tiền Tự Do FCF (Cash Flow Statement)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  &quot;Lợi nhuận là ý kiến chủ quan, nhưng Tiền mặt là thực tế khách quan.&quot; - Đánh giá CFO, CFI, CFF & FCF
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Chất lượng tiền mặt (CFO / LNST):</span>
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold rounded-lg">
                  {fs.healthMetrics.cfoToNetIncomeRatio}x
                </span>
              </div>
            </div>

            {/* Cash Flow Visual Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800/60">
              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">1. DÒNG TIỀN KINH DOANH (CFO)</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  +{formatNumber(currentPeriod.cashflow.cfo)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tiền mặt thực thu từ bán hàng & cung cấp dịch vụ
                </div>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">2. DÒNG TIỀN ĐẦU TƯ (CFI)</div>
                <div className="text-xl font-extrabold text-rose-400 mt-1">
                  {formatNumber(currentPeriod.cashflow.cfi)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  CapEx mua sắm máy móc: {formatNumber(currentPeriod.cashflow.capex)}
                </div>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">3. DÒNG TIỀN TÀI CHÍNH (CFF)</div>
                <div className="text-xl font-extrabold text-blue-400 mt-1">
                  {formatNumber(currentPeriod.cashflow.cff)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Cổ tức tiền mặt đã trả: {formatNumber(currentPeriod.cashflow.dividendPaid)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/60 to-teal-950/60 p-3.5 rounded-lg border border-emerald-500/40">
                <div className="text-xs font-semibold text-emerald-300">4. DÒNG TIỀN TỰ DO (FCF)</div>
                <div className="text-2xl font-black text-white mt-1">
                  {formatNumber(currentPeriod.cashflow.freeCashFlow)}
                </div>
                <div className="text-[11px] text-emerald-200 mt-1">
                  FCF = CFO - CapEx (Thước đo của Warren Buffett)
                </div>
              </div>
            </div>

            {/* Cash Flow Detailed Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="py-3 px-3 font-semibold">Khoản mục Dòng Tiền</th>
                    {periodsList.map((p) => (
                      <th key={p.period} className="py-3 px-3 text-right font-bold text-slate-200">
                        {p.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* CFO */}
                  <tr className="bg-emerald-950/20 font-bold text-slate-200">
                    <td className="py-2.5 px-3">I. Lưu chuyển tiền thuần từ HĐ Kinh Doanh (CFO)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2.5 px-3 text-right text-emerald-400">
                        +{formatNumber(p.cashflow.cfo)}
                      </td>
                    ))}
                  </tr>

                  {/* CFI */}
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Tiền chi mua sắm tài sản cố định (CapEx)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-rose-400">
                        ({formatNumber(Math.abs(p.cashflow.capex))})
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-rose-950/20 font-bold text-slate-200">
                    <td className="py-2 px-3">II. Lưu chuyển tiền thuần từ HĐ Đầu Tư (CFI)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-rose-400">
                        {formatNumber(p.cashflow.cfi)}
                      </td>
                    ))}
                  </tr>

                  {/* CFF */}
                  <tr className="text-slate-300">
                    <td className="py-2 px-3 pl-6">1. Tiền chi trả cổ tức cho chủ sở hữu</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-slate-400">
                        ({formatNumber(Math.abs(p.cashflow.dividendPaid))})
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-950/20 font-bold text-slate-200">
                    <td className="py-2 px-3">III. Lưu chuyển tiền thuần từ HĐ Tài Chính (CFF)</td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-2 px-3 text-right text-blue-300">
                        {formatNumber(p.cashflow.cff)}
                      </td>
                    ))}
                  </tr>

                  {/* NET CHANGE IN CASH */}
                  <tr className="text-slate-300 border-t border-slate-700">
                    <td className="py-2 px-3 font-semibold">IV. Lưu chuyển tiền thuần trong kỳ (CFO + CFI + CFF)</td>
                    {periodsList.map((p) => (
                      <td
                        key={p.period}
                        className={`py-2 px-3 text-right font-bold ${
                          p.cashflow.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatNumber(p.cashflow.netCashFlow)}
                      </td>
                    ))}
                  </tr>

                  {/* FREE CASH FLOW */}
                  <tr className="bg-emerald-950/40 font-extrabold text-white text-sm border-t-2 border-slate-700">
                    <td className="py-3 px-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      DÒNG TIỀN TỰ DO (FREE CASH FLOW - FCF)
                    </td>
                    {periodsList.map((p) => (
                      <td key={p.period} className="py-3 px-3 text-right text-emerald-400">
                        +{formatNumber(p.cashflow.freeCashFlow)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: AUDIT & PIOTROSKI 9/9 CRITERIA */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Piotroski Score Hero Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Kiểm Định Gian Lận & Bộ Thước Đo Piotroski F-Score (9 Tiêu Chí Kế Toán)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Được phát minh bởi Giáo sư Kế toán Joseph Piotroski (Đại học Stanford) để sàng lọc cổ phiếu chất lượng cao và phát hiện rủi ro xào nấu số liệu BCTC
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Điểm số Piotroski:</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {fs.piotroskiDetailed.filter((c) => c.passed).length}/9 Điểm
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg">
                  {fs.piotroskiDetailed.filter((c) => c.passed).length >= 8
                    ? 'Xuất Sắc (Chuẩn Đầu Tư)'
                    : fs.piotroskiDetailed.filter((c) => c.passed).length >= 6
                    ? 'Ổn Định'
                    : 'Rủi Ro Cần Lưu Ý'}
                </span>
              </div>
            </div>

            {/* Expert Audit Commentary Box */}
            <div className="mt-4 p-4 bg-slate-850/80 border border-slate-700/60 rounded-xl text-xs">
              <div className="font-bold text-white flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-blue-400" />
                Kết Luận Đánh Giá BCTC Từ Chuyên Gia Phân Tích:
              </div>
              <p className="text-slate-300 leading-relaxed">{fs.auditVerdict.auditNote}</p>
            </div>

            {/* 9 Piotroski Accounting Criteria Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
              {fs.piotroskiDetailed.map((item) => (
                <div
                  key={item.code}
                  className={`p-4 rounded-xl border transition-all ${
                    item.passed
                      ? 'bg-slate-850/60 border-slate-700/60 hover:border-emerald-500/40'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.code} • {item.category}
                    </span>
                    {item.passed ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ĐẠT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        CHƯA ĐẠT
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1.5">{item.title}</h4>

                  <div className="flex items-center justify-between text-[11px] py-1 px-2 bg-slate-900/60 rounded mb-2">
                    <span className="text-slate-400">Thực tế:</span>
                    <span className="font-bold text-slate-200">{item.actualValue}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">{item.accountingMeaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
