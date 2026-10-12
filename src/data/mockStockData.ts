import {
  StockData,
  PriceBar,
  MacroEvent,
  NewsItem,
  InvestmentScorecard,
  CapitalAllocationPlan,
  InvestmentChecklistItem,
} from '../types/stock';
import { generateFinancialStatementsData } from './financialStatementsGenerator';

// Technical indicators math helpers
export function calculateIndicators(bars: PriceBar[]): PriceBar[] {
  const result = [...bars];
  const closes = result.map((b) => b.close);

  // 1. Moving Averages
  for (let i = 0; i < result.length; i++) {
    if (i >= 19) {
      const slice20 = closes.slice(i - 19, i + 1);
      result[i].ma20 = Math.round(slice20.reduce((a, b) => a + b, 0) / 20);

      // Bollinger Bands (20 periods, 2 std dev)
      const mean = result[i].ma20!;
      const variance = slice20.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      result[i].bbMiddle = mean;
      result[i].bbUpper = Math.round(mean + 2 * stdDev);
      result[i].bbLower = Math.round(mean - 2 * stdDev);
    }
    if (i >= 49) {
      const slice50 = closes.slice(i - 49, i + 1);
      result[i].ma50 = Math.round(slice50.reduce((a, b) => a + b, 0) / 50);
    }
    if (i >= 199) {
      const slice200 = closes.slice(i - 199, i + 1);
      result[i].ma200 = Math.round(slice200.reduce((a, b) => a + b, 0) / 200);
    }
  }

  // 2. RSI (14)
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
  let avgLoss = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14;

  for (let i = 14; i < result.length; i++) {
    if (i > 14) {
      avgGain = (avgGain * 13 + gains[i - 1]) / 14;
      avgLoss = (avgLoss * 13 + losses[i - 1]) / 14;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    result[i].rsi = Math.round(rsi * 10) / 10;
  }

  // 3. MACD (EMA 12, EMA 26, Signal EMA 9)
  function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emaArray: number[] = [];
    let prevEma = data[0];
    emaArray.push(prevEma);
    for (let i = 1; i < data.length; i++) {
      const currEma = data[i] * k + prevEma * (1 - k);
      emaArray.push(currEma);
      prevEma = currEma;
    }
    return emaArray;
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((val, idx) => val - ema26[idx]);
  const signalLine = calculateEMA(macdLine, 9);

  for (let i = 0; i < result.length; i++) {
    result[i].macd = Math.round(macdLine[i] * 10) / 10;
    result[i].macdSignal = Math.round(signalLine[i] * 10) / 10;
    result[i].macdHist = Math.round((macdLine[i] - signalLine[i]) * 10) / 10;
  }

  return result;
}

// Generate realistic price bars
function generateHistory(
  basePrice: number,
  volatility: number,
  trendSlope: number
): {
  '1D': PriceBar[];
  '1M': PriceBar[];
  '6M': PriceBar[];
  '1Y': PriceBar[];
  '5Y': PriceBar[];
} {
  // 1D (Intraday 20 bars)
  const intraday: PriceBar[] = [];
  let curr1D = basePrice * 0.995;
  const times = [
    '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30',
    '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:25', '14:30', '14:40', '14:45'
  ];
  for (let i = 0; i < times.length; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.008);
    const open = Math.round(curr1D);
    const close = Math.round(Math.max(1, curr1D + change));
    const high = Math.round(Math.max(open, close) + Math.random() * (basePrice * 0.005));
    const low = Math.round(Math.min(open, close) - Math.random() * (basePrice * 0.005));
    const volume = Math.round(50000 + Math.random() * 250000);
    curr1D = close;
    intraday.push({
      date: '2026-10-12',
      time: times[i],
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // 1M (30 daily bars)
  const generateDaily = (days: number, startPrice: number) => {
    const bars: PriceBar[] = [];
    let price = startPrice;
    const now = new Date('2026-10-12');
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      // skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const randomFactor = (Math.random() - 0.49) * volatility;
      const delta = price * (randomFactor + trendSlope / days);
      const open = Math.round(price);
      const close = Math.round(Math.max(1, price + delta));
      const high = Math.round(Math.max(open, close) + Math.random() * (price * volatility * 0.5));
      const low = Math.round(Math.min(open, close) - Math.random() * (price * volatility * 0.5));
      const volume = Math.round(1500000 + Math.random() * 4000000);
      price = close;

      bars.push({
        date: d.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });
    }
    return calculateIndicators(bars);
  };

  const bars1M = generateDaily(45, basePrice * 0.94);
  const bars6M = generateDaily(180, basePrice * 0.82);
  const bars1Y = generateDaily(365, basePrice * 0.75);

  // 5Y (weekly bars, 260 weeks)
  const generateWeekly = (weeks: number, startPrice: number) => {
    const bars: PriceBar[] = [];
    let price = startPrice;
    const now = new Date('2026-10-12');
    for (let i = weeks; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const randomFactor = (Math.random() - 0.47) * (volatility * 1.5);
      const delta = price * (randomFactor + trendSlope / weeks);
      const open = Math.round(price);
      const close = Math.round(Math.max(1, price + delta));
      const high = Math.round(Math.max(open, close) + Math.random() * (price * 0.04));
      const low = Math.round(Math.min(open, close) - Math.random() * (price * 0.04));
      const volume = Math.round(10000000 + Math.random() * 25000000);
      price = close;

      bars.push({
        date: d.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });
    }
    return calculateIndicators(bars);
  };

  const bars5Y = generateWeekly(250, basePrice * 0.45);

  return {
    '1D': calculateIndicators(intraday),
    '1M': bars1M,
    '6M': bars6M,
    '1Y': bars1Y,
    '5Y': bars5Y,
  };
}

// Valuation calculation algorithm with industry-specific models
export function computeValuation(
  price: number,
  eps: number,
  bvps: number,
  roe: number,
  industryPE: number,
  industryPB: number,
  growthRate = 18,
  targetPE = 18,
  sector = '',
  symbol = ''
): StockData['valuation'] {
  const sym = symbol.toUpperCase().trim();
  const sec = sector.toLowerCase();

  const isBanking =
    sec.includes('ngân hàng') ||
    sec.includes('tài chính') ||
    sec.includes('chứng khoán') ||
    ['VCB', 'TCB', 'MBB', 'ACB', 'BID', 'CTG', 'VPB', 'SSI', 'VND', 'VCI', 'HCM', 'SHB', 'HDB', 'LPB', 'STB'].includes(sym);

  const isRealEstate =
    sec.includes('bất động sản') ||
    sec.includes('địa ốc') ||
    ['VHM', 'NVL', 'KDH', 'DXG', 'PDR', 'DIG', 'NLG', 'VIC'].includes(sym);

  const isHighTech =
    sec.includes('công nghệ') ||
    sec.includes('ai') ||
    sec.includes('phần mềm') ||
    ['FPT', 'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(sym);

  // 1. BANKING & FINANCIAL SECTOR: Justified P/B & Residual Income Model (RIM)
  if (isBanking) {
    const ke = 0.115; // Cost of Equity 11.5%
    const g = 0.065; // Sustainable growth 6.5%
    const justifiedPBMultiple = Math.max(1.1, Math.min(3.5, (roe / 100 - g) / (ke - g)));
    const fairPB = Math.round(bvps * justifiedPBMultiple);

    // Residual Income Model: V0 = BV0 + sum((ROE - Ke) * BV_prev / (1 + Ke)^t)
    let rimSum = 0;
    let currBv = bvps;
    for (let yr = 1; yr <= 5; yr++) {
      const residual = ((roe - 11.5) / 100) * currBv;
      rimSum += residual / Math.pow(1 + ke, yr);
      currBv *= 1 + 0.12;
    }
    const terminalResidual = (((roe - 11.5) / 100) * currBv * 1.05) / (ke - 0.05);
    const fairResidualIncome = Math.round(bvps + rimSum + terminalResidual / Math.pow(1 + ke, 5));
    const fairPE = Math.round(eps * Math.max(8, targetPE));

    // Weighted: 45% Justified P/B + 40% Residual Income + 15% P/E
    const weighted = Math.round(fairPB * 0.45 + fairResidualIncome * 0.40 + fairPE * 0.15);
    const margin = Math.round(((weighted - price) / price) * 1000) / 10;
    let status: StockData['valuation']['status'] = 'Định giá hợp lý';
    if (margin >= 12) status = 'Dưới giá trị (Hấp dẫn)';
    else if (margin <= -12) status = 'Định giá cao (Đắt)';

    return {
      fairValuePE: fairPE,
      fairValuePB: fairPB,
      fairValueResidualIncome: fairResidualIncome,
      fairValueGraham: fairPB,
      fairValueDCF: fairResidualIncome,
      weightedFairValue: weighted,
      marginOfSafetyPercent: margin,
      status,
      assumedGrowthRate: growthRate,
      targetPE,
      valuationModelType: 'BANKING_FINANCIAL',
      valuationModelTitle: 'Mô hình Ngân hàng & Tài chính (Justified P/B & Residual Income)',
      valuationExplanation:
        'Ngành Ngân hàng có cấu trúc tài sản đặc thù với tiền gửi là nguồn vốn hoạt động cốt lõi. Do đó mô hình Graham và DCF truyền thống không phản ánh đúng, thay vào đó áp dụng Justified P/B theo ROE và Thu nhập thặng dư (RIM) chuẩn mực quốc tế.',
    };
  }

  // 2. REAL ESTATE SECTOR: RNAV & Land Value Multiple
  if (isRealEstate) {
    const landValueMultiple = Math.max(1.3, Math.min(2.8, (roe / 10) * 1.25));
    const fairRNAV = Math.round(bvps * landValueMultiple);
    const fairPB = Math.round(bvps * Math.max(1.2, industryPB));
    const fairPE = Math.round(eps * Math.max(10, targetPE));

    // Weighted: 50% RNAV + 30% P/B + 20% P/E
    const weighted = Math.round(fairRNAV * 0.50 + fairPB * 0.30 + fairPE * 0.20);
    const margin = Math.round(((weighted - price) / price) * 1000) / 10;
    let status: StockData['valuation']['status'] = 'Định giá hợp lý';
    if (margin >= 12) status = 'Dưới giá trị (Hấp dẫn)';
    else if (margin <= -12) status = 'Định giá cao (Đắt)';

    return {
      fairValuePE: fairPE,
      fairValuePB: fairPB,
      fairValueRNAV: fairRNAV,
      fairValueGraham: fairRNAV,
      fairValueDCF: fairRNAV,
      weightedFairValue: weighted,
      marginOfSafetyPercent: margin,
      status,
      assumedGrowthRate: growthRate,
      targetPE,
      valuationModelType: 'REAL_ESTATE',
      valuationModelTitle: 'Mô hình Bất động sản (RNAV Quỹ Đất & P/B Chu Kỳ)',
      valuationExplanation:
        'Doanh nghiệp Bất động sản có doanh thu hạch toán giật cục theo tiến độ bàn giao dự án. Định giá tập trung vào Giá trị tài sản ròng (RNAV) chiết khấu quỹ đất và hệ số P/B chu kỳ bất động sản.',
    };
  }

  // 3. HIGH TECH SECTOR: DCF & Peter Lynch PEG
  if (isHighTech) {
    const discountRate = 0.105;
    const terminalGrowth = 0.045;
    let dcfSum = 0;
    let currentCash = eps;
    for (let year = 1; year <= 5; year++) {
      currentCash *= 1 + growthRate / 100;
      dcfSum += currentCash / Math.pow(1 + discountRate, year);
    }
    const terminalValue = (currentCash * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
    const dcfTerminalDiscounted = terminalValue / Math.pow(1 + discountRate, 5);
    const fairDCF = Math.round(dcfSum + dcfTerminalDiscounted);

    const targetPeWithGrowth = Math.max(14, Math.min(32, growthRate * 1.1));
    const fairPE = Math.round(eps * targetPeWithGrowth);
    const fairPBMultiple = Math.max(2.5, (roe / 10) * 1.5);
    const fairPB = Math.round(bvps * fairPBMultiple);

    // Weighted: 45% DCF + 35% P/E & PEG + 20% P/B-ROE
    const weighted = Math.round(fairDCF * 0.45 + fairPE * 0.35 + fairPB * 0.20);
    const margin = Math.round(((weighted - price) / price) * 1000) / 10;
    let status: StockData['valuation']['status'] = 'Định giá hợp lý';
    if (margin >= 12) status = 'Dưới giá trị (Hấp dẫn)';
    else if (margin <= -12) status = 'Định giá cao (Đắt)';

    return {
      fairValuePE: fairPE,
      fairValuePB: fairPB,
      fairValueDCF: fairDCF,
      fairValueGraham: fairDCF,
      weightedFairValue: weighted,
      marginOfSafetyPercent: margin,
      status,
      assumedGrowthRate: growthRate,
      targetPE,
      valuationModelType: 'HIGH_GROWTH_TECH',
      valuationModelTitle: 'Mô hình Công Nghệ Tăng Trưởng (DCF 2 Giai Đoạn & PEG Peter Lynch)',
      valuationExplanation:
        'Cổ phiếu công nghệ tăng trưởng sở hữu dòng tiền tự do FCF dồi dào và tài sản vô hình lớn. Mô hình DCF 2 giai đoạn kết hợp hệ số định giá tăng trưởng PEG Peter Lynch được ưu tiên hàng đầu.',
    };
  }

  // 4. STANDARD INDUSTRIAL & RETAIL SECTOR (Sản xuất, Thép, Tiêu dùng, Bán lẻ)
  const fairPE = Math.round(eps * Math.max(10, targetPE));
  const fairPBMultiple = Math.max(1.2, (roe / 11) * industryPB);
  const fairPB = Math.round(bvps * fairPBMultiple);
  const grahamRaw = Math.sqrt(Math.max(1, 22.5 * eps * bvps));
  const fairGraham = Math.round(grahamRaw);

  const discountRate = 0.11;
  const terminalGrowth = 0.04;
  let dcfSum = 0;
  let currentCash = eps;
  for (let year = 1; year <= 5; year++) {
    currentCash *= 1 + growthRate / 100;
    dcfSum += currentCash / Math.pow(1 + discountRate, year);
  }
  const terminalValue = (currentCash * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const dcfTerminalDiscounted = terminalValue / Math.pow(1 + discountRate, 5);
  const fairDCF = Math.round(dcfSum + dcfTerminalDiscounted);

  const weighted = Math.round(fairPE * 0.35 + fairPB * 0.2 + fairGraham * 0.15 + fairDCF * 0.3);
  const margin = Math.round(((weighted - price) / price) * 1000) / 10;

  let status: StockData['valuation']['status'] = 'Định giá hợp lý';
  if (margin >= 12) {
    status = 'Dưới giá trị (Hấp dẫn)';
  } else if (margin <= -12) {
    status = 'Định giá cao (Đắt)';
  }

  return {
    fairValuePE: fairPE,
    fairValuePB: fairPB,
    fairValueGraham: fairGraham,
    fairValueDCF: fairDCF,
    weightedFairValue: weighted,
    marginOfSafetyPercent: margin,
    status,
    assumedGrowthRate: growthRate,
    targetPE: targetPE,
    valuationModelType: 'STANDARD_INDUSTRIAL',
    valuationModelTitle: 'Mô hình Đa Phương Pháp Công Nghiệp (P/E, DCF, Graham, P/B-ROE)',
    valuationExplanation:
      'Kết hợp 4 phương pháp kinh điển: Dòng tiền chiết khấu DCF, Benjamin Graham, P/E tương đối và P/B-ROE để tạo biên an toàn vững chắc cho doanh nghiệp sản xuất và thương mại.',
  };
}

// Compute Technical Indicators summary
export function computeTechnicals(bars: PriceBar[], currentPrice: number): StockData['technicals'] {
  const lastBar = bars[bars.length - 1] || { close: currentPrice };
  const rsi = lastBar.rsi ?? 55;
  const macd = lastBar.macd ?? 0.5;
  const signal = lastBar.macdSignal ?? 0.3;
  const hist = lastBar.macdHist ?? 0.2;
  const ma20 = lastBar.ma20 ?? currentPrice * 0.98;

  let rsiSignal: StockData['technicals']['rsiSignal'] = 'Trung lập (Neutral)';
  if (rsi >= 70) rsiSignal = 'Quá mua (Overbought)';
  else if (rsi <= 30) rsiSignal = 'Quá bán (Oversold)';

  let macdCross: StockData['technicals']['macdCross'] = 'Trung tính';
  if (macd > signal && hist > 0) {
    macdCross = 'Giao cắt Vàng (Golden Cross - Mua)';
  } else if (macd < signal && hist < 0) {
    macdCross = 'Giao cắt Tử thần (Death Cross - Bán)';
  }

  const ma20Status = currentPrice >= ma20 ? 'Trên MA20' : 'Dưới MA20';

  let trend: StockData['technicals']['trend'] = 'Tăng nhẹ';
  if (currentPrice > ma20 && rsi > 55 && hist > 0) trend = 'Tăng mạnh';
  else if (currentPrice < ma20 && rsi < 45 && hist < 0) trend = 'Giảm nhẹ';
  else if (rsi < 35) trend = 'Giảm mạnh';
  else trend = 'Đi ngang (Sideway)';

  const support1 = Math.round(currentPrice * 0.96);
  const support2 = Math.round(currentPrice * 0.91);
  const resistance1 = Math.round(currentPrice * 1.05);
  const resistance2 = Math.round(currentPrice * 1.11);

  let overall: StockData['technicals']['overallTechnicalSignal'] = 'MUA';
  if (rsi < 35 && currentPrice >= support1) overall = 'MUA MẠNH';
  else if (rsi > 72 && hist < 0) overall = 'BÁN';
  else if (trend === 'Tăng mạnh') overall = 'MUA';
  else if (trend === 'Giảm mạnh') overall = 'BÁN MẠNH';
  else overall = 'THEO DÕI';

  return {
    currentRSI: rsi,
    rsiSignal,
    currentMACD: macd,
    currentMACDSignal: signal,
    macdHistogram: hist,
    macdCross,
    trend,
    support1,
    support2,
    resistance1,
    resistance2,
    ma20Status,
    overallTechnicalSignal: overall,
  };
}

// Compute Investment Scorecard (100 pts) & 12 Institutional Checklist Criteria
export function computeInvestmentScorecard(stock: {
  symbol: string;
  currentPrice: number;
  pe: number;
  industryPE: number;
  pb: number;
  industryPB: number;
  roe: number;
  roa: number;
  eps: number;
  debtEquity: number;
  netMargin: number;
  profitGrowth: number;
  revenueGrowth: number;
  dividendYield: number;
  technicals?: StockData['technicals'];
  valuation?: StockData['valuation'];
}): InvestmentScorecard {
  const roe = stock.roe || 15;
  const roa = stock.roa || 7;
  const de = stock.debtEquity || 0.6;
  const pe = stock.pe || 15;
  const profitGrowth = Math.max(5, stock.profitGrowth || 15);
  const marginOfSafety = stock.valuation?.marginOfSafetyPercent ?? 8;
  const rsi = stock.technicals?.currentRSI ?? 52;
  const isAboveMA50 = stock.technicals?.trend?.includes('Tăng') || true;

  // 1. Piotroski F-Score (0 - 9)
  let fScore = 0;
  if (roa > 0) fScore++;
  if (stock.netMargin > 0) fScore++;
  if (profitGrowth > 0) fScore++;
  if (stock.netMargin > 10) fScore++; // OCF > Net Income quality proxy
  if (de < 1.2) fScore++;
  if (de < 0.8) fScore++;
  fScore++; // No stock dilution
  if (stock.netMargin >= 12) fScore++;
  if (roa >= 8) fScore++;
  fScore = Math.min(9, Math.max(4, fScore));

  // 2. Altman Z-Score (Safe > 2.99, Grey 1.81-2.99, Distress < 1.81)
  const zScore = Math.round((2.4 + (roe / 10) * 0.8 - (de > 2 ? 1.0 : de * 0.3)) * 10) / 10;
  let zStatus: InvestmentScorecard['altmanZStatus'] = 'Vùng An toàn (>2.99)';
  if (zScore < 1.81) zStatus = 'Vùng Nguy hiểm (<1.81)';
  else if (zScore <= 2.99) zStatus = 'Vùng Xám (1.81 - 2.99)';

  // 3. ROIC (Return on Invested Capital)
  const roic = Math.round((roe * (1 - Math.min(0.5, de * 0.15))) * 10) / 10;

  // 4. PEG Ratio (Peter Lynch)
  const pegRatio = Math.round((pe / profitGrowth) * 100) / 100;

  // 5. Interest Coverage
  const interestCoverage = de < 0.2 ? 28 : Math.round((14 / Math.max(0.2, de)) * 10) / 10;

  // 6. Score breakdown
  // Financial Health (25 pts)
  let healthScore = Math.round(
    (fScore / 9) * 12 + (zScore > 2.99 ? 8 : zScore > 1.81 ? 5 : 2) + (de < 1.0 ? 5 : 2)
  );
  healthScore = Math.min(25, Math.max(8, healthScore));

  // Growth (25 pts)
  let growthScore = Math.round(
    (roe / 25) * 10 + (roic / 20) * 8 + (profitGrowth / 30) * 7
  );
  growthScore = Math.min(25, Math.max(8, growthScore));

  // Valuation (20 pts)
  let valScore = Math.round(
    (marginOfSafety > 15 ? 10 : marginOfSafety > 0 ? 7 : 3) +
      (pegRatio < 1.0 ? 6 : pegRatio < 1.5 ? 4 : 2) +
      (pe <= stock.industryPE ? 4 : 2)
  );
  valScore = Math.min(20, Math.max(5, valScore));

  // Momentum (15 pts)
  let momScore = Math.round(
    (rsi >= 40 && rsi <= 68 ? 6 : 4) +
      (isAboveMA50 ? 5 : 2) +
      (stock.technicals?.overallTechnicalSignal?.includes('MUA') ? 4 : 2)
  );
  momScore = Math.min(15, Math.max(4, momScore));

  // Governance & Moat (15 pts)
  let govScore = Math.round(
    (stock.netMargin >= 15 ? 6 : 4) + (stock.dividendYield >= 2 ? 5 : 3) + 4
  );
  govScore = Math.min(15, Math.max(5, govScore));

  const totalScore = healthScore + growthScore + valScore + momScore + govScore;

  let rank: InvestmentScorecard['rank'] = 'A (Tốt - Đạt chuẩn đầu tư)';
  if (totalScore >= 85) rank = 'A+ (Xuất sắc - Nên giải ngân mạnh)';
  else if (totalScore >= 75) rank = 'A (Tốt - Đạt chuẩn đầu tư)';
  else if (totalScore >= 60) rank = 'B (Khá - Phù hợp tích lũy/lướt sóng)';
  else if (totalScore >= 50) rank = 'C (Trung bình - Cần quan sát)';
  else rank = 'D (Yếu - Tránh tham gia)';

  // 12 Institutional Investment Checklist criteria
  const checklist: InvestmentChecklistItem[] = [
    {
      id: 'chk-1',
      title: 'Tỷ suất sinh lời ROE ≥ 15%',
      category: 'Tăng trưởng & Lợi thế',
      passed: roe >= 15,
      valueText: `${roe}%`,
      benchmarkText: '≥ 15.0%',
      impact: 'Rất quan trọng',
      explanation: 'Thước đo của Warren Buffett về hiệu quả sinh lời trên vốn chủ sở hữu.',
    },
    {
      id: 'chk-2',
      title: 'Hiệu quả sử dụng vốn hoạt động ROIC ≥ 12%',
      category: 'Tăng trưởng & Lợi thế',
      passed: roic >= 12,
      valueText: `${roic}%`,
      benchmarkText: '≥ 12.0%',
      impact: 'Quan trọng',
      explanation: 'Năng lực tạo ra lợi nhuận từ toàn bộ vốn hoạt động kinh doanh.',
    },
    {
      id: 'chk-3',
      title: 'Sức khỏe tài chính Piotroski F-Score ≥ 7/9',
      category: 'Sức khỏe tài chính',
      passed: fScore >= 7,
      valueText: `${fScore}/9`,
      benchmarkText: '≥ 7/9',
      impact: 'Rất quan trọng',
      explanation: 'Mô hình Giáo sư Piotroski đánh giá xu hướng cải thiện tài chính lành mạnh.',
    },
    {
      id: 'chk-4',
      title: 'Chỉ số an toàn Altman Z-Score trong Vùng An Toàn (> 2.99)',
      category: 'Sức khỏe tài chính',
      passed: zScore >= 2.99,
      valueText: `${zScore}`,
      benchmarkText: '> 2.99',
      impact: 'Rất quan trọng',
      explanation: 'Mô hình định lượng hàng đầu thế giới về mức độ an toàn trước nguy cơ kiệt quệ tài chính.',
    },
    {
      id: 'chk-5',
      title: 'Đòn bẩy tài chính Nợ/VCSH (D/E) an toàn < 1.0x',
      category: 'Sức khỏe tài chính',
      passed: de < 1.0,
      valueText: `${de}x`,
      benchmarkText: '< 1.0x',
      impact: 'Quan trọng',
      explanation: 'Tỷ lệ nợ thấp giúp doanh nghiệp vững vàng trước các đợt tăng lãi suất.',
    },
    {
      id: 'chk-6',
      title: 'Chất lượng dòng tiền: Dòng tiền kinh doanh OCF thặng dư',
      category: 'Sức khỏe tài chính',
      passed: true,
      valueText: 'Dương mạnh',
      benchmarkText: 'OCF > LNST',
      impact: 'Rất quan trọng',
      explanation: 'Lợi nhuận được hỗ trợ bởi dòng tiền mặt thật, không phải lợi nhuận ảo trên giấy.',
    },
    {
      id: 'chk-7',
      title: 'Tăng trưởng lợi nhuận EPS ≥ 15% YoY',
      category: 'Tăng trưởng & Lợi thế',
      passed: profitGrowth >= 15,
      valueText: `+${profitGrowth}%`,
      benchmarkText: '≥ 15.0%',
      impact: 'Quan trọng',
      explanation: 'Động lực tăng trưởng cốt lõi đẩy giá cổ phiếu bứt phá theo trường phái CANSLIM.',
    },
    {
      id: 'chk-8',
      title: 'Định giá tăng trưởng Peter Lynch: PEG ≤ 1.2x',
      category: 'Định giá & Biên an toàn',
      passed: pegRatio <= 1.2,
      valueText: `${pegRatio}x`,
      benchmarkText: '≤ 1.2x',
      impact: 'Quan trọng',
      explanation: 'Huyền thoại Peter Lynch ưu tiên cổ phiếu có P/E chiết khấu so với tốc độ tăng trưởng.',
    },
    {
      id: 'chk-9',
      title: 'Biên an toàn định giá (Margin of Safety) ≥ 10%',
      category: 'Định giá & Biên an toàn',
      passed: marginOfSafety >= 10,
      valueText: `${marginOfSafety}%`,
      benchmarkText: '≥ 10.0%',
      impact: 'Rất quan trọng',
      explanation: 'Khoảng đệm an toàn theo Benjamin Graham bảo vệ vốn trước rủi ro thị trường.',
    },
    {
      id: 'chk-10',
      title: 'Động lượng kỹ thuật duy trì trên đường xu hướng MA50',
      category: 'Dòng tiền & Kỹ thuật',
      passed: isAboveMA50,
      valueText: isAboveMA50 ? 'Trên MA50' : 'Dưới MA50',
      benchmarkText: 'Uptrend',
      impact: 'Quan trọng',
      explanation: 'Dòng tiền tổ chức lớn ưu tiên giải ngân vào các cổ phiếu đang trong xu hướng tăng.',
    },
    {
      id: 'chk-11',
      title: 'Chỉ báo RSI trong vùng an toàn, không Quá Mua cực điểm',
      category: 'Dòng tiền & Kỹ thuật',
      passed: rsi < 70,
      valueText: `RSI = ${rsi}`,
      benchmarkText: 'RSI < 70',
      impact: 'Quan trọng',
      explanation: 'Tránh mở vị thế mua đuổi giá xanh khi cổ phiếu đã rơi vào vùng quá nóng ngắn hạn.',
    },
    {
      id: 'chk-12',
      title: 'Tỷ suất cổ tức tiền mặt duy trì đều đặn (Yield ≥ 2%)',
      category: 'Quản trị & Vĩ mô',
      passed: stock.dividendYield >= 2,
      valueText: `${stock.dividendYield}%`,
      benchmarkText: '≥ 2.0%',
      impact: 'Tham khảo',
      explanation: 'Cổ tức tiền mặt đều đặn đóng vai trò như chiếc đệm đỡ giá trong các giai đoạn thị trường điều chỉnh.',
    },
  ];

  return {
    totalScore,
    rank,
    financialHealthScore: healthScore,
    growthScore,
    valuationScore: valScore,
    momentumScore: momScore,
    governanceScore: govScore,
    piotroskiFScore: fScore,
    altmanZScore: zScore,
    altmanZStatus: zStatus,
    roic,
    pegRatio,
    cashFlowQuality: 'Thặng dư tiền mặt vượt trội (OCF > NI)',
    interestCoverage,
    checklist,
  };
}

// Compute Capital Allocation & Position Sizing Plan
export function computeCapitalAllocationPlan(stock: {
  symbol: string;
  currentPrice: number;
  scorecard?: InvestmentScorecard;
  technicals?: StockData['technicals'];
}): CapitalAllocationPlan {
  const price = stock.currentPrice;
  const support = stock.technicals?.support1 || Math.round(price * 0.96);
  const resistance = stock.technicals?.resistance1 || Math.round(price * 1.05);

  const totalScore = stock.scorecard?.totalScore || 75;
  const maxWeight = totalScore >= 85 ? 25 : totalScore >= 70 ? 20 : totalScore >= 60 ? 15 : 10;

  return {
    maxPortfolioWeight: maxWeight,
    riskProfile: totalScore >= 80 ? 'Tăng trưởng cân bằng' : 'Tích sản an toàn',
    stages: [
      {
        stage: 1,
        name: 'Giai đoạn 1: Vị thế thăm dò (30%)',
        percentage: 30,
        action: `Giải ngân 30% quy mô dự kiến quanh vùng hỗ trợ ${support.toLocaleString('vi-VN')} - ${price.toLocaleString('vi-VN')} đ`,
        targetPriceCondition: 'Giá cổ phiếu tích lũy ổn định quanh vùng hỗ trợ kỹ thuật và kiểm định lượng cung bán ra',
        riskRule: 'Không tất tay ngay lập tức; duy trì tiền mặt dự phòng',
      },
      {
        stage: 2,
        name: 'Giai đoạn 2: Gia tăng theo xu hướng (30%)',
        percentage: 30,
        action: `Gia tăng thêm 30% khi giá bứt phá vượt ngưỡng cản ${resistance.toLocaleString('vi-VN')} đ với thanh khoản lớn`,
        targetPriceCondition: 'Khối lượng giao dịch (Volume) bùng nổ vượt 1.3x so với mức trung bình 20 phiên',
        riskRule: 'Chỉ gia tăng khi vị thế bước 1 đang có lãi (quy tắc trung bình giá lên)',
      },
      {
        stage: 3,
        name: 'Giai đoạn 3: Mua đủ vị thế (40%)',
        percentage: 40,
        action: 'Giải ngân 40% còn lại khi cổ phiếu test lại cản cũ thành công và xác nhận bước vào sóng tăng chính',
        targetPriceCondition: 'Cổ phiếu duy trì đà tăng ổn định trên đường trung bình MA20 và MA50',
        riskRule: 'Nâng điểm chặn lãi (Trailing Stop) về mức hòa vốn để triệt tiêu hoàn toàn rủi ro thua lỗ',
      },
    ],
    riskRewardRatio: '1 : 2.8',
    maxLossTolerated: 7.0,
  };
}

// Pre-defined bluechips
export const STOCKS_DATABASE: Record<string, StockData> = {
  FPT: {
    symbol: 'FPT',
    name: 'Công ty Cổ phần FPT',
    exchange: 'HOSE',
    sector: 'Công nghệ thông tin',
    industry: 'Phần mềm & Dịch vụ số & AI',
    currentPrice: 138500,
    change: 2800,
    changePercent: 2.06,
    dayHigh: 139500,
    dayLow: 136200,
    dayOpen: 136500,
    volume: 5824100,
    averageVolume: 4950000,
    week52High: 142000,
    week52Low: 91500,
    marketCap: 202800,
    sharesOutstanding: 1464,
    foreignOwnershipPercent: 49.0,

    pe: 24.8,
    industryPE: 22.5,
    pb: 6.2,
    industryPB: 4.8,
    roe: 28.5,
    roa: 14.2,
    eps: 5580,
    bvps: 22340,
    netMargin: 15.6,
    revenueGrowth: 22.4,
    profitGrowth: 23.8,
    debtEquity: 0.42,
    dividendYield: 2.1,
    beta: 0.88,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Tập đoàn công nghệ số 1 Việt Nam, dẫn đầu khu vực trong lĩnh vực xuất khẩu phần mềm, chuyển đổi số Cloud/AI, hạ tầng viễn thông và giáo dục đào tạo công nghệ cao. Quan hệ đối tác chiến lược với NVIDIA trong phát triển AI Factory.',
    highlights: [
      'Doanh thu ký mới chuyển đổi số toàn cầu vượt mốc 1 tỷ USD/năm, tăng trưởng trên 25%.',
      'Động lực bứt phá mạnh từ AI Factory hợp tác cùng NVIDIA cung cấp hạ tầng GPU điện toán đám mây.',
      'Mảng giáo dục FPT Education tiếp tục mở rộng quy mô tuyển sinh sinh viên vượt 150.000 người.',
      'Cổ tức đều đặn 20% bằng tiền mặt và 15% bằng cổ phiếu hàng năm.',
    ],
    news: [
      {
        id: 'fpt-news-1',
        title: 'FPT công bố kết quả kinh doanh quý: Doanh thu và lợi nhuận tăng trưởng trên 22%',
        summary: 'Mảng xuất khẩu dịch vụ CNTT tại thị trường Nhật Bản và APAC duy trì tăng tốc độ phá kỷ lục, biên lợi nhuận trước thuế giữ vững trên 19%.',
        source: 'Vietstock',
        date: '2026-10-10',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 98,
      },
      {
        id: 'fpt-news-2',
        title: 'FPT hợp tác mở rộng hạ tầng AI Factory cùng đối tác công nghệ quốc tế',
        summary: 'Đưa các cụm siêu máy tính phục vụ nghiên cứu mô hình ngôn ngữ lớn (LLM) và ứng dụng trí tuệ nhân tạo tạo sinh cho doanh nghiệp toàn cầu.',
        source: 'CafeF',
        date: '2026-10-08',
        category: 'M&A & Dự án',
        sentiment: 'bullish',
        relevanceScore: 94,
      },
      {
        id: 'fpt-news-3',
        title: 'Khối ngoại tiếp tục kín room 49% tại FPT, giao dịch thỏa thuận chênh lệch phí premium cao',
        summary: 'Các quỹ đầu tư tổ chức ngoại đánh giá FPT là cổ phiếu tăng trưởng công nghệ hiếm hoi có chất lượng quản trị minh bạch nhất Đông Nam Á.',
        source: 'FiinTrade',
        date: '2026-10-05',
        category: 'Nội bộ',
        sentiment: 'bullish',
        relevanceScore: 89,
      },
    ],
  },

  HPG: {
    symbol: 'HPG',
    name: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    exchange: 'HOSE',
    sector: 'Nguyên vật liệu & Công nghiệp',
    industry: 'Sản xuất Thép & Kim loại nặng',
    currentPrice: 28400,
    change: 450,
    changePercent: 1.61,
    dayHigh: 28650,
    dayLow: 27950,
    dayOpen: 28000,
    volume: 24500000,
    averageVolume: 22000000,
    week52High: 31200,
    week52Low: 24100,
    marketCap: 181700,
    sharesOutstanding: 6398,
    foreignOwnershipPercent: 26.5,

    pe: 14.2,
    industryPE: 15.5,
    pb: 1.55,
    industryPB: 1.4,
    roe: 12.8,
    roa: 7.2,
    eps: 2000,
    bvps: 18320,
    netMargin: 8.4,
    revenueGrowth: 18.5,
    profitGrowth: 35.2,
    debtEquity: 0.58,
    dividendYield: 3.5,
    beta: 1.25,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Nhà sản xuất thép xây dựng và thép cuộn cán nóng (HRC) lớn nhất Đông Nam Á. Đại dự án Khu liên hợp gang thép Dung Quất 2 nâng công suất thép thô lên 14 triệu tấn/năm, đưa Hòa Phát vào Top 30 nhà sản xuất thép lớn nhất thế giới.',
    highlights: [
      'Đại dự án Dung Quất 2 đi vào chạy thử nghiệm và vận hành thương mại, tạo bước nhảy vọt sản lượng HRC.',
      'Hưởng lợi trực tiếp từ làn sóng đầu tư công (sân bay Long Thành, cao tốc Bắc-Nam, đường sắt tốc độ cao).',
      'Được bảo vệ bởi các biện pháp tự vệ phòng vệ thương mại đối với thép HRC nhập khẩu giá rẻ.',
      'Sức khỏe tài chính lành mạnh, tỷ lệ nợ vay được kiểm soát an toàn sau chu kỳ đầu tư lớn.',
    ],
    news: [
      {
        id: 'hpg-news-1',
        title: 'Hòa Phát đón dòng tiền đột biến khi dự án Dung Quất 2 cho ra lò mẻ thép cuộn HRC đầu tiên',
        summary: 'Công suất bổ sung 5,6 triệu tấn HRC chất lượng cao sẽ giúp HPG chiếm lĩnh thị trường nội địa thay thế hàng nhập khẩu.',
        source: 'Vietstock',
        date: '2026-10-11',
        category: 'M&A & Dự án',
        sentiment: 'bullish',
        relevanceScore: 96,
      },
      {
        id: 'hpg-news-2',
        title: 'Bộ Công Thương ban hành quyết định áp thuế chống bán phá giá tạm thời thép cuộn cán nóng',
        summary: 'Động thái tạo rào cản ngăn chặn thép phá giá, giúp giá bán thép nội địa ổn định và phục hồi biên lợi nhuận cho Hòa Phát.',
        source: 'Báo Đầu Tư',
        date: '2026-10-07',
        category: 'Ngành',
        sentiment: 'bullish',
        relevanceScore: 92,
      },
    ],
  },

  VNM: {
    symbol: 'VNM',
    name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    exchange: 'HOSE',
    sector: 'Hàng tiêu dùng thiết yếu',
    industry: 'Sữa & Thực phẩm dinh dưỡng',
    currentPrice: 68500,
    change: -200,
    changePercent: -0.29,
    dayHigh: 69200,
    dayLow: 68200,
    dayOpen: 68800,
    volume: 3850000,
    averageVolume: 4200000,
    week52High: 76000,
    week52Low: 64500,
    marketCap: 143160,
    sharesOutstanding: 2090,
    foreignOwnershipPercent: 53.8,

    pe: 15.6,
    industryPE: 17.0,
    pb: 4.1,
    industryPB: 3.8,
    roe: 27.2,
    roa: 18.5,
    eps: 4390,
    bvps: 16700,
    netMargin: 15.1,
    revenueGrowth: 6.8,
    profitGrowth: 8.5,
    debtEquity: 0.22,
    dividendYield: 5.8,
    beta: 0.65,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Thương hiệu sữa quốc gia số 1 Việt Nam với thị phần áp đảo hơn 50% nội địa. Hệ thống trang trại đạt chuẩn quốc tế Green Farm và mạng lưới phân phối hơn 250.000 điểm bán lẻ phủ khắp 63 tỉnh thành cùng xuất khẩu đi 60 quốc gia.',
    highlights: [
      'Dòng tiền tự do cực kỳ dồi dào, tỷ lệ chia cổ tức tiền mặt cao và đều đặn 35-40% mệnh giá (yield ~5.8%).',
      'Chiến lược tái định vị thương hiệu thành công thu hút phân khúc người tiêu dùng trẻ Gen Z.',
      'Giá sữa bột nguyên liệu thế giới duy trì vùng thấp, giúp nới rộng biên lợi nhuận gộp lên trên 42%.',
      'Cổ phiếu phòng thủ lý tưởng trong giai đoạn thị trường biến động kinh tế vĩ mô phức tạp.',
    ],
    news: [
      {
        id: 'vnm-news-1',
        title: 'Vinamilk chốt danh sách tạm ứng cổ tức đợt 2 năm 2026 bằng tiền mặt tỷ lệ 15%',
        summary: 'Nguồn chi trả từ nguồn lợi nhuận giữ lại dồi dào, tiếp tục khẳng định vị thế "cỗ máy in tiền mặt" cho cổ đông dài hạn.',
        source: 'CafeF',
        date: '2026-10-09',
        category: 'Cổ tức',
        sentiment: 'bullish',
        relevanceScore: 95,
      },
    ],
  },

  VCB: {
    symbol: 'VCB',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    exchange: 'HOSE',
    sector: 'Tài chính - Ngân hàng',
    industry: 'Ngân hàng thương mại',
    currentPrice: 94200,
    change: 1200,
    changePercent: 1.29,
    dayHigh: 94800,
    dayLow: 93000,
    dayOpen: 93200,
    volume: 2800000,
    averageVolume: 2500000,
    week52High: 99000,
    week52Low: 83500,
    marketCap: 526500,
    sharesOutstanding: 5589,
    foreignOwnershipPercent: 23.4,

    pe: 13.8,
    industryPE: 9.8,
    pb: 2.7,
    industryPB: 1.4,
    roe: 22.4,
    roa: 2.3,
    eps: 6820,
    bvps: 34880,
    netMargin: 38.5,
    revenueGrowth: 14.2,
    profitGrowth: 16.5,
    debtEquity: 8.5,
    dividendYield: 1.8,
    beta: 0.75,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Ngân hàng thương mại hàng đầu Việt Nam về quy mô vốn hóa, chất lượng tài sản và tỷ lệ bao phủ nợ xấu dẫn đầu toàn ngành (>230%). Nắm giữ vai trò trụ cột hệ thống ngân hàng nhà nước và thanh toán quốc tế.',
    highlights: [
      'Chất lượng tài sản số 1 toàn ngành ngân hàng với tỷ lệ nợ xấu NPL dưới 1.0%.',
      'Chi phí vốn rẻ nhờ nguồn tiền gửi không kỳ hạn (CASA) dồi dào từ thanh toán xuất nhập khẩu.',
      'Kế hoạch phát hành riêng lẻ 6.5% vốn cho nhà đầu tư ngoại gia tăng bộ đệm vốn CAR lên trên 13%.',
    ],
    news: [
      {
        id: 'vcb-news-1',
        title: 'Vietcombank duy trì quán quân lợi nhuận trước thuế toàn hệ thống tài chính',
        summary: 'Tăng trưởng tín dụng tập trung nhóm khách hàng doanh nghiệp FDI và bán lẻ rủi ro thấp.',
        source: 'Vietstock',
        date: '2026-10-10',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 93,
      },
    ],
  },

  MWG: {
    symbol: 'MWG',
    name: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
    exchange: 'HOSE',
    sector: 'Bán lẻ tiêu dùng',
    industry: 'Chuỗi bán lẻ ICT & Bách hóa',
    currentPrice: 65800,
    change: 1400,
    changePercent: 2.17,
    dayHigh: 66200,
    dayLow: 64200,
    dayOpen: 64500,
    volume: 7900000,
    averageVolume: 7100000,
    week52High: 72500,
    week52Low: 42000,
    marketCap: 96200,
    sharesOutstanding: 1462,
    foreignOwnershipPercent: 49.0,

    pe: 21.5,
    industryPE: 19.0,
    pb: 3.5,
    industryPB: 2.9,
    roe: 18.2,
    roa: 7.9,
    eps: 3060,
    bvps: 18800,
    netMargin: 3.8,
    revenueGrowth: 15.4,
    profitGrowth: 68.0,
    debtEquity: 0.85,
    dividendYield: 1.5,
    beta: 1.18,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Chuỗi bán lẻ số 1 Việt Nam gồm Thế Giới Di Động, Điện Máy Xanh, chuỗi siêu thị thực phẩm Bách Hóa Xanh và nhà thuốc An Khang. Bước ngoặt lớn khi Bách Hóa Xanh chính thức có lãi ròng và mở rộng mạng lưới miền Trung.',
    highlights: [
      'Chuỗi Bách Hóa Xanh đóng góp lợi nhuận dương đều đặn sau tái cấu trúc tối ưu doanh thu/cửa hàng.',
      'Sức mua các mặt hàng điện thoại & điện máy phục hồi tích cực trong quý tiêu dùng cuối năm.',
      'Tái mở room ngoại thành công thu hút các quỹ đầu tư tiêu dùng Đông Nam Á.',
    ],
    news: [
      {
        id: 'mwg-news-1',
        title: 'Bách Hóa Xanh cán mốc doanh thu trung bình 2,1 tỷ đồng/cửa hàng/tháng',
        summary: 'Biên lợi nhuận gộp đạt 26.5%, hệ thống logistics tự động hóa giúp hạ mạnh chi phí hủy hàng.',
        source: 'CafeF',
        date: '2026-10-09',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 97,
      },
    ],
  },

  TCB: {
    symbol: 'TCB',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
    exchange: 'HOSE',
    sector: 'Tài chính - Ngân hàng',
    industry: 'Ngân hàng số & Bán lẻ',
    currentPrice: 24800,
    change: 350,
    changePercent: 1.43,
    dayHigh: 25100,
    dayLow: 24400,
    dayOpen: 24500,
    volume: 16500000,
    averageVolume: 14200000,
    week52High: 26500,
    week52Low: 18900,
    marketCap: 174800,
    sharesOutstanding: 7045,
    foreignOwnershipPercent: 22.5,

    pe: 7.8,
    industryPE: 9.8,
    pb: 1.15,
    industryPB: 1.4,
    roe: 17.4,
    roa: 2.6,
    eps: 3180,
    bvps: 21560,
    netMargin: 36.2,
    revenueGrowth: 19.2,
    profitGrowth: 28.5,
    debtEquity: 5.6,
    dividendYield: 4.0,
    beta: 1.32,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Ngân hàng tư nhân dẫn đầu Việt Nam về tỷ lệ CASA (trên 40%), nền tảng công nghệ số và hệ sinh thái khách hàng cao cấp liên kết chặt chẽ cùng các tập đoàn hàng đầu.',
    highlights: [
      'Tỷ lệ CASA vượt 40% giúp chi phí vốn huy động COF nằm trong top thấp nhất khối ngân hàng TMCP tư nhân.',
      'Sự phục hồi của thị trường bất động sản và trái phiếu doanh nghiệp tháo gỡ điểm nghẽn nợ xấu.',
      'Định giá P/B chỉ ~1.15x, chiết khấu sâu so với mức ROE 17.4%.',
    ],
    news: [
      {
        id: 'tcb-news-1',
        title: 'Techcombank tiếp tục mở rộng dư nợ bán lẻ, đẩy mạnh gói tín dụng nhà ở lãi suất ưu đãi',
        summary: 'Thu nhập từ phí dịch vụ bảo hiểm và môi giới chứng khoán TCBS tăng trưởng trở lại.',
        source: 'Vietstock',
        date: '2026-10-08',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 91,
      },
    ],
  },

  SSI: {
    symbol: 'SSI',
    name: 'Công ty Cổ phần Chứng khoán SSI',
    exchange: 'HOSE',
    sector: 'Dịch vụ Tài chính',
    industry: 'Chứng khoán & Ngân hàng đầu tư',
    currentPrice: 32600,
    change: 600,
    changePercent: 1.88,
    dayHigh: 33000,
    dayLow: 31900,
    dayOpen: 32000,
    volume: 18200000,
    averageVolume: 15400000,
    week52High: 37500,
    week52Low: 26800,
    marketCap: 65200,
    sharesOutstanding: 2000,
    foreignOwnershipPercent: 44.2,

    pe: 16.2,
    industryPE: 17.5,
    pb: 1.85,
    industryPB: 1.7,
    roe: 14.5,
    roa: 5.2,
    eps: 2010,
    bvps: 17620,
    netMargin: 32.1,
    revenueGrowth: 26.8,
    profitGrowth: 32.0,
    debtEquity: 1.4,
    dividendYield: 3.1,
    beta: 1.45,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Công ty chứng khoán có quy mô vốn chủ sở hữu lớn nhất thị trường chứng khoán Việt Nam. Hưởng lợi trực tiếp hàng đầu khi hệ thống KRX vận hành, thanh khoản thị trường mở rộng và tiến trình nâng hạng thị trường chứng khoán mới nổi FTSE.',
    highlights: [
      'Vị thế số 1 mảng khách hàng tổ chức và ngân hàng đầu tư (IB).',
      'Hưởng lợi kép từ quy mô dư nợ cho vay Margin kỷ lục và mảng tự doanh danh mục trái phiếu sinh lời an toàn.',
    ],
    news: [
      {
        id: 'ssi-news-1',
        title: 'Thanh khoản thị trường chứng khoán bùng nổ, SSI ghi nhận doanh thu môi giới và margin tăng vọt',
        summary: 'Thị trường hướng tới cột mốc nâng hạng thị trường mới nổi trong kỳ đánh giá sắp tới.',
        source: 'CafeF',
        date: '2026-10-09',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 94,
      },
    ],
  },

  DGC: {
    symbol: 'DGC',
    name: 'Công ty Cổ phần Tập đoàn Hóa chất Đức Giang',
    exchange: 'HOSE',
    sector: 'Nguyên vật liệu & Hóa chất',
    industry: 'Phốt pho vàng & Bán dẫn',
    currentPrice: 114500,
    change: 2200,
    changePercent: 1.96,
    dayHigh: 115800,
    dayLow: 112000,
    dayOpen: 112500,
    volume: 3200000,
    averageVolume: 2900000,
    week52High: 128000,
    week52Low: 84000,
    marketCap: 43500,
    sharesOutstanding: 379,
    foreignOwnershipPercent: 28.5,

    pe: 14.8,
    industryPE: 16.5,
    pb: 3.2,
    industryPB: 2.8,
    roe: 24.8,
    roa: 19.2,
    eps: 7730,
    bvps: 35780,
    netMargin: 34.0,
    revenueGrowth: 16.0,
    profitGrowth: 21.5,
    debtEquity: 0.12,
    dividendYield: 4.2,
    beta: 1.1,

    valuation: {} as any,
    technicals: {} as any,
    history: {} as any,

    description:
      'Nhà sản xuất phốt pho vàng (P4) hàng đầu thế giới – nguyên liệu thiết yếu không thể thay thế cho ngành sản xuất chip bán dẫn, pin lithium-ion và công nghiệp điện tử hiện đại. Dự án Tổ hợp Hóa chất Nghi Sơn đang chuẩn bị hoàn thành.',
    highlights: [
      'Nhu cầu chip AI bùng nổ kéo theo sản lượng và giá bán phốt pho vàng điện tử tăng mạnh.',
      'Sở hữu công nghệ tinh chế sâu và mỏ apatit tự chủ mang lại biên lợi nhuận ròng trên 30%.',
      'Lượng tiền mặt ròng khổng lồ, hầu như không có nợ vay rủi ro.',
    ],
    news: [
      {
        id: 'dgc-news-1',
        title: 'Giá phốt pho vàng xuất khẩu hồi phục mạnh theo nhu cầu chuỗi cung ứng bán dẫn toàn cầu',
        summary: 'Các nhà máy sản xuất chip tại Nhật Bản, Hàn Quốc và Đài Loan gia tăng đơn hàng dài hạn với DGC.',
        source: 'FiinTrade',
        date: '2026-10-06',
        category: 'Ngành',
        sentiment: 'bullish',
        relevanceScore: 92,
      },
    ],
  },
};

// Initialize valuations, technicals, scorecard, and allocation for all predefined stocks
Object.keys(STOCKS_DATABASE).forEach((sym) => {
  const s = STOCKS_DATABASE[sym];
  s.history = generateHistory(s.currentPrice, 0.02, 0.18);
  s.valuation = computeValuation(
    s.currentPrice,
    s.eps,
    s.bvps,
    s.roe,
    s.industryPE,
    s.industryPB,
    18,
    s.industryPE,
    s.sector,
    s.symbol
  );
  s.financialStatements = generateFinancialStatementsData(s);
  s.technicals = computeTechnicals(s.history['1Y'], s.currentPrice);
  s.scorecard = computeInvestmentScorecard({
    symbol: s.symbol,
    currentPrice: s.currentPrice,
    pe: s.pe,
    industryPE: s.industryPE,
    pb: s.pb,
    industryPB: s.industryPB,
    roe: s.roe,
    roa: s.roa,
    eps: s.eps,
    debtEquity: s.debtEquity,
    netMargin: s.netMargin,
    profitGrowth: s.profitGrowth,
    revenueGrowth: s.revenueGrowth,
    dividendYield: s.dividendYield,
    technicals: s.technicals,
    valuation: s.valuation,
  });
  s.allocationPlan = computeCapitalAllocationPlan({
    symbol: s.symbol,
    currentPrice: s.currentPrice,
    scorecard: s.scorecard,
    technicals: s.technicals,
  });
});

// Dynamic fallback generator for any ticker typed by the user (e.g. VIC, PVD, VHM, MBB, AAPL, NVDA)
export function getOrGenerateStock(querySymbol: string): StockData {
  const sym = querySymbol.toUpperCase().trim();
  if (STOCKS_DATABASE[sym]) {
    return STOCKS_DATABASE[sym];
  }

  // Generate realistic attributes based on hash of symbol
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = (hash << 5) - hash + sym.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const isUS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(sym);
  const basePrice = isUS
    ? Math.round(100 + (absHash % 400))
    : Math.round(20000 + (absHash % 120000));
  const changePercent = Math.round(((absHash % 70) / 10 - 3.5) * 100) / 100;
  const change = Math.round(basePrice * (changePercent / 100));

  const pe = Math.round((10 + (absHash % 25)) * 10) / 10;
  const pb = Math.round((1.1 + (absHash % 30) / 10) * 10) / 10;
  const roe = Math.round((12 + (absHash % 18)) * 10) / 10;
  const roa = Math.round((roe * 0.45) * 10) / 10;
  const eps = Math.round(basePrice / pe);
  const bvps = Math.round(basePrice / pb);

  const stock: StockData = {
    symbol: sym,
    name: `Công ty Cổ phần Đầu tư & Phát triển ${sym}`,
    exchange: isUS ? 'NASDAQ' : 'HOSE',
    sector: isUS ? 'Công nghệ toàn cầu' : 'Doanh nghiệp niêm yết',
    industry: isUS ? 'High-Tech & Semiconductors' : 'Sản xuất & Thương mại dịch vụ',
    currentPrice: basePrice,
    change,
    changePercent,
    dayHigh: Math.round(basePrice * 1.02),
    dayLow: Math.round(basePrice * 0.98),
    dayOpen: Math.round(basePrice - change * 0.5),
    volume: isUS ? 35000000 : 4500000,
    averageVolume: isUS ? 42000000 : 5100000,
    week52High: Math.round(basePrice * 1.3),
    week52Low: Math.round(basePrice * 0.75),
    marketCap: isUS ? 850 : 25000,
    sharesOutstanding: isUS ? 3500 : 850,
    foreignOwnershipPercent: 32.5,

    pe,
    industryPE: Math.round((pe * 1.05) * 10) / 10,
    pb,
    industryPB: Math.round((pb * 1.02) * 10) / 10,
    roe,
    roa,
    eps,
    bvps,
    netMargin: 14.5,
    revenueGrowth: 17.2,
    profitGrowth: 22.8,
    debtEquity: 0.65,
    dividendYield: 2.8,
    beta: 1.05,

    valuation: {} as any,
    technicals: {} as any,
    history: generateHistory(basePrice, 0.022, 0.15),

    description: `Mã cổ phiếu ${sym} đang thu hút sự chú ý lớn từ các quỹ đầu tư và dòng tiền thị trường. Hoạt động kinh doanh cốt lõi duy trì tốc độ mở rộng ổn định cùng các dự án trọng điểm đang triển khai.`,
    highlights: [
      `Tăng trưởng doanh thu duy trì ở mức hai con số trong các quý liên tiếp.`,
      `Sức khỏe tài chính an toàn với dòng tiền từ hoạt động kinh doanh thặng dư.`,
      `Thị phần và năng lực cạnh tranh trong ngành vững chắc.`,
    ],
    news: [
      {
        id: `${sym}-news-1`,
        title: `${sym} công bố kế hoạch kinh doanh và mở rộng thị phần quý tới`,
        summary: `Hội đồng quản trị thông qua định hướng tăng tốc các dự án đầu tư chiến lược nhằm đón đầu chu kỳ tăng trưởng mới.`,
        source: 'Vietstock',
        date: '2026-10-10',
        category: 'KQKD',
        sentiment: 'bullish',
        relevanceScore: 92,
      },
      {
        id: `${sym}-news-2`,
        title: `Phân tích triển vọng ngành và vị thế doanh nghiệp của mã ${sym}`,
        summary: `Báo cáo phân tích từ các công ty chứng khoán đánh giá tích cực về tiềm năng tăng trưởng trung và dài hạn.`,
        source: 'CafeF',
        date: '2026-10-07',
        category: 'Ngành',
        sentiment: 'neutral',
        relevanceScore: 85,
      },
    ],
  };

  stock.valuation = computeValuation(
    stock.currentPrice,
    stock.eps,
    stock.bvps,
    stock.roe,
    stock.industryPE,
    stock.industryPB,
    16,
    stock.industryPE,
    stock.sector,
    stock.symbol
  );
  stock.financialStatements = generateFinancialStatementsData(stock);
  stock.technicals = computeTechnicals(stock.history['1Y'], stock.currentPrice);
  stock.scorecard = computeInvestmentScorecard({
    symbol: stock.symbol,
    currentPrice: stock.currentPrice,
    pe: stock.pe,
    industryPE: stock.industryPE,
    pb: stock.pb,
    industryPB: stock.industryPB,
    roe: stock.roe,
    roa: stock.roa,
    eps: stock.eps,
    debtEquity: stock.debtEquity,
    netMargin: stock.netMargin,
    profitGrowth: stock.profitGrowth,
    revenueGrowth: stock.revenueGrowth,
    dividendYield: stock.dividendYield,
    technicals: stock.technicals,
    valuation: stock.valuation,
  });
  stock.allocationPlan = computeCapitalAllocationPlan({
    symbol: stock.symbol,
    currentPrice: stock.currentPrice,
    scorecard: stock.scorecard,
    technicals: stock.technicals,
  });

  return stock;
}

// Macro Economic & General Market Events
export const INITIAL_MACRO_EVENTS: MacroEvent[] = [
  {
    id: 'macro-1',
    title: 'Ngân hàng Nhà nước duy trì mặt bằng lãi suất điều hành thấp, thúc đẩy tăng trưởng tín dụng',
    summary:
      'Chính sách tiền tệ nới lỏng linh hoạt tiếp tục hỗ trợ chi phí vốn cho doanh nghiệp sản xuất và kích cầu tiêu dùng. Dòng tiền gửi tiết kiệm có xu hướng dịch chuyển một phần sang kênh đầu tư chứng khoán và bất động sản.',
    category: 'Lãi suất & Tiền tệ',
    impactLevel: 'Cao',
    sentiment: 'bullish',
    beneficiarySectors: ['Bất động sản', 'Chứng khoán', 'Sản xuất công nghiệp', 'Bán lẻ'],
    riskSectors: ['Ngân hàng (áp lực biên lãi thuần NIM ngắn hạn)'],
    actionAdvice:
      'Tích lũy các cổ phiếu đầu ngành có tỷ lệ nợ vay được tối ưu và hưởng lợi trực tiếp từ thanh khoản thị trường dồi dào.',
    date: '2026-10-11',
  },
  {
    id: 'macro-2',
    title: 'Tiến độ nâng hạng Thị trường Chứng khoán Việt Nam lên Thị trường Mới nổi (FTSE Emerging Market)',
    summary:
      'Ủy ban Chứng khoán Nhà nước và Bộ Tài chính hoàn tất cơ chế Non-prefunding (giao dịch không ký quỹ 100% bằng tiền mặt cho nhà đầu tư tổ chức nước ngoài) và triển khai hệ thống công nghệ thông tin mới. Dự kiến thu hút dòng vốn ngoại ước tính 3-5 tỷ USD từ các quỹ ETF toàn cầu.',
    category: 'Chính sách & Nâng hạng',
    impactLevel: 'Cao',
    sentiment: 'bullish',
    beneficiarySectors: ['Chứng khoán (SSI, VCI, HCM)', 'Nhóm VN30 vốn hóa lớn (FPT, HPG, VCB, VNM, MWG)'],
    riskSectors: ['Các mã đầu cơ thanh khoản thấp (dòng tiền tập trung vào rổ Bluechips)'],
    actionAdvice:
      'Tập trung tỷ trọng danh mục vào top 10 cổ phiếu trụ VN30 có thanh khoản lớn và room ngoại còn trống hoặc cổ phiếu kín room có sức tăng trưởng EPS cao.',
    date: '2026-10-10',
  },
  {
    id: 'macro-3',
    title: 'Biến động tỷ giá USD/VND và định hướng điều hành của Cục Dự trữ Liên bang Mỹ (Fed)',
    summary:
      'Chênh lệch lãi suất USD-VND được thu hẹp khi Fed tiến hành chu kỳ hạ lãi suất điều hành. Áp lực tỷ giá hạ nhiệt giúp Ngân hàng Nhà nước có thêm dư địa giữ thanh khoản tiền đồng dồi dào trên thị trường liên ngân hàng.',
    category: 'Tỷ giá & Ngoại hối',
    impactLevel: 'Trung bình',
    sentiment: 'neutral',
    beneficiarySectors: ['Doanh nghiệp nhập khẩu nguyên liệu (Thép HPG, Bán lẻ MWG)', 'Hàng không'],
    riskSectors: ['Doanh nghiệp vay nợ bằng đồng USD nếu tỷ giá giật cục'],
    actionAdvice:
      'Theo dõi sát chỉ số DXY và động thái hút/bơm ròng qua kênh OMO tín phiếu để quản trị tỷ trọng tiền mặt hợp lý.',
    date: '2026-10-08',
  },
  {
    id: 'macro-4',
    title: 'Tăng tốc giải ngân vốn Đầu tư công cho các đại dự án hạ tầng giao thông quốc gia',
    summary:
      'Chính phủ đẩy mạnh giải ngân các dự án trọng điểm như Cao tốc Bắc - Nam, Vành đai 3 & 4 TP.HCM/Hà Nội, Cảng hàng không quốc tế Long Thành và nghiên cứu dự án Đường sắt cao tốc. Nhu cầu vật liệu xây dựng dự kiến tăng mạnh 20-30%.',
    category: 'Kinh tế vĩ mô & GDP',
    impactLevel: 'Cao',
    sentiment: 'bullish',
    beneficiarySectors: ['Vật liệu xây dựng & Thép (HPG)', 'Xây dựng hạ tầng', 'Bất động sản công nghiệp'],
    riskSectors: ['Chưa ghi nhận rủi ro đáng kể'],
    actionAdvice:
      'Nắm giữ các cổ phiếu thép và vật liệu xây dựng dẫn đầu thị phần có công suất lớn đón trọn làn sóng giải ngân.',
    date: '2026-10-06',
  },
];
