import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  SkipForward,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { QuranSurahData } from '../types/quran';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  calculateAyahMatch,
  getFirstTwoWords,
  normalizeArabic,
  phoneticNormalizeArabic,
} from '../utils/arabicMatcher';

interface RecitationScreenProps {
  surahData: QuranSurahData;
  onBackToIndex: () => void;
  onFinishSurah: () => void;
}

function toArabicDigits(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
}

// Strips leading "بسم الله الرحمن الرحيم" if user speaks it before Ayah 1 of any surah other than Fatihah
function stripBasmalahPrefix(spokenText: string): string {
  const norm = normalizeArabic(spokenText);
  const basmalahNorm = 'بسم الله الرحمن الرحيم';
  if (norm.startsWith(basmalahNorm)) {
    return norm.slice(basmalahNorm.length).trim();
  }
  const phon = phoneticNormalizeArabic(spokenText);
  const basmalahPhon = phoneticNormalizeArabic(basmalahNorm);
  if (phon.startsWith(basmalahPhon)) {
    // Return approximate remainder
    const words = spokenText.trim().split(/\s+/);
    if (words.length > 4) {
      return words.slice(4).join(' ');
    }
  }
  return spokenText;
}

export const RecitationScreen: React.FC<RecitationScreenProps> = ({
  surahData,
  onBackToIndex,
  onFinishSurah,
}) => {
  const totalAyahs = surahData.numberOfAyahs || 1;
  const isSurahTawbah = surahData.number === 9;
  const isSurahFatihah = surahData.number === 1;

  // Active state
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [liveSpokenText, setLiveSpokenText] = useState<string>('');
  const [verseStatus, setVerseStatus] = useState<
    'idle' | 'listening' | 'success' | 'retry'
  >('idle');
  const [similarity, setSimilarity] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // References
  const silenceTimerRef = useRef<any>(null);
  const retryClearTimerRef = useRef<any>(null);
  const advanceTimerRef = useRef<any>(null);
  const hintAutoDismissRef = useRef<any>(null);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  const isAdvancingRef = useRef(false);

  useEffect(() => {
    currentAyahIndexRef.current = currentAyahIndex;
    setShowHint(false);
  }, [currentAyahIndex]);

  // Target text of current Ayah
  const currentAyah = surahData.ayahs[currentAyahIndex];
  const targetAyahText = currentAyah?.text || '';
  const currentFailedCount = failedAttempts[currentAyahIndex] || 0;
  const isHintAvailable = currentFailedCount >= 3;
  const hintText = targetAyahText ? getFirstTwoWords(targetAyahText) : '';

  // Trigger advance when a verse is recited successfully
  const triggerSuccessAdvance = useCallback(
    (verseIndex: number) => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      // Clear any pending timers
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (retryClearTimerRef.current) clearTimeout(retryClearTimerRef.current);

      setVerseStatus('success');

      // Wait ~1000ms, then fade out and transition to the next verse with zero scroll
      advanceTimerRef.current = setTimeout(() => {
        setIsFadingOut(true);

        setTimeout(() => {
          const nextIdx = verseIndex + 1;
          if (nextIdx >= totalAyahs) {
            stopListening();
            onFinishSurah();
          } else {
            clearSession();
            setLiveSpokenText('');
            setVerseStatus('idle');
            setSimilarity(0);
            isAdvancingRef.current = false;
            setCurrentAyahIndex(nextIdx);
            setIsFadingOut(false);
          }
        }, 300);
      }, 1000);
    },
    [totalAyahs, onFinishSurah]
  );

  // Trigger retry when speech ends without passing (similarity < 80%)
  const triggerRetry = useCallback(
    (verseIndex: number) => {
      if (isAdvancingRef.current) return;

      setVerseStatus('retry');
      setFailedAttempts((prev) => ({
        ...prev,
        [verseIndex]: (prev[verseIndex] || 0) + 1,
      }));

      // Clear spoken text after 1.5 seconds so user can try again on the same Ayah
      retryClearTimerRef.current = setTimeout(() => {
        setLiveSpokenText('');
        setVerseStatus('idle');
        setSimilarity(0);
        clearSession();
      }, 1500);
    },
    []
  );

  // Incoming speech transcript callback
  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isAdvancingRef.current) return;

      const trimmed = transcript.trim();
      if (!trimmed) return;

      const activeIdx = currentAyahIndexRef.current;
      const expectedText = surahData.ayahs[activeIdx]?.text || '';

      // Strip Basmalah prefix if recited before Ayah 1 of non-Fatihah surahs
      const testSpoken =
        activeIdx === 0 && !isSurahFatihah && !isSurahTawbah
          ? stripBasmalahPrefix(trimmed)
          : trimmed;

      const matchResult = calculateAyahMatch(testSpoken, expectedText);

      setLiveSpokenText(trimmed);
      setSimilarity(matchResult.similarity);

      // Check if match passed (>= 80%) immediately during speech!
      if (matchResult.isPassed) {
        triggerSuccessAdvance(activeIdx);
        return;
      }

      // Not passed yet: update status to listening
      setVerseStatus('listening');

      // Reset existing silence detection timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // If user stops speaking for 1.4s, or if final result arrives with < 80%
      const delayMs = isFinal ? 1100 : 1500;
      silenceTimerRef.current = setTimeout(() => {
        const finalCheck = calculateAyahMatch(testSpoken, expectedText);
        if (finalCheck.isPassed) {
          triggerSuccessAdvance(activeIdx);
        } else {
          // If transcript is very short (mic noise like "اه"), clear silently without penalty
          if (testSpoken.length <= 2) {
            setLiveSpokenText('');
            setVerseStatus('idle');
            clearSession();
          } else {
            triggerRetry(activeIdx);
          }
        }
      }, delayMs);
    },
    [surahData.ayahs, isSurahFatihah, isSurahTawbah, triggerSuccessAdvance, triggerRetry]
  );

  const {
    isListening,
    error: speechError,
    errorType,
    isSupported,
    startListening,
    stopListening,
    clearSession,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    lang: 'ar-SA',
  });

  // Start listening automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 350);
    return () => clearTimeout(timer);
  }, [startListening]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (retryClearTimerRef.current) clearTimeout(retryClearTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (hintAutoDismissRef.current) clearTimeout(hintAutoDismissRef.current);
    };
  }, []);

  // Skip verse handler (permanent backup button)
  const handleSkipAyah = () => {
    if (isAdvancingRef.current) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (retryClearTimerRef.current) clearTimeout(retryClearTimerRef.current);

    setIsFadingOut(true);
    setTimeout(() => {
      setLiveSpokenText('');
      setVerseStatus('idle');
      setSimilarity(0);
      clearSession();

      const nextIdx = currentAyahIndex + 1;
      if (nextIdx >= totalAyahs) {
        stopListening();
        onFinishSurah();
      } else {
        setCurrentAyahIndex(nextIdx);
        setIsFadingOut(false);
      }
    }, 250);
  };

  const toggleMic = () => {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
    } else {
      startListening();
    }
  };

  const handleBackClicked = () => {
    if (currentAyahIndex > 0) {
      setShowExitConfirm(true);
    } else {
      stopListening();
      onBackToIndex();
    }
  };

  const confirmExit = () => {
    stopListening();
    onBackToIndex();
  };

  const toggleHint = () => {
    setShowHint((prev) => {
      const next = !prev;
      if (next) {
        if (hintAutoDismissRef.current) clearTimeout(hintAutoDismissRef.current);
        hintAutoDismissRef.current = setTimeout(() => {
          setShowHint(false);
        }, 5000);
      }
      return next;
    });
  };

  // Dynamic font sizing (auto-fit based on verse length so no scrolling is ever needed)
  const displayedContent =
    verseStatus === 'success'
      ? targetAyahText
      : liveSpokenText || targetAyahText;
  const contentLength = displayedContent.length;

  const getFontSizeClass = (len: number) => {
    if (len <= 45) return 'text-2xl sm:text-3xl md:text-4xl leading-relaxed sm:leading-loose';
    if (len <= 95) return 'text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose';
    if (len <= 165) return 'text-lg sm:text-xl md:text-2xl leading-relaxed';
    if (len <= 260) return 'text-base sm:text-lg md:text-xl leading-normal';
    return 'text-sm sm:text-base md:text-lg leading-normal';
  };

  const progressPercent = Math.min(
    100,
    Math.round(((currentAyahIndex) / totalAyahs) * 100)
  );

  return (
    <div
      className="w-full h-[100dvh] max-h-[100dvh] bg-white text-stone-900 flex flex-col justify-between font-arabic select-none overflow-hidden relative"
      dir="rtl"
    >
      {/* 1. Thin Progress Bar */}
      <div className="w-full h-1 bg-stone-100 shrink-0 z-30">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* 2. Top Header (Compact & Fixed) */}
      <header className="w-full px-4 pt-[max(env(safe-area-inset-top),14px)] pb-2 flex items-center justify-between border-b border-stone-100 bg-white/95 backdrop-blur-md shrink-0 z-20">
        {/* Back Button */}
        <button
          onClick={handleBackClicked}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-semibold transition-colors"
        >
          <ArrowRight className="w-4 h-4 text-emerald-700" />
          <span>الفهرس</span>
        </button>

        {/* Surah Name & Counter */}
        <div className="text-center">
          <h2 className="font-quran text-base sm:text-lg font-bold text-stone-900 leading-tight">
            سُورَةُ {surahData.name}
          </h2>
          <div className="text-[11px] text-stone-500 font-medium">
            الآية {toArabicDigits(currentAyahIndex + 1)} من {toArabicDigits(totalAyahs)}
          </div>
        </div>

        {/* Progress Counter Badge */}
        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
          {toArabicDigits(currentAyahIndex)} / {toArabicDigits(totalAyahs)}
        </div>
      </header>

      {/* Notice Banners (Compact, non-intrusive) */}
      {errorType === 'offline_language_missing' && (
        <div className="mx-4 mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-stone-800 shrink-0 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-stone-700 leading-snug">
              <strong>وضع دون اتصال:</strong> لتفعيل التعرف أوفلاين، ثبّت حزمة العربية من
              (إعدادات الهاتف ← Google ← التعرف الصوتي دون اتصال).
            </p>
          </div>
        </div>
      )}

      {speechError && errorType !== 'offline_language_missing' && (
        <div className="mx-4 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{speechError}</span>
          </div>
          <button
            onClick={() => startListening()}
            className="text-xs text-emerald-700 font-bold underline shrink-0 flex items-center gap-1 mr-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span>إعادة</span>
          </button>
        </div>
      )}

      {!isSupported && (
        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>المتصفح لا يدعم التعرف على الصوت. يُفضل تطبيق أندرويد أو Chrome.</span>
        </div>
      )}

      {/* 3. Center Verse Area (Strictly NO SCROLL, auto-fit font size, single verse only) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 flex flex-col items-center justify-center text-center overflow-hidden relative">
        {/* Basmalah for start of Surah (Ayah 1) */}
        {!isSurahTawbah && !isSurahFatihah && currentAyahIndex === 0 && (
          <div className="font-quran text-sm sm:text-base text-emerald-800 font-semibold mb-4 select-none opacity-85">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
        )}

        {/* Main Verse Transition Container */}
        <div
          className={`w-full flex flex-col items-center justify-center transition-opacity duration-300 ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {verseStatus === 'success' ? (
            /* Verified Match (>= 80%): authentic Uthmani text with full tashkeel in emerald + checkmark */
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-200">
              <p
                className={`font-quran font-bold text-emerald-800 leading-relaxed ${getFontSizeClass(
                  contentLength
                )}`}
              >
                {targetAyahText}{' '}
                <span className="font-quran text-emerald-700 font-bold inline-block mr-1">
                  ﴿{toArabicDigits(currentAyahIndex + 1)}﴾
                </span>
              </p>
              <div className="flex items-center gap-1.5 mt-4 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>صحيح ✓</span>
              </div>
            </div>
          ) : verseStatus === 'retry' ? (
            /* Failed attempt (< 80%): soft red/gray with gentle retry notice */
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-150">
              <p
                className={`font-quran font-bold text-red-700/80 line-through decoration-red-300 leading-relaxed ${getFontSizeClass(
                  contentLength
                )}`}
              >
                {liveSpokenText}{' '}
                <span className="font-quran text-red-500 font-normal inline-block mr-1">
                  ﴿{toArabicDigits(currentAyahIndex + 1)}﴾
                </span>
              </p>
              <div className="flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <span>حاول مرة تانية... اقرأ الآية بوضوح</span>
                {similarity > 0 && (
                  <span className="text-[11px] text-stone-400">
                    ({toArabicDigits(similarity)}٪)
                  </span>
                )}
              </div>
            </div>
          ) : liveSpokenText ? (
            /* Interim speech: live spoken words word-by-word with end verse symbol */
            <div className="w-full flex flex-col items-center justify-center">
              <p
                className={`font-quran font-bold text-stone-900 leading-relaxed ${getFontSizeClass(
                  contentLength
                )}`}
              >
                {liveSpokenText}
                <span className="inline-block w-2 h-5 bg-emerald-600 rounded-full mr-1.5 animate-pulse align-middle" />{' '}
                <span className="font-quran text-stone-400 font-normal inline-block mr-1">
                  ﴿{toArabicDigits(currentAyahIndex + 1)}﴾
                </span>
              </p>
              {similarity > 0 && (
                <span className="text-[11px] text-stone-400 font-medium mt-3">
                  نسبة التطابق: {toArabicDigits(similarity)}٪
                </span>
              )}
            </div>
          ) : (
            /* Empty / Waiting state: end symbol ﴿num﴾ in soft style waiting for recitation */
            <div className="w-full flex flex-col items-center justify-center py-2">
              <div className="font-quran text-4xl sm:text-5xl text-stone-300 font-bold mb-4 select-none">
                ﴿{toArabicDigits(currentAyahIndex + 1)}﴾
              </div>
              <p className="text-sm sm:text-base text-stone-400 font-arabic flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-800 font-medium">
                      اقرأ الآية من حفظك في الميكروفون...
                    </span>
                  </>
                ) : (
                  <span>اضغط على الميكروفون وابدأ القراءة...</span>
                )}
              </p>
            </div>
          )}

          {/* Hint Card (available after 3 failed attempts) */}
          {isHintAvailable && verseStatus !== 'success' && (
            <div className="mt-5 flex flex-col items-center">
              <button
                onClick={toggleHint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>{showHint ? 'إخفاء التلميح' : 'تلميح (أول كلمتين)'}</span>
              </button>

              {showHint && hintText && (
                <div className="mt-2 px-4 py-2 bg-amber-50/90 border border-amber-200 rounded-xl text-center animate-in fade-in duration-200">
                  <span className="text-xs text-stone-500 font-medium ml-1">
                    أول كلمتين:
                  </span>
                  <span className="font-quran text-base sm:text-lg text-amber-950 font-bold">
                    « {hintText} ... »
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. Fixed Bottom Controls (Microphone + Skip Button) */}
      <footer className="w-full shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-100 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),18px)] flex flex-col items-center">
        <div className="w-full max-w-sm flex items-center justify-between">
          {/* Listening Status Badge */}
          <div className="w-24 flex items-center justify-start text-[11px] font-bold">
            {isListening ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>جاري الاستماع</span>
              </span>
            ) : (
              <span className="text-stone-400">متوقف</span>
            )}
          </div>

          {/* Large Central Microphone Button */}
          <div className="relative flex flex-col items-center">
            {isListening && (
              <span className="absolute -inset-2.5 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
            )}
            <button
              onClick={toggleMic}
              className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                isListening
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-emerald-600/30'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/20'
              }`}
              title={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع والتسميع'}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-pulse" />
              ) : (
                <MicOff className="w-7 h-7 opacity-85" />
              )}
            </button>
          </div>

          {/* Skip Button (Permanent backup) */}
          <div className="w-24 flex items-center justify-end">
            <button
              onClick={handleSkipAyah}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 text-xs font-semibold transition active:scale-95 shadow-sm"
              title="تخطي هذه الآية والانتقال للآية التالية"
            >
              <span>تخطي</span>
              <SkipForward className="w-3.5 h-3.5 rotate-180 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Helper Note */}
        <p className="mt-2 text-[11px] text-stone-400 font-arabic select-none text-center">
          {isListening
            ? 'اقرأ الآية بنسبة ٧٠٪ أو أكثر لتثبيتها والانتقال تلقائياً'
            : 'اضغط على الميكروفون للبدء'}
        </p>
      </footer>

      {/* 5. Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-quran text-xl font-bold text-stone-900 mb-2">
              العودة إلى الفهرس؟
            </h3>
            <p className="text-xs text-stone-500 mb-6 font-arabic leading-relaxed">
              لقد بدأت في تسميع سورة {surahData.name}. هل تريد إيقاف التسميع والعودة لقائمة السور؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                متابعة التسميع
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
