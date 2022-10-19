import Vue from 'vue';
import VueI18n from 'vue-i18n';
import messages from '../messages';

Vue.use(VueI18n);

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

export default new VueI18n({
  locale: getLocale(),
  messages,
  fallbackLocale: 'en',
});
