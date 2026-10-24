/**
 * Utility functions for Arabic text normalization, phonetic tolerance,
 * and fuzzy Levenshtein comparison for Quranic recitation.
 */

// Arabic Diacritics and Quranic marks regex (without dagger alif \u0670 which is converted to Alef)
const TASHKEEL_REGEX = /[\u064B-\u065F\u06D6-\u06ED\u0617-\u061A\u0653\u0654\u0655]/g;
const TATWEEL_REGEX = /\u0640/g;
const PUNCTUATION_REGEX = /[،؛؟.,\/#!$%\^&\*;:{}=\-_`~()'"\[\]<>«»۝۩۞ۖۗۘۙۚۛۜ]/g;

/**
 * Normalizes an Arabic string for fair comparison against speech recognition output:
 * - Converts dagger alif (\u0670) to Alef (ا) so words like ٱلصِّرَٰطَ -> الصراط, مَٰلِكِ -> مالك
 * - Converts Quranic small high letters (\u06E7 -> ي, \u06E5 -> و)
 * - Strips all diacritics / tashkeel and Quranic pause marks
 * - Unifies Alef forms: أ, إ, آ, ٱ -> ا
 * - Unifies Taa Marbuta & Haa: ة -> ه
 * - Unifies Alef Maqsura & Yaa: ى -> ي
 * - Unifies Hamzas: ؤ -> و, ئ -> ي
 * - Normalizes classic Quranic spellings: الصلوة -> الصلاة -> الصله
 * - Removes tatweel (kashida)
 * - Collapses repeated elongated vowels (e.g. الضاليننن -> الضالين)
 * - Removes punctuation and excess whitespace
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text
    // In Alef Maqsura (e.g. على, إلى, حتى, بلى, هدى), dagger alif indicates the 'ى' sounds like alif, not yaa+alif!
    .replace(/[ىي]\u0670/g, 'ي')
    // Replace standalone dagger alif with Alef (crucial for Uthmani script matching like الصراط, مالك!)
    .replace(/\u0670/g, 'ا')
    // Replace small high yaa and waw
    .replace(/\u06E7/g, 'ي')
    .replace(/\u06E5/g, 'و')
    // Remove diacritics
    .replace(TASHKEEL_REGEX, '')
    // Remove tatweel
    .replace(TATWEEL_REGEX, '')
    // Remove punctuation
    .replace(PUNCTUATION_REGEX, ' ');

  // Handle common Quranic script variations & archaic spellings
  normalized = normalized
    .replace(/صلَوٰة|صلوة/g, 'صلاة')
    .replace(/زكَوٰة|زكوة/g, 'زكاة')
    .replace(/حيَوٰة|حيوة/g, 'حياة')
    .replace(/ربَوٰا|ربوا/g, 'ربا')
    .replace(/يَـٰأَيُّهَا|يـٰأيها|يأيها/g, 'يا ايها')
    .replace(/هَـٰذَا|هـٰذا/g, 'هذا')
    .replace(/هَـٰؤُلَاءِ|هـٰؤلاء/g, 'هؤلاء')
    .replace(/ٱلرَّحْمَـٰنِ|الرحمـن|الرحمٰن|الرحمان/g, 'الرحمن')
    .replace(/إِلَـٰهَ|الـٰه/g, 'اله')
    .replace(/إِبْرَٰهِـۧمَ|ابراهيم/g, 'ابراهيم')
    .replace(/إِسْمَـٰعِيلَ|اسماعيل|اسمعيل/g, 'اسماعيل')
    .replace(/اسحٰق|اسحق/g, 'اسحاق')
    .replace(/السمٰوٰت|السموت/g, 'السماوات');

  // Normalize Alef variants: [إأآٱ] -> ا
  normalized = normalized.replace(/[إأآٱ]/g, 'ا');

  // Normalize Taa Marbuta and Haa: ة -> ه
  normalized = normalized.replace(/ة/g, 'ه');

  // Normalize Alef Maqsura: ى -> ي
  normalized = normalized.replace(/ى/g, 'ي');

  // Normalize Hamza carriers
  normalized = normalized.replace(/ؤ/g, 'و');
  normalized = normalized.replace(/ئ/g, 'ي');
  normalized = normalized.replace(/ء/g, '');

  // Remove non-Arabic letters
  normalized = normalized.replace(/[^\u0621-\u064A0-9\s]/g, '');

  // Unify common words after tashkeel removal
  normalized = normalized
    .replace(/الرحمان/g, 'الرحمن')
    .replace(/السموت/g, 'السماوات')
    .replace(/اسمعيل/g, 'اسماعيل')
    .replace(/اسحق/g, 'اسحاق')
    .replace(/ابرهيم/g, 'ابراهيم')
    .replace(/هاذا/g, 'هذا')
    .replace(/هاذه/g, 'هذه')
    .replace(/هاؤلاء/g, 'هؤلاء')
    .replace(/ذالك/g, 'ذلك')
    .replace(/ذالكم/g, 'ذلكم')
    .replace(/كذالك/g, 'كذلك')
    .replace(/اولايك/g, 'اولئك')
    .replace(/لاكن/g, 'لكن');

  // Collapse repeated vowels/consonants from tajweed madd elongation (e.g. الضاليننن أو الضااالين -> الضالين)
  normalized = normalized.replace(/([اوي])\1+/g, '$1').replace(/(.)\1{2,}/g, '$1');

  // Collapse multiple spaces and trim
  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates standard Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const current = Math.min(
        d[j] + 1, // deletion
        prev + 1, // insertion
        d[j - 1] + cost // substitution
      );
      d[j - 1] = prev;
      prev = current;
    }
    d[n] = prev;
  }

  return d[n];
}

/**
 * Checks whether a spoken word matches an expected Quranic word with tolerance:
 * 1. Exact normalized match
 * 2. Critical Quranic phonetic equivalences (e.g., لله vs الله, باسم vs بسم, مالك vs ملك)
 * 3. Prefix tolerance (handling Arabic 'waw' / 'fa' / 'al-' attached or separated)
 * 4. Levenshtein edit distance tolerance for speech recognition phonetics
 */
export function isWordMatch(
  spoken: string,
  expected: string
): { matched: boolean; score: number; distance: number } {
  const cleanSpoken = normalizeArabic(spoken);
  const cleanExpected = normalizeArabic(expected);

  if (!cleanSpoken || !cleanExpected) {
    return { matched: false, score: 0, distance: 99 };
  }

  // 1. Exact match
  if (cleanSpoken === cleanExpected) {
    return { matched: true, score: 1.0, distance: 0 };
  }

  // 2. Critical Quranic phonetics & STT dialectal equivalences
  // In Al-Fatihah and Quran, STT frequently outputs "الله" for "لله", "باسم" for "بسم", "مالك" for "ملك"
  if (
    (cleanExpected === 'لله' && (cleanSpoken === 'الله' || cleanSpoken === 'لله')) ||
    (cleanExpected === 'الله' && (cleanSpoken === 'لله' || cleanSpoken === 'الله')) ||
    (cleanExpected === 'بسم' && (cleanSpoken === 'باسم' || cleanSpoken === 'بسم')) ||
    (cleanExpected === 'باسم' && (cleanSpoken === 'بسم' || cleanSpoken === 'باسم')) ||
    (cleanExpected === 'الرحمن' && (cleanSpoken === 'الرحمان' || cleanSpoken === 'الرحمن')) ||
    (cleanExpected === 'ملك' && cleanSpoken === 'مالك') ||
    (cleanExpected === 'مالك' && cleanSpoken === 'ملك') ||
    (cleanExpected === 'الصراط' && (cleanSpoken === 'سراط' || cleanSpoken === 'صراط' || cleanSpoken === 'السراط')) ||
    (cleanExpected === 'صراط' && (cleanSpoken === 'سراط' || cleanSpoken === 'الصراط' || cleanSpoken === 'السراط')) ||
    (cleanExpected === 'المستقيم' && (cleanSpoken === 'مستقيم' || cleanSpoken === 'المستقيم')) ||
    (cleanExpected === 'العالمين' && (cleanSpoken === 'عالمين' || cleanSpoken === 'العالمين')) ||
    (cleanExpected === 'القران' && (cleanSpoken === 'القرءان' || cleanSpoken === 'القران')) ||
    (cleanExpected === 'الم' && (cleanSpoken === 'الف لام ميم' || cleanSpoken === 'الف لام' || cleanSpoken === 'الم')) ||
    (cleanExpected === 'الر' && (cleanSpoken === 'الف لام را' || cleanSpoken === 'الف لام ر' || cleanSpoken === 'الر')) ||
    (cleanExpected === 'المر' && (cleanSpoken === 'الف لام ميم را' || cleanSpoken === 'المر')) ||
    (cleanExpected === 'المص' && (cleanSpoken === 'الف لام ميم صاد' || cleanSpoken === 'المص')) ||
    (cleanExpected === 'طسم' && (cleanSpoken === 'طا سين ميم' || cleanSpoken === 'طسم')) ||
    (cleanExpected === 'طس' && (cleanSpoken === 'طا سين' || cleanSpoken === 'طس')) ||
    (cleanExpected === 'يس' && (cleanSpoken === 'يا سين' || cleanSpoken === 'ياسين' || cleanSpoken === 'يس')) ||
    (cleanExpected === 'طه' && (cleanSpoken === 'طا ها' || cleanSpoken === 'طاها' || cleanSpoken === 'طه')) ||
    (cleanExpected === 'حم' && (cleanSpoken === 'حا ميم' || cleanSpoken === 'حم')) ||
    (cleanExpected === 'عسق' && (cleanSpoken === 'عين سين قاف' || cleanSpoken === 'عسق')) ||
    (cleanExpected === 'كهيعص' && (cleanSpoken === 'كاف ها يا عين صاد' || cleanSpoken === 'كهيعص')) ||
    (cleanExpected === 'ق' && (cleanSpoken === 'قاف' || cleanSpoken === 'ق')) ||
    (cleanExpected === 'ن' && (cleanSpoken === 'نون' || cleanSpoken === 'ن')) ||
    (cleanExpected === 'ص' && (cleanSpoken === 'صاد' || cleanSpoken === 'ص'))
  ) {
    return { matched: true, score: 1.0, distance: 0 };
  }

  // 3. Dropped Hamzat Al-Wasl in continuous speech (e.g. بالغيب vs بلغيب, واستغفر vs وستغفر, بالحق vs بلحق)
  if (
    (cleanExpected.startsWith('بال') && cleanSpoken === cleanExpected.replace(/^بال/, 'بل')) ||
    (cleanSpoken.startsWith('بال') && cleanExpected === cleanSpoken.replace(/^بال/, 'بل')) ||
    (cleanExpected.startsWith('وال') && cleanSpoken === cleanExpected.replace(/^وال/, 'ول')) ||
    (cleanSpoken.startsWith('وال') && cleanExpected === cleanSpoken.replace(/^وال/, 'ول')) ||
    (cleanExpected.startsWith('فال') && cleanSpoken === cleanExpected.replace(/^فال/, 'فل')) ||
    (cleanSpoken.startsWith('فال') && cleanExpected === cleanSpoken.replace(/^فال/, 'فل')) ||
    (cleanExpected.startsWith('وا') && cleanSpoken === cleanExpected.replace(/^وا/, 'و')) ||
    (cleanExpected.startsWith('فا') && cleanSpoken === cleanExpected.replace(/^فا/, 'ف'))
  ) {
    return { matched: true, score: 0.95, distance: 1 };
  }

  // 4. Prefix tolerance (handling Arabic 'waw' / 'fa' / 'ba' / 'al-' attached or separated)
  if (
    cleanSpoken === 'و' + cleanExpected ||
    cleanSpoken === 'ف' + cleanExpected ||
    cleanSpoken === 'ب' + cleanExpected ||
    cleanSpoken === 'ل' + cleanExpected ||
    'و' + cleanSpoken === cleanExpected ||
    'ف' + cleanSpoken === cleanExpected ||
    'ب' + cleanSpoken === cleanExpected ||
    'ل' + cleanSpoken === cleanExpected ||
    cleanSpoken === 'ال' + cleanExpected ||
    'ال' + cleanSpoken === cleanExpected
  ) {
    return { matched: true, score: 0.95, distance: 1 };
  }

  // 5. Tanween phonetic tolerance (STT often writes noon or alif for tanween: e.g. عذابن vs عذاب, كفوا vs كفو, احدا vs احد)
  if (
    (cleanSpoken.endsWith('ن') && cleanSpoken.slice(0, -1) === cleanExpected) ||
    (cleanExpected.endsWith('ن') && cleanExpected.slice(0, -1) === cleanSpoken) ||
    (cleanSpoken.endsWith('ا') && cleanSpoken.slice(0, -1) === cleanExpected) ||
    (cleanExpected.endsWith('ا') && cleanExpected.slice(0, -1) === cleanSpoken)
  ) {
    return { matched: true, score: 0.95, distance: 1 };
  }

  // 4. Calculate Levenshtein distance
  const distance = levenshteinDistance(cleanSpoken, cleanExpected);
  const maxLen = Math.max(cleanSpoken.length, cleanExpected.length);
  const similarity = 1 - distance / maxLen;

  let matched = false;
  if (cleanExpected.length <= 3) {
    // 3 letter words: allow distance 1 if similarity >= 0.60
    matched = distance <= 1;
  } else if (cleanExpected.length <= 6) {
    // 4-6 letter words: allow distance 1 or 2
    matched = distance <= 1 || (distance <= 2 && similarity >= 0.65);
  } else {
    // 7+ letter words: allow distance <= 2
    matched = distance <= 2 || similarity >= 0.65;
  }

  return { matched, score: similarity, distance };
}

/**
 * Splits a spoken transcript into words and tries to match a sequence of Quran words
 * starting from currentIndex.
 *
 * Designed for continuous streaming recitation:
 * - Scans transcript tokens to locate where the expected currentWord appears
 * - Matches continuous forward word chains smoothly
 * - Tolerates speech recognition history and noise
 */
export function matchSpeechSequence(
  transcript: string,
  allWords: Array<{ id: string; cleanText: string; text: string }>,
  currentIndex: number
): {
  matchedWordsCount: number;
  lastSpokenToken?: string;
  isError: boolean;
  isRepeat: boolean;
  recognizedTokens: string[];
} {
  const normalizedTranscript = normalizeArabic(transcript);
  if (!normalizedTranscript.trim()) {
    return { matchedWordsCount: 0, isError: false, isRepeat: false, recognizedTokens: [] };
  }

  const tokens = normalizedTranscript.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || currentIndex >= allWords.length) {
    return { matchedWordsCount: 0, isError: false, isRepeat: false, recognizedTokens: [] };
  }

  const targetWord = allWords[currentIndex];

  // 1. Determine starting scan token index
  // If currentIndex > 0, find where the previous word appeared in tokens,
  // so we scan AFTER it to avoid matching earlier occurrences of repeated words (e.g. عليهم, ما, الله)
  let startScanTokenIdx = 0;
  if (currentIndex > 0) {
    const prevWord = allWords[currentIndex - 1];
    for (let p = tokens.length - 1; p >= 0; p--) {
      if (isWordMatch(tokens[p], prevWord.cleanText).matched) {
        startScanTokenIdx = p + 1;
        break;
      }
    }
    if (startScanTokenIdx >= tokens.length) {
      startScanTokenIdx = 0;
    }
  }

  let bestTokenIndex = -1;
  for (let i = startScanTokenIdx; i < tokens.length; i++) {
    const match = isWordMatch(tokens[i], targetWord.cleanText);
    if (match.matched) {
      bestTokenIndex = i;
      break;
    }
    // Also check if two adjacent tokens form the word (e.g. "يا" + "ايها")
    if (i + 1 < tokens.length) {
      const combined = tokens[i] + tokens[i + 1];
      if (isWordMatch(combined, targetWord.cleanText).matched) {
        bestTokenIndex = i;
        break;
      }
    }
  }

  // Fallback: if not found after previous word, scan from index 0
  if (bestTokenIndex === -1 && startScanTokenIdx > 0) {
    for (let i = 0; i < startScanTokenIdx; i++) {
      const match = isWordMatch(tokens[i], targetWord.cleanText);
      if (match.matched) {
        bestTokenIndex = i;
        break;
      }
    }
  }

  // 2. If targetWord was found at bestTokenIndex, match forward as many words as possible!
  if (bestTokenIndex !== -1) {
    let matchedCount = 0;
    let wordPtr = currentIndex;
    let tokenPtr = bestTokenIndex;

    while (tokenPtr < tokens.length && wordPtr < allWords.length) {
      const token = tokens[tokenPtr];
      const expected = allWords[wordPtr];

      const matchRes = isWordMatch(token, expected.cleanText);
      if (matchRes.matched) {
        matchedCount++;
        wordPtr++;
        tokenPtr++;
        continue;
      }

      // Check if two tokens combine to match expected
      if (tokenPtr + 1 < tokens.length) {
        const combined = token + tokens[tokenPtr + 1];
        if (isWordMatch(combined, expected.cleanText).matched) {
          matchedCount++;
          wordPtr++;
          tokenPtr += 2;
          continue;
        }
      }

      // Check if expected matches next token (1 noise token skipped)
      if (tokenPtr + 1 < tokens.length && isWordMatch(tokens[tokenPtr + 1], expected.cleanText).matched) {
        matchedCount++;
        wordPtr++;
        tokenPtr += 2;
        continue;
      }

      break;
    }

    if (matchedCount > 0) {
      return {
        matchedWordsCount: matchedCount,
        lastSpokenToken: tokens[Math.min(tokens.length - 1, bestTokenIndex + matchedCount - 1)],
        isError: false,
        isRepeat: false,
        recognizedTokens: tokens,
      };
    }
  }

  // 3. If not matched, check if user is repeating recent previous words (don't penalize)
  if (currentIndex > 0) {
    for (let back = 1; back <= Math.min(5, currentIndex); back++) {
      const prevWord = allWords[currentIndex - back];
      for (const t of tokens) {
        if (isWordMatch(t, prevWord.cleanText).matched) {
          return {
            matchedWordsCount: 0,
            lastSpokenToken: t,
            isError: false,
            isRepeat: true,
            recognizedTokens: tokens,
          };
        }
      }
    }
  }

  // 4. If tokens were spoken, and none matched the target, flag error on the last token
  const lastToken = tokens[tokens.length - 1];
  return {
    matchedWordsCount: 0,
    lastSpokenToken: lastToken,
    isError: true,
    isRepeat: false,
    recognizedTokens: tokens,
  };
}

/**
 * Strips any leading "سورة" / "سُورَةُ" with or without diacritics/tashkeel,
 * ensuring no duplicate "سورة سورة" ever occurs.
 */
export function cleanSurahName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^([\u0617-\u061A\u064B-\u065F]*[س][\u0617-\u061A\u064B-\u065F]*[و][\u0617-\u061A\u064B-\u065F]*[ر][\u0617-\u061A\u064B-\u065F]*[ةه][\u0617-\u061A\u064B-\u065F]*\s*)+/, '')
    .trim();
}

/**
 * Formats any Surah name to always have exactly ONE "سورة" prefix:
 * e.g. "سُورَةُ البَقَرَةِ" -> "سورة البَقَرَةِ"
 * e.g. "البَقَرَة" -> "سورة البَقَرَة"
 * e.g. "سورة سورة البقرة" -> "سورة البقرة"
 */
export function formatSurahTitle(name: string): string {
  const clean = cleanSurahName(name);
  return clean ? `سورة ${clean}` : name;
}

