/**
 * Removes diacritics from a string (e.g., accents, combining marks).
 *
 * This function normalizes text to NFD (Canonical Decomposition) form and removes
 * all Unicode diacritical marks using the \p{Diacritic} Unicode property.
 *
 * @param str - The input string to process
 * @returns The string with all diacritics removed
 *
 * @example
 * ```ts
 * removeDiacritics('Café') // 'Cafe'
 * removeDiacritics('Pão de queijo') // 'Pao de queijo'
 * removeDiacritics('açúcar') // 'acucar'
 * ```
 *
 * @remarks
 * **Behavior with different scripts:**
 * - Latin: Removes all accents (á→a, é→e, ç→c, etc.)
 * - Greek: Removes tonos and dialytika marks (ά→α)
 * - Japanese: Removes combining marks like long vowel marks (コーヒー→コヒ)
 * - Cyrillic, Chinese, Arabic: Base characters preserved
 * - Emoji and symbols: Generally preserved
 *
 * **Edge cases:**
 * - Empty strings return empty strings
 * - Whitespace and punctuation are preserved
 * - Handles all Unicode normalization forms (NFC, NFD, NFKC, NFKD)
 * - Performance: O(n) where n is string length, optimized for search operations
 *
 * **Use case:**
 * Primary use is for diacritic-insensitive and case-insensitive search in pt-BR contexts.
 * Combine with `.toLowerCase()` for full normalization:
 * ```ts
 * const normalized = removeDiacritics(text).toLowerCase()
 * ```
 */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

