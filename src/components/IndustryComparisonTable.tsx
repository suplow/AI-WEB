import React from 'react';
import {
  Scale,
  Award,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BarChart2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { StockData } from '../types/stock';
import { SECTOR_GROUPS } from '../data/sectors';
import { getOrGenerateStock } from '../data/mockStockData';

interface IndustryComparisonTableProps {
  stock: StockData;
  onSelectSymbol?: (symbol: string) => void;
}

export const IndustryComparisonTable: React.FC<IndustryComparisonTableProps> = ({
  stock,
  onSelectSymbol,
}) => {
  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Find sector of current stock
  const sector =
    SECTOR_GROUPS.find((sec) =>
      sec.stocks.some((s) => s.symbol.toUpperCase() === stock.symbol.toUpperCase())
    ) || SECTOR_GROUPS[0];

  const industryAvgPE = stock.industryPE || sector.averagePE;
  const industryAvgROE = sector.averageROE || 18.0;
  const industryAvgPB = stock.industryPB || 2.2;
  const industryAvgNetMargin = 14.0;

  // Extract constituent peer stocks (filter out current stock and take up to 4 peers)
  const peerList = sector.stocks
    .filter((s) => s.symbol.toUpperCase() !== stock.symbol.toUpperCase())
    .slice(0, 4)
    .map((s) => getOrGenerateStock(s.symbol));

  // Differences vs Industry Average
  const peDiffPercent = (((stock.pe - industryAvgPE) / industryAvgPE) * 100).toFixed(1);
  const roeDiffPts = (stock.roe - industryAvgROE).toFixed(1);
  const pbDiffPercent = (((stock.pb - industryAvgPB) / industryAvgPB) * 100).toFixed(1);

  // Competitive Positioning Analysis Logic
  const isRoeHigher = stock.roe > industryAvgROE;
  const isPeLower = stock.pe < industryAvgPE;

  let positioningTitle = '';
  let positioningDesc = '';
  let badgeColor = '';

  if (isRoeHigher && isPeLower) {
    positioningTitle = 'Vị Thế Siêu Cổ Phiếu Giá Trị (Lợi Thế Vượt Trội)';
    positioningDesc = `Hiệu quả sinh lời trên vốn chủ sở hữu ROE (${stock.roe}%) cao hơn mức trung bình ngành (+${roeDiffPts}% điểm), trong khi hệ số định giá P/E (${stock.pe}x) lại đang thấp hơn ngành (${peDiffPercent}%). Doanh nghiệp sở hữu hiệu quả kinh doanh xuất sắc nhưng đang giao dịch với mức giá chiết khấu hấp dẫn.`;
    badgeColor = 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300';
  } else if (isRoeHigher && !isPeLower) {
    positioningTitle = 'Vị Thế Tăng Trưởng Đầu Ngành (Premium Moat)';
    positioningDesc = `ROE đạt ${stock.roe}%, vượt trội mức bình quân ngành (+${roeDiffPts}% điểm). Thị trường chấp nhận định giá P/E ở mức ${stock.pe}x (cao hơn ngành ${peDiffPercent}%) nhờ thương hiệu đầu ngành, vị thế độc quyền hoặc rào cản gia nhập (Moat) kiên cố.`;
    badgeColor = 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300';
  } else if (!isRoeHigher && isPeLower) {
    positioningTitle = 'Vị Thế Định Giá Rẻ Theo Hiệu Quả Sinh Lời';
    positioningDesc = `Định giá P/E (${stock.pe}x) thấp hơn mức trung bình ngành (${industryAvgPE}x). Tỷ suất sinh lời ROE (${stock.roe}%) ở mức vừa phải, phù hợp với các nhà đầu tư ưa thích mua tài sản chiết khấu chờ chu kỳ phục hồi.`;
    badgeColor = 'bg-amber-950/90 border-amber-500/60 text-amber-300';
  } else {
    positioningTitle = 'Cần Theo Dõi Động Lực Tăng Trưởng Bổ Sung';
    positioningDesc = `Hệ số P/E (${stock.pe}x) đang cao hơn bình quân ngành trong khi ROE (${stock.roe}%) chưa bứt phá vượt trội. Cần các dự án mới hoặc kết quả kinh doanh quý tới đột biến để biện minh cho mức định giá hiện hành.`;
    badgeColor = 'bg-rose-950/90 border-rose-500/60 text-rose-300';
  }

  // All rows for table: Current stock, Peers, and Industry Average
  const allRows = [
    {
      symbol: stock.symbol,
      name: stock.name,
      isCurrent: true,
      isBenchmark: false,
      price: stock.currentPrice,
      pe: stock.pe,
      roe: stock.roe,
      pb: stock.pb,
      netMargin: stock.netMargin,
      eps: stock.eps,
      marketCap: stock.marketCap,
      status: isRoeHigher ? 'Dẫn đầu hiệu quả' : 'Đang cải thiện',
    },
    {
      symbol: `TB ${sector.shortName.toUpperCase()}`,
      name: `Mức Trung Bình Ngành ${sector.name}`,
      isCurrent: false,
      isBenchmark: true,
      price: 0,
      pe: industryAvgPE,
      roe: industryAvgROE,
      pb: industryAvgPB,
      netMargin: industryAvgNetMargin,
      eps: 0,
      marketCap: 0,
      status: 'Mốc tham chiếu chuẩn',
    },
    ...peerList.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      isCurrent: false,
      isBenchmark: false,
      price: p.currentPrice,
      pe: p.pe,
      roe: p.roe,
      pb: p.pb,
      netMargin: p.netMargin,
      eps: p.eps,
      marketCap: p.marketCap,
      status: p.roe >= industryAvgROE ? 'Vượt trội ngành' : 'Ngang mức ngành',
    })),
  ];

  // Visual bar max calculation
  const maxPE = Math.max(...allRows.map((r) => r.pe), 30);
  const maxROE = Math.max(...allRows.map((r) => r.roe), 35);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Scale className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              So Sánh Chỉ Số P/E, ROE Với Trung Bình Ngành & Doanh Nghiệp Cùng Ngành
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đánh giá sức mạnh cạnh tranh, định giá tương đối và hiệu quả sinh lời của{' '}
            <strong className="text-emerald-400">{stock.symbol}</strong> so với ngành{' '}
            <strong className="text-slate-200">{sector.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold">
            Ngành: {sector.name}
          </span>
        </div>
      </div>

      {/* Competitive Position Verdict Banner */}
      <div className={`p-4.5 rounded-xl border-2 ${badgeColor} space-y-2 shadow-lg`}>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 shrink-0" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide">
            {positioningTitle}
          </h4>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {positioningDesc}
        </p>
      </div>

      {/* 3 Metric Comparison Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* P/E Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Hệ số P/E (Định giá)</span>
            <span className="text-[10px] text-slate-500">Mã vs Ngành</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">{stock.pe}x</span>
            <span className="text-xs text-slate-400 font-mono">/ TB Ngành: {industryAvgPE}x</span>
          </div>
          <div className="text-xs mt-2 flex items-center gap-1 font-semibold">
            {Number(peDiffPercent) <= 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Thấp hơn ngành {Math.abs(Number(peDiffPercent))}% (Định giá rẻ hơn)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Cao hơn ngành +{peDiffPercent}% (Mức giá Premium)
              </span>
            )}
          </div>
        </div>

        {/* ROE Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Hiệu quả ROE (Sinh lời vốn)</span>
            <span className="text-[10px] text-slate-500">Mã vs Ngành</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">{stock.roe}%</span>
            <span className="text-xs text-slate-400 font-mono">/ TB Ngành: {industryAvgROE}%</span>
          </div>
          <div className="text-xs mt-2 flex items-center gap-1 font-semibold">
            {Number(roeDiffPts) >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Vượt trội ngành +{roeDiffPts}% điểm (Lợi nhuận vượt trội)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Thấp hơn ngành {roeDiffPts}% điểm
              </span>
            )}
          </div>
        </div>

        {/* P/B & Net Margin Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Biên Lợi Nhuận Ròng (Net Margin)</span>
            <span className="text-[10px] text-slate-500">Mã vs Ngành</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">{stock.netMargin}%</span>
            <span className="text-xs text-slate-400 font-mono">/ TB Ngành: {industryAvgNetMargin}%</span>
          </div>
          <div className="text-xs mt-2 flex items-center gap-1 font-semibold">
            {stock.netMargin >= industryAvgNetMargin ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Biên lợi nhuận dày hơn trung bình ngành
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                Tương đương mức trung bình ngành
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Peer Comparison Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Doanh Nghiệp / Cổ Phiếu</th>
                <th className="py-3 px-3 text-right">Thị Giá</th>
                <th className="py-3 px-3 text-right text-indigo-300">P/E (lần)</th>
                <th className="py-3 px-3 text-right text-emerald-300">ROE (%)</th>
                <th className="py-3 px-3 text-right">P/B (lần)</th>
                <th className="py-3 px-3 text-right">Biên LN (%)</th>
                <th className="py-3 px-3 text-right">EPS</th>
                <th className="py-3 px-4 text-center">Đánh Giá Vị Thế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {allRows.map((row, idx) => {
                const isSelected = row.symbol === stock.symbol;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/40 text-white font-bold border-l-4 border-l-emerald-500'
                        : row.isBenchmark
                        ? 'bg-slate-850/70 text-indigo-300 font-semibold italic'
                        : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    {/* Symbol & Name */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        {row.isBenchmark ? (
                          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectSymbol && onSelectSymbol(row.symbol)}
                            disabled={isSelected}
                            className={`font-black tracking-wider text-xs ${
                              isSelected
                                ? 'text-emerald-400'
                                : 'text-slate-200 hover:text-emerald-400 hover:underline cursor-pointer'
                            }`}
                          >
                            {row.symbol}
                          </button>
                        )}

                        <div className="truncate max-w-[160px] sm:max-w-[220px]">
                          <div className="truncate text-xs">{row.name}</div>
                          {isSelected && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold uppercase inline-block">
                              Đang phân tích
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="py-3 px-3 text-right font-bold text-slate-100">
                      {row.price > 0 ? formatMoney(row.price) : '—'}
                    </td>

                    {/* P/E */}
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        row.pe < industryAvgPE
                          ? 'text-emerald-400'
                          : row.pe > industryAvgPE * 1.2
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {row.pe}x
                    </td>

                    {/* ROE */}
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        row.roe >= industryAvgROE
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.roe}%
                    </td>

                    {/* P/B */}
                    <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                      {row.pb}x
                    </td>

                    {/* Net Margin */}
                    <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                      {row.netMargin}%
                    </td>

                    {/* EPS */}
                    <td className="py-3 px-3 text-right text-slate-400">
                      {row.eps > 0 ? formatMoney(row.eps) : '—'}
                    </td>

                    {/* Position Status Badge */}
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.isBenchmark
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                            : isSelected
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                            : row.roe >= industryAvgROE
                            ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Bar Comparison for P/E & ROE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* P/E Visual Comparison Bar */}
        <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              So Sánh Hệ Số Định Giá P/E (Thấp hơn là rẻ hơn)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              TB Ngành: {industryAvgPE}x
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {allRows.map((r, i) => {
              const pct = Math.min(100, Math.max(5, (r.pe / maxPE) * 100));
              const isCurr = r.symbol === stock.symbol;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        isCurr ? 'text-emerald-400 font-bold' : r.isBenchmark ? 'text-indigo-300 italic' : 'text-slate-300'
                      }`}
                    >
                      {r.symbol}
                    </span>
                    <span className="font-mono text-slate-300 font-bold">{r.pe}x</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCurr
                          ? 'bg-emerald-500'
                          : r.isBenchmark
                          ? 'bg-indigo-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROE Visual Comparison Bar */}
        <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              So Sánh Tỷ Suất Sinh Lời ROE (Cao hơn là tốt hơn)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              TB Ngành: {industryAvgROE}%
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {allRows.map((r, i) => {
              const pct = Math.min(100, Math.max(5, (r.roe / maxROE) * 100));
              const isCurr = r.symbol === stock.symbol;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        isCurr ? 'text-emerald-400 font-bold' : r.isBenchmark ? 'text-indigo-300 italic' : 'text-slate-300'
                      }`}
                    >
                      {r.symbol}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{r.roe}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCurr
                          ? 'bg-emerald-400'
                          : r.isBenchmark
                          ? 'bg-indigo-400'
                          : 'bg-slate-600'
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
  );
};
