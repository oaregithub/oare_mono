import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import TextsSearch from '../TextsSearch.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextsSearch', () => {
  const mockServer = {
    searchTexts: jest.fn().mockResolvedValue({ totalRows: 0, results: [] }),
    searchTextsTotal: jest.fn().mockResolvedValue(10),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockRouter = {
    push: jest.fn(),
  };

  const $t = () => {};

  const renderOptions = {
    localVue,
    vuetify,
    mocks: { $t },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);

    return mount(TextsSearch, renderOptions);
  };

  it('performs search on text title submit', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('.test-title-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockServer.searchTexts).toHaveBeenCalled();
  });

  it('displays error on failed text title search', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchTexts: jest.fn().mockRejectedValue(null),
      },
    });
    const input = wrapper.find('.test-title-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('performs search on character sequence submit', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockServer.searchTexts).toHaveBeenCalled();
  });

  it('displays a result without showing the search page', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchTexts: jest.fn().mockResolvedValue({
          totalRows: 1,
          results: [{ name: 'testName', uuid: 'testUUID' }],
        }),
      },
    });
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('displays error on failed character sequence search', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchTexts: jest.fn().mockRejectedValue(null),
      },
    });
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('retrieves search results count', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockServer.searchTextsTotal).toHaveBeenCalled();
  });

  it('displays error failed search count retrieval', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchTextsTotal: jest
          .fn()
          .mockRejectedValue('failed to retrieve search count'),
      },
    });
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
