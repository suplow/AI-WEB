export type TimeFrame = '1D' | '1M' | '6M' | '1Y' | '5Y';

export type ChartType = 'candlestick' | 'line';

export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export interface PriceBar {
  date: string;
  time?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: 'KQKD' | 'Cổ tức' | 'M&A & Dự án' | 'Nội bộ' | 'Ngành' | 'Vĩ mô';
  sentiment: SentimentType;
  relevanceScore: number; // 1-100
  url?: string;
}

export interface MacroEvent {
  id: string;
  title: string;
  summary: string;
  category: 'Lãi suất & Tiền tệ' | 'Tỷ giá & Ngoại hối' | 'Chính sách & Nâng hạng' | 'Kinh tế vĩ mô & GDP';
  impactLevel: 'Cao' | 'Trung bình' | 'Thấp';
  sentiment: SentimentType;
  beneficiarySectors: string[];
  riskSectors: string[];
  actionAdvice: string;
  date: string;
}

export interface FairValueEstimates {
  fairValuePE: number;
  fairValuePB: number;
  fairValueGraham?: number;
  fairValueDCF?: number;
  fairValueResidualIncome?: number; // Mô hình thu nhập thặng dư (Chuyên ngành Ngân hàng & Tài chính)
  fairValueRNAV?: number; // Mô hình giá trị tài sản ròng (Chuyên ngành Bất động sản)
  weightedFairValue: number;
  marginOfSafetyPercent: number; // positive = undervalued, negative = overvalued
  status: 'Dưới giá trị (Hấp dẫn)' | 'Định giá hợp lý' | 'Định giá cao (Đắt)';
  assumedGrowthRate: number; // percentage
  targetPE: number;
  valuationModelType: 'STANDARD_INDUSTRIAL' | 'BANKING_FINANCIAL' | 'REAL_ESTATE' | 'HIGH_GROWTH_TECH';
  valuationModelTitle: string;
  valuationExplanation: string;
}

export interface TechnicalIndicators {
  currentRSI: number;
  rsiSignal: 'Quá mua (Overbought)' | 'Quá bán (Oversold)' | 'Trung lập (Neutral)';
  currentMACD: number;
  currentMACDSignal: number;
  macdHistogram: number;
  macdCross: 'Giao cắt Vàng (Golden Cross - Mua)' | 'Giao cắt Tử thần (Death Cross - Bán)' | 'Trung tính';
  trend: 'Tăng mạnh' | 'Tăng nhẹ' | 'Đi ngang (Sideway)' | 'Giảm nhẹ' | 'Giảm mạnh';
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  ma20Status: 'Trên MA20' | 'Dưới MA20';
  overallTechnicalSignal: 'MUA MẠNH' | 'MUA' | 'THEO DÕI' | 'BÁN' | 'BÁN MẠNH';
}

// ---------------------------------------------
// Detailed Financial Statement Types (BCTC)
// ---------------------------------------------
export interface IncomeStatementItem {
  period: string; // e.g., "2023", "2024", "2025", "2026F", "Q3/2025", "Q4/2025", "Q1/2026", "Q2/2026"
  revenue: number; // Doanh thu thuần (tỷ VND)
  cogs: number; // Giá vốn hàng bán (tỷ VND)
  grossProfit: number; // Lợi nhuận gộp (tỷ VND)
  grossMargin: number; // Biên lãi gộp (%)
  operatingExpenses: number; // Chi phí bán hàng & QLDN (SG&A)
  financialIncome: number; // Doanh thu tài chính
  financialExpenses: number; // Chi phí tài chính
  interestExpense: number; // Chi phí lãi vay
  operatingProfit: number; // Lợi nhuận từ HĐKD (EBIT)
  ebitda: number; // EBITDA
  profitBeforeTax: number; // LNTT (EBT)
  netIncome: number; // LNST của CĐ công ty mẹ
  netMargin: number; // Biên lãi ròng (%)
  eps: number; // Lãi cơ bản trên cổ phiếu (VND)
  growthYoYRevenue?: number; // Tăng trưởng Doanh thu YoY (%)
  growthYoYProfit?: number; // Tăng trưởng LNST YoY (%)
}

