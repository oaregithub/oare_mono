import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#002E5D"
      }
    }
  },
  icons: {
    iconfont: 'mdi',
  },
});
