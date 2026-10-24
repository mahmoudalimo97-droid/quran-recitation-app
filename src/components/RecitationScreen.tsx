import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  Sun,
  Moon,
  CheckCircle2,
  HelpCircle,
  Keyboard,
  Send,
} from 'lucide-react';
import { QuranSurahData } from '../types/quran';
import { formatSurahTitle } from '../utils/arabicMatcher';

interface RecitationScreenProps {
  surahData: QuranSurahData;
  currentAyahIndex: number;
  revealedAyahWordCount: number;
  isListening: boolean;
  audioLevel: number;
  interimTranscript: string;
  isDarkMode: boolean;
  fontSize: number;
  isAyahCompletedFlash: boolean;
  onBackToIndex: () => void;
  onToggleListening: () => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onResetAyah: () => void;
  onHintWord: () => void;
  onSimulateWord: (word: string) => void;
  onToggleDarkMode: () => void;
  onChangeFontSize: (delta: number) => void;
  onRestartSurah: () => void;
  onNextSurah?: () => void;
  hasNextSurah: boolean;
  isSurahFinished: boolean;
}

function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

export const RecitationScreen: React.FC<RecitationScreenProps> = ({
  surahData,
  currentAyahIndex,
  revealedAyahWordCount,
  isListening,
  audioLevel,
  interimTranscript,
  isDarkMode,
  fontSize,
  isAyahCompletedFlash,
  onBackToIndex,
  onToggleListening,
  onNextAyah,
  onPrevAyah,
  onResetAyah,
  onHintWord,
  onSimulateWord,
  onToggleDarkMode,
  onChangeFontSize,
  onRestartSurah,
  onNextSurah,
  hasNextSurah,
  isSurahFinished,
}) => {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [typedText, setTypedText] = useState('');

  const currentAyah = surahData.ayahs[currentAyahIndex];
  const isFirstAyah = currentAyahIndex === 0;
  const isSurahTawbah = surahData.number === 9;
  const isSurahFatihah = surahData.number === 1;

  const totalWords = currentAyah?.words.length || 0;
  const nextTargetWord =
    currentAyah && revealedAyahWordCount < totalWords
      ? currentAyah.words[revealedAyahWordCount]
      : null;

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedText.trim()) {
      onSimulateWord(typedText.trim());
      setTypedText('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#faf9f5] dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex flex-col font-arabic select-none transition-colors duration-200">
      {/* 1. Minimal Top Navigation Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between border-b border-stone-200/40 dark:border-stone-800/40">
        {/* Back to Index Button */}
        <button
          onClick={onBackToIndex}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          title="العودة لفهرس سور القرآن"
        >
          <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>فهرس السور</span>
        </button>

        {/* Center: Surah Title & Ayah Progress */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="font-quran font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100">
              {formatSurahTitle(surahData.name)}
            </h2>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
              {surahData.revelationType}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            الآية {toArabicDigits(currentAyahIndex + 1)} من {toArabicDigits(surahData.numberOfAyahs)}
          </div>
        </div>

        {/* Right Tools: Font Size & Dark Mode */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeFontSize(-2)}
            disabled={fontSize <= 24}
            className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold disabled:opacity-30 transition-colors"
            title="تصغير الخط"
          >
            A-
          </button>
          <button
            onClick={() => onChangeFontSize(2)}
            disabled={fontSize >= 44}
            className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold disabled:opacity-30 transition-colors"
            title="تكبير الخط"
          >
            A+
          </button>
          <button
            onClick={onToggleDarkMode}
            className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-colors"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Centered Ayah Display Area (Generous Space Above & Below) */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 flex-1 flex flex-col items-center justify-center my-auto py-12 sm:py-20 min-h-[50vh]">
        {/* Basmalah Header (if Ayah 1 and not Tawbah and not Fatihah) */}
        {isFirstAyah && !isSurahTawbah && !isSurahFatihah && (
          <div className="mb-10 sm:mb-14 text-center font-quran text-2xl sm:text-3xl font-bold text-amber-800/90 dark:text-amber-400/90 tracking-wide select-none animate-in fade-in duration-300">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
        )}

        {/* Ayah Completion Banner Flash */}
        {isAyahCompletedFlash && (
          <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm sm:text-base animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>ما شاء الله! أتممت الآية الكريمة، جاري الانتقال للآية التالية...</span>
          </div>
        )}

        {/* Ayah Words Display - Only writes what the user has recited */}
        {currentAyah ? (
          <div className="w-full min-h-[140px] flex items-center justify-center">
            {revealedAyahWordCount === 0 ? (
              <div className="text-center py-8 px-4 animate-in fade-in duration-300">
                <p className="text-stone-400/90 dark:text-stone-500 font-quran text-xl sm:text-2xl animate-pulse">
                  اقرأ الآية من حفظك وسيتم كتابتها هنا فوراً...
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-400">
                  <span className="font-semibold">الآية رقم {toArabicDigits(currentAyah.numberInSurah)}</span>
                  <span>·</span>
                  <span>({toArabicDigits(totalWords)} كلمات)</span>
                </div>
              </div>
            ) : (
              <div
                className="w-full text-center font-quran leading-loose sm:leading-loose tracking-wide flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-4 px-2 sm:px-6"
                style={{ fontSize: `${fontSize}px` }}
              >
                {/* Only words that have been recited so far */}
                {currentAyah.words.slice(0, revealedAyahWordCount).map((word, idx) => (
                  <span
                    key={word.id || idx}
                    className="text-stone-900 dark:text-stone-50 font-bold drop-shadow-xs transition-all duration-150 animate-in zoom-in-95 inline-block"
                  >
                    {word.text}
                  </span>
                ))}

                {/* Subtle blinking cursor while waiting for the user to recite the next word */}
                {revealedAyahWordCount < totalWords && (
                  <span
                    className="inline-block w-1.5 h-8 bg-amber-500/80 rounded-full animate-pulse self-center mr-1"
                    title="في انتظار نطق الكلمة التالية..."
                  />
                )}

                {/* End of Ayah Ornament Symbol - Only appears when the entire Ayah is completed */}
                {revealedAyahWordCount >= totalWords && (
                  <span
                    className="inline-flex items-center justify-center font-quran text-emerald-600 dark:text-emerald-400 text-lg sm:text-2xl font-bold mr-2 transition-all duration-300 scale-110 animate-in zoom-in-95"
                  >
                    ﴿{toArabicDigits(currentAyah.numberInSurah)}﴾
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-stone-400 py-12">
            <p>جاري تحميل آيات السورة الكريمة...</p>
          </div>
        )}

        {/* Live Heard Word Feedback or Prompt */}
        <div className="mt-8 sm:mt-12 text-center min-h-[32px] flex items-center justify-center">
          {interimTranscript ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-medium animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>سمعت: «{interimTranscript}»</span>
            </div>
          ) : isListening ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {revealedAyahWordCount === 0
                  ? 'الميكروفون يستمع... ابدأ قراءة الآية الكريمة من حفظك'
                  : revealedAyahWordCount < totalWords
                  ? 'الميكروفون يستمع... واصل التسميع بصوتك'
                  : 'ما شاء الله! اكتملت الآية الكريمة'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-stone-400 dark:text-stone-500">
              اضغط على زر الميكروفون أدناه لبدء التسميع
            </div>
          )}
        </div>
      </main>

      {/* 3. Bottom Controls Area */}
      <footer className="w-full max-w-2xl mx-auto px-4 pb-8 pt-4 flex flex-col items-center gap-4">
        {/* Quick Stepper & Helper Actions */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
          <button
            onClick={onPrevAyah}
            disabled={currentAyahIndex <= 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-25 disabled:pointer-events-none text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            title="الآية السابقة"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">الآية السابقة</span>
          </button>

          <button
            onClick={onResetAyah}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            title="إعادة تسميع الآية الحالية من البداية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>إعادة الآية</span>
          </button>

          <button
            onClick={onHintWord}
            disabled={revealedAyahWordCount >= totalWords}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs disabled:opacity-30 disabled:pointer-events-none"
            title="إظهار الكلمة التالية كتلميح"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>تلميح كلمة</span>
          </button>

          <button
            onClick={onNextAyah}
            disabled={currentAyahIndex >= surahData.numberOfAyahs - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-25 disabled:pointer-events-none text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
            title="تخطي للآية التالية"
          >
            <span className="hidden sm:inline">الآية التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Big Microphone Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleListening}
            className={`flex items-center gap-3 px-6 sm:px-8 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-md cursor-pointer ${
              isListening
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/30'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:hover:bg-white dark:text-stone-900 ring-2 ring-transparent'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-5 h-5 text-white animate-pulse" />
                <span>الميكروفون يستمع (انقر للإيقاف)</span>
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5 opacity-80" />
                <span>ابدأ التسميع الصوتي</span>
              </>
            )}
          </button>

          {/* Toggle manual text entry test bar */}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline mt-1 cursor-pointer"
          >
            {showKeyInput ? 'إخفاء الكتابة اليدوية' : 'أو اكتب للتجربة بدون ميكروفون'}
          </button>
        </div>

        {/* Simulation / Text Input Bar if opened */}
        {showKeyInput && (
          <form
            onSubmit={handleSimulateSubmit}
            className="w-full max-w-md flex items-center gap-2 mt-1 animate-in fade-in"
          >
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="اكتب كلمة أو آية واضغط إرسال..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 flex items-center gap-1 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </button>
          </form>
        )}
      </footer>

      {/* Surah Completion Modal */}
      {isSurahFinished && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#faf9f5] dark:bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl text-center font-arabic">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-quran text-stone-900 dark:text-stone-100 mb-2">
              هَنِيئًا لَك!
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-6">
              تم بحمد الله إتمام تسميع {formatSurahTitle(surahData.name)} كاملاً ({toArabicDigits(surahData.numberOfAyahs)} آية).
            </p>

            <div className="flex flex-col gap-2.5">
              {hasNextSurah && onNextSurah && (
                <button
                  onClick={onNextSurah}
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  الانتقال للسورة التالية
                </button>
              )}

              <button
                onClick={onRestartSurah}
                className="w-full py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                إعادة تسميع السورة
              </button>

              <button
                onClick={onBackToIndex}
                className="w-full py-2.5 rounded-2xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-sm font-semibold transition-colors cursor-pointer"
              >
                العودة لفهرس القرآن الكريم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
