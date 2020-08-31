import search from "./search";
import appBar from "./appBar";
import login from "./login";
import register from "./register";
import landing from "./landing";

export default {
  us: {
    search: {
      ...search.us
    },
    appBar: {
      ...appBar.us
    },
    login: {
      ...login.us
    },
    register: {
      ...register.us
    },
    landing: {
      ...landing.us
    }
  },
  tr: {
    search: {
      ...search.tr
    },
    appBar: {
      ...appBar.tr
    },
    login: {
      ...login.tr
    },
    register: {
      ...register.tr
    },
    landing: {
      ...landing.tr
    }
  }
};
