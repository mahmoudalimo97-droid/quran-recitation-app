import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, AlertTriangle, Lightbulb, Clock, ArrowLeft, RotateCcw } from 'lucide-react';
import { RecitationStats } from '../types/quran';

interface PageCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: RecitationStats | null;
  onNextPage: () => void;
  onRepeatPage: () => void;
  isDarkMode: boolean;
}

export const PageCompletionModal: React.FC<PageCompletionModalProps> = ({
  isOpen,
  onClose,
  stats,
  onNextPage,
  onRepeatPage,
  isDarkMode,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c5a059', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const minutes = Math.floor(stats.timeSpentSeconds / 60);
  const seconds = stats.timeSpentSeconds % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const getEvaluationTier = (accuracy: number) => {
    if (accuracy >= 95) return { title: 'إتقان ممتاز وراسخ!', desc: 'ما شاء الله تبارك الله، حفظ متقن ومرتب.' };
    if (accuracy >= 85) return { title: 'حفظ جيد جداً!', desc: 'أداء رائع مع بعض الهنات اليسيرة.' };
    if (accuracy >= 70) return { title: 'حفظ جيد بحاجة لتثبيت', desc: 'استمر في المراجعة لتثبيت مواضع التردد.' };
    return { title: 'بحاجة لمزيد من المراجعة', desc: 'راجع الصفحة قراءة أولاً ثم أعد التسميع.' };
  };

  const evaluation = getEvaluationTier(stats.accuracyPercentage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl flex flex-col shadow-2xl border overflow-hidden p-6 text-center ${
          isDarkMode
            ? 'bg-[#1c1b18] border-[#3d362a] text-[#f5f2eb]'
            : 'bg-[#fcfbf7] border-[#dfd4be] text-[#2c261e]'
        }`}
        dir="rtl"
      >
        {/* Islamic Ornament Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
          <Award className="w-8 h-8" />
        </div>

        <h3 className="font-arabic font-bold text-2xl text-stone-900 dark:text-stone-100 mb-1">
          مُبارك! أتممت تسميع {stats.surahNames?.length ? `سورة ${stats.surahNames[0]}` : `الصفحة ${stats.pageNumber || 1}`}
        </h3>
        <p className="font-arabic text-sm text-amber-700 dark:text-amber-400 font-semibold mb-4">
          {evaluation.title} — {evaluation.desc}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 font-arabic">
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {stats.correctWords}
            </div>
            <div className="text-[11px] text-stone-500">كلمة صحيحة</div>
          </div>

          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
            <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
              {stats.mistakesCount}
            </div>
            <div className="text-[11px] text-stone-500">أخطاء/محاولات</div>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {stats.hintsCount}
            </div>
            <div className="text-[11px] text-stone-500">تلميحات</div>
          </div>

          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
              {timeFormatted}
            </div>
            <div className="text-[11px] text-stone-500">الوقت</div>
          </div>
        </div>

        {/* Overall Accuracy Meter */}
        <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 my-2 font-arabic">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 mb-1.5">
            <span>نسبة الإتقان العامة:</span>
            <span className="font-bold font-mono text-base text-amber-600 dark:text-amber-400">
              {stats.accuracyPercentage}%
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
              style={{ width: `${stats.accuracyPercentage}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-5 font-arabic">
          <button
            onClick={onNextPage}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <span>{stats.surahNames?.length ? 'المتابعة التالية' : `الصفحة التالية (${(stats.pageNumber || 1) + 1})`}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onRepeatPage}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة التسميع</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-arabic py-1"
        >
          البقاء في هذه الصفحة لمراجعتها
        </button>
      </div>
    </div>
  );
};
