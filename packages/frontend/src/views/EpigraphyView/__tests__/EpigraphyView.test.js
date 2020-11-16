import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import EpigraphyView from '../index.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Epigraphy View', () => {
  const mockServer = {
    getDiscourseUnits: jest.fn().mockRejectedValue({}),
    getEpigraphicInfo: jest.fn().mockRejectedValue({}),
    getEpigraphicMarkups: jest.fn().mockRejectedValue({}),
    getSingleDraft: jest.fn().mockRejectedValue({}),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: jest.fn().mockResolvedValue(false),
    },
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      textUuid: '123',
    },
    stubs: ['router-link'],
  };

  const createWrapper = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);

    return mount(EpigraphyView, renderOptions);
  };

  it('displays error on text load error', async () => {
    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
