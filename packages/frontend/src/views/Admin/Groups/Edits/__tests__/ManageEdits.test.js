import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ManageEdits from '../ManageEdits.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ManageEdits test', () => {
  const getTextsResponse = [
    {
      uuid: '1',
      name: 'Text 1',
      hasEpigraphy: true,
    },
    {
      uuid: '2',
      name: 'Text 2',
      hasEpigraphy: true,
    },
  ];
  const getCollectionsResponse = [
    {
      uuid: '1',
      name: 'Collection 1',
    },
    {
      uuid: '2',
      name: 'Collection 2',
    },
  ];
  const mockServer = {
    getGroupTextEditPermissions: jest.fn().mockResolvedValue(getTextsResponse),
    getGroupCollectionEditPermissions: jest
      .fn()
      .mockResolvedValue(getCollectionsResponse),
    removeItemsFromGroupEditPermissions: jest.fn().mockResolvedValue(),
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

    return mount(ManageEdits, renderOptions);
  };

  it('displays edit permission texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    getTextsResponse
      .map(text => text.name)
      .forEach(name => {
        expect(wrapper.html()).toContain(name);
      });
  });

  it('displays error on failed edit permissions texts load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getGroupTextEditPermissions: jest
          .fn()
          .mockRejectedValue('failed to load edit permissions texts'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeItemsFromGroupEditPermissions).toHaveBeenCalled();
  });

  it('displays error on failed remove text', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeItemsFromGroupEditPermissions: jest
          .fn()
          .mockRejectedValue('failed to remove from edit permissions'),
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

  it('displays edit permissions collections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.test-radio-btn input').at(1).trigger('click');
    await flushPromises();
    getCollectionsResponse
      .map(collection => collection.name)
      .forEach(name => {
        expect(wrapper.html()).toContain(name);
      });
  });

  it('displays error on failed edit permissions collections load', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getGroupCollectionEditPermissions: jest
          .fn()
          .mockRejectedValue('failed to load allowlist collections'),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-radio-btn input').at(1).trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes collections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.test-radio-btn input').at(1).trigger('click');
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeItemsFromGroupEditPermissions).toHaveBeenCalled();
  });

  it('displays error on failed remove collection', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeItemsFromGroupEditPermissions: jest
          .fn()
          .mockRejectedValue('failed to remove from edit permissions'),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-radio-btn input').at(1).trigger('click');
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
