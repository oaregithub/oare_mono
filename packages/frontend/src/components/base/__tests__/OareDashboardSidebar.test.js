import Vuetify from 'vuetify';
import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import OareDashboardSidebar from '../OareDashboardSidebar.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareDashboardSidebar', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(OareDashboardSidebar, {
      localVue,
      vuetify: new Vuetify(),
      stubs: ['router-link'],
    });
  });

  it('matches snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('contains expected sidebar links', () => {
    ['Profile', 'Drafts'].forEach(link => {
      const linkItem = wrapper.find(`[data-testid="${link}"]`);
      expect(linkItem.text()).toBe(link);
    });
  });
});
