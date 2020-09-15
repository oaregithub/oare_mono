export const letterGroups: { [key: string]: string } = {
  'A-J': 'ABCDEFGHIJ',
  K: 'K',
  'L-Z': 'LMNOPQRSTUVWXYZ',
};

export const getLetterGroup = (word: string) => {
  for (const [key, val] of Object.entries(letterGroups)) {
    if (val.includes(word[0])) {
      return key;
    }
  }
  return null;
};
