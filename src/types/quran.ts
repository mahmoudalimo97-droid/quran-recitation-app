export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  startPage: number;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan' | 'مكية' | 'مدنية';
  juz: number;
}

export interface JuzMeta {
  number: number;
  startPage: number;
  startSurah: string;
  startAyah: number;
  name: string;
}

export interface QuranWord {
  id: string; // e.g. "ayah1_word3"
  text: string; // Original Uthmani text with tashkeel
  cleanText: string; // Normalized text without tashkeel
  ayahInSurah: number;
  ayahInQuran: number;
  surahNumber: number;
  isEndMarker?: boolean;
}

export interface QuranAyah {
  numberInQuran: number;
  numberInSurah: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
  };
  juz: number;
  page: number;
  words: QuranWord[];
}

export interface QuranPageData {
  pageNumber: number;
  juzNumber: number;
  surahsInPage: Array<{
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    startAyahIndex: number;
    isFirstAyahOfSurah: boolean;
  }>;
  ayahs: QuranAyah[];
  words: QuranWord[];
  totalWords: number;
}

export interface QuranSurahData {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: QuranAyah[];
  words: QuranWord[];
  totalWords: number;
}

export type ViewMode = 'blank' | 'ghost' | 'full';

export type RecitationDisplayMode = 'ayah_focus' | 'mushaf_page';

export interface RecitationStats {
  correctWords: number;
  mistakesCount: number;
  hintsCount: number;
  timeSpentSeconds: number;
  accuracyPercentage: number;
  date: string;
  pageNumber?: number;
  surahNumber?: number;
  surahNames: string[];
}

export interface FeedbackState {
  type: 'idle' | 'correct' | 'wrong' | 'hint' | 'skipped';
  spokenWord?: string;
  expectedWord?: string;
  message?: string;
  timestamp: number;
}
