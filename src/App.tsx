import React, { useState, useEffect, useCallback } from 'react';
import { QuranSurahData } from './types/quran';
import { getQuranSurah } from './services/quranService';
import { SplashScreen } from './components/SplashScreen';
import { SurahIndexScreen } from './components/SurahIndexScreen';
import { RecitationScreen } from './components/RecitationScreen';
import { RewardScreen } from './components/RewardScreen';
import { initMobileNative } from './utils/mobileNative';
import { Loader2 } from 'lucide-react';

import { SURAHS_META } from './data/quranMeta';

type Screen = 'splash' | 'index' | 'recite' | 'reward';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [surahData, setSurahData] = useState<QuranSurahData | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);

  // Initialize Capacitor native plugins (StatusBar, SplashScreen) on mount
  useEffect(() => {
    initMobileNative();
  }, []);

  // Load Surah Data (100% offline from bundled JSON, zero network dependency)
  const loadSurah = useCallback(async (surahNumber: number) => {
    setIsLoadingSurah(true);
    setSurahError(null);
    try {
      const data = await getQuranSurah(surahNumber);
      setSurahData(data);
      setCurrentScreen('recite');
    } catch (err: any) {
      console.warn('Fallback on loadSurah:', err);
      const meta = SURAHS_META.find((s) => s.number === surahNumber) || {
        number: surahNumber,
        name: `سورة ${surahNumber}`,
        englishName: `Surah ${surahNumber}`,
        ayahCount: 7,
        revelationType: 'مكية' as const,
        juz: 1,
        startPage: 1,
      };

      setSurahData({
        number: meta.number,
        name: meta.name,
        englishName: meta.englishName,
        revelationType: meta.revelationType,
        numberOfAyahs: meta.ayahCount,
        ayahs: Array.from({ length: meta.ayahCount }, (_, i) => ({
          numberInQuran: i + 1,
          numberInSurah: i + 1,
          text: '',
          surah: {
            number: meta.number,
            name: meta.name,
            englishName: meta.englishName,
            revelationType: meta.revelationType,
          },
          juz: meta.juz,
          page: meta.startPage,
          words: [],
        })),
        words: [],
        totalWords: 0,
      });
      setCurrentScreen('recite');
    } finally {
      setIsLoadingSurah(false);
    }
  }, []);

  const handleSelectSurah = (surahNumber: number) => {
    setSelectedSurahNumber(surahNumber);
    loadSurah(surahNumber);
  };

  const handleRestartSurah = () => {
    if (selectedSurahNumber) {
      loadSurah(selectedSurahNumber);
    }
  };

  // Screen 1: Splash
  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={() => setCurrentScreen('index')} />;
  }

  // Loading state when opening a Surah
  if (isLoadingSurah) {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-stone-700 font-arabic text-center" dir="rtl">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-base font-semibold text-stone-800">جاري فتح السورة المباركة...</p>
      </div>
    );
  }

  // Error state when opening a Surah
  if (surahError) {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-stone-700 font-arabic text-center" dir="rtl">
        <p className="text-base font-semibold text-red-600 mb-4">{surahError}</p>
        <button
          onClick={() => setCurrentScreen('index')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
        >
          العودة لفهرس السور
        </button>
      </div>
    );
  }

  // Screen 3: Recitation
  if (currentScreen === 'recite' && surahData) {
    return (
      <RecitationScreen
        surahData={surahData}
        onBackToIndex={() => setCurrentScreen('index')}
        onFinishSurah={() => setCurrentScreen('reward')}
      />
    );
  }

  // Screen 4: Reward
  if (currentScreen === 'reward' && surahData) {
    return (
      <RewardScreen
        surahData={surahData}
        onRestartSurah={handleRestartSurah}
        onSelectAnotherSurah={() => setCurrentScreen('index')}
      />
    );
  }

  // Screen 2: Index (Default)
  return <SurahIndexScreen onSelectSurah={handleSelectSurah} />;
}
