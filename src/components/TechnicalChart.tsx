import React, { useState, useMemo } from 'react';
import {
  CandlestickChart,
  LineChart,
  Activity,
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
  Maximize2,
  Compass,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PriceBar, StockData, TimeFrame, ChartType } from '../types/stock';

interface TechnicalChartProps {
  stock: StockData;
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({ stock }) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1Y');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [enableRsiAlert, setEnableRsiAlert] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rawBars = stock.history[timeframe] || stock.history['1Y'];

  // Slice bars so charts aren't overly squished on dense series
  const bars = useMemo(() => {
    if (timeframe === '5Y') return rawBars.slice(-120);
    if (timeframe === '1Y') return rawBars.slice(-100);
    return rawBars;
  }, [rawBars, timeframe]);

  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const formatPrice = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Min / Max calculations for SVG coordinate mapping
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    bars.forEach((b) => {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (b.bbLower && b.bbLower < min) min = b.bbLower;
      if (b.bbUpper && b.bbUpper > max) max = b.bbUpper;
      if (b.volume > maxVol) maxVol = b.volume;
    });

    const padding = (max - min) * 0.08 || 10;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol * 1.2 || 1,
    };
  }, [bars]);

  // Chart Dimensions
  const svgWidth = 850;
  const mainHeight = 280;
  const volumeHeight = 70;
  const rsiHeight = 80;
  const macdHeight = 80;

  const barCount = bars.length;
  const barWidth = Math.max(3, (svgWidth - 60) / barCount);
  const chartInnerWidth = svgWidth - 70;

  // Coordinate conversion functions
  const getX = (index: number) => 15 + index * (chartInnerWidth / Math.max(1, barCount - 1));
  const getY = (price: number) => {
    const range = maxPrice - minPrice;
    if (range <= 0) return mainHeight / 2;
    return mainHeight - ((price - minPrice) / range) * (mainHeight - 20) - 10;
  };

  const getVolY = (vol: number) => {
    return volumeHeight - (vol / maxVolume) * (volumeHeight - 10);
  };

  const getRsiY = (rsi: number) => {
    // RSI from 0 to 100
    return rsiHeight - (rsi / 100) * (rsiHeight - 16) - 8;
  };

  // Min/Max for MACD
  const { maxMacdAbs } = useMemo(() => {
    let maxAbs = 1;
    bars.forEach((b) => {
      if (b.macd !== undefined && Math.abs(b.macd) > maxAbs) maxAbs = Math.abs(b.macd);
      if (b.macdSignal !== undefined && Math.abs(b.macdSignal) > maxAbs) maxAbs = Math.abs(b.macdSignal);
      if (b.macdHist !== undefined && Math.abs(b.macdHist) > maxAbs) maxAbs = Math.abs(b.macdHist);
    });
    return { maxMacdAbs: maxAbs * 1.2 };
  }, [bars]);

  const getMacdY = (val: number) => {
    return macdHeight / 2 - (val / maxMacdAbs) * (macdHeight / 2 - 8);
  };

  // Build SVG polyline points
  const linePoints = bars.map((b, i) => `${getX(i)},${getY(b.close)}`).join(' ');
  const ma20Points = bars
    .map((b, i) => (b.ma20 ? `${getX(i)},${getY(b.ma20)}` : null))
    .filter(Boolean)
    .join(' ');
  const ma50Points = bars
    .map((b, i) => (b.ma50 ? `${getX(i)},${getY(b.ma50)}` : null))
    .filter(Boolean)
    .join(' ');

  // Bollinger Bands path
  const bbUpperPoints = bars
    .map((b, i) => (b.bbUpper ? `${getX(i)},${getY(b.bbUpper)}` : null))
    .filter(Boolean)
    .join(' ');
  const bbLowerPoints = bars
    .map((b, i) => (b.bbLower ? `${getX(i)},${getY(b.bbLower)}` : null))
    .filter(Boolean)
    .join(' ');

  // RSI path
  const rsiPoints = bars
    .map((b, i) => (b.rsi !== undefined ? `${getX(i)},${getRsiY(b.rsi)}` : null))
    .filter(Boolean)
    .join(' ');

  // MACD lines
  const macdLinePoints = bars
    .map((b, i) => (b.macd !== undefined ? `${getX(i)},${getMacdY(b.macd)}` : null))
    .filter(Boolean)
    .join(' ');
  const macdSignalPoints = bars
    .map((b, i) => (b.macdSignal !== undefined ? `${getX(i)},${getMacdY(b.macdSignal)}` : null))
    .filter(Boolean)
    .join(' ');

  // Active bar under crosshair or latest
  const activeBar = hoverIndex !== null ? bars[hoverIndex] : bars[bars.length - 1];
  const latestBar = bars[bars.length - 1];
  const currentRsiVal = activeBar?.rsi ?? latestBar?.rsi ?? 50;
  const isOverbought = currentRsiVal >= 70;
  const isOversold = currentRsiVal <= 30;

  return (
    <div className="space-y-6">
      {/* Chart Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            {(['1D', '1M', '6M', '1Y', '5Y'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setHoverIndex(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {tf === '1D'
                  ? '1 Ngày'
                  : tf === '1M'
                  ? '1 Tháng'
                  : tf === '6M'
                  ? '6 Tháng'
                  : tf === '1Y'
                  ? '1 Năm'
                  : '5 Năm'}
              </button>
            ))}
          </div>

          {/* Chart Type (Candlestick vs Line) */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setChartType('candlestick')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartType === 'candlestick'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              Nến Nhật
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartType === 'line'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Đường Line
            </button>
          </div>

          {/* Overlays Switches */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/60 px-2.5 py-1.5 rounded border border-slate-700 text-slate-300">
              <input
                type="checkbox"
                checked={showMA20}
                onChange={(e) => setShowMA20(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span>
              MA20
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/60 px-2.5 py-1.5 rounded border border-slate-700 text-slate-300">
              <input
                type="checkbox"
                checked={showMA50}
                onChange={(e) => setShowMA50(e.target.checked)}
                className="accent-violet-400 rounded"
              />
              <span className="w-2.5 h-0.5 bg-violet-400 inline-block"></span>
              MA50
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/60 px-2.5 py-1.5 rounded border border-slate-700 text-slate-300">
              <input
                type="checkbox"
                checked={showBollinger}
                onChange={(e) => setShowBollinger(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
              Bollinger Bands
            </label>

            {/* RSI Automatic Alert Toggle */}
            <button
              onClick={() => setEnableRsiAlert(!enableRsiAlert)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all ${
                enableRsiAlert
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <BellRing
                className={`w-3.5 h-3.5 ${
                  enableRsiAlert ? 'text-emerald-400 animate-bounce' : 'text-slate-400'
                }`}
              />
              <span>Cảnh báo RSI (70/30)</span>
            </button>
          </div>
        </div>

        {/* AUTOMATIC RSI EXTREME ALERTS BANNER */}
        {enableRsiAlert && isOverbought && (
          <div className="my-3 p-3.5 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 border-2 border-rose-500/90 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5 animate-pulse text-rose-400" />
              </div>
              <div>
                <div className="text-xs font-black text-rose-300 flex items-center gap-2 flex-wrap">
                  <span>CẢNH BÁO TỰ ĐỘNG: RSI ĐÃ VƯỢT NGƯỠNG QUÁ MUA (RSI = {currentRsiVal} &gt; 70)</span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded font-bold uppercase tracking-wider animate-pulse">
                    VÙNG QUÁ MUA NGUY HIỂM
                  </span>
                </div>
                <div className="text-xs text-rose-100/90 mt-1 leading-relaxed">
                  Cổ phiếu đã tăng nóng và đi vào vùng quá mua kỹ thuật. Áp lực chốt lời ngắn hạn đang tăng cao, xác suất xảy ra nhịp điều chỉnh rung lắc là rất lớn.
                  <strong className="text-white ml-1 underline decoration-rose-400">
                    Khuyến nghị: KHÔNG mua đuổi giá xanh, cân nhắc hiện thực hóa lợi nhuận từng phần hoặc nâng mức chặn lãi (Trailing Stop).
                  </strong>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 bg-rose-900/80 text-rose-200 rounded-lg border border-rose-700 font-mono font-bold text-xs shadow-inner">
                RSI: {currentRsiVal}
              </span>
            </div>
          </div>
        )}

        {enableRsiAlert && isOversold && (
          <div className="my-3 p-3.5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/90 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert className="w-5 h-5 animate-pulse text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300 flex items-center gap-2 flex-wrap">
                  <span>CẢNH BÁO TỰ ĐỘNG: RSI ĐÃ RƠI VÀO VÙNG QUÁ BÁN (RSI = {currentRsiVal} &lt; 30)</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded font-bold uppercase tracking-wider">
                    CƠ HỘI BẮT ĐÁY
                  </span>
                </div>
                <div className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                  Đà bán tháo đã đẩy cổ phiếu vào vùng chiết khấu sâu cực điểm. Biên an toàn ngắn hạn mở rộng và khả năng xuất hiện phiên bật tăng hồi phục kỹ thuật (Rebound) là rất cao.
                  <strong className="text-white ml-1 underline decoration-emerald-400">
                    Khuyến nghị: Bắt đầu chia vốn giải ngân thăm dò từng phần để đón sóng phục hồi.
                  </strong>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 bg-emerald-900/80 text-emerald-200 rounded-lg border border-emerald-700 font-mono font-bold text-xs shadow-inner">
                RSI: {currentRsiVal}
              </span>
            </div>
          </div>
        )}

        {enableRsiAlert && !isOverbought && !isOversold && (
          <div className="my-2.5 px-3.5 py-2 bg-slate-800/40 border border-slate-700/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                Hệ thống giám sát tự động: Chỉ số RSI hiện tại (<strong className="text-white font-mono">{currentRsiVal}</strong>) đang ở vùng trung lập bình thường (30 - 70).
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Ngưỡng cảnh báo: Quá bán &le; 30 | Quá mua &ge; 70
            </span>
          </div>
        )}

        {/* Live Hover Info Bar */}
        {activeBar && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-xs bg-slate-950/40 px-3 rounded-lg border border-slate-800/80 my-3 font-mono">
            <span className="text-slate-400 font-sans">
              Thời gian: <strong className="text-white">{activeBar.time || activeBar.date}</strong>
            </span>
            <span>
              Mở: <strong className="text-slate-200">{formatPrice(activeBar.open)}</strong>
            </span>
            <span>
              Cao: <strong className="text-emerald-400">{formatPrice(activeBar.high)}</strong>
            </span>
            <span>
              Thấp: <strong className="text-rose-400">{formatPrice(activeBar.low)}</strong>
            </span>
            <span>
              Đóng: <strong className="text-white">{formatPrice(activeBar.close)}</strong>
            </span>
            <span>
              KL:{' '}
              <strong className="text-cyan-400">{activeBar.volume.toLocaleString('vi-VN')}</strong>
            </span>
            {activeBar.rsi !== undefined && (
              <span className="text-violet-300">
                RSI(14): <strong>{activeBar.rsi}</strong>
              </span>
            )}
            {activeBar.macd !== undefined && (
              <span className="text-amber-300">
                MACD: <strong>{activeBar.macd}</strong> (Hist: {activeBar.macdHist})
              </span>
            )}
          </div>
        )}

        {/* MAIN PRICE & VOLUME SVG CHART */}
        <div className="relative w-full overflow-x-auto select-none bg-slate-950/60 rounded-xl p-2 border border-slate-800/70">
          <svg
            viewBox={`0 0 ${svgWidth} ${mainHeight + volumeHeight + 20}`}
            className="w-full h-auto cursor-crosshair min-w-[700px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const ratio = clientX / rect.width;
              const svgX = ratio * svgWidth;
              const idx = Math.min(
                bars.length - 1,
                Math.max(0, Math.round(((svgX - 15) / chartInnerWidth) * (bars.length - 1)))
              );
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((pct) => {
              const p = minPrice + (maxPrice - minPrice) * (1 - pct);
              const y = 10 + pct * (mainHeight - 20);
              return (
                <g key={pct}>
                  <line
                    x1="10"
                    y1={y}
                    x2={svgWidth - 60}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="3,3"
                    strokeOpacity="0.5"
                  />
                  <text
                    x={svgWidth - 55}
                    y={y + 3}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {isUS ? `$${Math.round(p)}` : `${Math.round(p / 100) / 10}k`}
                  </text>
                </g>
              );
            })}

            {/* Bollinger Bands Shading & Lines */}
            {showBollinger && bbUpperPoints && bbLowerPoints && (
              <>
                <polyline
                  points={bbUpperPoints}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
                <polyline
                  points={bbLowerPoints}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
              </>
            )}

            {/* Moving Averages */}
            {showMA20 && ma20Points && (
              <polyline
                points={ma20Points}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.6"
                opacity="0.85"
              />
            )}
            {showMA50 && ma50Points && (
              <polyline
                points={ma50Points}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.6"
                opacity="0.85"
              />
            )}

            {/* Line Chart Mode */}
            {chartType === 'line' && (
              <>
                <polygon
                  points={`15,${mainHeight} ${linePoints} ${getX(bars.length - 1)},${mainHeight}`}
                  fill="url(#lineGradient)"
                />
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                />
              </>
            )}

            {/* Candlestick Mode */}
            {chartType === 'candlestick' &&
              bars.map((b, i) => {
                const x = getX(i);
                const isGreen = b.close >= b.open;
                const top = getY(Math.max(b.open, b.close));
                const bottom = getY(Math.min(b.open, b.close));
                const height = Math.max(2, bottom - top);
                const wickHigh = getY(b.high);
                const wickLow = getY(b.low);
                const color = isGreen ? '#10b981' : '#f43f5e';

                return (
                  <g key={i}>
                    {/* High-Low Wick */}
                    <line
                      x1={x}
                      y1={wickHigh}
                      x2={x}
                      y2={wickLow}
                      stroke={color}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - barWidth / 2}
                      y={top}
                      width={barWidth}
                      height={height}
                      fill={color}
                      stroke={color}
                      strokeWidth="0.8"
                      rx="1"
                    />

                    {/* Automatic RSI Extreme Markers on Candles */}
                    {enableRsiAlert && b.rsi !== undefined && b.rsi >= 70 && (
                      <g>
                        <circle cx={x} cy={wickHigh - 6} r="2.5" fill="#f43f5e" />
                        <polygon
                          points={`${x - 2.5},${wickHigh - 3} ${x + 2.5},${wickHigh - 3} ${x},${wickHigh}`}
                          fill="#f43f5e"
                        />
                      </g>
                    )}
                    {enableRsiAlert && b.rsi !== undefined && b.rsi <= 30 && (
                      <g>
                        <circle cx={x} cy={wickLow + 6} r="2.5" fill="#10b981" />
                        <polygon
                          points={`${x - 2.5},${wickLow + 3} ${x + 2.5},${wickLow + 3} ${x},${wickLow}`}
                          fill="#10b981"
                        />
                      </g>
                    )}
                  </g>
                );
              })}

            {/* SEPARATOR LINE FOR VOLUME */}
            <line
              x1="10"
              y1={mainHeight + 5}
              x2={svgWidth - 10}
              y2={mainHeight + 5}
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text
              x="15"
              y={mainHeight + 18}
              fill="#64748b"
              fontSize="9"
              fontWeight="bold"
            >
              KHỐI LƯỢNG GIAO DỊCH (VOLUME)
            </text>

            {/* Volume Bars */}
            {bars.map((b, i) => {
              const x = getX(i);
              const isGreen = b.close >= b.open;
              const y = mainHeight + 20 + getVolY(b.volume);
              const height = mainHeight + volumeHeight + 20 - y;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={Math.max(1, height)}
                  fill={isGreen ? '#10b981' : '#f43f5e'}
                  opacity={hoverIndex === i ? 0.9 : 0.45}
                />
              );
            })}

            {/* Crosshair Line */}
            {hoverIndex !== null && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={0}
                  x2={getX(hoverIndex)}
                  y2={mainHeight + volumeHeight + 20}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(bars[hoverIndex].close)}
                  r="4"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        {/* SUB INDICATOR 1: RSI (14) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-violet-400">RSI (14)</span>
              <span className="text-slate-400">
                Giá trị: <strong className="text-white">{activeBar?.rsi ?? 50}</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  (activeBar?.rsi ?? 50) >= 70
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    : (activeBar?.rsi ?? 50) <= 30
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {(activeBar?.rsi ?? 50) >= 70
                  ? 'Quá Mua (> 70) - Rủi ro điều chỉnh'
                  : (activeBar?.rsi ?? 50) <= 30
                  ? 'Quá Bán (< 30) - Cơ hội hồi phục'
                  : 'Vùng Trung Lập (30-70)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Ngưỡng 30 (Quá bán) / 70 (Quá mua)</div>
          </div>

          <div className="relative w-full overflow-x-auto select-none bg-slate-950/40 rounded-lg p-1 border border-slate-800/60">
            <svg
              viewBox={`0 0 ${svgWidth} ${rsiHeight}`}
              className="w-full h-auto min-w-[700px]"
            >
              {/* Overbought 70 line & Oversold 30 line */}
              <rect
                x="15"
                y={getRsiY(70)}
                width={chartInnerWidth}
                height={getRsiY(30) - getRsiY(70)}
                fill="#8b5cf6"
                fillOpacity="0.06"
              />
              <line
                x1="15"
                y1={getRsiY(70)}
                x2={svgWidth - 60}
                y2={getRsiY(70)}
                stroke="#f43f5e"
                strokeDasharray="3,3"
                strokeWidth="1"
                opacity="0.6"
              />
              <text x={svgWidth - 55} y={getRsiY(70) + 3} fill="#f43f5e" fontSize="9">
                70
              </text>

              <line
                x1="15"
                y1={getRsiY(30)}
                x2={svgWidth - 60}
                y2={getRsiY(30)}
                stroke="#10b981"
                strokeDasharray="3,3"
                strokeWidth="1"
                opacity="0.6"
              />
              <text x={svgWidth - 55} y={getRsiY(30) + 3} fill="#10b981" fontSize="9">
                30
              </text>

              {/* RSI Polyline */}
              {rsiPoints && (
                <polyline
                  points={rsiPoints}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                />
              )}

              {/* Automatic highlight circles on extreme RSI points */}
              {enableRsiAlert &&
                bars.map((b, i) => {
                  if (b.rsi === undefined) return null;
                  if (b.rsi >= 70) {
                    return (
                      <g key={`rsi-ob-${i}`}>
                        <circle
                          cx={getX(i)}
                          cy={getRsiY(b.rsi)}
                          r="3"
                          fill="#f43f5e"
                          stroke="#ffe4e6"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  }
                  if (b.rsi <= 30) {
                    return (
                      <g key={`rsi-os-${i}`}>
                        <circle
                          cx={getX(i)}
                          cy={getRsiY(b.rsi)}
                          r="3"
                          fill="#10b981"
                          stroke="#d1fae5"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  }
                  return null;
                })}

              {/* Crosshair indicator */}
              {hoverIndex !== null && activeBar?.rsi !== undefined && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getRsiY(activeBar.rsi)}
                  r="3.5"
                  fill="#c4b5fd"
                />
              )}
            </svg>
          </div>
        </div>

        {/* SUB INDICATOR 2: MACD (12, 26, 9) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">MACD (12, 26, 9)</span>
              <span className="text-slate-400">
                MACD: <strong className="text-cyan-300">{activeBar?.macd ?? 0}</strong> | Signal:{' '}
                <strong className="text-amber-300">{activeBar?.macdSignal ?? 0}</strong> | Hist:{' '}
                <strong className={Number(activeBar?.macdHist ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {activeBar?.macdHist ?? 0}
                </strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {Number(activeBar?.macdHist ?? 0) >= 0
                ? 'Động lượng Tăng (Bullish Momentum)'
                : 'Động lượng Giảm (Bearish Momentum)'}
            </div>
          </div>

          <div className="relative w-full overflow-x-auto select-none bg-slate-950/40 rounded-lg p-1 border border-slate-800/60">
            <svg
              viewBox={`0 0 ${svgWidth} ${macdHeight}`}
              className="w-full h-auto min-w-[700px]"
            >
              {/* Zero baseline */}
              <line
                x1="15"
                y1={macdHeight / 2}
                x2={svgWidth - 60}
                y2={macdHeight / 2}
                stroke="#475569"
                strokeWidth="1"
              />
              <text x={svgWidth - 55} y={macdHeight / 2 + 3} fill="#94a3b8" fontSize="9">
                0.0
              </text>

              {/* MACD Histogram bars */}
              {bars.map((b, i) => {
                if (b.macdHist === undefined) return null;
                const x = getX(i);
                const isPos = b.macdHist >= 0;
                const yZero = macdHeight / 2;
                const yVal = getMacdY(b.macdHist);
                const height = Math.abs(yVal - yZero);
                const yTop = isPos ? yVal : yZero;

                return (
                  <rect
                    key={`hist-${i}`}
                    x={x - barWidth / 2}
                    y={yTop}
                    width={barWidth}
                    height={Math.max(1, height)}
                    fill={isPos ? '#10b981' : '#f43f5e'}
                    opacity="0.75"
                  />
                );
              })}

              {/* MACD Line & Signal Line */}
              {macdLinePoints && (
                <polyline
                  points={macdLinePoints}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.6"
                />
              )}
              {macdSignalPoints && (
                <polyline
                  points={macdSignalPoints}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.6"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* TECHNICAL INDICATORS SUMMARY PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Tổng Hợp Tín Hiệu Kỹ Thuật & Các Mức Giá Trọng Yếu
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Signal 1: Overall Technical Action */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Tín hiệu Kỹ thuật Tổng thể</div>
            <div
              className={`text-xl font-black mt-1 ${
                stock.technicals.overallTechnicalSignal.includes('MUA')
                  ? 'text-emerald-400'
                  : stock.technicals.overallTechnicalSignal.includes('BÁN')
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {stock.technicals.overallTechnicalSignal}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Xu hướng: <strong className="text-slate-200">{stock.technicals.trend}</strong>
            </div>
          </div>

          {/* Signal 2: RSI Status */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Chỉ số RSI (14 ngày)</div>
            <div className="text-xl font-black text-white mt-1">
              {stock.technicals.currentRSI}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Trạng thái: <span className="text-emerald-400">{stock.technicals.rsiSignal}</span>
            </div>
          </div>

          {/* Signal 3: MACD Cross */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Tín hiệu giao cắt MACD</div>
            <div className="text-sm font-bold text-emerald-300 mt-1.5 leading-tight">
              {stock.technicals.macdCross}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Vị thế so với MA20: <span className="text-cyan-400">{stock.technicals.ma20Status}</span>
            </div>
          </div>

          {/* Signal 4: Support & Resistance */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400">Mức Hỗ trợ & Kháng cự</div>
            <div className="text-xs font-mono text-slate-200 mt-1.5 space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-400">Hỗ trợ 1:</span>
                <span>{formatPrice(stock.technicals.support1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Kháng cự 1:</span>
                <span>{formatPrice(stock.technicals.resistance1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
