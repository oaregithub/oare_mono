import Vue from 'vue';
import VueI18n from 'vue-i18n';
import messages from '../messages';

// Adds internationalization to the Vue app.
Vue.use(VueI18n);

/**
 * Determines the locale to use for the app. Only English and Turkish are supported.
 * If a locale is stored in local storage, it is used.
 * If the user's browser is set to Turkish, the app is set to Turkish.
 * Otherwise, the app is set to English.
 * @returns The locale to use for the app.
 */
const getLocale = (): string => {
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale && ['en', 'tr'].includes(storedLocale)) {
    return storedLocale;
  }
  if (navigator.language.includes('tr')) {
    return 'tr';
  }
  return 'en';
};

/**
 * The internationalization instance for the app.
 */
export default new VueI18n({
  locale: getLocale(),
  messages,
  fallbackLocale: 'en',
});
