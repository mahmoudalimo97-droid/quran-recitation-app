import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Volume2, User } from 'lucide-react';
import { QuranPageData } from '../types/quran';
import { getAyahAudioUrl } from '../services/quranService';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageData: QuranPageData;
  isDarkMode: boolean;
}

const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'مشاري بن راشد العفاسي', subtext: 'مرتل ومتقن' },
  { id: 'Husary_128kbps', name: 'محمود خليل الحصري', subtext: 'المصحف المعلم والمرتل' },
  { id: 'Minshawi_Murattal_128kbps', name: 'محمد صديق المنشاوي', subtext: 'ترتيل خاشع' },
];

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  isOpen,
  onClose,
  pageData,
  isDarkMode,
}) => {
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentAyah = pageData.ayahs[currentAyahIndex];

  useEffect(() => {
    // Reset to first ayah when page changes
    setCurrentAyahIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [pageData.pageNumber]);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  const playCurrentAyah = () => {
    if (!currentAyah) return;
    setPlaybackError(null);

    const url = getAyahAudioUrl(
      currentAyah.surah.number,
      currentAyah.numberInSurah,
      selectedReciter
    );

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    audioRef.current.onended = () => {
      // Play next ayah on the page if available
      if (currentAyahIndex + 1 < pageData.ayahs.length) {
        setCurrentAyahIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audioRef.current.onerror = () => {
      setPlaybackError('تعذر تشغيل التسجيل الصوتي لهذه الآية.');
      setIsPlaying(false);
    };

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((e) => {
        console.warn('Playback play() interrupted:', e);
        setIsPlaying(false);
      });
  };

  useEffect(() => {
    if (isPlaying) {
      playCurrentAyah();
    }
  }, [currentAyahIndex, selectedReciter]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      playCurrentAyah();
    }
  };

  const handleNext = () => {
    if (currentAyahIndex + 1 < pageData.ayahs.length) {
      setCurrentAyahIndex(currentAyahIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl flex flex-col shadow-2xl border overflow-hidden p-6 ${
          isDarkMode
            ? 'bg-[#1c1b18] border-[#3d362a] text-[#f5f2eb]'
            : 'bg-[#fcfbf7] border-[#dfd4be] text-[#2c261e]'
        }`}
        dir="rtl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-arabic font-bold text-lg">استمع لتلاوة الصفحة {pageData.pageNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reciter Selector */}
        <div className="my-4 font-arabic">
          <label className="text-xs text-stone-500 block mb-2 font-medium">اختر القارئ:</label>
          <div className="grid grid-cols-1 gap-2">
            {RECITERS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReciter(r.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all ${
                  selectedReciter === r.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200 font-bold'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-sm">{r.name}</div>
                    <div className="text-[11px] text-stone-500 font-normal">{r.subtext}</div>
                  </div>
                </div>
                {selectedReciter === r.id && (
                  <span className="text-xs text-amber-600 font-bold">محدد ✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Ayah Display */}
        {currentAyah && (
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center my-2">
            <div className="text-xs text-stone-500 font-arabic mb-1">
              {currentAyah.surah.name} — الآية {currentAyah.numberInSurah} (من {pageData.ayahs.length} آيات في الصفحة)
            </div>
            <div className="font-quran text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-relaxed max-h-24 overflow-y-auto px-2">
              {currentAyah.text}
            </div>
          </div>
        )}

        {playbackError && (
          <div className="text-xs text-rose-500 font-arabic text-center my-1">
            {playbackError}
          </div>
        )}

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handlePrev}
            disabled={currentAyahIndex === 0}
            className="p-3 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="الآية السابقة"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg transition-transform active:scale-95"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-[-1px]" />}
          </button>

          <button
            onClick={handleNext}
            disabled={currentAyahIndex >= pageData.ayahs.length - 1}
            className="p-3 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="الآية التالية"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
