import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PersonsView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PersonsView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockServer = {
    getPersons: jest.fn().mockResolvedValue([]),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(PersonsView, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      propsData: {
        letter: 'A',
      },
    });
  };

  it('gets persons on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPersons).toHaveBeenCalled();
  });

  it('shows snackbar when periods retrieval fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getPersons: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
