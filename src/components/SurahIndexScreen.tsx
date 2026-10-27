import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, BookOpen, X } from 'lucide-react';
import { SURAHS_META } from '../data/quranMeta';
import { normalizeArabic } from '../utils/arabicMatcher';

import { PWAInstallButton } from './PWAInstallButton';

interface SurahIndexScreenProps {
  onSelectSurah: (surahNumber: number) => void;
}

function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

export const SurahIndexScreen: React.FC<SurahIndexScreenProps> = ({ onSelectSurah }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) {
      return SURAHS_META;
    }
    const qClean = normalizeArabic(searchQuery).toLowerCase();
    const qRaw = searchQuery.trim().toLowerCase();

    return SURAHS_META.filter((s) => {
      // Match by number
      if (s.number.toString() === qRaw || toArabicDigits(s.number) === qRaw) {
        return true;
      }
      // Match by Arabic name
      const sClean = normalizeArabic(s.name);
      if (sClean.includes(qClean) || s.name.includes(searchQuery.trim())) {
        return true;
      }
      // Match by English name
      if (s.englishName.toLowerCase().includes(qRaw)) {
        return true;
      }
      return false;
    });
  }, [searchQuery]);

  return (
    <div className="w-full h-full min-h-[100dvh] bg-white text-stone-900 flex flex-col font-arabic select-none" dir="rtl">
      {/* Sticky Top Header */}
      <header className="w-full px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 bg-white/95 backdrop-blur-md border-b border-stone-100 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <BookOpen className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-arabic text-stone-900 tracking-tight">
                فهرس القرآن الكريم
              </h1>
              <p className="text-xs text-stone-400">
                ١١٤ سورة مباركة
              </p>
            </div>
          </div>
          <PWAInstallButton />
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، يس، ٦٧)..."
            className="w-full pr-10 pl-9 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200/80 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Surahs Scrollable List */}
      <main className="flex-1 w-full px-4 py-3 overflow-y-auto pb-[max(env(safe-area-inset-bottom),28px)]">
        {filteredSurahs.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-sm">لا توجد سورة مطابقة لـ &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredSurahs.map((surah) => (
              <div
                key={surah.number}
                onClick={() => onSelectSurah(surah.number)}
                className="w-full p-3.5 rounded-2xl bg-stone-50/70 hover:bg-emerald-50/50 border border-stone-100 hover:border-emerald-200/60 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                {/* Surah Number & Name */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center font-bold text-xs text-stone-600 shadow-2xs">
                    {toArabicDigits(surah.number)}
                  </div>

                  <div>
                    <h2 className="font-quran text-lg font-bold text-stone-900 leading-tight">
                      سُورَةُ {surah.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                      <span>{toArabicDigits(surah.ayahCount)} آية</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium text-[11px]">
                        {surah.revelationType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left chevron arrow */}
                <div className="text-stone-300 hover:text-emerald-600 pl-1">
                  <ChevronLeft className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
