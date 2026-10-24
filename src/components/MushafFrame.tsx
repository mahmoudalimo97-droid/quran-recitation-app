import React from 'react';
import { getJuzForPage } from '../data/quranMeta';

interface MushafFrameProps {
  pageNumber: number;
  surahNames: string[];
  isDarkMode: boolean;
  children: React.ReactNode;
}

export const MushafFrame: React.FC<MushafFrameProps> = ({
  pageNumber,
  surahNames,
  isDarkMode,
  children,
}) => {
  const juzNumber = getJuzForPage(pageNumber);
  const surahTitle = surahNames.length > 0 ? surahNames.join(' · ') : 'القرآن الكريم';

  // Odd vs even page margin style in traditional Mushaf
  const isLeftPage = pageNumber % 2 === 0;

  return (
    <div
      className={`relative mx-auto w-full max-w-4xl rounded-2xl transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#1a1917] text-[#e8e4dc] border border-[#3d362a] shadow-2xl shadow-black/60'
          : 'bg-[#fcfbf7] text-[#2c261e] border border-[#dfd4be] shadow-xl shadow-stone-300/40'
      }`}
      style={{
        boxShadow: isDarkMode
          ? '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 0 100px rgba(0,0,0,0.4)'
          : '0 20px 40px -15px rgba(180, 150, 100, 0.15), inset 0 0 80px rgba(230, 215, 180, 0.18)',
      }}
    >
      {/* Outer Golden Islamic Border */}
      <div
        className={`m-3 sm:m-5 p-3 sm:p-6 rounded-xl border-2 relative ${
          isDarkMode
            ? 'border-[#7a6538]/50 bg-gradient-to-b from-[#22201b]/50 to-[#181714]/50'
            : 'border-[#c5a059]/60 bg-gradient-to-b from-[#fbf8f0] to-[#f7f3e8]'
        }`}
      >
        {/* Corner Arabesque Ornaments */}
        <div className="absolute top-1 right-1 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none opacity-80">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path
              d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="absolute top-1 left-1 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none opacity-80 rotate-90">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path
              d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="absolute bottom-1 right-1 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none opacity-80 -rotate-90">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path
              d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="absolute bottom-1 left-1 w-6 h-6 sm:w-8 sm:h-8 pointer-events-none opacity-80 rotate-180">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path
              d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Page Top Header Bar */}
        <div
          className={`flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b text-xs sm:text-sm font-arabic font-semibold select-none ${
            isDarkMode ? 'border-[#4a3e28] text-[#c9b48b]' : 'border-[#d8be8d] text-[#84632b]'
          }`}
        >
          {/* Juz Number */}
          <div className="flex items-center gap-1.5">
            <span className="opacity-60 text-[10px] sm:text-xs">الجزء</span>
            <span className="font-bold">{juzNumber}</span>
          </div>

          {/* Surah Name in Center */}
          <div className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
            <span className="text-[#a67c32] dark:text-[#c5a059] opacity-75">❖</span>
            <span>{surahTitle}</span>
            <span className="text-[#a67c32] dark:text-[#c5a059] opacity-75">❖</span>
          </div>

          {/* Page Number */}
          <div className="flex items-center gap-1.5">
            <span className="opacity-60 text-[10px] sm:text-xs">صفحة</span>
            <span className="font-bold font-mono">{pageNumber}</span>
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="min-h-[480px] sm:min-h-[560px] flex flex-col justify-start">
          {children}
        </div>

        {/* Page Bottom Footer Bar */}
        <div
          className={`mt-6 pt-3 border-t flex items-center justify-between text-[11px] sm:text-xs select-none ${
            isDarkMode ? 'border-[#3a3222] text-[#8c826e]' : 'border-[#e4d6bc] text-[#9b8969]'
          }`}
        >
          <div>مُصحف المدينة النبوية</div>
          <div className="font-mono font-bold text-xs sm:text-sm text-[#a67c32] dark:text-[#c5a059]">
            - {pageNumber} -
          </div>
          <div>{isLeftPage ? 'جهة اليسار' : 'جهة اليمين'}</div>
        </div>
      </div>
    </div>
  );
};
