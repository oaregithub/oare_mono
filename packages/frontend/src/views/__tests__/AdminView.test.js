import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import AdminView from '../AdminView.vue';
import flushPromises from 'flush-promises';
import sl from '../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AdminView test', () => {
  const mockGroups = [
    {
      id: 0,
      name: 'Test Group',
      created_on: new Date(),
      num_users: 1,
    },
    {
      id: 1,
      name: 'Test Group 2',
      created_on: new Date(),
      num_users: 2,
    },
  ];
  const mockServer = {
    getAllGroups: jest.fn().mockResolvedValue(mockGroups),
    createGroup: jest.fn().mockResolvedValue(2),
    deleteGroup: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    return mount(AdminView, {
      vuetify,
      localVue,
      stubs: ['router-link'],
    });
  };

  it('loads groups on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllGroups).toHaveBeenCalled();
  });

  it('shows error if loading group fails', async () => {
    createWrapper({
      server: {
        getAllGroups: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays returned groups', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const groups = wrapper.findAll('.test-group-name');

    groups.wrappers.forEach((w, index) =>
      expect(w.text()).toBe(mockGroups[index].name)
    );
  });

  it('successfully adds a group', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-group').trigger('click');
    await wrapper.get('.test-group-name input').setValue('New group');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.createGroup).toHaveBeenCalledWith({
      groupName: 'New group',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar if adding group fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        createGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.get('.test-add-group').trigger('click');
    await wrapper.get('.test-group-name input').setValue('New group');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('actions button is disabled with no groups selected', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.get('.test-actions').element).toBeDisabled();
  });

  it('deletes group', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-delete-group').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.deleteGroup).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar if failing to delete', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        deleteGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();

    await wrapper.get('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-delete-group').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
