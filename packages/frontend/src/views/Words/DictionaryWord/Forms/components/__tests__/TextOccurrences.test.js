import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import TextOccurrences from '../TextOccurrences.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextOccurrences test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const setup = () => {
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);
  };

  beforeEach(setup);

  const mockTitle = 'title';
  const mockPersonUuid = 'uuid';
  const mockTotalTextOccurrences = 2;
  const mockTextOccurrences = [
    {
      textName: 'Text1',
      readings: ['<strong>1. This is text 1</strong>'],
    },
    {
      textName: 'Text2',
      readings: ['<strong>2. This is text 2</strong>'],
    },
  ];

  const mockProps = {
    title: mockTitle,
    uuid: mockPersonUuid,
    totalTextOccurrences: mockTotalTextOccurrences,
    getTexts: jest.fn().mockResolvedValue(mockTextOccurrences),
  };

  const createWrapper = ({ props } = {}) =>
    mount(TextOccurrences, {
      vuetify,
      localVue,
      propsData: props || mockProps,
      stubs: ['router-link'],
    });

  it('gets person text occurrences', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockProps.getTexts).toHaveBeenCalledWith(mockPersonUuid, {
      limit: 10,
      page: 1,
    });

    const text = await wrapper.findAll('.test-text').at(0);
    expect(text.html()).toContain(mockTextOccurrences[0].textName);
    const reading = await wrapper.findAll('.test-reading').at(0);
    expect(reading.html()).toContain(mockTextOccurrences[0].readings);
  });

  it('fails to get person text occurrences', async () => {
    const props = {
      ...mockProps,
      getTexts: jest
        .fn()
        .mockRejectedValue('Error, unable to retrieve text occurrences'),
    };
    createWrapper({ props });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
