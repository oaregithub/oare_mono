import router from '../../router';

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
