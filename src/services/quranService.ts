import { QuranPageData, QuranAyah, QuranWord, QuranSurahData } from '../types/quran';
import { normalizeArabic, cleanSurahName } from '../utils/arabicMatcher';
import { FALLBACK_PAGES } from '../data/fallbackPages';
import { getJuzForPage, SURAHS_META } from '../data/quranMeta';

const CACHE_PREFIX = 'musammia_page_v4_';
const SURAH_CACHE_PREFIX = 'musammia_surah_v5_';

/**
 * Attaches floating Quranic pause marks (like ۖ ۗ ۘ ۙ ۚ ۛ ۜ ۩ ۞ ۝) directly to the preceding word
 * so they are displayed gracefully with the word without becoming separate empty obstacle words.
 */
function attachFloatingPauseMarks(text: string): string {
  if (!text) return '';
  return text.replace(/\s*([ۖۗۘۙۚۛۜ۩۞۝])\s*/g, '$1 ').trim();
}

/**
 * Strips the prefixed Basmalah from Ayah 1 of any surah (except Al-Fatihah, where it is Ayah 1)
 * because Basmalah is an opening header in the Quran, not part of verse 1 text.
 */
function stripBasmalahFromAyah(text: string): string {
  if (!text) return '';
  const cleanNorm = normalizeArabic(text);
  if (
    cleanNorm.startsWith('بسم الله الرحمن الرحيم') ||
    cleanNorm.startsWith('بسم الله الرحمان الرحيم')
  ) {
    const rawTokens = text.trim().split(/\s+/);
    return rawTokens.slice(4).join(' ').trim();
  }
  return text;
}

/**
 * Fetches and formats Quran page data for any page (1-604).
 * Uses localStorage cache for instant zero-latency loading.
 */
