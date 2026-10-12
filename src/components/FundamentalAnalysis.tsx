import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Award,
  BarChart3,
  Scale,
  Sparkles,
  Sliders,
  DollarSign,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { StockData } from '../types/stock';
import { computeValuation } from '../data/mockStockData';
import { IndustryComparisonTable } from './IndustryComparisonTable';
import { SectorAnalysis } from './SectorAnalysis';

interface FundamentalAnalysisProps {
  stock: StockData;
  onOpenAiAdviceTab: () => void;
  onOpenFinancialStatementsTab?: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export const FundamentalAnalysis: React.FC<FundamentalAnalysisProps> = ({
  stock,
  onOpenAiAdviceTab,
  onOpenFinancialStatementsTab,
  onSelectSymbol,
}) => {
  // Interactive valuation sliders
  const [growthRate, setGrowthRate] = useState<number>(stock.valuation.assumedGrowthRate || 18);
  const [targetPE, setTargetPE] = useState<number>(stock.valuation.targetPE || stock.industryPE || 18);

  // Recompute live valuation when sliders move with sector awareness
  const liveValuation = computeValuation(
    stock.currentPrice,
    stock.eps,
    stock.bvps,
    stock.roe,
    stock.industryPE,
    stock.industryPB,
    growthRate,
    targetPE,
    stock.sector,
    stock.symbol
  );

  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const currency = isUS ? '$' : 'đ';

  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  const isUndervalued = liveValuation.marginOfSafetyPercent > 10;
  const isOvervalued = liveValuation.marginOfSafetyPercent < -10;

  return (
    <div className="space-y-6">
      {/* 1. Fair Value Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ước Tính Giá Trị Hợp Lý & Biên An Toàn
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold rounded">
                {liveValuation.valuationModelTitle || 'Mô hình Định Giá Đa Phương Pháp'}
              </span>
              <p className="text-xs text-slate-400">
                {liveValuation.valuationExplanation || 'Tính toán định giá phù hợp theo đặc thù tài chính của ngành.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenFinancialStatementsTab && (
              <button
                onClick={onOpenFinancialStatementsTab}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Xem BCTC Đầy Đủ
              </button>
            )}
            <span
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                isUndervalued
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : isOvervalued
                  ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {liveValuation.status}
            </span>
          </div>
        </div>

        {/* Big Numbers Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Thị giá hiện tại</div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
              {formatMoney(stock.currentPrice)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Giá giao dịch khớp lệnh thực tế</div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-emerald-500/20">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <span>Giá trị hợp lý ước tính (Weighted Fair Value)</span>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-300 mt-1">
              {formatMoney(liveValuation.weightedFairValue)}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">
              Tổng hợp bình quân 4 phương pháp định giá
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Biên an toàn (Margin of Safety)</div>
            <div
              className={`text-2xl lg:text-3xl font-extrabold mt-1 flex items-center gap-1 ${
                liveValuation.marginOfSafetyPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {liveValuation.marginOfSafetyPercent >= 0 ? '+' : ''}
              {liveValuation.marginOfSafetyPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {liveValuation.marginOfSafetyPercent >= 15
                ? 'Biên an toàn rất cao, rủi ro điều chỉnh thấp'
                : liveValuation.marginOfSafetyPercent >= 0
                ? 'Định giá hợp lý, phù hợp tích lũy từng phần'
                : 'Thị giá đang cao hơn giá trị nội tại ước tính'}
            </div>
          </div>
        </div>

        {/* Visual Progress Spread */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Vùng chiết khấu sâu (Giá hời)</span>
            <span className="font-semibold text-slate-200">
              Thị giá: {formatMoney(stock.currentPrice)} vs Giá hợp lý:{' '}
              {formatMoney(liveValuation.weightedFairValue)}
            </span>
            <span>Vùng quá mua / Đắt</span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full relative overflow-hidden flex">
            <div className="w-1/3 bg-emerald-600/40 h-full border-r border-slate-700"></div>
            <div className="w-1/3 bg-amber-600/40 h-full border-r border-slate-700"></div>
            <div className="w-1/3 bg-rose-600/40 h-full"></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>&lt; -15% (Mua tích sản)</span>
            <span>-15% đến +15% (Vùng giá hợp lý)</span>
            <span>&gt; +15% (Chốt lời / Đắt)</span>
          </div>
        </div>

        {/* 4 Detailed Valuation Methods Cards - Customized per Sector Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          {liveValuation.valuationModelType === 'BANKING_FINANCIAL' ? (
            <>
              {/* Bank Method 1: Justified P/B */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">1. Justified P/B (ROE/Ke)</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    ROE: {stock.roe}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  P/B mục tiêu theo ROE & Chi phí vốn Ke = 11.5%
                </div>
              </div>

              {/* Bank Method 2: Residual Income Model */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">2. Thu Nhập Thặng Dư (RIM)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                    Chuẩn Ngân Hàng
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValueResidualIncome || liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dòng thu nhập thặng dư trên vốn CSH 5 năm
                </div>
              </div>

              {/* Bank Method 3: P/E Target */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">3. P/E Mục Tiêu</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    P/E: {targetPE}x
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePE)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  P = EPS ({formatMoney(stock.eps)}) × {targetPE}
                </div>
              </div>

              {/* Bank Method 4: Sector Note */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                  <span className="font-semibold">4. Đặc thù Ngân hàng</span>
                  <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded">
                    Lưu ý Kế toán
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-300 mt-1">
                  Loại trừ Graham & DCF do tiền gửi là nguồn vốn kinh doanh.
                </div>
                <div className="text-[10px] text-blue-400 mt-1">
                  Trọng số cao vào Justified P/B và Thu nhập thặng dư RIM.
                </div>
              </div>
            </>
          ) : liveValuation.valuationModelType === 'REAL_ESTATE' ? (
            <>
              {/* Real Estate Method 1: RNAV */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">1. RNAV Quỹ Đất</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Định giá dự án
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValueRNAV || liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Giá trị tài sản ròng định giá lại chiết khấu quỹ đất
                </div>
              </div>

              {/* Real Estate Method 2: P/B Chu kỳ */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">2. P/B Chu Kỳ Ngành</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    P/B: {stock.pb}x
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dựa trên BVPS ({formatMoney(stock.bvps)}) & P/B chu kỳ quỹ đất
                </div>
              </div>

              {/* Real Estate Method 3: P/E Chu kỳ bàn giao */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">3. P/E Chu Kỳ Bàn Giao</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    P/E: {targetPE}x
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePE)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  P = EPS ({formatMoney(stock.eps)}) × {targetPE}
                </div>
              </div>

              {/* Real Estate Method 4: Note */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                  <span className="font-semibold">4. Đặc thù Bất động sản</span>
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded">
                    Pháp lý dự án
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-300 mt-1">
                  Doanh thu hạch toán giật cục theo tiến độ bàn giao nhà.
                </div>
                <div className="text-[10px] text-amber-400 mt-1">
                  Theo dõi sát tiến độ pháp lý & nợ vay trái phiếu.
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Method 1: P/E multiple */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">1. P/E Chuẩn Ngành</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    P/E: {targetPE}x
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePE)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  P = EPS ({formatMoney(stock.eps)}) × {targetPE}
                </div>
              </div>

              {/* Method 2: P/B & ROE */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">2. P/B - Hiệu quả ROE</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    ROE: {stock.roe}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dựa trên BVPS ({formatMoney(stock.bvps)}) & Chi phí vốn 11%
                </div>
              </div>

              {/* Method 3: Graham */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">3. Benjamin Graham</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    Giá trị bảo thủ
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValueGraham || liveValuation.fairValuePB)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Công thức định giá bảo thủ của Warren Buffett & Graham
                </div>
              </div>

              {/* Method 4: DCF */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">4. Chiết Khấu DCF</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                    g = {growthRate}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(liveValuation.fairValueDCF || liveValuation.fairValuePE)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dòng tiền 5 năm chiết khấu 11%, g dài hạn 4%
                </div>
              </div>
            </>
          )}
        </div>

        {/* Interactive Custom Scenario Sliders */}
        <div className="mt-6 p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Tùy chỉnh giả định định giá cá nhân (What-If Simulator)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Tốc độ tăng trưởng EPS kỳ vọng (g):</span>
                <span className="font-bold text-emerald-400">{growthRate}% / năm</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Thận trọng)</span>
                <span>18% (Cơ sở)</span>
                <span>40% (Lạc quan cao)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>P/E mục tiêu theo kỳ vọng:</span>
                <span className="font-bold text-emerald-400">{targetPE}x</span>
              </div>
              <input
                type="range"
                min="8"
                max="35"
                step="0.5"
                value={targetPE}
                onChange={(e) => setTargetPE(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>8x (Thấp)</span>
                <span>{stock.industryPE}x (Bình quân ngành)</span>
                <span>35x (Tăng trưởng cao)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Financial Ratios Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">Chỉ Số Tài Chính Cốt Lõi</h3>
              <p className="text-xs text-slate-400">
                Đánh giá sức khỏe tài chính, khả năng sinh lời và mức độ rủi ro vốn vay
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAiAdviceTab}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Xem nhận định chi tiết của AI
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* P/E Ratio */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">P/E (Hệ số giá / Lợi nhuận)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.pe}x</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>P/E ngành: {stock.industryPE}x</span>
              <span
                className={`font-semibold ${
                  stock.pe <= stock.industryPE ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {stock.pe <= stock.industryPE ? 'Thấp hơn ngành' : 'Cao hơn ngành'}
              </span>
            </div>
          </div>

          {/* EPS */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">EPS (Thu nhập trên mỗi CP)</div>
            <div className="text-2xl font-black text-white mt-1">
              {formatMoney(stock.eps)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              Tăng trưởng LN: +{stock.profitGrowth}% YoY
            </div>
          </div>

          {/* ROE */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">ROE (Tỷ suất sinh lời VCSH)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.roe}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stock.roe >= 20 ? (
                <span className="text-emerald-400 font-semibold">Xuất sắc (&gt; 20%)</span>
              ) : stock.roe >= 15 ? (
                <span className="text-emerald-400">Rất tốt (&gt; 15%)</span>
              ) : (
                <span>Mức trung bình</span>
              )}
            </div>
          </div>

          {/* P/B Ratio */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">P/B (Giá / Giá trị sổ sách)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.pb}x</div>
            <div className="text-[11px] text-slate-400 mt-1">
              BVPS: {formatMoney(stock.bvps)}
            </div>
          </div>

          {/* ROA */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">ROA (Sinh lời trên tổng tài sản)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.roa}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Hiệu quả quản lý tài sản</div>
          </div>

          {/* Net Margin */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Biên Lợi Nhuận Ròng (Net Margin)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.netMargin}%</div>
            <div className="text-[11px] text-emerald-400 mt-1">Biên lợi nhuận gộp dày</div>
          </div>

          {/* Debt / Equity */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Nợ vay / Vốn chủ sở hữu (D/E)</div>
            <div className="text-2xl font-black text-white mt-1">{stock.debtEquity}x</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stock.debtEquity <= 1.0 ? (
                <span className="text-emerald-400 font-semibold">Cực kỳ an toàn (&lt; 1.0x)</span>
              ) : (
                <span className="text-amber-400">Cần theo dõi chi phí lãi vay</span>
              )}
            </div>
          </div>

          {/* Dividend Yield */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Tỷ suất Cổ tức (Dividend Yield)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stock.dividendYield}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Chi trả đều đặn hàng năm</div>
          </div>
        </div>
      </div>

      {/* 3. Sector Analysis: Radar Chart & Top 5 Peers Summary */}
      <SectorAnalysis stock={stock} onSelectSymbol={onSelectSymbol} />

      {/* 4. Industry Peer Comparison Table (P/E & ROE) */}
      <IndustryComparisonTable stock={stock} onSelectSymbol={onSelectSymbol} />

      {/* 5. Company Overview & Moat Highlights */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Tổng Quan Hoạt Động & Lợi Thế Cạnh Tranh (Moat)</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{stock.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stock.highlights.map((hl, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-300"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
              <span>{hl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
