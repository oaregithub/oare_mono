import search from './search';
import appBar from './appBar';
import login from './login';
import register from './register';
import landing from './landing';

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
