import router from '../../router';

export const FRACTION_VALS: { [key: string]: number } = {
  '1/4': 188,
  '1/2': 189,
  '3/4': 190,
  '1/3': 8531,
  '2/3': 8532,
  '1/6': 8537,
  '5/6': 8538,
};

export const formattedSearchCharacter = (char: string): string => {
  if (Object.keys(FRACTION_VALS).includes(char)) {
    char = String.fromCharCode(FRACTION_VALS[char]);
  }
  // This allows users to put a normal number on the end of a search character
  // and for it to be automatically subscripted.
  else if (
    !char.match(/^\d+$/) &&
    char[char.length - 1] >= '0' &&
    char[char.length - 1] <= '9'
  ) {
    // 8320 is the unicode for subscripted 0
    const lastChar = String.fromCharCode(8320 + Number(char[char.length - 1]));
    char = char.slice(0, char.length - 1) + lastChar;
  }
  return char;
};

export interface SearchOptions {
  title?: string;
  query?: string;
  dictionary?: string;
  page?: string;
  rows?: string;
}
export const updateUrl = (searchOptions: Readonly<SearchOptions>) => {
  router.replace({
    name: router.currentRoute.name || '/',
    query: {
      ...searchOptions,
    },
  });
};

export const highlightedItem = (item: string, search: string) => {
  const components: string[] = [];
  for (let i = 0; i < item.length; i += 1) {
    if (
      item.substring(i, i + search.length).toLowerCase() ===
      search.toLowerCase()
    ) {
      components.push(`<mark>${item.substring(i, i + search.length)}</mark>`);
      i += search.length - 1;
    } else {
      components.push(item[i]);
    }
  }
  return components.join('');
};
