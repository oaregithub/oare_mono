import Vue from 'vue';
import Router from 'vue-router';
import routes from './routes';

// Adds Vue Router to the Vue app.
Vue.use(Router);

/**
 * The router instance for the app.
 * This adds all the routes to the app.
 */
export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});
