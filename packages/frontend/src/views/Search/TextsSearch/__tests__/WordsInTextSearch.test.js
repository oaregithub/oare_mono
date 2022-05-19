import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import WordsInTextSearch from '../WordsInTextSearch.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('WordsInTextSearch', () => {
  const mockServer = {
    getWordsInTextSearchResults: jest
      .fn()
      .mockResolvedValue({ total: 0, results: [] }),
    getFormOptions: jest.fn().mockResolvedValue({
      uuid: 'uuid',
      word: 'word',
      forms: ['words', 'wurd'],
    }),
    getWordsAndForms: jest.fn().mockResolvedValue([
      {
        wordDisplay: 'qibima',
        uuid: 'uuid',
      },
    ]),
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

    return mount(WordsInTextSearch, renderOptions);
  };

  it('gets words and forms on mount', async () => {
    createWrapper();
    expect(mockServer.getWordsAndForms).toHaveBeenCalled();
  });

  it('increases and decreases autocomplete options', async () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.test-increase-button').exists()).toBe(true);
    expect(wrapper.find('.test-decrease-button').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-1').exists()).toBe(false);
    expect(wrapper.find('.test-autocomplete-1').exists()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-2').exists()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-1').exists()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-3').exists()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-2').exists()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-4').exists()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-3').exists()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-5').exists()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-4').exists()).toBe(true);
    expect(wrapper.find('.test-increase-button').exists()).toBe(false);
    expect(wrapper.find('.test-decrease-button').exists()).toBe(true);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-5').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-4').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-4').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-3').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-3').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-2').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-2').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-1').exists()).toBe(false);
    await flushPromises();
  });
});
