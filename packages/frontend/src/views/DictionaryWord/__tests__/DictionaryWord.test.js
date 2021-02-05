import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import DictionaryWord from '../index.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DictionaryWord test', () => {
  const mockStore = {
    getters: {
      permissions: [],
    },
  };

  const mockServer = {
    getDictionaryInfo: jest.fn().mockResolvedValue({
      word: 'word',
      forms: [],
      partsOfSpeech: [],
      verbalThematicVowelTypes: [],
      specialClassifications: [],
      translations: [],
    }),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = ({ store, server } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(DictionaryWord, {
      localVue,
      vuetify,
      propsData: {
        uuid: 'test-uuid',
      },
      stubs: ['router-link'],
      mocks: {
        $route: {
          name: 'dictionaryWord',
        },
      },
    });
  };

  it('gets dictionary info on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDictionaryInfo).toHaveBeenCalled();
  });

  it('shows an error when the request fails', async () => {
    createWrapper({
      server: {
        getDictionaryInfo: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows pencil icon if user has edit permissions', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          permissions: [{ name: 'UPDATE_WORD_SPELLING' }],
        },
      },
    });
    await flushPromises();
    expect(wrapper.get('.test-pencil'));
  });

  // it('shows error when deleting spelling fails', async () => {
  //   const wrapper = createWrapper({
  //     server: {
  //       ...mockServer,
  //       removeSpelling: jest
  //         .fn()
  //         .mockRejectedValue('Failed to delete spelling'),
  //     },
  //   });
  //
  //   await wrapper.get('.testing-spelling').trigger('click');
  //   await wrapper.get('.test-close').trigger('click');
  //   await wrapper.get('.test-submit-btn').trigger('click');
  //   await flushPromises();
  //
  //   expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  //   expect(reload).not.toHaveBeenCalled();
  // });

  it('does not show pencil icon if user does not have edit permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-pencil').exists()).toBe(false);
  });

  it('check util list displays', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-util-list-displayed').exists()).toBe(false);
    await wrapper.get('.test-word-util-list').trigger('click');
    expect(wrapper.find('.test-util-list-displayed').exists()).toBe(true);
  });
});
