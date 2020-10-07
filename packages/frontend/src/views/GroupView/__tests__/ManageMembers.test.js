import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ManageMembers from '../ManageMembers.vue';
import flushPromises from 'flush-promises';

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

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      groupId: '1',
      serverProxy: mockServer,
    },
  };

  const renderWrapper = () => render(ManageMembers, renderOptions);

  const mountWrapper = () => mount(ManageMembers, renderOptions);

  it('displays users in group', async () => {
    const { getByText } = renderWrapper();
    await flushPromises();
    expect(mockServer.getAllUsers).toHaveBeenCalled();
    expect(mockServer.getGroupUsers).toHaveBeenCalled();
    expect(getByText('Tony Stark'));
  });

  it('removes users', async () => {
    const wrapper = mountWrapper();
    await flushPromises();
    await wrapper.find('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeUsersFromGroup).toHaveBeenCalledWith(1, [2]);
  });
});