export async function getQuranPage(pageNumber: number): Promise<QuranPageData> {
  const clampedPage = Math.max(1, Math.min(604, Math.floor(pageNumber)));

  // 1. Check in-memory fallback first for instant loads
  if (FALLBACK_PAGES[clampedPage]) {
    // If we have a complete fallback, verify it's ready
    return FALLBACK_PAGES[clampedPage];
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${clampedPage}`);
    if (cached) {
      const parsed = JSON.parse(cached) as QuranPageData;
      if (parsed && parsed.ayahs && parsed.words && parsed.words.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  // 3. Fetch from Al-Quran Cloud API
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${clampedPage}/quran-uthmani`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 200 && data.data && data.data.ayahs) {
      const parsedPage = parseApiResponse(clampedPage, data.data.ayahs);

      // Save to localStorage
      try {
        localStorage.setItem(`${CACHE_PREFIX}${clampedPage}`, JSON.stringify(parsedPage));
      } catch (e) {
        console.warn('LocalStorage quota exceeded or save error:', e);
      }

      return parsedPage;
    }
  } catch (apiError) {
    console.error(`Failed to fetch page ${clampedPage} from Al-Quran API:`, apiError);
  }

  // 4. Try secondary mirror (quran.com API)
  try {
    const secondaryResponse = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${clampedPage}?words=true&word_fields=text_uthmani`
    );
    if (secondaryResponse.ok) {
      const secData = await secondaryResponse.json();
      if (secData && secData.verses) {
        const parsed = parseSecondaryApiResponse(clampedPage, secData.verses);
        try {
          localStorage.setItem(`${CACHE_PREFIX}${clampedPage}`, JSON.stringify(parsed));
        } catch (_) {}
        return parsed;
      }
    }
  } catch (secError) {
    console.error('Secondary API error:', secError);
  }

  // Fallback to page 1 if all fails
  if (FALLBACK_PAGES[1]) {
    return FALLBACK_PAGES[1];
  }

  throw new Error(`تعذر تحميل بيانات الصفحة ${clampedPage}. يرجى التحقق من الاتصال بالإنترنت.`);
}

/**
 * Parses ayahs from Al-Quran Cloud API into our structured page format.
 */
function parseApiResponse(pageNumber: number, apiAyahs: any[]): QuranPageData {
  const ayahs: QuranAyah[] = [];
  const words: QuranWord[] = [];
  const surahsInPageMap = new Map<number, any>();

  apiAyahs.forEach((apiAyah, ayahIdx) => {
    const surahNum = apiAyah.surah.number;
    const ayahInSurah = apiAyah.numberInSurah;
    const isFirstAyah = ayahInSurah === 1;

    if (!surahsInPageMap.has(surahNum)) {
      surahsInPageMap.set(surahNum, {
        number: surahNum,
        name: apiAyah.surah.name,
        englishName: apiAyah.surah.englishName,
        revelationType: apiAyah.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
        startAyahIndex: ayahIdx,
        isFirstAyahOfSurah: isFirstAyah,
      });
    }

    // Clean text split into words
    // Note: In Al-Quran Cloud, if ayah is 1 of a surah (except Fatihah and Tawbah),
    // it starts with Basmalah. We can retain the words.
    let ayahText = (apiAyah.text || '').trim();

    if (surahNum !== 1 && ayahInSurah === 1) {
      ayahText = stripBasmalahFromAyah(ayahText);
    }

    const rawWordTokens = attachFloatingPauseMarks(ayahText).split(/\s+/).filter(Boolean);
    const ayahWords: QuranWord[] = [];
    rawWordTokens.forEach((rawWord: string, wordIdx: number) => {
      const clean = normalizeArabic(rawWord);
      if (!clean) {
        if (ayahWords.length > 0) {
          ayahWords[ayahWords.length - 1].text += ' ' + rawWord;
        }
        return;
      }
      ayahWords.push({
        id: `${apiAyah.number}_${wordIdx}`,
        text: rawWord,
        cleanText: clean,
        ayahInSurah: ayahInSurah,
        ayahInQuran: apiAyah.number,
        surahNumber: surahNum,
      });
    });

    const parsedAyah: QuranAyah = {
      numberInQuran: apiAyah.number,
      numberInSurah: ayahInSurah,
      text: ayahText,
      surah: {
        number: surahNum,
        name: apiAyah.surah.name,
        englishName: apiAyah.surah.englishName,
        revelationType: apiAyah.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
      },
      juz: apiAyah.juz || getJuzForPage(pageNumber),
      page: pageNumber,
      words: ayahWords,
    };

    ayahs.push(parsedAyah);
    words.push(...ayahWords);
  });

  return {
    pageNumber,
    juzNumber: ayahs[0]?.juz || getJuzForPage(pageNumber),
    surahsInPage: Array.from(surahsInPageMap.values()),
    ayahs,
    words,
    totalWords: words.length,
  };
}

/**
 * Parses verses from quran.com API v4 as secondary fallback.
 */
function parseSecondaryApiResponse(pageNumber: number, verses: any[]): QuranPageData {
  const ayahs: QuranAyah[] = [];
  const words: QuranWord[] = [];
  const surahsInPageMap = new Map<number, any>();

  verses.forEach((verse, vIdx) => {
    const [surahNumStr, ayahInSurahStr] = (verse.verse_key || '1:1').split(':');
    const surahNum = parseInt(surahNumStr, 10);
    const ayahInSurah = parseInt(ayahInSurahStr, 10);

    if (!surahsInPageMap.has(surahNum)) {
      surahsInPageMap.set(surahNum, {
        number: surahNum,
        name: `سورة رقم ${surahNum}`,
        englishName: `Surah ${surahNum}`,
        revelationType: 'مكية',
        startAyahIndex: vIdx,
        isFirstAyahOfSurah: ayahInSurah === 1,
      });
    }

    const ayahWords: QuranWord[] = [];
    if (verse.words && Array.isArray(verse.words)) {
      verse.words.forEach((w: any, wIdx: number) => {
        // Skip end marker words in quran.com api
        if (w.char_type_name === 'end') return;
        const txt = w.text_uthmani || w.text || '';
        ayahWords.push({
          id: `${verse.id || vIdx}_${wIdx}`,
          text: txt,
          cleanText: normalizeArabic(txt),
          ayahInSurah,
          ayahInQuran: verse.id || vIdx + 1,
          surahNumber: surahNum,
        });
      });
    }

    const ayah: QuranAyah = {
      numberInQuran: verse.id || vIdx + 1,
      numberInSurah: ayahInSurah,
      text: ayahWords.map((w) => w.text).join(' '),
      surah: {
        number: surahNum,
        name: `سورة ${surahNum}`,
        englishName: `Surah ${surahNum}`,
        revelationType: 'مكية',
      },
      juz: verse.juz_number || getJuzForPage(pageNumber),
      page: pageNumber,
      words: ayahWords,
    };

    ayahs.push(ayah);
    words.push(...ayahWords);
  });

  return {
    pageNumber,
    juzNumber: ayahs[0]?.juz || getJuzForPage(pageNumber),
    surahsInPage: Array.from(surahsInPageMap.values()),
    ayahs,
    words,
    totalWords: words.length,
  };
}

/**
 * Generates an audio URL for an ayah from EveryAyah CDN.
 * Reciter options:
 * - 'Alafasy_128kbps': Sheikh Mishary Rashid Alafasy
 * - 'Husary_128kbps': Sheikh Mahmoud Khalil Al-Husary
 * - 'Minshawi_Murattal_128kbps': Sheikh Mohamed Siddiq El-Minshawi
 */
export function getAyahAudioUrl(
  surahNumber: number,
  ayahNumberInSurah: number,
  reciter = 'Alafasy_128kbps'
): string {
  const sStr = String(surahNumber).padStart(3, '0');
  const aStr = String(ayahNumberInSurah).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${sStr}${aStr}.mp3`;
}

