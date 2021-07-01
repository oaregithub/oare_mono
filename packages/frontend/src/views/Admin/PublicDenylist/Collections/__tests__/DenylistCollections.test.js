import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import DenylistCollections from '../DenylistCollections.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DenylistCollections test', () => {
  const mockDenylistedCollections = [
    {
      name: 'test1',
      uuid: 'test1',
    },
    {
      name: 'test2',
      uuid: 'test2',
    },
  ];
  const mockServer = {
    getDenylistCollections: jest
      .fn()
      .mockResolvedValue(mockDenylistedCollections),
    addTextsToPublicDenylist: jest.fn().mockResolvedValue(),
    removeItemsFromPublicDenylist: jest.fn().mockResolvedValue(),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };
  const mockLodash = {
    debounce: cb => cb,
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);

    return mount(DenylistCollections, renderOptions);
  };

  it('retrieves public denylist collections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getDenylistCollections).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed denylist collections retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getDenylistCollections: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes collections successfully', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeItemsFromPublicDenylist).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('displays error on failed collection removal', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeItemsFromPublicDenylist: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.get('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-items').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
