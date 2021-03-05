import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AdminGroupView from '../AdminGroupView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AdminGroupView test', () => {
  const mockGroups = [
    {
      id: 0,
      name: 'Test Group',
      description: 'Test Description',
      created_on: new Date(),
      num_users: 1,
    },
    {
      id: 1,
      name: 'Test Group 2',
      description: 'Test Description 2',
      created_on: new Date(),
      num_users: 2,
    },
  ];
  const mockServer = {
    getAllGroups: jest.fn().mockResolvedValue(mockGroups),
    createGroup: jest.fn().mockResolvedValue(),
    deleteGroup: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    return mount(AdminGroupView, {
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
      description: '',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('successfully adds a group with a description', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-group').trigger('click');
    await wrapper.get('.test-group-name input').setValue('Group Name');
    await wrapper
      .get('.test-group-description input')
      .setValue('Group Description');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.createGroup).toHaveBeenCalledWith({
      groupName: 'Group Name',
      description: 'Group Description',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('does not allow blank group names', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-group').trigger('click');
    await wrapper.get('.test-group-name input').setValue('');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
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
