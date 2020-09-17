import { ref, Ref } from '@vue/composition-api';

const getUrlParams = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
};

const getQueryStringVal = (key: string): string | null => {
  return getUrlParams().get(key);
};

const useQueryParam = (
  key: string,
  defaultVal: string
): [Ref<string>, (val: string) => void] => {
  const param = ref(getQueryStringVal(key) || defaultVal);

  const updateParam = (newVal: string) => {
    param.value = newVal;

    const urlParams = getUrlParams();

    if (newVal.trim() !== '') {
      urlParams.set(key, newVal);
    } else {
      urlParams.delete(key);
    }

    if (typeof window !== 'undefined') {
      const { protocol, pathname, host } = window.location;
      const newUrl = `${protocol}//${host}${pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  return [param, updateParam];
};

export default useQueryParam;
