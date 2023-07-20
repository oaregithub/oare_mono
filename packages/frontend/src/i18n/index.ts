import Vue from 'vue';
import VueI18n from 'vue-i18n';
import messages from '../messages';

Vue.use(VueI18n);

/**
 * Retrieves the user's preferred locale from local storage or navigator.
 * @returns The user's preferred locale.
 */
const getLocale = (): string => {
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale) {
    return storedLocale;
  }
  if (navigator.language.includes('tr')) {
    return 'tr';
  }
  return 'en';
};

/**
 * The VueI18n instance used throughout the application.
 */
export default new VueI18n({
  locale: getLocale(),
  messages,
  fallbackLocale: 'en',
});
