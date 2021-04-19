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
    getDrafts: jest.fn().mockResolvedValue([
      {
        createdAt: new Date(),
        textName: 'Some Text',
        textUuid: 'text-uuid',
        updatedAt: new Date(),
        uuid: 'draft-uuid',
        content: [],
        notes: 'draft notes',
        userUuid: 'user-uuid',
      },
    ]),
    deleteDraft: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
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
      stubs: ['router-link'],
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

  it('successfully deletes drafts', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-delete-draft').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.deleteDraft).toHaveBeenCalledWith('draft-uuid');
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar if deleting drafts fails', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      deleteDraft: jest.fn().mockRejectedValue('failed to delete draft'),
    });
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-delete-draft').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
