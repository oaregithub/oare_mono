import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import CollectionTexts from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('CollectionTexts test', () => {
  const mockServer = {
    getCollectionTexts: jest.fn().mockResolvedValue({
      totalTexts: 1,
      texts: [
        {
          id: 1,
          uuid: 'test-uuid-1',
          type: 'text',
          name: 'Test Text',
          hasEpigraphy: true,
        },
      ],
    }),
    getCollectionInfo: jest.fn().mockResolvedValue({ name: 'Test Collection' }),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockStore = {
    getters: {},
    hasPermission: name => ['ADD_NEW_TEXTS'].includes(name),
  };
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', mockStore);

    return mount(CollectionTexts, {
      vuetify,
      localVue,
      propsData: {
        collectionUuid: 'test-uuid',
      },
      stubs: ['router-link'],
    });
  };

  it('gets collection info', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getCollectionInfo).toHaveBeenCalled();
  });

  it('displays error when fails to retrieve collection info', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getCollectionInfo: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('gets collection texts', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getCollectionTexts).toHaveBeenCalled();
  });

  it('displays error when fails to retrieve collection texts', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getCollectionTexts: jest.fn().mockRejectedValue({}),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
