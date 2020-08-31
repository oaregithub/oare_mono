import routes from "../src/routes";
import VueRouter from "vue-router";
import { mockRouterComponents } from "vue-test-utils-helpers";

export default {
  mock() {
    const clearedRoutes = mockRouterComponents(routes);
    return new VueRouter({
      mode: "abstract",
      routes: clearedRoutes
    });
  }
};
