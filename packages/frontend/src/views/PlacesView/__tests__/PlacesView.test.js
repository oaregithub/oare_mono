import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import PlacesView from '../index.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PlacesView', () => {
  const mockServer = {
    getPlaces: jest.fn().mockResolvedValue([]),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

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
});
