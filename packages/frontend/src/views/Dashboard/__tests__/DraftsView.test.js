import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import DashboardDrafts from '../Drafts.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DashboardDraftsView', () => {
  const mockServer = {
    getDrafts: jest.fn().mockResolvedValue([]),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);

    return mount(DashboardDrafts, {
      vuetify,
      localVue,
    });
  };

  it('retrieves drafts on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDrafts).toHaveBeenCalled();
  });

  it('shows error snackbar when drafts fails to load', async () => {
    createWrapper({
      server: {
        getDrafts: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
