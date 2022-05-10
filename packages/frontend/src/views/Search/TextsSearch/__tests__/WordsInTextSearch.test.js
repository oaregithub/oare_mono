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
});