/**
 * Fetches and formats entire Quran Surah data (1-114) for Ayah-by-Ayah focused recitation.
 * Cached in localStorage for instant offline access.
 */
export async function getQuranSurah(surahNumber: number): Promise<QuranSurahData> {
  const clampedSurah = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  const cacheKey = `${SURAH_CACHE_PREFIX}${clampedSurah}`;

  // 1. Check local storage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as QuranSurahData;
      if (
        parsed &&
        parsed.ayahs &&
        parsed.ayahs.length > 0 &&
        parsed.ayahs.every((a) => a.words && a.words.every((w) => Boolean(w.cleanText)))
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  // 2. Fetch from Al-Quran Cloud API
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${clampedSurah}/quran-uthmani`);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data && data.data.ayahs) {
        const rawSurah = data.data;
        const ayahs: QuranAyah[] = [];
        const words: QuranWord[] = [];

        rawSurah.ayahs.forEach((apiAyah: any) => {
          let text = (apiAyah.text || '').trim();
          // Remove prefix Basmalah if ayah 1 and not Fatihah and not Tawbah
          if (clampedSurah !== 1 && apiAyah.numberInSurah === 1) {
            text = stripBasmalahFromAyah(text);
          }

          const rawWords = attachFloatingPauseMarks(text).split(/\s+/).filter(Boolean);
          const ayahWords: QuranWord[] = [];
          rawWords.forEach((rw: string, wIdx: number) => {
            const clean = normalizeArabic(rw);
            if (!clean) {
              if (ayahWords.length > 0) {
                ayahWords[ayahWords.length - 1].text += ' ' + rw;
              }
              return;
            }
            ayahWords.push({
              id: `${apiAyah.number}_${wIdx}`,
              text: rw,
              cleanText: clean,
              ayahInSurah: apiAyah.numberInSurah,
              ayahInQuran: apiAyah.number,
              surahNumber: clampedSurah,
            });
          });

          const ayah: QuranAyah = {
            numberInQuran: apiAyah.number,
            numberInSurah: apiAyah.numberInSurah,
            text,
            surah: {
              number: clampedSurah,
              name: rawSurah.name,
              englishName: rawSurah.englishName,
              revelationType: rawSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
            },
            juz: apiAyah.juz,
            page: apiAyah.page,
            words: ayahWords,
          };

          ayahs.push(ayah);
          words.push(...ayahWords);
        });

        const surahData: QuranSurahData = {
          number: clampedSurah,
          name: cleanSurahName(rawSurah.name),
          englishName: rawSurah.englishName,
          revelationType: rawSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
          numberOfAyahs: ayahs.length,
          ayahs,
          words,
          totalWords: words.length,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(surahData));
        } catch (_) {}

        return surahData;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch Surah ${clampedSurah}:`, err);
  }

  // 3. Fallback to secondary mirror (quran.com API v4)
  try {
    const quranComRes = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${clampedSurah}?words=true&per_page=300&word_fields=text_uthmani`
    );
    if (quranComRes.ok) {
      const qcData = await quranComRes.json();
      if (qcData && qcData.verses) {
        const meta = SURAHS_META.find((s) => s.number === clampedSurah);
        const ayahs: QuranAyah[] = [];
        const words: QuranWord[] = [];

        qcData.verses.forEach((v: any, vIdx: number) => {
          const ayahInSurah = vIdx + 1;
          const ayahWords: QuranWord[] = [];
          if (v.words && Array.isArray(v.words)) {
            v.words.forEach((w: any, wIdx: number) => {
              if (w.char_type_name === 'end') return;
              const txt = w.text_uthmani || w.text || '';
              const clean = normalizeArabic(txt);
              if (!clean) {
                if (ayahWords.length > 0) {
                  ayahWords[ayahWords.length - 1].text += ' ' + txt;
                }
                return;
              }
              ayahWords.push({
                id: `${v.id || vIdx}_${wIdx}`,
                text: txt,
                cleanText: clean,
                ayahInSurah,
                ayahInQuran: v.id || vIdx + 1,
                surahNumber: clampedSurah,
              });
            });
          }

          const ayah: QuranAyah = {
            numberInQuran: v.id || vIdx + 1,
            numberInSurah: ayahInSurah,
            text: ayahWords.map((w) => w.text).join(' '),
            surah: {
              number: clampedSurah,
              name: meta?.name || `سورة ${clampedSurah}`,
              englishName: meta?.englishName || `Surah ${clampedSurah}`,
              revelationType: meta?.revelationType || 'مكية',
            },
            juz: v.juz_number || 1,
            page: v.page_number || 1,
            words: ayahWords,
          };

          ayahs.push(ayah);
          words.push(...ayahWords);
        });

        const surahData: QuranSurahData = {
          number: clampedSurah,
          name: cleanSurahName(meta?.name || String(clampedSurah)),
          englishName: meta?.englishName || `Surah ${clampedSurah}`,
          revelationType: meta?.revelationType || 'مكية',
          numberOfAyahs: ayahs.length,
          ayahs,
          words,
          totalWords: words.length,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(surahData));
        } catch (_) {}

        return surahData;
      }
    }
  } catch (secErr) {
    console.error('Secondary API error for Surah:', secErr);
  }

  // 4. Bundled Fallbacks for key Surahs
  if (clampedSurah === 1 && FALLBACK_PAGES[1]) {
    const fatihahWords = FALLBACK_PAGES[1].words;
    return {
      number: 1,
      name: 'الفَاتِحَة',
      englishName: 'Al-Fatihah',
      revelationType: 'مكية',
      numberOfAyahs: 7,
      ayahs: FALLBACK_PAGES[1].ayahs,
      words: fatihahWords,
      totalWords: fatihahWords.length,
    };
  }

  if ((clampedSurah === 112 || clampedSurah === 113 || clampedSurah === 114) && FALLBACK_PAGES[604]) {
    const meta = SURAHS_META.find((s) => s.number === clampedSurah);
    const surahAyahs = FALLBACK_PAGES[604].ayahs.filter((a) => a.surah.number === clampedSurah);
    const surahWords = surahAyahs.flatMap((a) => a.words);
    return {
      number: clampedSurah,
      name: meta?.name || 'سورة',
      englishName: meta?.englishName || 'Surah',
      revelationType: 'مكية',
      numberOfAyahs: surahAyahs.length,
      ayahs: surahAyahs,
      words: surahWords,
      totalWords: surahWords.length,
    };
  }

  throw new Error(`تعذر تحميل بيانات سورة رقم ${clampedSurah}. يرجى التحقق من الاتصال بالإنترنت.`);
}

