import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OareAdminSidebar from '@/components/base/OareAdminSidebar';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareAdminSidebar', () => {
  const mockStore = {
    getters: {
      displayAdminBadge: {
        error: false,
        comments: false,
      },
    },
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
  };

  const createWrapper = ({ store } = {}) => {
    sl.set('store', store || mockStore);
    return mount(OareAdminSidebar, renderOptions);
  };

  it('does not display error indicator when not in store', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.findAll('.test-admin-badge').at(2).html()).toContain(
      'display: none'
    );
  });

  it('does not display comment indicator when not in store', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.findAll('.test-admin-badge').at(3).html()).toContain(
      'display: none'
    );
  });

  it('displays error indicator when in store', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          displayAdminBadge: {
            ...mockStore.getters,
            error: true,
          },
        },
      },
    });
    await flushPromises();
    expect(wrapper.findAll('.test-admin-badge').at(2).html()).not.toContain(
      'display: none'
    );
  });

  it('displays comment indicator when in store', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          displayAdminBadge: {
            ...mockStore.getters,
            comments: true,
          },
        },
      },
    });
    await flushPromises();
    expect(wrapper.findAll('.test-admin-badge').at(3).html()).not.toContain(
      'display: none'
    );
  });
});
