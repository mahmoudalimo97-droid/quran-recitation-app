import { QuranSurahData, QuranAyah, QuranWord } from '../types/quran';
import { normalizeArabic, cleanSurahName } from '../utils/arabicMatcher';
import { SURAHS_META } from '../data/quranMeta';
import bundledSurahsRaw from '../data/quranSurahs.json';

interface RawBundledSurah {
  number: number;
  name: string;
  fullName: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
  ayahs: Array<{
    numberInSurah: number;
    text: string;
  }>;
}

const bundledSurahs: RawBundledSurah[] = bundledSurahsRaw as RawBundledSurah[];

/**
 * Attaches floating Quranic pause marks directly to preceding word
 */
function attachFloatingPauseMarks(text: string): string {
  if (!text) return '';
  return text.replace(/\s*([ۖۗۘۙۚۛۜ۩۞۝])\s*/g, '$1 ').trim();
}

/**
 * Synchronously or asynchronously gets Quran Surah data purely from bundled local JSON.
 * ZERO network requests, works 100% offline in airplane mode.
 */
export async function getQuranSurah(surahNumber: number): Promise<QuranSurahData> {
  const clampedSurah = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  const meta = SURAHS_META.find((s) => s.number === clampedSurah);
  const foundSurah = bundledSurahs.find((s) => s.number === clampedSurah);

  const name = cleanSurahName(meta?.name || foundSurah?.name || String(clampedSurah));
  const englishName = meta?.englishName || foundSurah?.englishName || `Surah ${clampedSurah}`;
  const revelationType = meta?.revelationType === 'مدنية' ? 'مدنية' : 'مكية';
  const numberOfAyahs = foundSurah?.ayahCount || meta?.ayahCount || 7;

  const rawAyahs =
    foundSurah?.ayahs && foundSurah.ayahs.length > 0
      ? foundSurah.ayahs
      : Array.from({ length: numberOfAyahs }, (_, i) => ({
          numberInSurah: i + 1,
          text: '',
        }));

  const ayahs: QuranAyah[] = [];
  const allWords: QuranWord[] = [];

  rawAyahs.forEach((item, idx) => {
    const ayahInSurah = item.numberInSurah || idx + 1;
    const text = item.text || '';
    const wordTokens = attachFloatingPauseMarks(text).split(/\s+/).filter(Boolean);
    const ayahWords: QuranWord[] = [];

    wordTokens.forEach((token, wIdx) => {
      const clean = normalizeArabic(token);
      ayahWords.push({
        id: `${clampedSurah}_${ayahInSurah}_${wIdx}`,
        text: token,
        cleanText: clean || token,
        ayahInSurah,
        ayahInQuran: ayahInSurah,
        surahNumber: clampedSurah,
      });
    });

    const parsedAyah: QuranAyah = {
      numberInQuran: ayahInSurah,
      numberInSurah: ayahInSurah,
      text,
      surah: {
        number: clampedSurah,
        name,
        englishName,
        revelationType,
      },
      juz: meta?.juz || 1,
      page: meta?.startPage || 1,
      words: ayahWords,
    };

    ayahs.push(parsedAyah);
    allWords.push(...ayahWords);
  });

  return {
    number: clampedSurah,
    name,
    englishName,
    revelationType,
    numberOfAyahs: ayahs.length,
    ayahs,
    words: allWords,
    totalWords: allWords.length,
  };
}

/**
 * Dummy audio URL provider (sound playback is disabled)
 */
export function getAyahAudioUrl(
  _surahNumber: number,
  _ayahNumberInSurah: number,
  _reciter = 'Alafasy_128kbps'
): string {
  return '';
}