export interface BalanceSheetItem {
  period: string;
  currentAssets: number; // Tài sản ngắn hạn (tỷ VND)
  cashAndEquivalents: number; // Tiền & tương đương tiền
  shortTermInvestments: number; // Đầu tư tài chính ngắn hạn (tiền gửi kỳ hạn)
  accountsReceivable: number; // Phải thu ngắn hạn khách hàng
  inventories: number; // Hàng tồn kho
  otherCurrentAssets: number; // Tài sản ngắn hạn khác
  nonCurrentAssets: number; // Tài sản dài hạn
  fixedAssets: number; // Tài sản cố định ròng
  constructionInProgress: number; // Chi phí XDCB dở dang
  totalAssets: number; // TỔNG TÀI SẢN
  currentLiabilities: number; // Nợ ngắn hạn
  shortTermDebt: number; // Vay nợ tài chính ngắn hạn
  nonCurrentLiabilities: number; // Nợ dài hạn
  longTermDebt: number; // Vay nợ tài chính dài hạn
  totalLiabilities: number; // TỔNG NỢ PHẢI TRẢ
  totalDebt: number; // Tổng nợ vay tài chính (ngắn + dài hạn)
  equity: number; // VỐN CHỦ SỞ HỮU
  charterCapital: number; // Vốn điều lệ
  retainedEarnings: number; // LNST chưa phân phối
  totalResources: number; // TỔNG NGUỒN VỐN (= Tổng tài sản)
}

export interface CashFlowItem {
  period: string;
  cfo: number; // Dòng tiền thuần từ HĐKD (Operating Cash Flow)
  cfi: number; // Dòng tiền thuần từ HĐ Đầu tư (Investing Cash Flow)
  capex: number; // Chi mua sắm TSCĐ (Capital Expenditure, số âm)
  cff: number; // Dòng tiền thuần từ HĐ Tài chính (Financing Cash Flow)
  dividendPaid: number; // Cổ tức tiền mặt đã trả (số âm)
  netCashFlow: number; // Lưu chuyển tiền thuần trong kỳ
  freeCashFlow: number; // Dòng tiền tự do FCF = CFO + capex
  endingCash: number; // Tiền & tương đương tiền cuối kỳ
}

export interface FinancialStatementPeriodData {
  period: string;
  income: IncomeStatementItem;
  balance: BalanceSheetItem;
  cashflow: CashFlowItem;
}

export interface DuPontAnalysis {
  netMargin: number; // Biên lợi nhuận ròng (%)
  assetTurnover: number; // Vòng quay tài sản (lần)
  equityMultiplier: number; // Đòn bẩy tài chính (Tổng tài sản / Vốn CSH)
  calculatedROE: number; // ROE = Margin * Turnover * Leverage (%)
  primaryDriver: 'Hiệu quả biên lợi nhuận' | 'Vòng quay tài sản nhanh' | 'Đòn bẩy tài chính cao';
  interpretation: string;
}

export interface FinancialHealthMetrics {
  currentRatio: number; // Thanh toán hiện hành
  quickRatio: number; // Thanh toán nhanh
  cashRatio: number; // Thanh toán tiền mặt
  interestCoverage: number; // EBIT / Chi phí lãi vay
  dso: number; // Số ngày thu tiền bình quân (Days Sales Outstanding)
  dio: number; // Số ngày tồn kho bình quân (Days Inventory Outstanding)
  dpo: number; // Số ngày phải trả bình quân (Days Payable Outstanding)
  ccc: number; // Chu kỳ chuyển đổi tiền mặt (CCC = DIO + DSO - DPO)
  cfoToNetIncomeRatio: number; // CFO / Net Income
  debtToEbitda: number; // Nợ vay / EBITDA
  netDebtToEquity: number; // (Nợ vay - Tiền) / Vốn CSH
}

export interface PiotroskiScoreCriterion {
  code: string; // e.g. "F1", "F2", ... "F9"
  title: string;
  category: 'Khả năng sinh lời' | 'Đòn bẩy & Thanh khoản' | 'Hiệu quả hoạt động';
  passed: boolean;
  actualValue: string;
  benchmark: string;
  accountingMeaning: string;
}

