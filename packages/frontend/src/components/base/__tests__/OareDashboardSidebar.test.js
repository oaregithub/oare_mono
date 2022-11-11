import Vuetify from 'vuetify';
import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import OareDashboardSidebar from '../OareDashboardSidebar.vue';
import sl from '../../../serviceLocator';

const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareDashboardSidebar', () => {
  const mockStore = {
    hasPermission: () => false,
  };

  let wrapper;
  beforeEach(() => {
    sl.set('store', mockStore);
    wrapper = mount(OareDashboardSidebar, {
      localVue,
      vuetify: new Vuetify(),
      stubs: ['router-link'],
    });
  });

  it('contains expected sidebar links', () => {
    ['Profile', 'Drafts'].forEach(link => {
      const linkItem = wrapper.find(`[data-testid="${link}"]`);
      expect(linkItem.text()).toBe(link);
    });
  });
});

describe('OareDashboardSidebar with permissions', () => {
  const mockStore = {
    hasPermission: () => true,
  };

  let wrapper;
  beforeEach(() => {
    sl.set('store', mockStore);
    wrapper = mount(OareDashboardSidebar, {
      localVue,
      vuetify: new Vuetify(),
      stubs: ['router-link'],
    });
  });

  it('contains expected sidebar links', () => {
    ['Profile', 'Drafts', 'Comments', 'Preferences'].forEach(link => {
      const linkItem = wrapper.find(`[data-testid="${link}"]`);
      expect(linkItem.text()).toBe(link);
    });
  });
});
