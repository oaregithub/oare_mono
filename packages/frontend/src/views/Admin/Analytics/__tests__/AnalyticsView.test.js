import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AnalyticsView from '../Analytics.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const renderOptions = {
  localVue,
  vuetify,
};

const adminUser = {
  uuid: 'uuid',
  isAdmin: true,
};

const mockStore = {
  getters: {
    user: adminUser,
  },
  hasPermission: () => true,
};

const setup = () => {
  sl.set('store', mockStore);
};

beforeEach(setup);

describe('AnalyticsView test', () => {
  const createWrapper = () => mount(AnalyticsView, renderOptions);
  if (process.env.NODE_ENV === 'production') {
    it('displays Google Analytics iframe', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-iframe').exists()).toBe(true);
    });

    it('displays Google Analytics Button', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-button').exists()).toBe(true);
    });

    it('does not display page only available on production', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-page-unavailable').exists()).toBe(false);
    });
  } else {
    it('does not display Google Analytics iframe', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-iframe').exists()).toBe(false);
    });

    it('does not display Google Analytics Button', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-button').exists()).toBe(false);
    });

    it('displays page only available on production', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('.test-page-unavailable').exists()).toBe(true);
    });
  }
});
