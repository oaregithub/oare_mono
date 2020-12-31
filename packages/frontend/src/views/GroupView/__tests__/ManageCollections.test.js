import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import ManageCollections from '../ManageCollections.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ManageCollections test', () => {
  const collectionGroups = [
    {
      uuid: '1',
      canRead: true,
      canWrite: false,
      name: 'Text 1',
    },
    {
      uuid: '2',
      canRead: true,
      canWrite: false,
      name: 'Text 2',
    },
  ];
  const mockServer = {
    getGroupCollections: jest.fn().mockResolvedValue(collectionGroups),
    removeGroupCollections: jest.fn().mockResolvedValue(),
    updateCollectionPermissions: jest.fn().mockResolvedValue(),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
    propsData: {
      groupId: '1',
    },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(ManageCollections, renderOptions);
  };

  it('displays collections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    collectionGroups
      .map(tg => tg.name)
      .forEach(name => {
        expect(wrapper.html()).toContain(name);
      });
  });

  it('displays error on failed collection groups load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getGroupCollections: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('updates edit permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editToggle = wrapper.findAll('.test-toggle-edit input').at(0);
    await editToggle.trigger('click');
    expect(mockServer.updateCollectionPermissions).toHaveBeenCalled();
  });

  it('displays error on failed edit permission update', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        updateCollectionPermissions: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-toggle-edit input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('updates view permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const viewToggle = wrapper.findAll('.test-toggle-view input').at(0);
    await viewToggle.trigger('click');
    expect(mockServer.updateCollectionPermissions).toHaveBeenCalled();
  });

  it('displays error on failed view permission update', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        updateCollectionPermissions: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-toggle-view input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes collections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper
      .findAll('.v-data-table__checkbox')
      .at(0)
      .trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeGroupCollections).toHaveBeenCalled();
  });

  it('displays error on failed remove collection', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeGroupCollections: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
