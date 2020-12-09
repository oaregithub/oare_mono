import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import BlacklistTexts from '../BlacklistTexts.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('BlacklistText test', () => {
  const mockPublicBlacklist = [
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
    getPublicBlacklist: jest.fn().mockResolvedValue(mockPublicBlacklist),
    addTextsToPublicBlacklist: jest.fn().mockResolvedValue(),
    removeTextsFromPublicBlacklist: jest.fn().mockResolvedValue(),
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

    return mount(BlacklistTexts, renderOptions);
  };

  it('retrieves public blacklist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getPublicBlacklist).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed blacklist retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getPublicBlacklist: jest.fn().mockRejectedValue(null),
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
    await wrapper.get('.test-remove-texts').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeTextsFromPublicBlacklist).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('displays error on failed removal', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeTextsFromPublicBlacklist: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.get('.v-data-table__checkbox').trigger('click');
    await wrapper.get('.test-actions').trigger('click');
    await wrapper.get('.test-remove-texts').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
