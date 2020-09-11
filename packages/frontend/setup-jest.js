import Vue from "vue";
import Vuetify from "vuetify";
import OareButtonSpinner from "./src/components/base/OareButtonSpinner.vue";
import OareLoaderButton from "./src/components/base/OareLoaderButton.vue";

Vue.use(Vuetify);
Vue.component("OareButtonSpinner", OareButtonSpinner);
Vue.component("OareLoaderButton", OareLoaderButton);
