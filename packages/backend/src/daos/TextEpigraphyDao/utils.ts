import { normalizeFraction, normalizeSign, normalizeNumber } from '@oare/oare';

export const formattedSearchCharacter = (char: string): string[] => {
  // Formats fractions
  char = normalizeFraction(char);

  // Formats subscripts when user puts number at end
  char = normalizeSign(char);

  // Formats numbers
  char = normalizeNumber(char);

  const allChars = char.split(/[\s\-.+]+/);
  return allChars;
};

export const stringToCharsArray = (search: string): string[] => {
  const chars = search
    .trim()
    .split(/[\s\-.+]+/)
    .flatMap(formattedSearchCharacter);

  if (chars.length === 1 && chars[0] === '') {
    return [];
  }
  return chars;
};

export function ignorePunctuation(search: string): string {
  const ignoredPunctuation: string = `^.*${search
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()<>]/g, '[.,/#!$%^&*;:{}=-_`~()<>]{0,1}')
    .replace(/[\s]{1,}/g, '([\\s]{1,}|[.,/#!$%^&*;:{}=-_`~()<>]{1,1})')
    .toLowerCase()}.*$`;
  return ignoredPunctuation;
}