export interface FinancialStatementsPackage {
  annual: FinancialStatementPeriodData[];
  quarterly: FinancialStatementPeriodData[];
  dupont: DuPontAnalysis;
  healthMetrics: FinancialHealthMetrics;
  piotroskiDetailed: PiotroskiScoreCriterion[];
  auditVerdict: {
    status: 'Rất lành mạnh' | 'Ổn định' | 'Cảnh báo rủi ro' | 'Nguy cơ cao';
    cashFlowWarning: boolean;
    debtStressWarning: boolean;
    dilutionWarning: boolean;
    auditNote: string;
  };
}

export interface StockData {
  symbol: string;
  name: string;
  exchange: 'HOSE' | 'HNX' | 'UPCoM' | 'NASDAQ' | 'NYSE';
  sector: string;
  industry: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  dayOpen: number;
  volume: number;
  averageVolume: number;
  week52High: number;
  week52Low: number;
  marketCap: number; // in billion VND or USD
  sharesOutstanding: number; // in million shares
  foreignOwnershipPercent: number;

  // Fundamental Ratios
  pe: number;
  industryPE: number;
  pb: number;
  industryPB: number;
  roe: number; // %
  roa: number; // %
  eps: number; // VND or USD
  bvps: number; // Book Value Per Share
  netMargin: number; // %
  revenueGrowth: number; // %
  profitGrowth: number; // %
  debtEquity: number;
  dividendYield: number; // %
  beta: number;

  // Valuation
  valuation: FairValueEstimates;

  // Technical summary
  technicals: TechnicalIndicators;

  // Historical data series
  history: {
    '1D': PriceBar[];
    '1M': PriceBar[];
    '6M': PriceBar[];
    '1Y': PriceBar[];
    '5Y': PriceBar[];
  };

  // Company intro & description
  description: string;
  highlights: string[];

  // Related news
  news: NewsItem[];

  // Advanced Investment Decision & Scorecard
  scorecard?: InvestmentScorecard;
  allocationPlan?: CapitalAllocationPlan;

  // Financial Statements Data Package (BCTC Đầy Đủ)
  financialStatements?: FinancialStatementsPackage;

  // Real-Time Data Connection Info
  isRealData?: boolean;
  realDataSource?: string;
  lastUpdated?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  currentValue: number;
  change: number;
  changePercent: number;
  volume: number;
  updatedTime: string;
}

export interface InvestmentChecklistItem {
  id: string;
  title: string;
  category: 'Sức khỏe tài chính' | 'Tăng trưởng & Lợi thế' | 'Định giá & Biên an toàn' | 'Dòng tiền & Kỹ thuật' | 'Quản trị & Vĩ mô';
  passed: boolean;
  valueText: string;
  benchmarkText: string;
  impact: 'Quan trọng' | 'Rất quan trọng' | 'Tham khảo';
  explanation: string;
}

export interface InvestmentScorecard {
  totalScore: number; // 0 - 100
  rank: 'A+ (Xuất sắc - Nên giải ngân mạnh)' | 'A (Tốt - Đạt chuẩn đầu tư)' | 'B (Khá - Phù hợp tích lũy/lướt sóng)' | 'C (Trung bình - Cần quan sát)' | 'D (Yếu - Tránh tham gia)';
  financialHealthScore: number; // /25
  growthScore: number; // /25
  valuationScore: number; // /20
  momentumScore: number; // /15
  governanceScore: number; // /15
  piotroskiFScore: number; // 0 - 9
  altmanZScore: number;
  altmanZStatus: 'Vùng An toàn (>2.99)' | 'Vùng Xám (1.81 - 2.99)' | 'Vùng Nguy hiểm (<1.81)';
  roic: number; // Return on Invested Capital %
  pegRatio: number; // P/E / Growth
  cashFlowQuality: 'Thặng dư tiền mặt vượt trội (OCF > NI)' | 'Ổn định' | 'Cần lưu ý lợi nhuận ảo';
  interestCoverage: number; // EBIT / Interest
  checklist: InvestmentChecklistItem[];
}

