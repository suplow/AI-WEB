import React, { useState } from 'react';
import {
  Radar,
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { StockData } from '../types/stock';
import { SECTOR_GROUPS } from '../data/sectors';
import { getOrGenerateStock } from '../data/mockStockData';

interface SectorAnalysisProps {
  stock: StockData;
  onSelectSymbol?: (symbol: string) => void;
}

export const SectorAnalysis: React.FC<SectorAnalysisProps> = ({ stock, onSelectSymbol }) => {
  // Tab/view mode: 'radar' | 'table' | 'both'
  const [activeView, setActiveView] = useState<'radar' | 'table'>('radar');
  const [selectedPeerSymbol, setSelectedPeerSymbol] = useState<string | null>(null);

  // 1. Identify current stock's sector
  const sector =
    SECTOR_GROUPS.find((sec) =>
      sec.stocks.some((s) => s.symbol.toUpperCase() === stock.symbol.toUpperCase())
    ) || SECTOR_GROUPS[0];

  // 2. Identify top 5 industry peers (excluding current stock, or top 5 stocks in the sector)
  const peerSymbols = sector.stocks
    .filter((s) => s.symbol.toUpperCase() !== stock.symbol.toUpperCase())
    .slice(0, 5)
    .map((s) => s.symbol);

  // Load peer stock data
  const peersData: StockData[] = peerSymbols.map((sym) => getOrGenerateStock(sym));

  // Top 5 peer list including current stock if suitable, or top 5 peers to compare against
  const allComparedStocks = [stock, ...peersData];

  // Industry average benchmarks
  const avgROE = sector.averageROE || 18.0;
  const avgPE = stock.industryPE || sector.averagePE || 15.0;
  const avgNetMargin = 14.5;
  const avgRevGrowth = 16.0;
  const avgProfitGrowth = 18.0;

  // Formatting helpers
  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Radar chart metrics definition (5 axes: ROE, Định giá P/E (điểm nghịch đảo), Biên Lợi Nhuận, Tăng Trưởng LN, Sức Khỏe Tài Chính)
  // Scores normalized from 0 to 100 for radar presentation
  const getRadarScores = (s: StockData) => {
    // 1. ROE score (benchmark 20% = 80 pts)
    const roeScore = Math.min(100, Math.max(15, Math.round((s.roe / 30) * 100)));

    // 2. P/E valuation score (lower P/E is better value; 10x = 90 pts, 30x = 30 pts)
    const peScore = Math.min(100, Math.max(20, Math.round((1 - Math.min(s.pe, 40) / 45) * 100)));

    // 3. Biên Lợi Nhuận Ròng (Net Margin) score (25% = 90 pts)
    const marginScore = Math.min(100, Math.max(15, Math.round((s.netMargin / 30) * 100)));

    // 4. Tăng trưởng lợi nhuận YoY (30% = 90 pts)
    const growthScore = Math.min(100, Math.max(20, Math.round((s.profitGrowth / 35) * 100)));

    // 5. Sức khỏe tài chính / An toàn nợ (D/E thấp là tốt, <0.8 = 90 pts)
    const healthScore = Math.min(
      100,
      Math.max(25, Math.round((1 - Math.min(s.debtEquity, 2.5) / 2.8) * 100))
    );

    return {
      roe: roeScore,
      pe: peScore,
      margin: marginScore,
      growth: growthScore,
      health: healthScore,
    };
  };

  const currentScores = getRadarScores(stock);
  const selectedPeerStock = selectedPeerSymbol
    ? peersData.find((p) => p.symbol === selectedPeerSymbol) || peersData[0]
    : peersData[0];
  const peerScores = selectedPeerStock ? getRadarScores(selectedPeerStock) : null;

  // Industry average benchmark score
  const industryBenchmarkScores = {
    roe: Math.round((avgROE / 30) * 100),
    pe: Math.round((1 - Math.min(avgPE, 40) / 45) * 100),
    margin: Math.round((avgNetMargin / 30) * 100),
    growth: Math.round((avgProfitGrowth / 35) * 100),
    health: 65,
  };

  // Radar SVG Math
  const center = 160;
  const radius = 105;
  type RadarMetricKey = 'roe' | 'pe' | 'margin' | 'growth' | 'health';

  const axes: { key: RadarMetricKey; label: string; unit: string; desc: string }[] = [
    { key: 'roe', label: 'Tỷ suất ROE', unit: '%', desc: 'Hiệu quả sử dụng vốn' },
    { key: 'pe', label: 'Hấp dẫn P/E', unit: 'lần', desc: 'Định giá rẻ / đắt' },
    { key: 'margin', label: 'Biên Lợi Nhuận', unit: '%', desc: 'Sức mạnh định giá & Moat' },
    { key: 'growth', label: 'Tăng Trưởng LN', unit: '%', desc: 'Tốc độ mở rộng LNST' },
    { key: 'health', label: 'Sức Khỏe Nợ', unit: 'x', desc: 'An toàn cơ cấu vốn' },
  ];

  // Helper to calculate coordinates on radar
  const getCoordinates = (value: number, index: number, total: number) => {
    // Angle in radians, rotated so index 0 points straight up (-pi/2)
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build SVG polygon points path
  const makePolygonPath = (scores: Record<string, number>) => {
    return axes
      .map((axis, i) => {
        const val = scores[axis.key] || 50;
        const pt = getCoordinates(val, i, axes.length);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  };

  // Rank current stock in peer group
  const roeRank = [...allComparedStocks].sort((a, b) => b.roe - a.roe).findIndex((s) => s.symbol === stock.symbol) + 1;
  const peRank = [...allComparedStocks].sort((a, b) => a.pe - b.pe).findIndex((s) => s.symbol === stock.symbol) + 1;
  const marginRank = [...allComparedStocks].sort((a, b) => b.netMargin - a.netMargin).findIndex((s) => s.symbol === stock.symbol) + 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-6">
      {/* 1. Header with Badge & View Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Radar className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Phân Tích So Sánh Ngành (Sector Analysis)
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 ml-1">
              Top 5 Cổ Phiếu Cùng Ngành
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đánh giá hiệu quả cạnh tranh của <strong className="text-emerald-400">{stock.symbol}</strong> so với 5 doanh nghiệp hàng đầu ngành{' '}
            <strong className="text-cyan-300">{sector.name}</strong> qua bộ ba chỉ số cốt lõi: <strong>ROE</strong>, <strong>P/E</strong> và <strong>Biên Lợi Nhuận</strong>.
          </p>
        </div>

        {/* View Switcher (Radar vs Summary Table) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-800/90 p-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
            <button
              onClick={() => setActiveView('radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'radar'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              Biểu Đồ Radar
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Bảng Tóm Tắt Chi Tiết
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Scorecard: Quick Ranking Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* ROE Ranking */}
        <div className="bg-slate-850/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Thứ Hạng ROE (Vốn)</div>
            <div className="text-lg font-black text-white mt-0.5 flex items-baseline gap-1.5">
              <span className="text-emerald-400">#{roeRank}</span>
              <span className="text-xs text-slate-400 font-normal">/ {allComparedStocks.length} doanh nghiệp</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              ROE đạt <span className="font-bold text-emerald-300">{stock.roe}%</span> (TB ngành: {avgROE}%)
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* P/E Valuation Ranking */}
        <div className="bg-slate-850/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Định Giá P/E (Thấp là rẻ)</div>
            <div className="text-lg font-black text-white mt-0.5 flex items-baseline gap-1.5">
              <span className={stock.pe <= avgPE ? 'text-emerald-400' : 'text-amber-400'}>
                #{peRank}
              </span>
              <span className="text-xs text-slate-400 font-normal">/ {allComparedStocks.length} doanh nghiệp</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              P/E hiện tại <span className="font-bold text-slate-200">{stock.pe}x</span> (TB ngành: {avgPE}x)
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Net Margin Ranking */}
        <div className="bg-slate-850/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Biên Lợi Nhuận Ròng (Moat)</div>
            <div className="text-lg font-black text-white mt-0.5 flex items-baseline gap-1.5">
              <span className="text-cyan-400">#{marginRank}</span>
              <span className="text-xs text-slate-400 font-normal">/ {allComparedStocks.length} doanh nghiệp</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Biên ròng <span className="font-bold text-cyan-300">{stock.netMargin}%</span> (TB ngành: {avgNetMargin}%)
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Main Interactive Content (Radar Chart Mode or Detailed Summary Table) */}
      {activeView === 'radar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart SVG Area (7 cols on large) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/90 rounded-xl p-5 relative">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Radar className="w-4 h-4 text-cyan-400" />
                Đa Giác Năng Lực 5 Chiều
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Thang điểm chuẩn hóa: 0 - 100
              </span>
            </div>

            {/* Radar SVG Container */}
            <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
              <svg
                viewBox="0 0 320 320"
                className="w-full h-full overflow-visible select-none drop-shadow-md"
              >
                {/* Background Concentric Radar Polygons (20%, 40%, 60%, 80%, 100%) */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, lvlIdx) => {
                  const ringPoints = axes
                    .map((_, i) => {
                      const pt = getCoordinates(level * 100, i, axes.length);
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');

                  return (
                    <polygon
                      key={lvlIdx}
                      points={ringPoints}
                      fill={lvlIdx === 4 ? '#0f172a' : lvlIdx % 2 === 0 ? '#1e293b22' : 'none'}
                      stroke="#334155"
                      strokeWidth={lvlIdx === 4 ? '1.5' : '1'}
                      strokeDasharray={lvlIdx === 4 ? 'none' : '2,2'}
                      opacity={0.8}
                    />
                  );
                })}

                {/* Radar Spoke Axes */}
                {axes.map((axis, i) => {
                  const outer = getCoordinates(100, i, axes.length);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="#475569"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  );
                })}

                {/* Industry Average Benchmark Polygon (Indigo dotted) */}
                <polygon
                  points={makePolygonPath(industryBenchmarkScores)}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  opacity={0.7}
                />

                {/* Selected Peer Polygon (Amber fill) */}
                {peerScores && (
                  <polygon
                    points={makePolygonPath(peerScores)}
                    fill="rgba(245, 158, 11, 0.18)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeOpacity={0.85}
                  />
                )}

                {/* Current Stock Polygon (Cyan / Emerald vibrant fill) */}
                <polygon
                  points={makePolygonPath(currentScores)}
                  fill="rgba(6, 182, 212, 0.28)"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Data Points on Current Stock Polygon */}
                {axes.map((axis, i) => {
                  const val = currentScores[axis.key];
                  const pt = getCoordinates(val, i, axes.length);
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-cyan-400 stroke-slate-900 stroke-2"
                    />
                  );
                })}

                {/* Axis Labels (Positioned outside radar) */}
                {axes.map((axis, i) => {
                  const labelPt = getCoordinates(126, i, axes.length);
                  return (
                    <g key={i}>
                      <text
                        x={labelPt.x}
                        y={labelPt.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-200 text-[10px] font-bold tracking-tight"
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Radar Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30"></span>
                <span className="font-bold text-white">{stock.symbol} (Đang xem)</span>
              </div>

              {selectedPeerStock && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-500/30"></span>
                  <span className="font-semibold text-amber-300">
                    {selectedPeerStock.symbol} (Đối thủ so sánh)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-indigo-400 border-dashed"></span>
                <span className="font-medium text-indigo-300">TB Ngành {sector.shortName}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Comparative Peer Selector & Metric Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Peer Switcher Chips */}
            <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Chọn đối thủ cùng ngành so sánh:
                </span>
                <span className="text-[11px] text-slate-400">Top 5 mã</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {peersData.map((peer) => {
                  const isCurrentSelectedPeer =
                    (selectedPeerSymbol || peersData[0]?.symbol) === peer.symbol;

                  return (
                    <button
                      key={peer.symbol}
                      onClick={() => setSelectedPeerSymbol(peer.symbol)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                        isCurrentSelectedPeer
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{peer.symbol}</span>
                      <span className="text-[10px] font-normal text-slate-400 truncate">
                        ROE: {peer.roe}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Head-to-Head Stats Card */}
            {selectedPeerStock && (
              <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-slate-200">
                    So sánh trực tiếp: {stock.symbol} vs {selectedPeerStock.symbol}
                  </div>
                  {onSelectSymbol && (
                    <button
                      onClick={() => onSelectSymbol(selectedPeerStock.symbol)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Mở {selectedPeerStock.symbol}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 3 Core Metric Comparison Meters */}
                <div className="space-y-3 text-xs">
                  {/* ROE */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Tỷ suất sinh lời ROE</span>
                      <div className="font-mono">
                        <span className="text-cyan-400 font-bold">{stock.roe}%</span>
                        <span className="text-slate-500 mx-1.5">vs</span>
                        <span className="text-amber-400 font-bold">{selectedPeerStock.roe}%</span>
                      </div>
                    </div>
                    <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${Math.min(100, (stock.roe / 35) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* P/E Ratio */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Hệ số định giá P/E</span>
                      <div className="font-mono">
                        <span className="text-cyan-400 font-bold">{stock.pe}x</span>
                        <span className="text-slate-500 mx-1.5">vs</span>
                        <span className="text-amber-400 font-bold">{selectedPeerStock.pe}x</span>
                      </div>
                    </div>
                    <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${Math.min(100, (stock.pe / 30) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Net Profit Margin */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Biên Lợi Nhuận Ròng</span>
                      <div className="font-mono">
                        <span className="text-cyan-400 font-bold">{stock.netMargin}%</span>
                        <span className="text-slate-500 mx-1.5">vs</span>
                        <span className="text-amber-400 font-bold">{selectedPeerStock.netMargin}%</span>
                      </div>
                    </div>
                    <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${Math.min(100, (stock.netMargin / 35) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Summary Takeaway Insight */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  {stock.roe >= selectedPeerStock.roe && stock.pe <= selectedPeerStock.pe ? (
                    <span className="text-emerald-400 font-medium">
                      ✓ {stock.symbol} có lợi thế vượt trội hoàn toàn: ROE cao hơn và định giá P/E hấp dẫn hơn {selectedPeerStock.symbol}.
                    </span>
                  ) : stock.roe >= selectedPeerStock.roe ? (
                    <span className="text-cyan-300 font-medium">
                      ✓ {stock.symbol} sinh lời vốn (ROE) tốt hơn (+{(stock.roe - selectedPeerStock.roe).toFixed(1)}%), dù định giá P/E có phần cao hơn.
                    </span>
                  ) : stock.pe <= selectedPeerStock.pe ? (
                    <span className="text-amber-300 font-medium">
                      ✓ {stock.symbol} đang có mức giá P/E chiết khấu tốt hơn {selectedPeerStock.symbol} ({stock.pe}x so với {selectedPeerStock.pe}x).
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      {selectedPeerStock.symbol} đang có các chỉ số tài chính cạnh tranh sát sao với {stock.symbol}.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Summary Comparison Table of Stock vs Top 5 Peers */
        <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-850 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã Cổ Phiếu / Doanh Nghiệp</th>
                  <th className="py-3 px-3 text-right">Thị Giá</th>
                  <th className="py-3 px-3 text-right text-emerald-300">ROE (%)</th>
                  <th className="py-3 px-3 text-right text-cyan-300">P/E (lần)</th>
                  <th className="py-3 px-3 text-right text-indigo-300">Biên Ròng (%)</th>
                  <th className="py-3 px-3 text-right">P/B (lần)</th>
                  <th className="py-3 px-3 text-right">Tăng Trưởng LN</th>
                  <th className="py-3 px-4 text-center">Vị Thế Ngành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {/* 1. Benchmark Industry Average Row */}
                <tr className="bg-slate-850/80 text-indigo-300 font-semibold italic">
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">TB Ngành {sector.shortName}</div>
                        <div className="text-[10px] text-indigo-400/80 font-normal">Mốc chuẩn tham chiếu</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-400">{avgROE}%</td>
                  <td className="py-3 px-3 text-right font-black text-cyan-400">{avgPE}x</td>
                  <td className="py-3 px-3 text-right font-bold text-indigo-300">{avgNetMargin}%</td>
                  <td className="py-3 px-3 text-right text-slate-400">{stock.industryPB}x</td>
                  <td className="py-3 px-3 text-right text-slate-400">+{avgProfitGrowth}%</td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                      Chuẩn ngành
                    </span>
                  </td>
                </tr>

                {/* 2. All Stocks in Peer Comparison (Current Stock first, highlighted) */}
                {allComparedStocks.map((item, idx) => {
                  const isCurrent = item.symbol === stock.symbol;

                  return (
                    <tr
                      key={item.symbol}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-cyan-950/40 text-white font-bold border-l-4 border-l-cyan-500'
                          : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      {/* Symbol & Name */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <span className="font-black text-sm text-cyan-400 tracking-wider">
                              {item.symbol}
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
                              className="font-black text-sm text-slate-200 hover:text-cyan-400 hover:underline cursor-pointer tracking-wider"
                            >
                              {item.symbol}
                            </button>
                          )}
                          <div className="truncate max-w-[150px] sm:max-w-[200px]">
                            <div className="truncate text-xs">{item.name}</div>
                            {isCurrent && (
                              <span className="text-[9px] bg-cyan-600 text-white px-1.5 py-0.2 rounded font-bold uppercase inline-block">
                                Đang xem
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Current Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        {formatMoney(item.currentPrice)}
                      </td>

                      {/* ROE */}
                      <td
                        className={`py-3 px-3 text-right font-black ${
                          item.roe >= avgROE ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.roe}%
                      </td>

                      {/* P/E */}
                      <td
                        className={`py-3 px-3 text-right font-black ${
                          item.pe <= avgPE ? 'text-cyan-400' : 'text-amber-400'
                        }`}
                      >
                        {item.pe}x
                      </td>

                      {/* Net Margin */}
                      <td
                        className={`py-3 px-3 text-right font-black ${
                          item.netMargin >= avgNetMargin ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {item.netMargin}%
                      </td>

                      {/* P/B */}
                      <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                        {item.pb}x
                      </td>

                      {/* Profit Growth */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        +{item.profitGrowth}%
                      </td>

                      {/* Positioning Badge */}
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isCurrent
                              ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50'
                              : item.roe >= avgROE && item.pe <= avgPE
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : item.roe >= avgROE
                              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.roe >= avgROE && item.pe <= avgPE
                            ? 'Lợi thế vượt trội'
                            : item.roe >= avgROE
                            ? 'Đầu ngành ROE cao'
                            : item.pe <= avgPE
                            ? 'Định giá rẻ'
                            : 'Theo dõi thêm'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
