import React, { useState } from 'react';
import { X, Search, BookOpen, Sparkles } from 'lucide-react';
import { SURAHS_META } from '../data/quranMeta';
import { SurahMeta } from '../types/quran';

interface SurahPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSurahNumber: number;
  onSelectSurah: (surahNumber: number, startAyah?: number) => void;
  isDarkMode: boolean;
}

export const SurahPickerModal: React.FC<SurahPickerModalProps> = ({
  isOpen,
  onClose,
  currentSurahNumber,
  onSelectSurah,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meccan' | 'medinan'>('all');

  if (!isOpen) return null;

  const filteredSurahs = SURAHS_META.filter((surah) => {
    // Type filter
    if (filterType === 'meccan' && surah.revelationType !== 'مكية') return false;
    if (filterType === 'medinan' && surah.revelationType !== 'مدنية') return false;

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      surah.name.includes(q) ||
      surah.englishName.toLowerCase().includes(q) ||
      surah.number.toString() === q
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          isDarkMode
            ? 'bg-[#1c1b18] border-[#3d362a] text-[#f5f2eb]'
            : 'bg-[#fcfbf7] border-[#dfd4be] text-[#2c261e]'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-arabic font-bold text-lg">فهرس سور القرآن الكريم (١١٤ سورة)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col sm:flex-row items-center gap-2 font-arabic">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم السورة (مثل: الفاتحة، الكهف، يس) أو رقمها..."
              className="w-full pr-9 pl-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 self-stretch sm:self-auto text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              الكل ({SURAHS_META.length})
            </button>
            <button
              onClick={() => setFilterType('meccan')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'meccan'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              مكية
            </button>
            <button
              onClick={() => setFilterType('medinan')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'medinan'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              مدنية
            </button>
          </div>
        </div>

        {/* Surahs Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-arabic">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredSurahs.map((surah) => {
              const isSelected = surah.number === currentSurahNumber;
              return (
                <button
                  key={surah.number}
                  onClick={() => {
                    onSelectSurah(surah.number);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100 font-bold ring-1 ring-amber-500'
                      : 'border-stone-200 dark:border-stone-800 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-amber-500 group-hover:text-white transition-colors'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <div className="min-w-0">
                      <div className="font-quran text-base font-bold truncate">
                        {surah.name}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {surah.revelationType} · {surah.ayahCount} آية
                      </div>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs text-amber-600 dark:text-amber-400 shrink-0">
                    جـ {surah.juz}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
