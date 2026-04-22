// utils/arabicTextUtils.ts

/**
 * Arabic Text Normalization Utility
 * 
 * Handles Arabic character variations for search and comparison:
 * - أ/إ/آ → ا (Normalize alef variations)
 * - ة → ه (Normalize ta marbuta)
 * - ى → ي (Normalize alef maksura)
 * - Remove diacritics (تَشْكِيل)
 * - Normalize whitespace
 */

/**
 * Normalizes Arabic text by converting character variations to their base forms
 * and removing diacritics for consistent search and comparison
 */
export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  
  return text
    // Normalize alef variations (أ, إ, آ) to ا
    .replace(/[أإآ]/g, 'ا')
    // Normalize ta marbuta (ة) to ه
    .replace(/ة/g, 'ه')
    // Normalize alef maksura (ى) to ي
    .replace(/ى/g, 'ي')
    // Remove diacritics (Fatha, Damma, Kasra, Sukun, Shadda, etc.)
    .replace(/[\u064B-\u065F]/g, '')
    // Remove additional Arabic diacritics
    .replace(/[\u0670]/g, '')
    // Normalize Persian/Urdu characters
    .replace(/گ/g, 'ك')  // گ → ك
    .replace(/چ/g, 'ج')  // چ → ج
    .replace(/پ/g, 'ب')  // پ → ب
    .replace(/ژ/g, 'ز')  // ژ → ز
    // Normalize Yeh variants
    .replace(/ئ/g, 'ي')  // ئ → ي
    .replace(/ى/g, 'ي')  // ى → ي (alef maksura)
    // Normalize Heh variants
    .replace(/ۀ/g, 'ه')  // ۀ → ه
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * Compares two strings with Arabic normalization
 * Returns true if the normalized search term is found in the normalized text
 */
export const matchesArabicSearch = (text: string, searchTerm: string): boolean => {
  if (!text || !searchTerm) return false;
  
  const normalizedText = normalizeArabic(text);
  const normalizedSearch = normalizeArabic(searchTerm);
  
  return normalizedText.includes(normalizedSearch);
};

/**
 * Advanced search function that supports multiple fields
 * Returns true if the search term matches any of the provided fields
 */
export const matchesArabicSearchMulti = (
  searchTerm: string,
  fields: (string | undefined | null)[]
): boolean => {
  if (!searchTerm || fields.length === 0) return false;
  
  const normalizedSearch = normalizeArabic(searchTerm);
  
  return fields.some(field => {
    if (!field) return false;
    return normalizeArabic(field).includes(normalizedSearch);
  });
};

/**
 * Highlights matched text in a string
 * Returns the text with matched portions wrapped in <mark> tags
 */
export const highlightMatch = (text: string, searchTerm: string): string => {
  if (!text || !searchTerm) return text;
  
  const normalizedText = normalizeArabic(text);
  const normalizedSearch = normalizeArabic(searchTerm);
  
  if (!normalizedText.includes(normalizedSearch)) return text;
  
  const startIndex = normalizedText.indexOf(normalizedSearch);
  const endIndex = startIndex + normalizedSearch.length;
  
  return (
    text.substring(0, startIndex) +
    '<mark>' + text.substring(startIndex, endIndex) + '</mark>' +
    text.substring(endIndex)
  );
};

/**
 * Removes Arabic diacritics (Tashkeel) from text
 * More focused than normalizeArabic, only removes marks
 */
export const removeDiacritics = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/[\u064B-\u065F]/g, '') // Fatha, Damma, Kasra, etc.
    .replace(/[\u0670]/g, '')         // Superscript alef
    .replace(/[ًٌٍَُِّْ]/g, '');       // Common diacritics
};

/**
 * Checks if text contains Arabic characters
 */
export const containsArabic = (text: string): boolean => {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Detects if text is primarily Arabic (>50% Arabic characters)
 */
export const isPrimarilyArabic = (text: string): boolean => {
  if (!text) return false;
  
  const arabicChars = text.match(/[\u0600-\u06FF]/g);
  if (!arabicChars) return false;
  
  return arabicChars.length / text.length > 0.5;
};

/**
 * Sorts an array of strings with Arabic support
 * Arabic text is sorted after normalization for consistent ordering
 */
export const sortArabicStrings = (
  strings: string[],
  order: 'asc' | 'desc' = 'asc'
): string[] => {
  return [...strings].sort((a, b) => {
    const normA = normalizeArabic(a);
    const normB = normalizeArabic(b);
    
    const comparison = normA.localeCompare(normB, 'ar');
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Debounce function for search input optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default {
  normalizeArabic,
  matchesArabicSearch,
  matchesArabicSearchMulti,
  highlightMatch,
  removeDiacritics,
  containsArabic,
  isPrimarilyArabic,
  sortArabicStrings,
  debounce
};
