import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '@/views/DictionaryWord/index.vue';
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

  const mockStore = {
    hasPermission: name => ['DISCONNECT_SPELLING'].includes(name),
  };

  const mockServer = {
    disconnectSpellings: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);
    sl.set('store', mockStore);
    sl.set('serverProxy', mockServer);
  };

  beforeEach(setup);

  const mockTitle = 'title';
  const mockPersonUuids = ['uuids'];
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
  const mockTextOccurrencesCount = [
    {
      uuid: 'uuid',
      count: 2,
    },
  ];

  const mockProps = {
    title: mockTitle,
    spellingUuids: mockPersonUuids,
    value: true,
    totalTextOccurrences: mockTotalTextOccurrences,
    getTexts: jest.fn().mockResolvedValue(mockTextOccurrences),
    getTextsCount: jest.fn().mockResolvedValue(mockTextOccurrencesCount),
  };

  const reload = jest.fn();

  const createWrapper = ({ props } = {}) =>
    mount(TextOccurrences, {
      vuetify,
      localVue,
      provide: {
        [ReloadKey]: reload,
      },
      propsData: props || mockProps,
      stubs: ['router-link'],
    });

  it('gets person text occurrences', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockProps.getTexts).toHaveBeenCalledWith(mockPersonUuids, {
      limit: 10,
      page: 1,
    });

    const text = await wrapper.findAll('.test-text').at(0);
    expect(text.html()).toContain(mockTextOccurrences[0].textName);
    const reading = await wrapper.findAll('.test-reading').at(0);
    expect(reading.html()).toContain(mockTextOccurrences[0].readings);
  });

  it('shows error when fails to get person text occurrences', async () => {
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

  it('disconnects spellings', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-disconnect input').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.disconnectSpellings).toHaveBeenCalled();
  });

  it('displays error on failed spelling disconnect', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      disconnectSpellings: jest
        .fn()
        .mockRejectedValue('failed to disconnect spelling'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-disconnect input').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('does not show disconnect buttons if user does not have permission', async () => {
    sl.set('store', {
      ...mockStore,
      hasPermission: () => false,
    });
    const wrapper = createWrapper();
    await flushPromises();
    const disconnectBox = wrapper.find('.test-disconnect input');
    expect(disconnectBox.exists()).toBe(false);
  });
});
