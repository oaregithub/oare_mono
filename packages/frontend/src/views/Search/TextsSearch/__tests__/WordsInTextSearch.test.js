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
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(true);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-autocomplete-1').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-2').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-1').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-3').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-2').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-4').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-3').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-5').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBetween-4').isVisible()).toBe(true);
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(true);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-5').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-4').isVisible()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-4').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-3').isVisible()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-3').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-2').isVisible()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    expect(wrapper.find('.test-autocomplete-2').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBetween-1').isVisible()).toBe(false);
    await flushPromises();
  });
});
