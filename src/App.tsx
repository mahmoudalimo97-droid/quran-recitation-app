/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { QuranSurahData } from './types/quran';
import { getQuranSurah } from './services/quranService';
import { SURAHS_META } from './data/quranMeta';
import { matchSpeechSequence } from './utils/arabicMatcher';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSoundEffects } from './hooks/useSoundEffects';
import { SurahIndexView } from './components/SurahIndexView';
import { RecitationScreen } from './components/RecitationScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Navigation View: 'index' (Surah Index) | 'recite' (Ayah Recitation Screen)
  const [activeView, setActiveView] = useState<'index' | 'recite'>(() => {
    try {
      const saved = localStorage.getItem('musammia_active_view');
      return saved === 'recite' ? 'recite' : 'index';
    } catch (_) {
      return 'index';
    }
  });

  // Current Surah Number (1 to 114)
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('musammia_last_surah');
      return saved ? parseInt(saved, 10) || 1 : 1;
    } catch (_) {
      return 1;
    }
  });

  // Current Ayah Index inside the Surah (0-indexed)
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [revealedAyahWordCount, setRevealedAyahWordCount] = useState<number>(0);

  // Synchronized state references for speech callbacks to prevent stale closures
  const currentAyahIndexRef = useRef<number>(currentAyahIndex);
  currentAyahIndexRef.current = currentAyahIndex;

  const revealedAyahWordCountRef = useRef<number>(revealedAyahWordCount);
  revealedAyahWordCountRef.current = revealedAyahWordCount;

  const isTransitioningAyahRef = useRef<boolean>(false);

  // Loaded Surah Data
  const [surahData, setSurahData] = useState<QuranSurahData | null>(null);
  const surahDataRef = useRef<QuranSurahData | null>(surahData);
  surahDataRef.current = surahData;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Visual Ayah flash & Surah finish state
  const [isAyahCompletedFlash, setIsAyahCompletedFlash] = useState<boolean>(false);
  const [isSurahFinished, setIsSurahFinished] = useState<boolean>(false);

  // UI Preferences: Dark mode & Font size
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('musammia_dark_mode') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('musammia_font_size');
      return saved ? parseInt(saved, 10) || 32 : 32;
    } catch (_) {
      return 32;
    }
  });

  // Sound effects
  const { playCorrectSound, playWrongSound, playHintSound, playCelebrationSound } =
    useSoundEffects();

  // Keep dark mode class synced on root element
  useEffect(() => {
    try {
      localStorage.setItem('musammia_dark_mode', isDarkMode.toString());
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_) {}
  }, [isDarkMode]);

  // Save font size and view state
  useEffect(() => {
    try {
      localStorage.setItem('musammia_font_size', fontSize.toString());
      localStorage.setItem('musammia_active_view', activeView);
      localStorage.setItem('musammia_last_surah', currentSurahNumber.toString());
    } catch (_) {}
  }, [fontSize, activeView, currentSurahNumber]);

  // Load Surah Data
  const loadSurah = useCallback(async (surahNum: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    setRevealedAyahWordCount(0);
    revealedAyahWordCountRef.current = 0;
    isTransitioningAyahRef.current = false;
    setIsSurahFinished(false);

    try {
      const data = await getQuranSurah(surahNum);
      setSurahData(data);
      surahDataRef.current = data;
    } catch (err: any) {
      console.error('Failed to load surah:', err);
      setErrorMessage(err.message || 'تعذر تحميل بيانات السورة');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When Surah Number changes in Recitation mode, load its data
  useEffect(() => {
    if (activeView === 'recite') {
      loadSurah(currentSurahNumber);
    }
  }, [activeView, currentSurahNumber, loadSurah]);

  // Handle Ayah Completion:
  // Plays pleasant chime, shows brief success flash, clears buffer, advances to next Ayah,
  // and STANDS WAITING for the user to recite the first word of the new Ayah!
  const handleAyahComplete = useCallback(() => {
    const activeSurah = surahDataRef.current;
    if (!activeSurah || isTransitioningAyahRef.current) return;

    playCorrectSound();
    isTransitioningAyahRef.current = true;
    setIsAyahCompletedFlash(true);

    const activeAyahIdx = currentAyahIndexRef.current;

    if (activeAyahIdx + 1 < activeSurah.numberOfAyahs) {
      // Advance to next Ayah and stand waiting
      setTimeout(() => {
        const nextIdx = activeAyahIdx + 1;
        setCurrentAyahIndex(nextIdx);
        currentAyahIndexRef.current = nextIdx;

        setRevealedAyahWordCount(0);
        revealedAyahWordCountRef.current = 0;

        clearSession();
        setIsAyahCompletedFlash(false);
        isTransitioningAyahRef.current = false;
      }, 450);
    } else {
      // Completed the entire Surah!
      setTimeout(() => {
        setIsAyahCompletedFlash(false);
        setIsSurahFinished(true);
        playCelebrationSound();
        try {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#c5a059', '#10b981', '#f59e0b'],
          });
        } catch (_) {}
        isTransitioningAyahRef.current = false;
      }, 450);
    }
  }, [playCorrectSound, playCelebrationSound]);

  // Unified Speech Recognition Transcript Handler:
  // Matches words instantly as the user speaks, revealing them word-by-word with zero delay.
  const handleSpeechResult = useCallback(
    (transcriptText: string, isFinal: boolean) => {
      if (isTransitioningAyahRef.current) return;

      const activeSurah = surahDataRef.current;
      if (!activeSurah) return;

      const activeAyahIdx = currentAyahIndexRef.current;
      const currentAyah = activeSurah.ayahs[activeAyahIdx];
      if (!currentAyah) return;

      const currentWordPtr = revealedAyahWordCountRef.current;
      if (currentWordPtr >= currentAyah.words.length) return;

      const matchResult = matchSpeechSequence(
        transcriptText,
        currentAyah.words,
        currentWordPtr
      );

      if (matchResult.matchedWordsCount > 0) {
        const newRevealed = currentWordPtr + matchResult.matchedWordsCount;
        setRevealedAyahWordCount(newRevealed);
        revealedAyahWordCountRef.current = newRevealed;
        playCorrectSound();

        // Check if the Ayah is finished
        if (newRevealed >= currentAyah.words.length) {
          handleAyahComplete();
        }
      }
    },
    [playCorrectSound, handleAyahComplete]
  );

  // Speech Recognition Hook
  const {
    isListening,
    interimTranscript,
    audioLevel,
    startListening,
    stopListening,
    clearSession,
  } = useSpeechRecognition({
    onTranscript: handleSpeechResult,
    lang: 'ar-SA',
  });

  // Toggle Microphone
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Navigation: Select Surah from Index
  const handleSelectSurah = useCallback(
    (surahNumber: number) => {
      setCurrentSurahNumber(surahNumber);
      setCurrentAyahIndex(0);
      currentAyahIndexRef.current = 0;
      setRevealedAyahWordCount(0);
      revealedAyahWordCountRef.current = 0;
      setIsSurahFinished(false);
      setActiveView('recite');

      // Start listening automatically for effortless recitation
      setTimeout(() => {
        startListening();
      }, 300);
    },
    [startListening]
  );

  // Navigation: Back to Surah Index
  const handleBackToIndex = useCallback(() => {
    stopListening();
    setActiveView('index');
  }, [stopListening]);

  // Stepper: Previous Ayah
  const handlePrevAyah = useCallback(() => {
    if (currentAyahIndex <= 0) return;
    const prevIdx = currentAyahIndex - 1;
    setCurrentAyahIndex(prevIdx);
    currentAyahIndexRef.current = prevIdx;
    setRevealedAyahWordCount(0);
    revealedAyahWordCountRef.current = 0;
    clearSession();
  }, [currentAyahIndex, clearSession]);

  // Stepper: Next Ayah (skip)
  const handleNextAyah = useCallback(() => {
    if (!surahData || currentAyahIndex >= surahData.numberOfAyahs - 1) return;
    const nextIdx = currentAyahIndex + 1;
    setCurrentAyahIndex(nextIdx);
    currentAyahIndexRef.current = nextIdx;
    setRevealedAyahWordCount(0);
    revealedAyahWordCountRef.current = 0;
    clearSession();
  }, [surahData, currentAyahIndex, clearSession]);

  // Action: Reset current Ayah
  const handleResetAyah = useCallback(() => {
    setRevealedAyahWordCount(0);
    revealedAyahWordCountRef.current = 0;
    clearSession();
  }, [clearSession]);

  // Action: Hint word
  const handleHintWord = useCallback(() => {
    const activeSurah = surahDataRef.current;
    if (!activeSurah) return;
    const activeAyahIdx = currentAyahIndexRef.current;
    const currentAyah = activeSurah.ayahs[activeAyahIdx];
    if (!currentAyah) return;

    const currentWordPtr = revealedAyahWordCountRef.current;
    if (currentWordPtr < currentAyah.words.length) {
      const newRevealed = currentWordPtr + 1;
      setRevealedAyahWordCount(newRevealed);
      revealedAyahWordCountRef.current = newRevealed;
      playHintSound();

      if (newRevealed >= currentAyah.words.length) {
        handleAyahComplete();
      }
    }
  }, [playHintSound, handleAyahComplete]);

  // Action: Simulate typing word
  const handleSimulateWord = useCallback(
    (text: string) => {
      handleSpeechResult(text, true);
    },
    [handleSpeechResult]
  );

  // Action: Restart Surah
  const handleRestartSurah = useCallback(() => {
    setCurrentAyahIndex(0);
    currentAyahIndexRef.current = 0;
    setRevealedAyahWordCount(0);
    revealedAyahWordCountRef.current = 0;
    setIsSurahFinished(false);
    clearSession();
    startListening();
  }, [clearSession, startListening]);

  // Action: Next Surah
  const handleNextSurah = useCallback(() => {
    if (currentSurahNumber < 114) {
      handleSelectSurah(currentSurahNumber + 1);
    }
  }, [currentSurahNumber, handleSelectSurah]);

  // Toggle Dark Mode
  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Change Font Size
  const handleChangeFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.min(48, Math.max(22, prev + delta)));
  }, []);

  // Render Screen 1: Surah Index
  if (activeView === 'index') {
    return (
      <SurahIndexView
        onSelectSurah={handleSelectSurah}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        lastRecitedSurahNumber={currentSurahNumber}
      />
    );
  }

  // Loading state for Recitation Screen
  if (isLoading || !surahData) {
    return (
      <div className="w-full min-h-screen bg-[#faf9f5] dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-stone-700 dark:text-stone-300 font-arabic">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
        <p className="text-base font-semibold">جاري فتح السورة المباركة...</p>
        <button
          onClick={handleBackToIndex}
          className="mt-6 px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
        >
          العودة لفهرس السور
        </button>
      </div>
    );
  }

  // Render Screen 2: Recitation Screen
  return (
    <RecitationScreen
      surahData={surahData}
      currentAyahIndex={currentAyahIndex}
      revealedAyahWordCount={revealedAyahWordCount}
      isListening={isListening}
      audioLevel={audioLevel}
      interimTranscript={interimTranscript}
      isDarkMode={isDarkMode}
      fontSize={fontSize}
      isAyahCompletedFlash={isAyahCompletedFlash}
      onBackToIndex={handleBackToIndex}
      onToggleListening={handleToggleListening}
      onNextAyah={handleNextAyah}
      onPrevAyah={handlePrevAyah}
      onResetAyah={handleResetAyah}
      onHintWord={handleHintWord}
      onSimulateWord={handleSimulateWord}
      onToggleDarkMode={handleToggleDarkMode}
      onChangeFontSize={handleChangeFontSize}
      onRestartSurah={handleRestartSurah}
      onNextSurah={handleNextSurah}
      hasNextSurah={currentSurahNumber < 114}
      isSurahFinished={isSurahFinished}
    />
  );
}
