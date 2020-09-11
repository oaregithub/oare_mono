import "@testing-library/jest-dom";
import Vue from "vue";
import Vuetify from "vuetify";
import OareLoaderButton from "./src/components/base/OareLoaderButton.vue";

Vue.use(Vuetify);
Vue.component("OareLoaderButton", OareLoaderButton);

// Stops Vuetify from complaining about missing data-app attribute
const app = document.createElement("div");
app.setAttribute("data-app", true);
document.body.append(app);
