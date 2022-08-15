import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import WordsView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('WordsView test', () => {
  const mockStore = {
    hasPermission: () => false,
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    getDictionaryWords: jest.fn().mockResolvedValue([]),
    getDictionaryPermissions: jest.fn().mockResolvedValue({ canEdit: false }),
  };

  const createWrapper = ({ store, server } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);

    return mount(WordsView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
        actions: mockActions,
        server: server || mockServer,
      },
      stubs: ['router-link'],
    });
  };

  it('retrieves dictionary words', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDictionaryWords).toHaveBeenCalled();
  });

  it('shows error snackbar when dictionary call fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getDictionaryWords: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows add button icon if user has add word permissions', async () => {
    const wrapper = createWrapper({
      store: {
        hasPermission: name => ['ADD_LEMMA'].includes(name),
      },
    });
    await flushPromises();
    expect(wrapper.get('.mb-8'));
  });
});
