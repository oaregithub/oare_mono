import '@testing-library/jest-dom';
import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import OareLoaderButton from './src/components/base/OareLoaderButton.vue';
import OareCard from './src/components/base/OareCard.vue';
import OareContentView from './src/components/base/OareContentView.vue';
import OareBreadcrumbs from './src/components/base/OareBreadcrumbs.vue';
import OareDialog from './src/components/base/OareDialog.vue';
import OareLabel from './src/components/base/OareLabel.vue';
import OareSubheader from './src/components/base/OareSubheader.vue';
import OareDataTable from './src/components/base/OareDataTable.vue';
import sl from './src/serviceLocator';

sl.set('globalActions', {
  showErrorSnackbar: () => {},
});

Vue.use(Vuetify);
Vue.component('OareLoaderButton', OareLoaderButton);
Vue.component('OareCard', OareCard);
Vue.component('OareContentView', OareContentView);
Vue.component('OareBreadcrumbs', OareBreadcrumbs);
Vue.component('OareDialog', OareDialog);
Vue.component('OareLabel', OareLabel);
Vue.component('OareSubheader', OareSubheader);
Vue.component('OareDataTable', OareDataTable);

// Stops Vuetify from complaining about missing data-app attribute
const app = document.createElement('div');
app.setAttribute('data-app', true);
document.body.append(app);
