import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, ListFilter } from 'lucide-react';
import { QuranSurahData } from '../types/quran';

interface RewardScreenProps {
  surahData: QuranSurahData;
  onRestartSurah: () => void;
  onSelectAnotherSurah: () => void;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({
  surahData,
  onRestartSurah,
  onSelectAnotherSurah,
}) => {
  useEffect(() => {
    // Gentle soft confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#059669', '#10b981', '#d97706', '#34d399'],
      });
    } catch (_) {}
  }, []);

  return (
    <div className="w-full h-full min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-stone-900 font-arabic select-none text-center" dir="rtl">
      <div className="max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Soft glowing celebration emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Sparkles className="w-10 h-10 animate-pulse stroke-[1.8]" />
          </div>
        </div>

        {/* Title & Surah Name */}
        <h1 className="font-quran text-3xl sm:text-4xl font-bold text-stone-900 mb-2">
          بَارَكَ ٱللَّهُ فِيك
        </h1>

        <p className="text-base sm:text-lg text-emerald-800 font-semibold mb-8">
          أتممت حفظ سورة {surahData.name}
        </p>

        {/* Exactly 2 Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Button 1: سورة تانية */}
          <button
            onClick={onSelectAnotherSurah}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
          >
            <ListFilter className="w-5 h-5" />
            <span>سورة تانية</span>
          </button>

          {/* Button 2: إعادة */}
          <button
            onClick={onRestartSurah}
            className="w-full py-3 px-6 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4 text-stone-500" />
            <span>إعادة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
