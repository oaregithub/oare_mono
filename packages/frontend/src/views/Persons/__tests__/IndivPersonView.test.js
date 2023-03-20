import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import IndivPersonView from '../indivPerson.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('IndivPersonView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockServer = {
    getIndivPerson: jest.fn().mockResolvedValue({
      years: [],
    }),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(IndivPersonView, {
      vuetify,
      localVue,
    });
  };

  it('gets periods on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getIndivPerson).toHaveBeenCalled();
  });

  it('shows snackbar when periods retrieval fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getIndivPerson: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
