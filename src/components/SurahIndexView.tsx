import React, { useState, useMemo } from 'react';
import { Search, Moon, Sun, BookOpen, Sparkles, ChevronLeft } from 'lucide-react';
import { SURAHS_META } from '../data/quranMeta';
import { normalizeArabic, formatSurahTitle } from '../utils/arabicMatcher';
import { SurahMeta } from '../types/quran';

interface SurahIndexViewProps {
  onSelectSurah: (surahNumber: number) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  lastRecitedSurahNumber?: number;
}

function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

export const SurahIndexView: React.FC<SurahIndexViewProps> = ({
  onSelectSurah,
  isDarkMode,
  onToggleDarkMode,
  lastRecitedSurahNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'meccan' | 'medinan' | 'juz30'>('all');

  // Filter surahs based on search query and category tab
  const filteredSurahs = useMemo(() => {
    let list = SURAHS_META;

    if (activeFilter === 'meccan') {
      list = list.filter((s) => s.revelationType === 'مكية');
    } else if (activeFilter === 'medinan') {
      list = list.filter((s) => s.revelationType === 'مدنية');
    } else if (activeFilter === 'juz30') {
      list = list.filter((s) => s.number >= 78);
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const qClean = normalizeArabic(searchQuery).toLowerCase();
    const qRaw = searchQuery.trim().toLowerCase();

    return list.filter((s) => {
      // Check number match
      if (s.number.toString() === qRaw || toArabicDigits(s.number) === qRaw) {
        return true;
      }
      // Check Arabic name match
      const sClean = normalizeArabic(s.name);
      if (sClean.includes(qClean) || s.name.includes(searchQuery.trim())) {
        return true;
      }
      // Check English name match
      if (s.englishName.toLowerCase().includes(qRaw)) {
        return true;
      }
      return false;
    });
  }, [searchQuery, activeFilter]);

  const lastSurah = lastRecitedSurahNumber
    ? SURAHS_META.find((s) => s.number === lastRecitedSurahNumber)
    : null;

  return (
    <div className="w-full h-full min-h-[100dvh] bg-[#faf9f5] dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex flex-col font-arabic transition-colors duration-200 overflow-x-hidden">
      {/* Top Simple Header */}
      <header className="w-full px-4 sm:px-6 pt-[max(env(safe-area-inset-top),20px)] pb-3 flex items-center justify-between sticky top-0 z-20 bg-[#faf9f5]/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-600/20 dark:border-amber-400/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-arabic tracking-tight text-stone-900 dark:text-stone-100">
              فهرس القرآن الكريم
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              اختر السورة للبدء في تسميعها آية بآية بالصوت
            </p>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors shadow-xs active:scale-95"
          title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          aria-label="تبديل المظهر"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full px-4 sm:px-6 py-4 flex-1 flex flex-col pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto">
        {/* Continue Last Surah Banner if available */}
        {lastSurah && (
          <div
            onClick={() => onSelectSurah(lastSurah.number)}
            className="mb-5 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  آخر سورة تم تسميعها
                </div>
                <div className="text-base font-bold font-quran text-stone-900 dark:text-stone-100">
                  {formatSurahTitle(lastSurah.name)} ({toArabicDigits(lastSurah.ayahCount)} آية)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>متابعة التسميع</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-stone-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها (مثال: الفاتحة، الكهف، يس، ٦٧)..."
            className="w-full pr-12 pl-4 py-3.5 text-sm sm:text-base rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            جميع السور (١١٤)
          </button>
          <button
            onClick={() => setActiveFilter('meccan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'meccan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            مكية (٨٦)
          </button>
          <button
            onClick={() => setActiveFilter('medinan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'medinan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            مدنية (٢٨)
          </button>
          <button
            onClick={() => setActiveFilter('juz30')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'juz30'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            قصار السور / جزء عم (٣٧)
          </button>
        </div>

        {/* Surahs Grid */}
        {filteredSurahs.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <p className="text-base font-semibold mb-1">لم يتم العثور على سورة تطابق بحثك</p>
            <p className="text-xs text-stone-500">جرب البحث برقم السورة أو اسم مختلف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 pb-12">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => onSelectSurah(surah.number)}
                className="group p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181818] border border-stone-200/90 dark:border-stone-800/90 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-stone-800/50 flex items-center justify-between text-right transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                {/* Surah Number & Names */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-amber-500/10 dark:group-hover:bg-amber-400/10 text-stone-700 dark:text-stone-300 group-hover:text-amber-700 dark:group-hover:text-amber-400 font-bold text-sm flex items-center justify-center transition-colors shrink-0">
                    {toArabicDigits(surah.number)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-quran font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-tight truncate">
                      {formatSurahTitle(surah.name)}
                    </h3>
                    <div className="text-[11px] text-stone-400 group-hover:text-stone-500 dark:group-hover:text-stone-400 font-sans truncate">
                      {surah.englishName}
                    </div>
                  </div>
                </div>

                {/* Badges: Type & Ayahs */}
                <div className="flex flex-col items-end gap-1 shrink-0 pr-2">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                    {toArabicDigits(surah.ayahCount)} آية
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {surah.revelationType} · ج {toArabicDigits(surah.juz)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
