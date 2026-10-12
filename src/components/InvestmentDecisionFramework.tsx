import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Scale,
  PieChart,
  Sliders,
  DollarSign,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  Briefcase,
  HelpCircle,
  Compass,
  FileCheck,
} from 'lucide-react';
import { StockData, InvestmentChecklistItem } from '../types/stock';
import { computeInvestmentScorecard, computeCapitalAllocationPlan } from '../data/mockStockData';

interface InvestmentDecisionFrameworkProps {
  stock: StockData;
  onOpenAiAdviceTab: () => void;
}

export const InvestmentDecisionFramework: React.FC<InvestmentDecisionFrameworkProps> = ({
  stock,
  onOpenAiAdviceTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedProfile, setSelectedProfile] = useState<'safe' | 'balanced' | 'aggressive'>('balanced');

  const scorecard = stock.scorecard || computeInvestmentScorecard(stock);
  const allocation = stock.allocationPlan || computeCapitalAllocationPlan(stock);

  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Filter checklist
  const categories = [
    'Tất cả',
    'Sức khỏe tài chính',
    'Tăng trưởng & Lợi thế',
    'Định giá & Biên an toàn',
    'Dòng tiền & Kỹ thuật',
    'Quản trị & Vĩ mô',
  ];

  const filteredChecklist = scorecard.checklist.filter(
    (item) => selectedCategory === 'Tất cả' || item.category === selectedCategory
  );

  const passedCount = scorecard.checklist.filter((c) => c.passed).length;
  const totalCount = scorecard.checklist.length;
  const passedPercent = Math.round((passedCount / totalCount) * 100);

  // Profile-specific recommendation
  const profileDetails = {
    safe: {
      name: 'Tích Sản An Toàn (Value & Dividend)',
      suitability:
        scorecard.financialHealthScore >= 18 && stock.dividendYield >= 2
          ? 'RẤT PHÙ HỢP'
          : 'TRUNG BÌNH',
      color: 'emerald',
      summary:
        'Ưu tiên bảng cân đối kế toán lành mạnh, nợ vay thấp (D/E < 0.8), dòng tiền kinh doanh thặng dư và cổ tức tiền mặt chi trả đều đặn hàng năm.',
      keyCondition: `F-Score: ${scorecard.piotroskiFScore}/9 | Z-Score: ${scorecard.altmanZScore} (${scorecard.altmanZStatus})`,
    },
    balanced: {
      name: 'Tăng Trưởng Cân Bằng (GARP - Growth at a Reasonable Price)',
      suitability:
        scorecard.growthScore >= 18 && scorecard.valuationScore >= 14
          ? 'RẤT PHÙ HỢP'
          : 'PHÙ HỢP',
      color: 'indigo',
      summary:
        'Cân bằng hoàn hảo giữa tốc độ tăng trưởng EPS (+15%) và mức định giá hợp lý (PEG < 1.2x), hưởng lợi kép từ tăng trưởng vốn và biên an toàn.',
      keyCondition: `ROE: ${stock.roe}% | ROIC: ${scorecard.roic}% | PEG: ${scorecard.pegRatio}x`,
    },
    aggressive: {
      name: 'Tấn Công Lướt Sóng (CANSLIM & Momentum)',
      suitability:
        scorecard.momentumScore >= 11 && stock.profitGrowth >= 20
          ? 'RẤT PHÙ HỢP'
          : 'CẦN CHỜ ĐIỂM VÀO',
      color: 'amber',
      summary:
        'Tận dụng sức mạnh giá bứt phá vượt nền giá (Breakout) với thanh khoản lớn, nằm trên đường trung bình MA50 và RSI kiểm tra vùng tích cực.',
      keyCondition: `Xu hướng: ${stock.technicals.trend} | RSI: ${stock.technicals.currentRSI} | Tăng trưởng LN: +${stock.profitGrowth}%`,
    },
  };

  const currentProfile = profileDetails[selectedProfile];

  return (
    <div className="space-y-6">
      {/* 1. MASTER SCORECARD HERO (100 PTS) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Award className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Thang Điểm Quyết Định Đầu Tư Toàn Diện (Investment Scorecard)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Khung thẩm định 5 trụ cột chuẩn định chế tài chính kết hợp Piotroski F-Score, Altman Z-Score & PEG Peter Lynch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 text-xs font-black rounded-lg border flex items-center gap-1.5 ${
                scorecard.totalScore >= 80
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : scorecard.totalScore >= 65
                  ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                  : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              {scorecard.rank}
            </span>
          </div>
        </div>

        {/* Master Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Big Score Gauge (4 cols) */}
          <div className="md:col-span-4 bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center flex flex-col justify-center items-center">
            <div className="text-xs font-medium text-slate-400">Điểm Số Đánh Giá Tổng Hợp</div>
            <div className="my-2 relative flex items-center justify-center">
              <div className="text-5xl font-black tracking-tight text-emerald-400">
                {scorecard.totalScore}
              </div>
              <span className="text-slate-500 text-xl font-bold ml-1 self-end mb-1">/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${scorecard.totalScore}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-300 mt-2.5 font-medium">
              Vượt qua <strong className="text-emerald-400 font-bold">{passedCount}/{totalCount}</strong> tiêu chí thẩm định khắt khe ({passedPercent}%)
            </div>
          </div>

          {/* 5 Pillars Breakdown (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Pillar 1: Financial Health */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-semibold text-slate-300">1. Sức khỏe tài chính</span>
                <span className="font-mono font-bold text-emerald-400">
                  {scorecard.financialHealthScore}/25đ
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>• F-Score: <strong className="text-white">{scorecard.piotroskiFScore}/9</strong> (Lành mạnh)</div>
                <div>• Z-Score: <strong className="text-white">{scorecard.altmanZScore}</strong> (An toàn)</div>
                <div>• Nợ/VCSH: <strong className="text-white">{stock.debtEquity}x</strong></div>
              </div>
            </div>

            {/* Pillar 2: Growth & Profitability */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-semibold text-slate-300">2. Tăng trưởng & Hiệu quả</span>
                <span className="font-mono font-bold text-emerald-400">
                  {scorecard.growthScore}/25đ
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>• ROE: <strong className="text-emerald-400">{stock.roe}%</strong></div>
                <div>• ROIC: <strong className="text-cyan-400">{scorecard.roic}%</strong></div>
                <div>• Tăng trưởng LN: <strong className="text-white">+{stock.profitGrowth}%</strong></div>
              </div>
            </div>

            {/* Pillar 3: Valuation & Margin */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-semibold text-slate-300">3. Định giá & Biên an toàn</span>
                <span className="font-mono font-bold text-emerald-400">
                  {scorecard.valuationScore}/20đ
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>• Peter Lynch PEG: <strong className="text-white">{scorecard.pegRatio}x</strong></div>
                <div>• Biên an toàn: <strong className="text-emerald-400">+{stock.valuation.marginOfSafetyPercent}%</strong></div>
                <div>• P/E: <strong className="text-white">{stock.pe}x</strong> (Ngành: {stock.industryPE}x)</div>
              </div>
            </div>

            {/* Pillar 4: Technical & Momentum */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-semibold text-slate-300">4. Xung lực & Dòng tiền</span>
                <span className="font-mono font-bold text-emerald-400">
                  {scorecard.momentumScore}/15đ
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>• Xu hướng: <strong className="text-emerald-400">{stock.technicals.trend}</strong></div>
                <div>• Vị thế: <strong className="text-white">{stock.technicals.ma20Status}</strong></div>
                <div>• RSI: <strong className="text-white">{stock.technicals.currentRSI}</strong> (An toàn)</div>
              </div>
            </div>

            {/* Pillar 5: Moat & Governance */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-semibold text-slate-300">5. Quản trị & Hào kinh tế</span>
                <span className="font-mono font-bold text-emerald-400">
                  {scorecard.governanceScore}/15đ
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>• Biên LN ròng: <strong className="text-white">{stock.netMargin}%</strong></div>
                <div>• Cổ tức: <strong className="text-emerald-400">{stock.dividendYield}% / năm</strong></div>
                <div>• Khối ngoại: <strong className="text-white">{stock.foreignOwnershipPercent}%</strong></div>
              </div>
            </div>

            {/* Quick Verdict */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Khuyến nghị tổng kết:</span>
              <div className="text-sm font-black text-white mt-1">
                {scorecard.totalScore >= 75 ? 'Đủ Điều Kiện Giải Ngân' : 'Theo Dõi Tích Lũy'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tỷ lệ R:R thuận lợi {allocation.riskRewardRatio}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAPITAL ALLOCATION & 3-STAGE POSITION SIZING */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Kế Hoạch Quản Trị Vốn & Giải Ngân 3 Bước (Capital Allocation Strategy)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Chiến lược đi tiền kim tự tháp (30% - 30% - 40%) giúp hạn chế tối đa rủi ro mua đuổi đỉnh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-950/70 border border-indigo-700/60 rounded-lg text-xs font-bold text-indigo-300">
              Tỷ trọng tối đa: {allocation.maxPortfolioWeight}% NAV
            </span>
          </div>
        </div>

        {/* 3 Stages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allocation.stages.map((st) => (
            <div
              key={st.stage}
              className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4.5 space-y-3 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">
                      {st.stage}
                    </span>
                    {st.name}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold">
                    {st.percentage}% Vốn
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-200 font-medium">
                  {st.action}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>
                    <strong className="text-slate-300">Điều kiện kích hoạt:</strong> {st.targetPriceCondition}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 text-[11px] text-amber-300/90 font-medium flex items-start gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>Quy tắc rủi ro: {st.riskRule}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Discipline Rule Callout */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Kỷ luật cắt lỗ tuyệt đối:</strong> Nếu thị giá vi phạm ngưỡng cắt lỗ{' '}
              <strong className="text-rose-400">{formatMoney(stock.technicals.support2)}</strong> (-{allocation.maxLossTolerated}%), nhà đầu tư phải kiên quyết thoát vị thế để bảo toàn vốn gốc.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Tỷ lệ Lợi nhuận/Rủi ro: {allocation.riskRewardRatio}
          </span>
        </div>
      </div>

      {/* 3. INVESTOR PROFILE SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Kiểm Tra Mức Độ Phù Hợp Theo Khẩu Vị Đầu Tư Cá Nhân
            </h3>
          </div>

          {/* Profile Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setSelectedProfile('safe')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                selectedProfile === 'safe'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Tích Sản An Toàn
            </button>
            <button
              onClick={() => setSelectedProfile('balanced')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                selectedProfile === 'balanced'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Tăng Trưởng (GARP)
            </button>
            <button
              onClick={() => setSelectedProfile('aggressive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                selectedProfile === 'aggressive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Tấn Công Lướt Sóng
            </button>
          </div>
        </div>

        {/* Profile Result Box */}
        <div className="p-4.5 bg-slate-850/80 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Trường phái: {currentProfile.name}</span>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
              Đánh giá: {currentProfile.suitability}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{currentProfile.summary}</p>
          <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
            <span>
              <strong>Tiêu chí cốt lõi của trường phái:</strong> {currentProfile.keyCondition}
            </span>
            <button
              onClick={onOpenAiAdviceTab}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              Xem chi tiết khuyến nghị AI <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. INSTITUTIONAL CHECKLIST (12 CRITERIA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <FileCheck className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Bộ Tiêu Chí Thẩm Định Khắt Khe (Institutional 12-Checklist)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Kiểm tra toàn diện trước khi ký lệnh giải ngân, loại bỏ 100% rủi ro do cảm xúc
            </p>
          </div>

          <div className="text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
            Kết quả: <strong className="text-emerald-400 font-bold">{passedCount}/{totalCount}</strong> đạt chuẩn ({passedPercent}%)
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs pb-1">
          <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Lọc trụ cột:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredChecklist.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                item.passed
                  ? 'bg-slate-850/60 border-slate-750 hover:border-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white leading-snug truncate">
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                      item.impact === 'Rất quan trọng'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span>
                    Thực tế:{' '}
                    <strong className={item.passed ? 'text-emerald-400' : 'text-slate-300'}>
                      {item.valueText}
                    </strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    Chuẩn: <strong className="text-slate-300">{item.benchmarkText}</strong>
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-0.5">
                  {item.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
