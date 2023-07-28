import { ref, Ref, watch } from '@vue/composition-api';

const getUrlParams = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
};

const getQueryStringVal = (key: string): string | null =>
  getUrlParams().get(key);

function useQueryParam(
  key: string,
  defaultVal: string,
  replace: boolean
): Ref<string>;
function useQueryParam(
  key: string,
  defaultVal: string,
  replace: boolean,
  asynchronous: true
): [() => string, (val: string) => Promise<void>];
function useQueryParam(
  key: string,
  defaultVal: string,
  replace: boolean,
  asynchronous?: true
): Ref<string> | [() => string, (val: string) => Promise<void>] {
  const param = ref(getQueryStringVal(key) || defaultVal);

  window.addEventListener('popstate', () => {
    const relevantParam = getQueryStringVal(key) || defaultVal;
    param.value = relevantParam;
  });

  window.addEventListener(`update:${key}`, e => {
    const { newVal } = (e as CustomEvent).detail;
    param.value = newVal;

    const urlParams = getUrlParams();

    if (newVal && newVal.trim() !== '') {
      urlParams.set(key, newVal);
    } else {
      urlParams.delete(key);
    }

    if (typeof window !== 'undefined') {
      const { protocol, pathname, host } = window.location;
      const newUrl = `${protocol}//${host}${pathname}?${urlParams.toString()}`;
      if (!replace) {
        window.history.pushState({}, '', newUrl);
      } else {
        window.history.replaceState({}, '', newUrl);
      }
    }
  });

  const updateParam = async (newVal: string) => {
    window.dispatchEvent(
      new CustomEvent(`update:${key}`, {
        detail: { newVal: newVal || '' },
      })
    );
  };

  if (!asynchronous) {
    watch(param, (newVal: string) => {
      const relevantParam = getQueryStringVal(key) || defaultVal;
      if (relevantParam !== newVal) {
        updateParam(newVal);
      }
    });
  }

  if (asynchronous) {
    return [() => param.value, updateParam];
  }

  return param;
}

export default useQueryParam;
