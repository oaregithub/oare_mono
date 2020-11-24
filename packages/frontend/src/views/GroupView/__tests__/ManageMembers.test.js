import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ManageMembers from '../ManageMembers.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ManageMembers test', () => {
  const mockUsers = [
    {
      id: 1,
      first_name: 'Steve',
      last_name: 'Rogers',
      email: 'steve@gmail.com',
      groups: [1],
    },
    {
      id: 2,
      first_name: 'Tony',
      last_name: 'Stark',
      email: 'tony@gmail.com',
      groups: [2],
    },
  ];
  const mockServer = {
    addUsersToGroup: jest.fn().mockResolvedValue(null),
    removeUsersFromGroup: jest.fn().mockResolvedValue(null),
    getAllUsers: jest.fn().mockResolvedValue(mockUsers.slice(0, 1)),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      groupId: '1',
      serverProxy: mockServer,
    },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(ManageMembers, renderOptions);
  };

  it('displays users in group', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getAllUsers).toHaveBeenCalled();
    expect(wrapper.html()).toContain('Steve Rogers');
  });

  it('displays error upon user retrieval fail', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getAllUsers: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays error upon user add failure', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addUsersToGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes users', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeUsersFromGroup).toHaveBeenCalledWith(1, {
      userIds: [1],
    });
  });

  it('displays error upon remove failure', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeUsersFromGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
