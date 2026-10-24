import React from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { QuranSurahData, ViewMode, FeedbackState } from '../types/quran';

interface AyahFocusViewProps {
  surahData: QuranSurahData;
  currentAyahIndex: number;
  revealedAyahWordCount: number;
  viewMode: ViewMode;
  feedback: FeedbackState | null;
  hintLevel: number;
  isDarkMode: boolean;
  fontSize: number;
  isListening: boolean;
  onOpenSurahPicker: () => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onJumpToAyah: (index: number) => void;
}

function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

export const AyahFocusView: React.FC<AyahFocusViewProps> = ({
  surahData,
  currentAyahIndex,
  revealedAyahWordCount,
  viewMode,
  feedback,
  hintLevel,
  isDarkMode,
  fontSize,
  isListening,
  onOpenSurahPicker,
  onNextAyah,
  onPrevAyah,
  onJumpToAyah,
}) => {
  const currentAyah = surahData.ayahs[currentAyahIndex];
  const prevAyah = currentAyahIndex > 0 ? surahData.ayahs[currentAyahIndex - 1] : null;

  const isFirstAyahInSurah = currentAyahIndex === 0;
  const isSurahTawbah = surahData.number === 9;
  const isSurahFatihah = surahData.number === 1;

  const totalWordsInAyah = currentAyah?.words.length || 0;
  const isAyahFinished = revealedAyahWordCount >= totalWordsInAyah;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center select-none font-arabic px-3 sm:px-6">
      {/* Top Header Card: Surah Name & Ayah Counter */}
      <div
        className={`w-full mb-6 py-3 px-4 sm:px-6 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isDarkMode
            ? 'bg-[#1b1916] border-[#383226] text-[#f5f2eb]'
            : 'bg-[#fcfbf7] border-[#dfd4be] text-[#2c261e]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSurahPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-600/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm transition-all shadow-xs"
            title="انقر لاختيار سورة أخرى من الفهرس"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>فهرس السور</span>
          </button>

          <div>
            <h2 className="font-quran font-bold text-lg sm:text-xl text-[#3a280c] dark:text-[#f8f4eb]">
              سُورَةُ {surahData.name.replace(/^سورة\s+/, '')}
            </h2>
            <div className="text-[11px] text-stone-500">
              {surahData.revelationType} · {surahData.numberOfAyahs} آية
            </div>
          </div>
        </div>

        {/* Current Ayah Stepper */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevAyah}
            disabled={currentAyahIndex <= 0}
            className="p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="الآية السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">
            <span>الآية {toArabicDigits(currentAyahIndex + 1)}</span>
            <span className="opacity-50 text-[10px] sm:text-xs"> من {toArabicDigits(surahData.numberOfAyahs)}</span>
          </div>

          <button
            onClick={onNextAyah}
            disabled={currentAyahIndex >= surahData.numberOfAyahs - 1}
            className="p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="الآية التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Centered Ayah Tablet Card */}
      <div
        key={`ayah_card_${surahData.number}_${currentAyahIndex}`}
        className={`w-full min-h-[360px] sm:min-h-[420px] p-6 sm:p-10 rounded-3xl border-2 flex flex-col justify-between relative shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#1e1c18] via-[#1a1815] to-[#141311] border-[#7a6538]/70 text-[#f5f2eb] shadow-black/80'
            : 'bg-gradient-to-b from-[#fdfbf7] via-[#faf6ec] to-[#f5eedc] border-[#c5a059]/80 text-[#2c261e] shadow-amber-900/15'
        }`}
      >
        {/* Decorative Golden Islamic Corner Flourishes */}
        <div className="absolute top-3 right-3 w-8 h-8 pointer-events-none opacity-60">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-3 left-3 w-8 h-8 pointer-events-none opacity-60 rotate-90">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-3 right-3 w-8 h-8 pointer-events-none opacity-60 -rotate-90">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-3 left-3 w-8 h-8 pointer-events-none opacity-60 rotate-180">
          <svg viewBox="0 0 40 40" className={`w-full h-full ${isDarkMode ? 'text-[#c5a059]' : 'text-[#a67c32]'}`}>
            <path d="M 0 0 L 30 0 C 20 10 10 20 0 30 Z M 5 5 L 20 5 C 15 10 10 15 5 20 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Top Header of the Ayah Card */}
        <div className="text-center min-h-[46px] flex flex-col items-center justify-center">
          {isFirstAyahInSurah && !isSurahTawbah && !isSurahFatihah ? (
            <div
              className={`text-xl sm:text-2xl font-quran font-semibold tracking-wider ${
                isDarkMode ? 'text-[#ede6d8]' : 'text-[#4e3c20]'
              }`}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          ) : prevAyah ? (
            <div className="text-xs sm:text-sm font-quran text-stone-400 dark:text-stone-500 truncate max-w-lg opacity-70">
              ﴿{toArabicDigits(prevAyah.numberInSurah)}﴾ {prevAyah.text}
            </div>
          ) : (
            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">
              ❖ بداية السورة المباركة ❖
            </div>
          )}
        </div>

        {/* Middle Stage: The Active Ayah in Majestic Calligraphy */}
        <div className="my-auto py-8 text-center flex items-center justify-center">
          {currentAyah && (
            <div
              className="leading-[2.7] sm:leading-[3.2] tracking-wide font-quran inline-flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 transition-all"
              style={{ fontSize: `${Math.max(28, fontSize * 1.2)}px` }}
              dir="rtl"
            >
              {currentAyah.words.map((word, wIdx) => {
                const isRevealed = wIdx < revealedAyahWordCount;
                const isTarget = wIdx === revealedAyahWordCount;
                const hasError = isTarget && feedback?.type === 'wrong';
                const hasHint = isTarget && hintLevel > 0;

                let wordClasses = '';
                let content: React.ReactNode = word.text;

                if (isRevealed) {
                  // Word is recited correctly
                  wordClasses = isDarkMode
                    ? 'text-[#fbf9f4] drop-shadow-sm transition-all duration-300'
                    : 'text-[#1c160e] font-medium transition-all duration-300';
                } else if (isTarget) {
                  // Active word currently waiting for user recitation
                  if (hasError) {
                    wordClasses =
                      'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 px-2 rounded-sm animate-pulse';
                    if (viewMode === 'blank') {
                      content = (
                        <span className="inline-flex items-center text-sm sm:text-base font-arabic font-bold text-rose-600 dark:text-rose-400">
                          [ خطأ: أعد المحاولة ]
                        </span>
                      );
                    }
                  } else if (hasHint) {
                    wordClasses =
                      'bg-amber-400/20 text-amber-700 dark:text-amber-300 border-b-2 border-amber-400 px-2 rounded-sm';
                    if (hintLevel === 1) {
                      const firstChar = word.cleanText.charAt(0) || word.text.charAt(0);
                      content = (
                        <span className="inline-flex items-center text-xl sm:text-2xl font-arabic font-bold text-amber-700 dark:text-amber-300">
                          [ {firstChar}... ]
                        </span>
                      );
                    } else {
                      content = word.text;
                    }
                  } else {
                    // Waiting for the user to recite this word
                    if (viewMode === 'blank') {
                      wordClasses =
                        'inline-block min-w-[42px] sm:min-w-[54px] h-[42px] sm:h-[50px] border-b-2 border-amber-500/70 bg-amber-500/10 rounded-sm animate-pulse align-middle';
                      content = <span className="opacity-0">{word.text}</span>;
                    } else if (viewMode === 'ghost') {
                      wordClasses =
                        'opacity-30 blur-[0.6px] border-b-2 border-dashed border-amber-500 text-stone-500';
                    } else {
                      wordClasses =
                        'bg-amber-300/30 dark:bg-amber-500/20 px-2 rounded border-b border-amber-500';
                    }
                  }
                } else {
                  // Future words in this Ayah
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
                    className={`relative inline-block transition-all duration-200 ${wordClasses}`}
                  >
                    {content}
                  </span>
                );
              })}

              {/* Ayah End Number Marker */}
              <span
                className={`inline-flex items-center justify-center mx-2.5 align-middle transition-all duration-300 ${
                  isAyahFinished
                    ? 'opacity-100 scale-100 text-[#96702c] dark:text-[#d3ab5a]'
                    : viewMode === 'full'
                    ? 'opacity-70 text-[#96702c] dark:text-[#d3ab5a]'
                    : 'opacity-0 scale-75'
                }`}
                style={{ fontSize: `${Math.max(22, fontSize * 0.85)}px` }}
              >
                <span className="font-arabic font-bold text-xs sm:text-sm border-2 border-[#c5a059] rounded-full w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center bg-amber-500/10 shadow-xs">
                  {toArabicDigits(currentAyah.numberInSurah)}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Bottom Status Bar: Waiting vs Progress */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs font-arabic text-stone-500">
          <div className="flex items-center gap-2">
            {isAyahFinished ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>✓ تمت الآية بنجاح! الانتقال للآية التالية...</span>
              </span>
            ) : isListening ? (
              <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>نستمع إليك الآن... اقرأ الآية بصوتك</span>
              </span>
            ) : (
              <span className="text-stone-400">
                اضغط "ابدأ التسميع" بالأسفل واقرأ من حفظك
              </span>
            )}
          </div>

          {/* Ayah Words Progress */}
          <div className="font-mono text-xs text-stone-400">
            {revealedAyahWordCount} / {totalWordsInAyah} كلمة
          </div>
        </div>
      </div>
    </div>
  );
};
