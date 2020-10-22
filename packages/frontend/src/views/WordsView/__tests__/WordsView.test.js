import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import WordsView from '../index.vue';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('WordsView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockServer = {
    getDictionaryWords: jest.fn().mockResolvedValue({ words: [] }),
    getDictionaryPermissions: jest.fn().mockResolvedValue({ canEdit: false }),
  };

  const createWrapper = (props = {}) =>
    mount(WordsView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
        actions: mockActions,
        server: mockServer,
        ...props,
      },
      stubs: ['router-link'],
    });

  it('retrieves dictionary words', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDictionaryWords).toHaveBeenCalled();
  });

  it('retrieves dictionary permissions', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDictionaryPermissions).toHaveBeenCalled();
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

  it('shows error snackbar when permissions call fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getDictionaryPermissions: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
