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
    getDictItems: jest.fn().mockResolvedValue([
      {
        info: { uuid: 'uuid', wordUuid: 'wordUuid', name: 'name' },
        wordDisplay: 'qibima',
      },
      {
        info: { uuid: 'uuid2', wordUuid: 'wordUuid2', name: 'name2' },
        wordDisplay: 'umma',
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
    await flushPromises();
    expect(mockServer.getDictItems).toHaveBeenCalled();
  });

  it('changes to parse properties and back', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-combobox-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-combobox-btn-word-forms').isVisible()).toBe(
      true
    );
    await wrapper.find('.test-combobox-btn-word-forms').trigger('click');
    expect(wrapper.find('.test-combobox-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(true);
    await wrapper.find('.test-combobox-btn-parse-props').trigger('click');
    expect(wrapper.find('.test-combobox-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
  });

  it('increases and decreases combobox options', async () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(true);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-combobox-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-numWordsBefore-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-2').isVisible()).toBe(true);
    expect(wrapper.find('.test-combobox-2').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-3').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-3').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-4').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-4').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-5').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-5').isVisible()).toBe(true);
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(true);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-5').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-5').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-4').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-4').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-3').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-3').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-combobox-2').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-2').exists()).toBe(false);
  });
});
