import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import AddBlacklistTexts from '../AddBlacklistTexts.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddBlacklistTexts test', () => {
  const mockServer = {
    searchTextNames: jest.fn().mockResolvedValue({
      texts: [
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

    return mount(AddBlacklistTexts, renderOptions);
  };

  it('successfully retrieves all texts on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.searchTextNames).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed text load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        searchTextNames: jest.fn().mockRejectedValue('failed text load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully adds texts to blacklist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper
      .findAll('.v-data-table__checkbox')
      .at(1)
      .trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.addTextsToPublicBlacklist).toHaveBeenCalled();
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
          .mockRejectedValue('failed text add'),
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
