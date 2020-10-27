import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';
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
  const createWrapper = () => {
    sl.set('serverProxy', mockServer);
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

  it('gets collection texts', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getCollectionTexts).toHaveBeenCalled();
  });
});
