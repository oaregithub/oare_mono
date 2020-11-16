import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import TextsSearch from '../TextsSearch.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextsSearch', () => {
  const mockServer = {
    searchTexts: jest.fn().mockResolvedValue({}),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
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

  it('displays error on failed character sequence search', async () => {
    const wrapper = createWrapper({
      server: {
        searchTexts: jest.fn().mockRejectedValue(null),
      },
    });
    const input = wrapper.find('.test-character-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
