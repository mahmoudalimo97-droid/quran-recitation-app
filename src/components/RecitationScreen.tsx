import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  SkipForward,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { QuranSurahData } from '../types/quran';
import { Capacitor } from '@capacitor/core';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // References
  const silenceTimerRef = useRef<any>(null);
  const isAdvancingRef = useRef(false);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  useEffect(() => {
    currentAyahIndexRef.current = currentAyahIndex;
  }, [currentAyahIndex]);

  // Clean transition to the next Ayah after user stops speaking for ~2s
  const advanceToNextAyah = useCallback(
    (verseIndex: number) => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // Keep text fixed for 500ms, then smooth fade transition
      setTimeout(() => {
        setIsFadingOut(true);

        setTimeout(() => {
          const nextIdx = verseIndex + 1;
          if (nextIdx >= totalAyahs) {
            stopListening();
            onFinishSurah();
          } else {
            clearSession();
            setLiveSpokenText('');
            isAdvancingRef.current = false;
            setCurrentAyahIndex(nextIdx);
            setIsFadingOut(false);
          }
        }, 300);
      }, 500);
    },
    [totalAyahs, onFinishSurah]
  );

  // Live Scribe speech transcript callback (no matching, no normalization)
  const handleTranscript = useCallback(
    (transcript: string) => {
      if (isAdvancingRef.current) return;

      const trimmed = transcript.trim();
      if (!trimmed) return;

      // Update spoken text live on screen as said
      setLiveSpokenText(trimmed);

      // Reset silence detection timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // When user pauses/stops speaking for ~2 seconds after writing text -> advance to next ayah
      silenceTimerRef.current = setTimeout(() => {
        advanceToNextAyah(currentAyahIndexRef.current);
      }, 2000);
    },
    [advanceToNextAyah]
  );

  const {
    isListening,
    error: speechError,
    errorType,
    isSupported,
    debugStatus,
    startListening,
    stopListening,
    clearSession,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    lang: 'ar-SA',
  });

  // Start listening automatically on screen enter
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 300);
    return () => clearTimeout(timer);
  }, [startListening]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Manual Next Button (backup)
  const handleManualNext = () => {
    if (isAdvancingRef.current) return;
    advanceToNextAyah(currentAyahIndex);
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();
    } else {
      startListening();
    }
  };

  // Back Button with confirmation
  const handleBackClicked = () => {
    if (currentAyahIndex > 0 || liveSpokenText) {
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

  // Auto-fit font size based on text length so single verse never overflows
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

      {/* 2.5 Diagnostic Status Bar (Temporary for debugging microphone status) */}
      <div className="w-full bg-stone-900 text-stone-100 px-3 py-1.5 text-[11px] flex items-center justify-between z-20 shrink-0 border-b border-stone-800 font-arabic select-text leading-tight">
        <div className="flex items-center gap-2 overflow-hidden mr-1">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isListening
                ? 'bg-emerald-400 animate-pulse'
                : speechError
                ? 'bg-red-400'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-bold text-emerald-400 shrink-0">تشخيص:</span>
          <span className="truncate text-stone-200 font-mono text-[10px]" dir="ltr">
            {debugStatus || (isListening ? 'يستمع' : 'متوقف')}
          </span>
        </div>
        <span className="text-[10px] text-stone-400 shrink-0 mr-1 font-mono" dir="ltr">
          {Capacitor.isNativePlatform() ? 'Android Native' : 'Web'}
        </span>
      </div>

      {/* Permission Denied Card */}
      {errorType === 'permission_denied' && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 shrink-0 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900 mb-1">تم رفض إذن الميكروفون</p>
              <p className="text-[11px] text-red-700 leading-relaxed mb-2">
                يرجى السماح للتطبيق باستخدام الميكروفون: إعدادات الهاتف ← التطبيقات ← تسميع القرآن ← الأذونات ← الميكروفون ← سماح.
              </p>
              <button
                onClick={() => startListening()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              >
                إعادة طلب الإذن الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {speechError && errorType !== 'permission_denied' && (
        <div className="mx-4 mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between shrink-0 animate-in fade-in duration-200">
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
          <span>التعرف على الصوت غير متاح على هذا الجهاز.</span>
        </div>
      )}

      {/* 3. Center Verse Area (Strictly NO SCROLL, auto-fit font size, pure live scribe) */}
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
          {liveSpokenText ? (
            /* Live spoken text written as-is word-by-word with end verse symbol */
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-100">
              <p
                className={`font-quran font-bold text-stone-900 leading-relaxed ${getFontSizeClass(
                  liveSpokenText.length
                )}`}
              >
                {liveSpokenText}
                <span className="inline-block w-2 h-5 bg-emerald-600 rounded-full mr-1.5 animate-pulse align-middle" />{' '}
                <span className="font-quran text-stone-300 font-normal inline-block mr-1">
                  ﴿{toArabicDigits(currentAyahIndex + 1)}﴾
                </span>
              </p>
            </div>
          ) : (
            /* Empty / Waiting state: end symbol ﴿num﴾ waiting for recitation */
            <div className="w-full flex flex-col items-center justify-center py-2">
              <div className="font-quran text-4xl sm:text-5xl text-stone-200 font-bold mb-4 select-none">
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
        </div>
      </main>

      {/* 4. Fixed Bottom Controls (Microphone + Manual Next Button) */}
      <footer className="w-full shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-100 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),18px)] flex flex-col items-center">
        <div className="w-full max-w-sm flex items-center justify-between">
          {/* Listening Status Badge */}
          <div className="w-24 flex items-center justify-start text-[11px] font-bold">
            {isListening ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>يستمع</span>
              </span>
            ) : (
              <span className="text-stone-400">متوقف</span>
            )}
          </div>

          {/* Large Central Microphone Button with Pulsing Animation */}
          <div className="relative flex flex-col items-center">
            {isListening && (
              <>
                <span className="absolute -inset-3 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />
                <span className="absolute -inset-1.5 rounded-full bg-emerald-500/40 animate-pulse pointer-events-none" />
              </>
            )}
            <button
              onClick={toggleMic}
              className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                isListening
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 shadow-emerald-600/40 scale-105 animate-pulse'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/20'
              }`}
              title={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع والتسميع'}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-pulse text-white" />
              ) : (
                <MicOff className="w-7 h-7 opacity-85 text-stone-200" />
              )}
            </button>
          </div>

          {/* Manual Next Button (Backup) */}
          <div className="w-24 flex items-center justify-end">
            <button
              onClick={handleManualNext}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 text-xs font-semibold transition active:scale-95 shadow-sm"
              title="الانتقال للآية التالية يدوياً"
            >
              <span>التالية</span>
              <SkipForward className="w-3.5 h-3.5 rotate-180 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Helper Note */}
        <p className="mt-2 text-[11px] text-stone-400 font-arabic select-none text-center">
          {isListening
            ? 'التسميع مستمر تلقائياً • الانتقال للآية التالية بعد ثانيتين من السكوت'
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
