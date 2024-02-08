import search from './search';
import appBar from './appBar';
import login from './login';
import register from './register';
import landing from './landing';

/**
 * A consolidated list of all internationalized text in the app.
 * Used by the i18n plugin to display portions of the app in Turkish and English.
 */
export default {
  en: {
    search: {
      ...search.en,
    },
    appBar: {
      ...appBar.en,
    },
    login: {
      ...login.en,
    },
    register: {
      ...register.en,
    },
    landing: {
      ...landing.en,
    },
  },
  tr: {
    search: {
      ...search.tr,
    },
    appBar: {
      ...appBar.tr,
    },
    login: {
      ...login.tr,
    },
    register: {
      ...register.tr,
    },
    landing: {
      ...landing.tr,
    },
  },
};
