import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import CollectionTexts from '../index.vue';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('CollectionTexts test', () => {
  const mockTexts = [
    {
      id: 1,
      uuid: '1',
      type: 'text',
      hasEpigraphy: true,
      name: 'CCT 3 31',
    },
    {
      id: 2,
      uuid: '2',
      type: 'text',
      hasEpigraphy: true,
      name: 'CCT 1 12b',
    },
  ];

  const mockSetQueryParam = jest.fn();

  const mockProps = {
    collectionUuid: 'test-uuid',
    router: {
      replace: jest.fn(),
    },
    serverProxy: {
      getCollectionTexts: jest.fn().mockResolvedValue({
        collectionName: 'Test Collection',
        totalTexts: 2,
        texts: mockTexts,
      }),
      getCollectionInfo: jest.fn().mockResolvedValue({
        name: 'Test Collection',
      }),
    },
  };

  const createWrapper = async () => {
    const wrapper = mount(CollectionTexts, {
      propsData: mockProps,
      localVue,
      vuetify,
      stubs: ['router-link'],
    });
    await flushPromises();
    return wrapper;
  };

  it('matches snapshot', async () => {
    const wrapper = await createWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  it('updates URL when searching', async () => {
    const wrapper = await createWrapper();
    const searchInput = wrapper.find('.test-search input');
    searchInput.setValue('text name');
  });
});
