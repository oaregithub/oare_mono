import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PlacesView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PlacesView', () => {
  const mockStore = {
    hasPermission: () => false,
  };

  const mockServer = {
    getPlaces: jest.fn().mockResolvedValue([]),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const createWrapper = ({ store, server } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);

    return mount(PlacesView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
      },
      stubs: ['router-link'],
    });
  };
  it('retrieves places on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPlaces).toHaveBeenCalled();
  });

  it('shows error snackbar when places fails to load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getPlaces: jest.fn().mockRejectedValue(null),
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
