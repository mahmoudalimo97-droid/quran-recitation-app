import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Lightbulb,
  SkipForward,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { FeedbackState, QuranWord } from '../types/quran';

interface RecitationControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  audioLevel: number;
  interimTranscript: string;
  feedback: FeedbackState | null;
  currentWord: QuranWord | undefined;
  revealedCount: number;
  totalWords: number;
  onHint: () => void;
  onSkipWord: () => void;
  onResetPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  pageNumber: number;
  isDarkMode: boolean;
  onSimulateWord: (wordText?: string) => void;
  isSpeechSupported: boolean;
  errorMessage: string | null;
  isAutoAdvance: boolean;
  onToggleAutoAdvance: () => void;
}

export const RecitationControls: React.FC<RecitationControlsProps> = ({
  isListening,
  onToggleListening,
  audioLevel,
  interimTranscript,
  feedback,
  currentWord,
  revealedCount,
  totalWords,
  onHint,
  onSkipWord,
  onResetPage,
  onPrevPage,
  onNextPage,
  pageNumber,
  isDarkMode,
  onSimulateWord,
  isSpeechSupported,
  errorMessage,
  isAutoAdvance,
  onToggleAutoAdvance,
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [typedInput, setTypedInput] = useState('');

  const progressPercent = totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      onSimulateWord(typedInput.trim());
      setTypedInput('');
    } else if (currentWord) {
      onSimulateWord(currentWord.cleanText);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 pt-2">
      <div
        className={`max-w-3xl mx-auto rounded-2xl border backdrop-blur-xl shadow-2xl p-3 sm:p-4 transition-all duration-300 ${
          isDarkMode
            ? 'bg-[#181714]/95 border-[#3d362a] text-[#f5f2eb] shadow-black/80'
            : 'bg-[#fcfbf7]/95 border-[#dfd4be] text-[#2c261e] shadow-amber-900/10'
        }`}
      >
        {/* Progress bar line */}
        <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-gradient-to-r from-amber-600 to-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Live Feedback & Speech Ticker */}
        <div className="min-h-[38px] flex items-center justify-between text-xs sm:text-sm px-1 mb-2 font-arabic gap-2">
          {/* Status Message */}
          <div className="flex-1 overflow-hidden">
            {feedback?.type === 'wrong' ? (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold truncate animate-bounce">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>الكلمة غير صحيحة، حاول مجدداً</span>
                {feedback.spokenWord && (
                  <span className="text-[11px] opacity-80">(قيل: "{feedback.spokenWord}")</span>
                )}
              </div>
            ) : feedback?.type === 'correct' ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>أحسنت! كلمة صحيحة</span>
              </div>
            ) : feedback?.type === 'hint' ? (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold truncate">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 truncate">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>نسمعك الآن:</span>
                </span>
                <span className="font-quran text-stone-900 dark:text-white truncate">
                  {interimTranscript || 'اقرأ من حفظك بصوت واضح...'}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="text-amber-600 dark:text-amber-400 truncate text-[11px]">
                {errorMessage}
              </div>
            ) : (
              <div className="text-stone-500 dark:text-stone-400 truncate">
                اضغط على الميكروفون لبدء التسميع بصوتك
              </div>
            )}
          </div>

          {/* Page Word Progress Counter */}
          <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-mono shrink-0">
            {revealedCount} / {totalWords} كلمة ({progressPercent}%)
          </div>
        </div>

        {/* Main Recitation Controls Dock */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Actions: Prev Page & Reset */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-arabic flex items-center gap-1"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">السابقة</span>
            </button>

            <button
              onClick={onResetPage}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-arabic flex items-center gap-1 text-stone-600 dark:text-stone-300"
              title="إعادة تسميع الصفحة"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">إعادة</span>
            </button>
          </div>

          {/* Center: The Big Microphone Button */}
          <div className="flex items-center justify-center relative">
            {/* Audio Wave Pulsing Ring */}
            {isListening && (
              <div
                className="absolute rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 pointer-events-none transition-all duration-150"
                style={{
                  width: `${68 + audioLevel * 0.4}px`,
                  height: `${68 + audioLevel * 0.4}px`,
                }}
              />
            )}

            <button
              onClick={onToggleListening}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-2xl font-arabic font-bold text-sm sm:text-base transition-all duration-200 shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-4 ring-rose-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-700/30'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  <span>إيقاف التسميع</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>ابدأ التسميع</span>
                </>
              )}
            </button>
          </div>

          {/* Right Actions: Hint, Skip & Next Page */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onHint}
              disabled={revealedCount >= totalWords}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors text-xs font-arabic flex items-center gap-1 font-medium disabled:opacity-40"
              title="تلميح (أول حرف أو الكلمة التالية)"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">تلميح</span>
            </button>

            <button
              onClick={onSkipWord}
              disabled={revealedCount >= totalWords}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-arabic flex items-center gap-1 text-stone-600 dark:text-stone-300 disabled:opacity-40"
              title="تخطي الكلمة"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">تخطي</span>
            </button>

            <button
              onClick={onNextPage}
              disabled={pageNumber >= 604}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-arabic flex items-center gap-1"
              title="الصفحة التالية"
            >
              <span className="hidden sm:inline">التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Auto Advance Toggle */}
            <button
              onClick={onToggleAutoAdvance}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-colors text-xs font-arabic flex items-center gap-1 ${
                isAutoAdvance
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-600'
              }`}
              title={isAutoAdvance ? 'الانتقال التلقائي بين الصفحات مفعّل: ينتقل للصفحة التالية فور اكتمال التسميع دون توقف' : 'الانتقال التلقائي معطّل'}
            >
              <span className="text-[10px]">تلقائي</span>
              <span className={isAutoAdvance ? 'text-emerald-600 font-bold' : 'opacity-40'}>
                {isAutoAdvance ? '✓' : '✗'}
              </span>
            </button>

            {/* Simulator toggle button */}
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`p-2 rounded-xl border transition-colors ${
                showSimulator
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500'
              }`}
              title="محاكي التسميع الصوتي والكتابي"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recitation Simulator Drawer (for instant testing or non-mic setups) */}
        {showSimulator && (
          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs font-arabic">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>محاكي التسميع (للتجربة السريعة أو بدون مايكروفون):</span>
              </span>
              <span className="text-stone-500 text-[11px]">
                المطلوب الآن:{' '}
                <strong className="font-quran text-amber-700 dark:text-amber-400 text-sm">
                  {currentWord?.text || '—'}
                </strong>
              </span>
            </div>

            <form onSubmit={handleSimulateSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="اكتب الكلمة أو اضغط 'تسميع الكلمة التالية'..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                dir="rtl"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium hover:opacity-90"
              >
                تحقق
              </button>
              <button
                type="button"
                onClick={() => onSimulateWord()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 whitespace-nowrap flex items-center gap-1"
              >
                <span>تسميع تلقائي للكلمة</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
