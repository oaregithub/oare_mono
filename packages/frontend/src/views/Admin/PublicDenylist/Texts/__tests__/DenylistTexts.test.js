import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import DenylistTexts from '../DenylistTexts.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DenylistText test', () => {
  const mockPublicDenylist = [
    {
      name: 'test1',
      text_uuid: 'test1',
      can_read: false,
      can_write: false,
    },
    {
      name: 'test2',
      text_uuid: 'test2',
      can_read: false,
      can_write: false,
    },
  ];
  const mockServer = {
    getPublicDenylist: jest.fn().mockResolvedValue(mockPublicDenylist),
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

    return mount(DenylistTexts, renderOptions);
  };

  it('retrieves public denylist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getPublicDenylist).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed denylist retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getPublicDenylist: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes texts successfully', async () => {
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

  it('displays error on failed removal', async () => {
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
