import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import NamesView from '../index.vue';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('NamesView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockServer = {
    getNames: jest.fn().mockResolvedValue([]),
  };

  const createWrapper = (props = {}) =>
    mount(NamesView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
        server: mockServer,
        actions: mockActions,
        ...props,
      },
      stubs: ['router-link'],
    });

  it('gets names on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getNames).toHaveBeenCalled();
  });

  it('shows snackbar when name retrieval fails', async () => {
    createWrapper({
      server: {
        getNames: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
