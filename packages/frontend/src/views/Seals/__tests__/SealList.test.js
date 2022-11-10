import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import SealsView from '../SealList.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const sealList = [
  { name: 'seal1', uuid: 'uuid1', count: 3, imageLinks: [] },
  { name: 'seal2', uuid: 'uuid2', count: 0, imageLinks: ['link1'] },
];

const mockServer = {
  getAllSeals: jest.fn().mockResolvedValue(sealList),
  addSealLink: jest.fn().mockResolvedValue(),
};

const mockActions = {
  showErrorSnackbar: jest.fn(),
  showSnackbar: jest.fn(),
};

const mockStore = {
  hasPermission: () => true,
};

describe('Seal List test - Regular', () => {
  const createWrapper = ({ server, actions, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(SealsView, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        showRadioBtns: false,
        hideImages: false,
        showConnectSeal: false,
      },
    });
  };

  it('retrieves seals on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllSeals).toHaveBeenCalled();
  });

  it('shows error snackbar on error', async () => {
    createWrapper({
      server: { getAllSeals: jest.fn().mockRejectedValue() },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});

describe('Seal List test - Text Epigraphy', () => {
  const createWrapper = ({ server, actions, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(SealsView, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        showRadioBtns: true,
        hideImages: true,
        showConnectSeal: true,
        textEpigraphyUuid: 'teUuid',
      },
    });
  };

  it('retrieves seals on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllSeals).toHaveBeenCalled();
  });

  it('has no images', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-image').exists()).toBe(false);
  });

  it('has radio buttons', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find(`.radio-${sealList[0].uuid}`).exists()).toBe(true);
  });

  it('shows error snackbar on error', async () => {
    createWrapper({
      server: { getAllSeals: jest.fn().mockRejectedValue() },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
