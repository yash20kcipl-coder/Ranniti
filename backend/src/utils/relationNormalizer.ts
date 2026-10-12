/**
 * Standard Relation Types accepted across Ranniti Voter Directory & Forms
 */
export type StandardRelation = 'Father' | 'Husband' | 'Mother' | 'Other';

/**
 * Normalizes relation strings from multiple languages (English, Gujarati, Hindi, Marathi, etc.)
 * or regional electoral roll formats into canonical system values ('Father', 'Husband', 'Mother', 'Other').
 *
 * @param raw - Raw relation string from import row or API request
 * @param fallback - Default relation if raw value is empty/null (defaults to null)
 */
export const normalizeRelation = (
  raw: any,
  fallback: StandardRelation | null = null
): StandardRelation | null => {
  if (raw === undefined || raw === null) return fallback;
  const str = String(raw).trim();
  if (!str) return fallback;

  const lower = str.toLowerCase();

  // 1. English Standard and Variations
  if (/^f(ather)?('s)?$/i.test(lower) || lower.includes('father')) return 'Father';
  if (/^h(usband)?('s)?$/i.test(lower) || lower.includes('husband') || lower.includes('spouse')) return 'Husband';
  if (/^m(other)?('s)?$/i.test(lower) || lower.includes('mother')) return 'Mother';
  if (/^o(ther)?$/i.test(lower) || lower.includes('other')) return 'Other';

  // 2. Hindi & Marathi
  if (/पिता|पिताजी|वडील|वडिल/i.test(str)) return 'Father';
  if (/पति|पती|नवरा/i.test(str)) return 'Husband';
  if (/माता|माताजी|आई/i.test(str)) return 'Mother';
  if (/अन्य|इतर/i.test(str)) return 'Other';

  // Strip leading punctuation/brackets often produced by OCR (e.g. '(પેતાનું', '`પતિનું')
  const cleaned = str.replace(/^[(\[{\"'\\s.:\-]+/, '');

  // 3. Gujarati (including common OCR misrecognitions found in AC electoral rolls)
  // Husband: પતિ, પૈતિ, પત્તિ, પત્નિ, પૂર્તિ, પૅતિ, પતિને, પતિનુ, ર્પતિ, ુપતિ, પંતિ, પર્તિ, પૃતિ
  if (/પ[તત્તિૄૅૈંૂર્].*િ|પતિ|પૈતિ|પત્તિ|પત્નિ|પૅતિ|ુપતિ|ર્પતિ|પંતિ|પૂર્તિ|પર્તિ|પૃતિ/i.test(cleaned)) {
    return 'Husband';
  }

  // Father: પિતા, િપતા, ર્પિતા, પૈતા, પ્રિતા, પિંતા, પિતો, ર્ષિતા, પીતે, પુતા, પેતિ, પેતા, પતા, વિતા, રિતા
  if (/પિ|િપ|ર્પિ|પ્રિ|પિં|પિત|પતા|પુતા|પેતિ|પેતા|પૈતા|પીતે|વિતા|રિતા|ર્ષિ/i.test(cleaned)) {
    return 'Father';
  }

  // Mother: માતા, માતાનું, માવડી
  if (/માતા|માવડી/i.test(cleaned)) {
    return 'Mother';
  }

  // Other: અન્ય, એન્ય, ઘર (head of house in Gujarati rolls)
  if (/અન્ય|એન્ય|અૂન્યુ|ઘર/i.test(cleaned)) {
    return 'Other';
  }

  return 'Other';
};

/**
 * Checks if a string is already a canonical standard relation.
 */
export const isStandardRelation = (val: any): val is StandardRelation => {
  return val === 'Father' || val === 'Husband' || val === 'Mother' || val === 'Other';
};
