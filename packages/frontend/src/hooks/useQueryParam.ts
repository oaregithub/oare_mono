import { ref, Ref, watch } from '@vue/composition-api';

/**
 * Generates a URLSearchParams object from the current URL.
 * @returns A URLSearchParams object.
 */
const getUrlParams = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
};

/**
 * Retrieves a query string value from the URL.
 * @param key The key of the query string value to retrieve.
 * @returns The query string value.
 */
const getQueryStringVal = (key: string): string | null =>
  getUrlParams().get(key);

/**
 * Overloaded custom hook for setting a query parameter from the URL and automatically updating the assigned variable.
 * @param key The key of the query parameter to set.
 * @param defaultVal The default value of the query parameter.
 * @param replace Whether to replace the current history state or push a new one.
 */
function useQueryParam(
  key: string,
  defaultVal: string,
  replace: boolean
): Ref<string>;
/**
 * Overloaded custom hook for setting a query parameter from the URL and updating the assigned variable.
 * @param key The key of the query parameter to set.
 * @param defaultVal The default value of the query parameter.
 * @param replace Whether to replace the current history state or push a new one.
 * @param asynchronous True boolean indicating that the hook should be used asynchronously. This means that the value will not be updated automatically, but must be manually updated using the returned function.
 */
function useQueryParam(
  key: string,
  defaultVal: string,
  replace: boolean,
  asynchronous: true
): [() => string, (val: string) => Promise<void>];
/**
 * The main signature for the custom hook.
 * @param key The key of the query parameter to set.
 * @param defaultVal The default value of the query parameter.
 * @param replace Whether to replace the current history state or push a new one.
 * @param asynchronous Optional true boolean indicating that the hook should be used asynchronously. See previous overload for details.
 * @returns Watched ref of the query parameter value (if asynchronous) or an array containing a getter and setter function (if not asynchronous).
 */
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
