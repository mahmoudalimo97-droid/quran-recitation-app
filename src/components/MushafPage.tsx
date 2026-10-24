import React from 'react';
import { QuranPageData, ViewMode, FeedbackState } from '../types/quran';

interface MushafPageProps {
  pageData: QuranPageData;
  revealedCount: number;
  currentWordIndex: number;
  viewMode: ViewMode;
  feedback: FeedbackState | null;
  hintLevel: number; // 0: none, 1: first letter, 2: full word
  isDarkMode: boolean;
  fontSize: number; // in pixels
}

// Convert western digits to Arabic-Indic digits: 1 -> ١
function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

export const MushafPage: React.FC<MushafPageProps> = ({
  pageData,
  revealedCount,
  currentWordIndex,
  viewMode,
  feedback,
  hintLevel,
  isDarkMode,
  fontSize,
}) => {
  // Build a lookup map of word index to global word index in page
  let globalWordCounter = 0;

  // Auto scroll active target word into view smoothly
  React.useEffect(() => {
    const el = document.getElementById('active-recitation-target');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentWordIndex]);

  return (
    <div className="w-full flex flex-col gap-6 py-2 px-1 sm:px-4 select-none">
      {pageData.ayahs.map((ayah, ayahIdx) => {
        const isFirstAyahInSurah = ayah.numberInSurah === 1;
        const isSurahTawbah = ayah.surah.number === 9;
        const isSurahFatihah = ayah.surah.number === 1;

        // Ayah words startIndex and endIndex in global page sequence
        const ayahWordStartIndex = globalWordCounter;
        const ayahWordEndIndex = globalWordCounter + ayah.words.length - 1;
        globalWordCounter += ayah.words.length;

        // Is this entire ayah completed?
        const isAyahCompleted = revealedCount > ayahWordEndIndex;

        return (
          <React.Fragment key={`ayah_${ayah.numberInQuran}`}>
            {/* Surah Header Banner when starting a new Surah */}
            {isFirstAyahInSurah && (
              <div className="my-4 sm:my-6">
                <div
                  className={`relative mx-auto max-w-xl py-3 px-4 rounded-xl border-2 text-center shadow-md ${
                    isDarkMode
                      ? 'border-[#94763e] bg-gradient-to-r from-[#29241b] via-[#383123] to-[#29241b] text-[#f1ede4]'
                      : 'border-[#c5a059] bg-gradient-to-r from-[#f7efdc] via-[#faeed1] to-[#f7efdc] text-[#523d18]'
                  }`}
                >
                  {/* Decorative Side Flaps */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-arabic font-semibold px-2">
                    <span className="text-[#a67c32] dark:text-[#c5a059] flex items-center gap-1">
                      <span>۞</span>
                      <span>{ayah.surah.revelationType}</span>
                    </span>

                    {/* Surah Name in Large Calligraphy */}
                    <h2 className="text-xl sm:text-2xl font-bold font-quran tracking-wide text-[#3a280c] dark:text-[#f8f4eb]">
                      سُورَةُ {ayah.surah.name.replace(/^سورة\s+/, '')}
                    </h2>

                    <span className="text-[#a67c32] dark:text-[#c5a059] flex items-center gap-1">
                      <span>{toArabicDigits(pageData.surahsInPage.find((s) => s.number === ayah.surah.number)?.startAyahIndex !== undefined ? 0 : 0) || ''} آيَاتُهَا</span>
                      <span>۞</span>
                    </span>
                  </div>
                </div>

                {/* Basmalah (unless Surah Tawbah or Surah Fatihah where Basmalah is ayah 1) */}
                {!isSurahTawbah && !isSurahFatihah && (
                  <div className="text-center my-4">
                    <div
                      className={`text-xl sm:text-2xl font-quran font-semibold tracking-wider ${
                        isDarkMode ? 'text-[#e2dbce]' : 'text-[#44351d]'
                      }`}
                    >
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ayah Words Stream */}
            <div
              className="leading-[2.8] sm:leading-[3.2] text-justify tracking-wide font-quran flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-2.5"
              style={{ fontSize: `${fontSize}px` }}
              dir="rtl"
            >
              {ayah.words.map((word, wIdx) => {
                const currentGlobalIdx = ayahWordStartIndex + wIdx;
                const isRevealed = currentGlobalIdx < revealedCount;
                const isTarget = currentGlobalIdx === currentWordIndex;
                const hasError = isTarget && feedback?.type === 'wrong';
                const hasHint = isTarget && hintLevel > 0;

                // State determination
                let wordClasses = '';
                let content: React.ReactNode = word.text;

                if (isRevealed) {
                  // Word is recited correctly
                  wordClasses = isDarkMode
                    ? 'text-[#f5f2eb] drop-shadow-sm transition-all duration-300'
                    : 'text-[#2a2216] transition-all duration-300';
                } else if (isTarget) {
                  // This is the active target word
                  if (hasError) {
                    // Mistake on this word
                    wordClasses =
                      'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 px-1 rounded-sm animate-pulse';
                    if (viewMode === 'blank') {
                      content = (
                        <span className="inline-flex items-center gap-1 text-sm sm:text-base font-arabic font-bold text-rose-600 dark:text-rose-400">
                          <span>[ خطأ: أعد المحاولة ]</span>
                        </span>
                      );
                    }
                  } else if (hasHint) {
                    // Hint requested
                    wordClasses =
                      'bg-amber-400/20 text-amber-700 dark:text-amber-300 border-b-2 border-amber-400 px-1 rounded-sm';
                    if (hintLevel === 1) {
                      // First letter only
                      const cleanWord = word.cleanText;
                      const firstChar = cleanWord.charAt(0) || word.text.charAt(0);
                      content = (
                        <span className="inline-flex items-center text-base sm:text-lg font-arabic font-bold text-amber-700 dark:text-amber-300">
                          [ {firstChar}... ]
                        </span>
                      );
                    } else {
                      // Reveal word in faint amber
                      content = word.text;
                    }
                  } else {
                    // Neutral target word
                    if (viewMode === 'blank') {
                      wordClasses =
                        'inline-block min-w-[32px] sm:min-w-[40px] h-[34px] sm:h-[42px] border-b-2 border-amber-500/60 dark:border-amber-400/60 bg-amber-500/5 dark:bg-amber-400/10 rounded-sm animate-pulse align-middle';
                      content = <span className="opacity-0">{word.text}</span>;
                    } else if (viewMode === 'ghost') {
                      wordClasses =
                        'opacity-35 blur-[0.5px] border-b-2 border-dashed border-amber-500 text-stone-500 dark:text-stone-400';
                    } else {
                      // full mode
                      wordClasses =
                        'bg-amber-300/30 dark:bg-amber-500/20 px-1 rounded border-b border-amber-500';
                    }
                  }
                } else {
                  // Future word not yet reached
                  if (viewMode === 'blank') {
                    wordClasses = 'opacity-0 select-none pointer-events-none';
                  } else if (viewMode === 'ghost') {
                    wordClasses = 'opacity-15 blur-[1.5px] select-none text-stone-400 dark:text-stone-600';
                  } else {
                    wordClasses = isDarkMode ? 'text-[#c2bcaf]' : 'text-[#615443]';
                  }
                }

                return (
                  <span
                    key={word.id}
                    id={isTarget ? 'active-recitation-target' : undefined}
                    className={`relative inline-block transition-all duration-200 ${wordClasses}`}
                    title={viewMode === 'full' ? `الآية ${ayah.numberInSurah}` : undefined}
                  >
                    {content}
                  </span>
                );
              })}

              {/* Ayah End Marker (Flower / Bracket with Ayah Number) */}
              <span
                className={`inline-flex items-center justify-center mx-1.5 align-middle select-none transition-all duration-300 ${
                  isAyahCompleted
                    ? 'opacity-100 scale-100 text-[#96702c] dark:text-[#d3ab5a]'
                    : viewMode === 'full'
                    ? 'opacity-70 text-[#96702c] dark:text-[#d3ab5a]'
                    : 'opacity-0 scale-75'
                }`}
                style={{ fontSize: `${Math.max(18, fontSize * 0.72)}px` }}
              >
                <span className="font-arabic font-bold text-xs sm:text-sm border border-[#c5a059] rounded-full w-6 h-6 sm:w-7 sm:h-7 inline-flex items-center justify-center bg-amber-500/10 shadow-xs">
                  {toArabicDigits(ayah.numberInSurah)}
                </span>
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
