import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Begin fade-out at 2.2s, transition at 2.6s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      dir="rtl"
    >
      <div className="flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-700">
        {/* Simple elegant Quran emblem */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm mb-6">
          <BookOpen className="w-10 h-10 stroke-[1.8]" />
        </div>

        {/* Title in Amiri Quran calligraphy style */}
        <h1 className="font-quran text-3xl sm:text-4xl font-bold text-stone-900 tracking-wide mb-3">
          تسميع القرآن الكريم
        </h1>

        <p className="font-arabic text-sm text-stone-500 font-medium">
          رتّل واستمع بخشوع آية بآية
        </p>

        {/* Subtle decorative dot line */}
        <div className="flex items-center gap-1.5 mt-8 text-emerald-600/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40"></span>
          <span className="w-8 h-1 rounded-full bg-emerald-600/30"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40"></span>
        </div>
      </div>
    </div>
  );
};
