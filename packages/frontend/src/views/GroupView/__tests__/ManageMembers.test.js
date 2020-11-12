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
    },
    {
      id: 2,
      first_name: 'Tony',
      last_name: 'Stark',
      email: 'tony@gmail.com',
    },
  ];
  const mockServer = {
    addUsersToGroup: jest.fn().mockResolvedValue(null),
    removeUsersFromGroup: jest.fn().mockResolvedValue(null),
    getAllUsers: jest.fn().mockResolvedValue(mockUsers.slice(0, 1)),
    getGroupUsers: jest.fn().mockResolvedValue(mockUsers.slice(1)),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  }

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
  }

  it('displays users in group', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getAllUsers).toHaveBeenCalled();
    expect(mockServer.getGroupUsers).toHaveBeenCalled();
    expect(wrapper.html('Tony Stark'));
  });

  it('displays error upon user retrieval fail', async () => {
    createWrapper({
      server: {
        getAllUsers: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays error upon user add failure', async () => {
    createWrapper({
      server: {
        addUsersToGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises;
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
      userIds: [2],
    });
  });

  it('displays error upon remove failure', async () => {
    createWrapper({
      server: {
        removeUsersFromGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises;
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});

