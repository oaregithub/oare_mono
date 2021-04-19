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

  const userUuid = 'user-uuid';
  const mockStore = {
    getters: {
      user: {
        uuid: userUuid,
      },
    },
  };

  beforeEach(() => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  });

  const createWrapper = () =>
    mount(DashboardDrafts, {
      vuetify,
      localVue,
    });

  it('retrieves drafts on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDrafts).toHaveBeenCalledWith(userUuid);
  });

  it('shows error snackbar when drafts fails to load', async () => {
    sl.set('serverProxy', {
      getDrafts: jest.fn().mockRejectedValue(null),
    });

    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar if user is not logged in', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {},
    });
    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('opens diff dialog when clicking on View Content', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-view-content').trigger('click');
    expect(wrapper.find('.test-content-dialog').exists()).toBe(true);
  });
});
