import Vue from 'vue';
import Vuetify from 'vuetify/lib';

// Adds Vuetify to the Vue app.
Vue.use(Vuetify);

/**
 * The Vuetify instance for the app.
 */
export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#002E5D',
      },
    },
  },
  icons: {
    iconfont: 'mdi',
  },
});
