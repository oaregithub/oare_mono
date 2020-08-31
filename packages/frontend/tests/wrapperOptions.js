import Vuetify from "vuetify";
import VueRouter from "vue-router";
import { createLocalVue } from "@vue/test-utils";

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(VueRouter);
const router = new VueRouter();

export default {
  localVue,
  router,
  vuetify: new Vuetify({
    mocks: {
      $vuetify: {
        breakpoint: {
          height: 500,
          smAndUp: true
        }
      }
    }
  })
};
