export const letterGroups: { [key: string]: string } = {
  'A-J': 'ABCDEFGHIJ',
  K: 'K',
  'L-Z': 'LMNOPQRSTUVWXYZ',
};

export const getLetterGroup = (word: string): string | null => {
  const startChar = word[0];
  const group = Object.entries(letterGroups).find(([key, val]) =>
    val.includes(startChar)
  );
  return group ? group[0] : null;
};
