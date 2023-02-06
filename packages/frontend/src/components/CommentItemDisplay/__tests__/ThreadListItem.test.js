import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ThreadListItem from '../ThreadListItem.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ThreadListItem test', () => {
  const testThread = {
    uuid: 'uuid1',
    name: 'threadName1',
    referenceUuid: 'itemUuid',
    status: 'New',
    route: '/dictionaryWord/uuid',
  };

  const mockServer = {
    updateThreadName: jest.fn().mockResolvedValue(),
    updateThread: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const user = {
    isAdmin: true,
  };

  const mockStore = {
    getters: {
      user,
    },
  };

  beforeEach(() => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  });

  const createWrapper = () =>
    mount(ThreadListItem, {
      vuetify,
      localVue,
      propsData: {
        thread: testThread,
        index: 0,
        isSelected: true,
      },
    });

  it('edit thread status if admin user', async () => {
    const wrapper = createWrapper();
    const testDropdown = wrapper.get('.test-status-dropdown');
    await testDropdown.trigger('click');

    const testDropdownItemPending = wrapper
      .findAll('.test-status-dropdown-item')
      .at(1); // Pending
    await testDropdownItemPending.trigger('click');
    await flushPromises();

    // Should update when status is different (Pending !== New)
    expect(mockServer.updateThread).toHaveBeenCalledWith({
      ...testThread,
      status: 'Pending',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(wrapper.emitted().statusUpdated).toBeTruthy();
  });

  it('unable to edit thread status if not admin user', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        user: {
          ...user,
          isAdmin: false,
        },
      },
    });

    const wrapper = createWrapper();
    await flushPromises();
    const testDropdown = wrapper.find('.test-status-dropdown').exists();
    expect(testDropdown).toBe(false);
  });

  it('edits a thread name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-thread-name-dialog').trigger('click');

    await wrapper
      .get('.test-edit-thread-name input')
      .setValue('New Thread Name');

    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.updateThreadName).toHaveBeenCalledWith({
      threadUuid: testThread.uuid,
      newName: 'New Thread Name',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(wrapper.emitted().nameUpdated[0]).toEqual(['New Thread Name']);
  });

  it('shows error snackbar when fails to edit a thread name', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      updateThreadName: jest
        .fn()
        .mockRejectedValue('error, unable to edit name.'),
    });
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-edit-thread-name-dialog').trigger('click');

    await wrapper
      .get('.test-edit-thread-name input')
      .setValue('New Thread Name');

    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
