import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import AddBlacklistCollections from '../AddBlacklistCollections.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddBlacklistCollections test', () => {
  const mockServer = {
    searchCollectionNames: jest.fn().mockResolvedValue({
      collections: [
        {
          uuid: 'test1',
          name: 'test1',
        },
        {
          uuid: 'test2',
          name: 'test2',
        },
      ],
      count: 2,
    }),
    addTextsToPublicBlacklist: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockRouter = {
    push: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);
    sl.set('lodash', mockLodash);

    return mount(AddBlacklistCollections, renderOptions);
  };

  it('successfully retrieves all collections on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.searchCollectionNames).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed collections load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        searchCollectionNames: jest
          .fn()
          .mockRejectedValue('failed collections load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully adds collections to blacklist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper
      .findAll('.v-data-table__checkbox')
      .at(1)
      .trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.addTextsToPublicBlacklist).toHaveBeenCalledWith({
      texts: [
        { uuid: 'test1', type: 'collection' },
        { uuid: 'test2', type: 'collection' },
      ],
    });
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('displays error on failed add', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addTextsToPublicBlacklist: jest
          .fn()
          .mockRejectedValue('failed collection add'),
      },
    });
    await flushPromises();
    await wrapper
      .findAll('.v-data-table__checkbox')
      .at(1)
      .trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
