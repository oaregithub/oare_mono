import Vue from 'vue';
import Router from 'vue-router';
import routes from './routes';

Vue.use(Router);

/**
 * Initializes the router instance used throughout the application.
 */
export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});
