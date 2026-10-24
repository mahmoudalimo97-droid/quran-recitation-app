import React from 'react';
import { BookOpen, Moon, Sun, Volume2, Award, ListFilter, LayoutTemplate } from 'lucide-react';
import { ViewMode, RecitationDisplayMode } from '../types/quran';

interface HeaderProps {
  pageNumber: number;
  surahName: string;
  recitationMode: RecitationDisplayMode;
  onToggleRecitationMode: (mode: RecitationDisplayMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSurahPicker: () => void;
  onOpenNavigation: () => void;
  onOpenAudio: () => void;
  onOpenStats: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageNumber,
  surahName,
  recitationMode,
  onToggleRecitationMode,
  viewMode,
  onViewModeChange,
  onOpenSurahPicker,
  onOpenNavigation,
  onOpenAudio,
  onOpenStats,
  isDarkMode,
  onToggleDarkMode,
  fontSize,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <header
      className={`sticky top-0 z-30 w-full border-b transition-colors duration-300 backdrop-blur-md ${
        isDarkMode
          ? 'bg-[#181714]/90 border-[#383124] text-[#ede8de]'
          : 'bg-[#fcfbf7]/90 border-[#e5dcce] text-[#2c261e]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8 font-arabic">
        {/* Zone 1: Brand Wordmark & Active Surah */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenSurahPicker}>
            <span className="font-quran text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400 tracking-wide whitespace-nowrap">
              مُسَمِّع
            </span>
          </div>

          {/* Quick Surah Picker Trigger in Brand Zone */}
          <button
            onClick={onOpenSurahPicker}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors"
            title="انقر لاختيار السورة من الفهرس"
          >
            <ListFilter className="w-3.5 h-3.5 text-amber-600" />
            <span className="truncate max-w-[120px] sm:max-w-none">{surahName || 'فهرس السور'}</span>
          </button>
        </div>

        {/* Zone 2: Navigation & Mode Controls */}
        <nav className="hidden md:flex items-center gap-4 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300">
          {/* Display Mode Switcher (آية آية vs صفحة المصحف) */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs">
            <button
              onClick={() => onToggleRecitationMode('ayah_focus')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                recitationMode === 'ayah_focus'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
              title="عرض آية آية في بؤرة التركيز بدون تمرير الشاشة"
            >
              <span>آية آية (بدون تمرير)</span>
            </button>
            <button
              onClick={() => onToggleRecitationMode('mushaf_page')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                recitationMode === 'mushaf_page'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
              title="عرض صفحة المصحف الكاملة"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>صفحة المصحف</span>
            </button>
          </div>

          {/* Surah & Quran Index */}
          <button
            onClick={onOpenSurahPicker}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>فهرس السور</span>
          </button>

          {/* Listen to Qari */}
          <button
            onClick={onOpenAudio}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>استماع</span>
          </button>

          {/* Stats Drawer */}
          <button
            onClick={onOpenStats}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>الإنجاز</span>
          </button>

          {/* Word Visibility Mode */}
          <div className="flex items-center p-0.5 rounded-lg bg-stone-200/50 dark:bg-stone-800/50 text-[11px]">
            <button
              onClick={() => onViewModeChange('blank')}
              className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                viewMode === 'blank'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="صفحة فارغة: الكلمة تظهر بعد نطقها"
            >
              فارغة
            </button>
            <button
              onClick={() => onViewModeChange('ghost')}
              className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                viewMode === 'ghost'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="طمس خفيف"
            >
              طمس
            </button>
            <button
              onClick={() => onViewModeChange('full')}
              className={`px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                viewMode === 'full'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="عرض كامل للمراجعة"
            >
              مراجعة
            </button>
          </div>
        </nav>

        {/* Zone 3: Actions (Mobile Switcher & Dark Mode) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Mobile Mode Toggle */}
          <button
            onClick={() =>
              onToggleRecitationMode(
                recitationMode === 'ayah_focus' ? 'mushaf_page' : 'ayah_focus'
              )
            }
            className="md:hidden px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-amber-600"
            title="تبديل وضع العرض"
          >
            {recitationMode === 'ayah_focus' ? 'آية آية' : 'المصحف'}
          </button>

          {/* Quick mobile index button */}
          <button
            onClick={onOpenSurahPicker}
            className="md:hidden p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-amber-600"
            title="فهرس السور"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
