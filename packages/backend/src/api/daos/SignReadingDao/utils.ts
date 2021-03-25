export const applyIntellisearch = (signs: string[]): string[][] => {
  let signArray = signs.map(sign => [sign]);

  // Apply Wildcard (*)
  signArray = signArray.map(applyWildcard);

  return signArray;
};

export const applyWildcard = (signs: string[]): string[] => {
  const wildcardConsonants = 'bdgklmnpqrstwyzBDGKLMNPQRSTWYZšṣṭḫṢŠṬḪ'.split('');
  const numberOfWildcards = (signs[0].match(/\*/g) || []).length;

  let wildcardSigns: string[] = signs;
  for (let i = 0; i < numberOfWildcards; i += 1) {
    wildcardSigns = wildcardSigns.flatMap(sign =>
      wildcardConsonants.map(consonant => sign.replace('*', consonant))
    );
  }

  return wildcardSigns;
};
