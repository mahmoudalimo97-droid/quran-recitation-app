import React from 'react';
import { X, Award, Flame, Calendar, Trash2 } from 'lucide-react';
import { RecitationStats } from '../types/quran';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: RecitationStats[];
  onClearHistory: () => void;
  isDarkMode: boolean;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const totalPagesRecited = history.length;
  const totalWords = history.reduce((acc, h) => acc + h.correctWords, 0);
  const totalMistakes = history.reduce((acc, h) => acc + h.mistakesCount, 0);
  const averageAccuracy =
    history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + h.accuracyPercentage, 0) / history.length)
      : 0;

  const totalSeconds = history.reduce((acc, h) => acc + h.timeSpentSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          isDarkMode
            ? 'bg-[#1c1b18] border-[#3d362a] text-[#f5f2eb]'
            : 'bg-[#fcfbf7] border-[#dfd4be] text-[#2c261e]'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-arabic font-bold text-lg">إحصائيات وسجل التسميع</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 font-arabic">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {totalPagesRecited}
              </div>
              <div className="text-[11px] text-stone-500">صفحة مُسمّعة</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {totalWords}
              </div>
              <div className="text-[11px] text-stone-500">كلمة صحيحة</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {averageAccuracy}%
              </div>
              <div className="text-[11px] text-stone-500">متوسط الإتقان</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {totalMinutes} د
              </div>
              <div className="text-[11px] text-stone-500">وقت التسميع</div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-arabic">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
              سجل الجلسات الأخيرة:
            </span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-stone-400 font-arabic text-sm">
              لم تسجل جلسات تسميع بعد. ابدأ بتسميع صفحتك الأولى!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center font-mono text-sm">
                      {item.pageNumber}
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        صفحة {item.pageNumber} {item.surahNames?.length ? `(${item.surahNames.join('، ')})` : ''}
                      </div>
                      <div className="text-stone-400 text-[10px] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                        <span>·</span>
                        <span>{Math.round(item.timeSpentSeconds)} ثانية</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span
                      className={`font-bold text-sm ${
                        item.accuracyPercentage >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.accuracyPercentage}%
                    </span>
                    <div className="text-[10px] text-stone-400">
                      {item.correctWords} صح / {item.mistakesCount} خطأ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
