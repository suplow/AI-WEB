import React, { useState } from 'react';
import {
  Newspaper,
  Globe2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Filter,
  ArrowUpDown,
  Tag,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { NewsItem, MacroEvent, StockData } from '../types/stock';

interface NewsAndMacroFeedProps {
  stock: StockData;
  macroEvents: MacroEvent[];
  onRefreshMacro: () => void;
  isMacroLoading: boolean;
}

export const NewsAndMacroFeed: React.FC<NewsAndMacroFeedProps> = ({
  stock,
  macroEvents,
  onRefreshMacro,
  isMacroLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'macro'>('company');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  // Filter and sort company news
  const filteredNews = stock.news
    .filter((item) => selectedCategory === 'Tất cả' || item.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'relevance') return b.relevanceScore - a.relevanceScore;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const categories = ['Tất cả', 'KQKD', 'Cổ tức', 'M&A & Dự án', 'Nội bộ', 'Ngành'];

  const getSentimentBadge = (sentiment: NewsItem['sentiment']) => {
    if (sentiment === 'bullish') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
          <TrendingUp className="w-3 h-3" /> Tích cực (Bullish)
        </span>
      );
    }
    if (sentiment === 'bearish') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
          <TrendingDown className="w-3 h-3" /> Tiêu cực (Bearish)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
        <Minus className="w-3 h-3" /> Trung lập
      </span>
    );
  };

  const getImpactBadge = (level: MacroEvent['impactLevel']) => {
    if (level === 'Cao') {
      return (
        <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
          Tác động: Cao
        </span>
      );
    }
    if (level === 'Trung bình') {
      return (
        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
          Tác động: Trung bình
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
        Tác động: Thấp
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-6">
      {/* Top Feed Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Newspaper className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Nguồn Cấp Tin Tức & Sự Kiện Kinh Tế Vĩ Mô
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật diễn biến doanh nghiệp và phân tích tác động chính sách tới thị trường chứng khoán
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'company'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Tin mã {stock.symbol} ({filteredNews.length})
          </button>
          <button
            onClick={() => setActiveTab('macro')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'macro'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            Sự kiện Vĩ mô & Thị trường ({macroEvents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: COMPANY SPECIFIC NEWS */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          {/* Filters & Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Phân loại:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sắp xếp theo:</span>
              <button
                onClick={() => setSortBy(sortBy === 'relevance' ? 'date' : 'relevance')}
                className="font-semibold text-emerald-400 hover:underline"
              >
                {sortBy === 'relevance' ? 'Mức độ liên quan cao nhất' : 'Mới nhất'}
              </button>
            </div>
          </div>

          {/* News Items List */}
          <div className="space-y-3">
            {filteredNews.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Không tìm thấy bài viết nào trong danh mục này.
              </div>
            ) : (
              filteredNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl p-4.5 transition-all space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-700/80 text-cyan-300 rounded border border-slate-600/50">
                        {news.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Nguồn: <strong className="text-slate-300 font-sans">{news.source}</strong>
                      </span>
                      <span className="text-xs text-slate-500">• {news.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getSentimentBadge(news.sentiment)}
                      <span className="text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded font-mono">
                        Độ khớp: {news.relevanceScore}%
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer">
                    {news.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">{news.summary}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                      <Tag className="w-3 h-3" />
                      Mã liên quan: #{stock.symbol} #{stock.sector}
                    </span>
                    <span className="hover:text-slate-200 cursor-pointer flex items-center gap-1">
                      Đọc toàn văn <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MACRO ECONOMIC & GENERAL MARKET EVENTS */}
      {activeTab === 'macro' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-300">
              Các chính sách tiền tệ, tài khóa, tỷ giá và tiến trình nâng hạng thị trường định hình xu hướng VN-Index
            </div>
            <button
              onClick={onRefreshMacro}
              disabled={isMacroLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isMacroLoading ? 'Đang cập nhật AI...' : 'Làm mới Vĩ mô bằng AI'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {macroEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded">
                      {evt.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {getImpactBadge(evt.impactLevel)}
                      {getSentimentBadge(evt.sentiment)}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{evt.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{evt.summary}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  {/* Sectors impacted */}
                  <div className="space-y-1">
                    <div className="text-slate-400 font-medium text-[11px]">Ngành hưởng lợi:</div>
                    <div className="flex flex-wrap gap-1">
                      {evt.beneficiarySectors.map((sec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded text-[11px]"
                        >
                          ✓ {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {evt.riskSectors.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-medium text-[11px]">Ngành chịu áp lực / Rủi ro:</div>
                      <div className="flex flex-wrap gap-1">
                        {evt.riskSectors.map((sec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded text-[11px]"
                          >
                            ⚠ {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Advice */}
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-emerald-400">Khuyến nghị hành động:</strong> {evt.actionAdvice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
