import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import EpigraphyView from '../index.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Epigraphy View', () => {
  const mockServer = {
    getEpigraphicInfo: jest.fn().mockResolvedValue({
      collection: {
        uuid: 'test',
        name: 'test',
      },
      units: null,
      canWrite: false,
      textName: 'testName',
      cdliNum: 'test',
      color: 'red',
      colorMeaning: 'test meaning',
      discourseUnits: [],
      markups: [],
    }),
    getSingleDraft: jest.fn().mockResolvedValue({}),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: jest.fn().mockResolvedValue(false),
      permissions: ['VIEW_TEXT_DISCOURSE'],
    },
  };

  const mockRouter = {
    currentRoute: {
      name: 'epigraphy',
    },
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      textUuid: '123',
    },
    stubs: ['router-link', 'router-view'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
    sl.set('router', mockRouter);

    return mount(EpigraphyView, renderOptions);
  };

  it('displays error on text load error', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getEpigraphicInfo: jest.fn().mockRejectedValue({}),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
