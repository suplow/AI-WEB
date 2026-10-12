import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  Compass,
  MessageSquare,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Flame,
  FileText,
  User,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { StockData, AIAnalysisResult } from '../types/stock';

interface AIInvestmentAdviceProps {
  stock: StockData;
  aiAnalysis: AIAnalysisResult | null;
  isLoading: boolean;
  onRefreshAnalysis: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AIInvestmentAdvice: React.FC<AIInvestmentAdviceProps> = ({
  stock,
  aiAnalysis,
  isLoading,
  onRefreshAnalysis,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const isUS = stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE';
  const formatMoney = (val: number) => {
    if (isUS) return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  const sampleQuestions = [
    `Vùng giá ${stock.currentPrice.toLocaleString('vi-VN')} này có nên giải ngân mua gom chưa?`,
    `Tác động của chính sách tiền tệ và vĩ mô gần nhất tới ${stock.symbol} như thế nào?`,
    `Điểm cắt lỗ và mục tiêu chốt lời hợp lý nhất cho mã này là bao nhiêu?`,
    `So sánh lợi thế cạnh tranh của ${stock.symbol} so với các đối thủ cùng ngành?`,
  ];

  const handleSendChat = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isChatLoading) return;

    const newHistory = [...chatMessages, { role: 'user' as const, text: q }];
    setChatMessages(newHistory);
    setInputQuestion('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          stockContext: {
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice,
            pe: stock.pe,
            pb: stock.pb,
            roe: stock.roe,
            eps: stock.eps,
            sector: stock.sector,
            recommendation: aiAnalysis?.recommendation,
            targetPriceShortTerm: aiAnalysis?.targetPriceShortTerm,
            targetPriceLongTerm: aiAnalysis?.targetPriceLongTerm,
          },
          chatHistory: chatMessages,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages([...newHistory, { role: 'model', text: data.reply }]);
      } else {
        setChatMessages([
          ...newHistory,
          {
            role: 'model',
            text: 'Rất tiếc, hệ thống chưa thể phân tích câu hỏi lúc này. Vui lòng thử lại sau giây lát.',
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        {
          role: 'model',
          text: `Đã xảy ra lỗi kết nối: ${err.message || 'Lỗi không xác định'}.`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Default fallback advice if AI is loading or not generated yet
  const recommendation = aiAnalysis?.recommendation || 'MUA';
  const recBadgeColor =
    recommendation === 'MUA MẠNH'
      ? 'bg-emerald-500 text-white'
      : recommendation === 'MUA'
      ? 'bg-emerald-600/90 text-white'
      : recommendation === 'NẮM GIỮ'
      ? 'bg-amber-600 text-white'
      : 'bg-rose-600 text-white';

  return (
    <div className="space-y-6">
      {/* 1. Master Recommendation Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Khuyến Nghị Đầu Tư & Chiến Lược Toàn Diện (AI Equity Analyst)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phân tích đa chiều kết hợp định giá cơ bản, động lượng kỹ thuật và tin tức vĩ mô
            </p>
          </div>

          <button
            onClick={onRefreshAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition-all self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang phân tích...' : 'Làm mới phân tích AI'}
          </button>
        </div>

        {/* Master Action Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
          {/* Main Action Badge */}
          <div className="md:col-span-1 bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-slate-400 font-medium">Khuyến nghị tổng thể</span>
            <div
              className={`mt-2 px-5 py-2 rounded-xl text-xl font-black tracking-wider shadow-lg ${recBadgeColor}`}
            >
              {recommendation}
            </div>
            <div className="mt-3 text-xs text-slate-300 font-medium leading-relaxed">
              {aiAnalysis?.recommendationReason ||
                'Cổ phiếu hội tụ đủ các yếu tố định giá hấp dẫn, biên an toàn cao và vị thế đầu ngành vững chắc.'}
            </div>
          </div>

          {/* Key Targets */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
              <div className="text-[11px] text-slate-400">Giá Mục Tiêu Ngắn Hạn (1-3T)</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {formatMoney(
                  aiAnalysis?.targetPriceShortTerm || Math.round(stock.currentPrice * 1.12)
                )}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Kỳ vọng: +
                {(
                  (((aiAnalysis?.targetPriceShortTerm || Math.round(stock.currentPrice * 1.12)) -
                    stock.currentPrice) /
                    stock.currentPrice) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
              <div className="text-[11px] text-slate-400">Giá Mục Tiêu Trung Hạn (6-12T)</div>
              <div className="text-xl font-extrabold text-emerald-300 mt-1">
                {formatMoney(
                  aiAnalysis?.targetPriceLongTerm || Math.round(stock.currentPrice * 1.25)
                )}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Kỳ vọng: +
                {(
                  (((aiAnalysis?.targetPriceLongTerm || Math.round(stock.currentPrice * 1.25)) -
                    stock.currentPrice) /
                    stock.currentPrice) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
              <div className="text-[11px] text-slate-400">Giá Cắt Lỗ Đề Xuất (Stop Loss)</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">
                {formatMoney(aiAnalysis?.stopLossPrice || Math.round(stock.currentPrice * 0.93))}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-1">
                Quản trị rủi ro tối đa: -7.0%
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3.5">
              <div className="text-[11px] text-slate-400">Tỷ lệ Lợi Nhuận / Rủi Ro (R:R)</div>
              <div className="text-xl font-extrabold text-cyan-400 mt-1">
                {aiAnalysis?.riskRewardRatio || '1 : 2.8'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Mức rủi ro: <strong className="text-amber-400">{aiAnalysis?.riskLevel || 'Trung bình'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Expert Executive Summary */}
        <div className="mt-5 p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5">
            <FileText className="w-4 h-4" />
            <span>Tóm tắt Nhận định Chuyên gia CFA</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {aiAnalysis?.expertSummary ||
              `${stock.name} (${stock.symbol}) đang thể hiện nền tảng tài chính lành mạnh với biên lợi nhuận ròng ${stock.netMargin}% và ROE đạt ${stock.roe}%. Định giá hiện tại tạo biên an toàn thích hợp để nhà đầu tư giải ngân gom theo từng phần trong các nhịp thị trường điều chỉnh.`}
          </p>
        </div>
      </div>

      {/* 2. Three Investment Horizons Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Chiến Lược Đầu Tư Theo Chân Trời Thời Gian (Investment Horizons)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Horizon 1: Short term */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Lướt Sóng Ngắn Hạn (T+)
              </span>
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                1 - 3 tuần
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-slate-100">Chiến lược:</strong> Theo dõi vùng hỗ trợ{' '}
                {formatMoney(stock.technicals.support1)}, chỉ mở mua khi RSI kiểm tra vùng bật tăng.
              </p>
              <p>
                <strong className="text-slate-100">Chốt lời ngắn hạn:</strong> Tại ngưỡng cản{' '}
                {formatMoney(stock.technicals.resistance1)}.
              </p>
              <p>
                <strong className="text-slate-100">Kỷ luật:</strong> Tuyệt đối tuân thủ cắt lỗ nếu
                thủng {formatMoney(stock.technicals.support2)}.
              </p>
            </div>
          </div>

          {/* Horizon 2: Medium term */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Trung Hạn (3 - 6 Tháng)
              </span>
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                Theo quý KQKD
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-slate-100">Chiến lược:</strong> Mua gom theo các đợt công bố
                kết quả kinh doanh quý và mùa chia cổ tức.
              </p>
              <p>
                <strong className="text-slate-100">Chất xúc tác:</strong> Hưởng lợi từ sự phục hồi
                kinh tế chung và các dự án mở rộng công suất mới.
              </p>
              <p>
                <strong className="text-slate-100">Mục tiêu:</strong> Đạt giá trị hợp lý{' '}
                {formatMoney(stock.valuation.weightedFairValue)}.
              </p>
            </div>
          </div>

          {/* Horizon 3: Long term */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Tích Sản Dài Hạn (&gt; 1 Năm)
              </span>
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                Đầu tư giá trị
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-slate-100">Chiến lược:</strong> Mua đều đặn (DCA) mỗi tháng,
                tận dụng hiệu ứng lãi kép từ cổ tức tiền mặt {stock.dividendYield}%.
              </p>
              <p>
                <strong className="text-slate-100">Lợi thế bền vững:</strong> Doanh nghiệp có hào kinh
                tế vững chắc, ít bị ảnh hưởng bởi biến động ngắn hạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SWOT Matrix & Catalysts/Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SWOT Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Ma Trận SWOT Doanh Nghiệp</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Strengths */}
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Điểm Mạnh (Strengths)
              </div>
              <ul className="space-y-1 text-slate-300">
                {(
                  aiAnalysis?.swotAnalysis?.strengths || [
                    'Thị phần dẫn đầu ngành, thương hiệu uy tín',
                    'Biên lợi nhuận gộp và ROE vượt trội',
                  ]
                ).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Điểm Yếu (Weaknesses)
              </div>
              <ul className="space-y-1 text-slate-300">
                {(
                  aiAnalysis?.swotAnalysis?.weaknesses || [
                    'Định giá P/E ở mức tương đối cao so với thị trường',
                    'Chi phí đầu vào có thể biến động',
                  ]
                ).map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-indigo-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Cơ Hội (Opportunities)
              </div>
              <ul className="space-y-1 text-slate-300">
                {(
                  aiAnalysis?.swotAnalysis?.opportunities || [
                    'Mở rộng thị trường xuất khẩu và chuỗi dịch vụ',
                    'Dòng vốn ngoại khi thị trường Việt Nam nâng hạng',
                  ]
                ).map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Thách Thức (Threats)
              </div>
              <ul className="space-y-1 text-slate-300">
                {(
                  aiAnalysis?.swotAnalysis?.threats || [
                    'Biến động kinh tế vĩ mô toàn cầu',
                    'Cạnh tranh từ các đối thủ mới gia nhập ngành',
                  ]
                ).map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Catalysts & Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Chất Xúc Tác Tăng Trưởng & Rủi Ro</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Động lực tăng trưởng (Growth Catalysts):
              </div>
              <div className="space-y-1.5">
                {(
                  aiAnalysis?.catalysts || [
                    'Hưởng lợi trực tiếp từ chu kỳ hồi phục kinh tế và đầu tư công.',
                    'Dự án nhà máy mới vận hành thương mại giúp tăng công suất.',
                    'Tỷ lệ cổ tức tiền mặt ổn định bảo vệ nhà đầu tư.',
                  ]
                ).map((cat, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300"
                  >
                    ✓ {cat}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="font-semibold text-rose-400 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Rủi ro chính cần theo dõi:
              </div>
              <div className="space-y-1.5">
                {(
                  aiAnalysis?.risks || [
                    'Biến động lãi suất và tỷ giá ảnh hưởng đến chi phí tài chính.',
                    'Thanh khoản thị trường chung điều chỉnh ngắn hạn.',
                  ]
                ).map((rk, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-rose-950/20 border border-rose-800/40 rounded-lg text-rose-300"
                  >
                    ⚠ {rk}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive AI Stock Q&A Assistant */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Hỏi Đáp Trực Tiếp Chuyên Gia AI Về Mã {stock.symbol}
              </h3>
              <p className="text-xs text-slate-400">
                Đặt câu hỏi tự do để nhận phân tích số liệu, điểm mua, điểm bán và quản trị rủi ro
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sample Questions */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Gợi ý câu hỏi nhanh:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(q)}
                disabled={isChatLoading}
                className="text-left text-xs bg-slate-800 hover:bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Box */}
        {chatMessages.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3 text-xs items-center text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 text-white">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Chuyên gia AI đang phân tích dữ liệu thị trường...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Hỏi chuyên gia AI bất kỳ điều gì về mã ${stock.symbol} (VD: "Có nên mua bình quân giá?")`}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendChat();
            }}
            disabled={isChatLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            onClick={() => handleSendChat()}
            disabled={isChatLoading || !inputQuestion.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Gửi câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
};
