import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import NamesView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('NamesView test', () => {
  const mockStore = {
    hasPermission: () => false,
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    getNames: jest.fn().mockResolvedValue([]),
  };

  const createWrapper = ({ store, server } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);

    return mount(NamesView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
        actions: mockActions,
        server: server || mockServer,
      },
      stubs: ['router-link'],
    });
  };

  it('gets names on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getNames).toHaveBeenCalled();
  });

  it('shows snackbar when name retrieval fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getNames: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows add button icon if user has add word permissions', async () => {
    const wrapper = createWrapper({
      store: {
        hasPermission: name => ['ADD_LEMMA'].includes(name),
      },
    });
    await flushPromises();
    expect(wrapper.get('.mb-8'));
  });
});