export interface CapitalAllocationPlan {
  maxPortfolioWeight: number; // % NAV (e.g. 20%)
  riskProfile: 'Tích sản an toàn' | 'Tăng trưởng cân bằng' | 'Tấn công lướt sóng';
  stages: {
    stage: number;
    name: string;
    percentage: number;
    action: string;
    targetPriceCondition: string;
    riskRule: string;
  }[];
  riskRewardRatio: string;
  maxLossTolerated: number; // %
}

export interface AIAnalysisResult {
  recommendation: 'MUA MẠNH' | 'MUA' | 'NẮM GIỮ' | 'BÁN' | 'BÁN MẠNH';
  recommendationReason: string;
  targetPriceShortTerm: number;
  targetPriceLongTerm: number;
  stopLossPrice: number;
  fairValueEstimated: number;
  marginOfSafetyPercent: number;
  valuationStatus: 'Dưới giá trị (Hấp dẫn)' | 'Định giá hợp lý' | 'Định giá cao (Đắt)';
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao';
  riskRewardRatio: string;
  investmentHorizons: {
    shortTerm: {
      strategy: string;
      action: string;
      entryZone: string;
      target: string;
      stopLoss: string;
    };
    mediumTerm: {
      strategy: string;
      action: string;
      catalysts: string;
    };
    longTerm: {
      strategy: string;
      action: string;
      competitiveMoat: string;
    };
  };
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  catalysts: string[];
  risks: string[];
  expertSummary: string;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  quantity: number;
  buyDate: string;
  notes?: string;
  targetWeight?: number; // % mục tiêu trong danh mục
}

export type AllocationStrategy =
  | 'CONSERVATIVE' // Thận trọng (40% Tiền/Trái phiếu, 40% Trụ cổ tức, 20% Tăng trưởng)
  | 'BALANCED'     // Cân bằng (20% Tiền mặt, 50% Cổ phiếu Lõi Core, 30% Vệ tinh Satellite)
  | 'AGGRESSIVE'   // Tăng trưởng cao (10% Tiền mặt, 60% Midcap tăng trưởng, 30% Động lượng)
  | 'BARBELL'      // Quả tạ (70% Siêu an toàn + 30% Tăng trưởng bùng nổ)
  | 'CUSTOM';      // Tùy chỉnh tự chọn

export interface PortfolioCapitalSettings {
  totalCapital: number; // Tổng vốn NAV dự kiến (VND)
  cashReserve: number;  // Số dư tiền mặt dự phòng (VND)
  strategy: AllocationStrategy;
  maxRiskPerTradePercent: number; // Tỷ lệ rủi ro tối đa mỗi lệnh (ví dụ 1.5% - 2%)
  maxSectorConcentration: number; // Trần tỷ trọng cho một ngành (ví dụ 30%)
  targetAllocations: Record<string, number>; // symbol -> % tỷ trọng mục tiêu
}

export interface PositionSizingCalculation {
  symbol: string;
  stockName: string;
  currentPrice: number;
  plannedBuyPrice: number;
  stopLossPrice: number;
  targetPrice: number;
  riskPercentOfNav: number; // % rủi ro chấp nhận trên NAV (ví dụ 1.5%)
  riskPerShare: number; // VND lỗ trên 1 cổ
  maxLossAmount: number; // Tổng số tiền chấp nhận mất tối đa
  recommendedShares: number; // Số lượng cổ phiếu tối ưu (làm tròn lô 100)
  totalInvestmentValue: number; // Tổng giá trị lệnh (VND)
  portfolioWeightPercent: number; // % chiếm trong tổng danh mục
  riskRewardRatio: string; // Tỷ lệ Lợi nhuận / Rủi ro
  warningNotes: string[];
}

export interface RebalanceRecommendation {
  symbol: string;
  stockName: string;
  currentValue: number;
  currentWeight: number; // %
  targetWeight: number;  // %
  diffWeight: number;    // current - target
  diffAmount: number;    // VND
  actionType: 'BUY' | 'SELL' | 'HOLD';
  recommendedShares: number; // Lô 100 cổ phiếu
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export type AlertCondition = 'ABOVE' | 'BELOW';

export interface PriceAlert {
  id: string;
  symbol: string;
  stockName: string;
  targetPrice: number;
  condition: AlertCondition;
  initialPrice: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  note?: string;
  soundEnabled?: boolean;
}

