import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import DictionarySearch from '../DictionarySearch.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DictionarySearch', () => {
  const mockServer = {
    searchDictionary: jest.fn().mockResolvedValue(null),
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

    return mount(DictionarySearch, renderOptions);
  };

  it('performs search on submit', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('.test-dictionary-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockServer.searchDictionary).toHaveBeenCalled();
  });

  it('displays error on failed search', async () => {
    const wrapper = createWrapper({
      server: {
        searchDictionary: jest.fn().mockRejectedValue(null),
      },
    });
    const input = wrapper.find('.test-dictionary-search input');
    await input.setValue('a');
    await wrapper.find('.test-submit-button').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
