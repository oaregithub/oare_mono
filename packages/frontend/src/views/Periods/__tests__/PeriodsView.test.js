import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PeriodsView from '../Periods.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PeriodsView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockServer = {
    getPeriods: jest.fn().mockResolvedValue({
      years: [],
    }),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(PeriodsView, {
      vuetify,
      localVue,
    });
  };

  it('gets periods on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPeriods).toHaveBeenCalled();
  });

  it('shows snackbar when periods retrieval fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getPeriods: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
