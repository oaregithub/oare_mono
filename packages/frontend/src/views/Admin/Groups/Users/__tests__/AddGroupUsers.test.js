import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AddGroupUsers from '../AddGroupUsers.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddGroupUsers test', () => {
  const mockUsers = [
    {
      uuid: '1',
      firstName: 'Steve',
      lastName: 'Rogers',
      email: 'steve@gmail.com',
      groups: [1],
    },
    {
      uuid: '2',
      firstName: 'Tony',
      lastName: 'Stark',
      email: 'tony@gmail.com',
      groups: [2],
    },
  ];
  const mockServer = {
    getGroupInfo: jest.fn().mockResolvedValue({
      name: 'testGroup',
    }),
    getAllUsers: jest.fn().mockResolvedValue(mockUsers),
    addUsersToGroup: jest.fn().mockResolvedValue(null),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };
  const mockRouter = {
    push: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      groupId: '1',
    },
    stubs: ['router-link'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);

    return mount(AddGroupUsers, renderOptions);
  };

  it('retrieves group name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getGroupInfo).toHaveBeenCalled();
    expect(wrapper.html()).toContain('testGroup');
  });

  it('displays error on failed group name retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getGroupInfo: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('retrieves all users', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllUsers).toHaveBeenCalled();
  });

  it('does not display users already in the group', async () => {
    const wrapper = createWrapper();
    flushPromises();
    expect(wrapper.html()).not.toContain('Steve Rogers');
  });

  it('displays error on failed user retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getAllUsers: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('navigates back to group view after add', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockRouter.push).toHaveBeenCalledWith('/groups/1/members');
  });

  it('adds users successfully', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.addUsersToGroup).toHaveBeenCalledWith(1, {
      userUuids: ['2'],
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(wrapper.html()).toContain('Tony Stark');
  });

  it('displays error on failed user add', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addUsersToGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(wrapper.html()).toContain('Tony Stark');
  });
});
