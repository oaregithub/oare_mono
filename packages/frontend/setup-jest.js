import '@testing-library/jest-dom';
import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import OareLoaderButton from './src/components/base/OareLoaderButton.vue';
import OareUserCard from './src/components/base/OareUserCard.vue';

Vue.use(Vuetify);
Vue.component('OareLoaderButton', OareLoaderButton);
Vue.component('OareUserCard', OareUserCard);

// Stops Vuetify from complaining about missing data-app attribute
const app = document.createElement('div');
app.setAttribute('data-app', true);
document.body.append(app);
