import React, { useState } from 'react';
import { X, Search, BookOpen, Layers, Hash } from 'lucide-react';
import { SURAHS_META, AJZAA_META } from '../data/quranMeta';
import { SurahMeta } from '../types/quran';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  onSelectPage: (page: number) => void;
  isDarkMode: boolean;
}

type TabType = 'surahs' | 'ajzaa' | 'pages';

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  onSelectPage,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('surahs');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetPageInput, setTargetPageInput] = useState(currentPage.toString());

  if (!isOpen) return null;

  const filteredSurahs = SURAHS_META.filter((surah) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      surah.name.includes(q) ||
      surah.englishName.toLowerCase().includes(q) ||
      surah.number.toString() === q
    );
  });

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= 604) {
      onSelectPage(p);
      onClose();
    }
  };

  const handleSelectSurah = (surah: SurahMeta) => {
    onSelectPage(surah.startPage);
    onClose();
  };

  const handleSelectJuz = (startPage: number) => {
    onSelectPage(startPage);
    onClose();
  };

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
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-arabic font-bold text-lg">فهرس وتصفح المصحف الشريف</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-sm font-arabic font-medium">
          <button
            onClick={() => setActiveTab('surahs')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'surahs'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>السور (١١٤)</span>
          </button>

          <button
            onClick={() => setActiveTab('ajzaa')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'ajzaa'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الأجزاء (٣٠)</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'pages'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>رقم الصفحة (٦٠٤)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Tab 1: Surahs */}
          {activeTab === 'surahs' && (
            <div className="flex flex-col gap-3 font-arabic">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم السورة أو رقمها..."
                  className="w-full pr-9 pl-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Surahs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => handleSelectSurah(surah)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-800/80 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-right transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-xs flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        {surah.number}
                      </span>
                      <div>
                        <div className="font-quran font-bold text-base text-stone-900 dark:text-stone-100">
                          {surah.name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {surah.revelationType} · {surah.ayahCount} آية
                        </div>
                      </div>
                    </div>
                    <div className="text-left font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      صفحة {surah.startPage}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Ajzaa */}
          {activeTab === 'ajzaa' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-arabic">
              {AJZAA_META.map((juz) => (
                <button
                  key={juz.number}
                  onClick={() => handleSelectJuz(juz.startPage)}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-right transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                      {juz.number}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {juz.name}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        يبدأ من: {juz.startSurah}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                    صفحة {juz.startPage}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tab 3: Direct Page Jump & Slider */}
          {activeTab === 'pages' && (
            <div className="flex flex-col gap-6 py-4 font-arabic max-w-md mx-auto">
              <form onSubmit={handlePageSubmit} className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  انتقل مباشرة إلى رقم الصفحة (1 - 604):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={targetPageInput}
                    onChange={(e) => setTargetPageInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                  >
                    انتقال
                  </button>
                </div>
              </form>

              {/* Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>صفحة 1 (الفاتحة)</span>
                  <span>صفحة 604 (الناس)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="604"
                  value={targetPageInput}
                  onChange={(e) => setTargetPageInput(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Quick Jump Badges */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-stone-500 block mb-2">
                  صفحات شائعة للحفظ والمراجعة:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'سورة الفاتحة', p: 1 },
                    { label: 'أول البقرة', p: 2 },
                    { label: 'آية الكرسي', p: 42 },
                    { label: 'سورة يس', p: 440 },
                    { label: 'سورة الملك', p: 562 },
                    { label: 'سورة النبأ (جزء عم)', p: 582 },
                    { label: 'المعوذات والإخلاص', p: 604 },
                  ].map((item) => (
                    <button
                      key={item.p}
                      onClick={() => {
                        onSelectPage(item.p);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs border border-stone-200 dark:border-stone-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    >
                      {item.label} (ص {item.p})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
