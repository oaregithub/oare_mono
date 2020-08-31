import Vue from "vue";
import Vuetify from "vuetify";
import OareAppBar from "../src/components/base/OareAppBar";
import OareContentView from "../src/components/base/OareContentView";
import OareFooter from "../src/components/base/OareFooter";
import OareListItem from "../src/components/base/OareListItem";
import OareSubheader from "../src/components/base/OareSubheader";
import OareUserCard from "../src/components/base/OareUserCard";
import OareButtonSpinner from "../src/components/base/OareButtonSpinner";
import "babel-polyfill";

Vue.use(Vuetify);
Vue.component("OareAppBar", OareAppBar);
Vue.component("OareContentView", OareContentView);
Vue.component("OareFooter", OareFooter);
Vue.component("OareListItem", OareListItem);
Vue.component("OareSubheader", OareSubheader);
Vue.component("OareUserCard", OareUserCard);
Vue.component("OareButtonSpinner", OareButtonSpinner);

// Stops Vuetify from complaining about missing data-app attribute
const app = document.createElement("div");
app.setAttribute("data-app", true);
document.body.append(app);
