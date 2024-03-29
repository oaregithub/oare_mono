import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ConnectSpellingOccurrence from '../ConnectSpellingOccurrence.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Connect Spelling Occurence test', () => {
  const mockForm = {
    uuid: 'uuid',
    form: 'form',
    properties: [],
  };

  const mockWord = {
    translations: [],
    properties: [],
    uuid: 'uuid',
    word: 'word',
    forms: [mockForm],
  };
  const spellingOccurrenceRow = {
    discourseUuid: 'discourseUuid',
    textName: 'textName',
    textUuid: 'textUuid',
    line: 1,
    wordOnTablet: 1,
    readings: ['reading1', 'reading2'],
  };

  const searchSpellingResultRow = {
    wordUuid: 'wordUuid',
    word: 'word',
    form: mockForm,
    spellingUuid: 'spellingUuid',
    occurrences: 2,
    wordInfo: mockWord,
  };

  const mockServer = {
    searchSpellings: jest.fn().mockResolvedValue([searchSpellingResultRow]),
    getSpellingTextOccurrences: jest
      .fn()
      .mockResolvedValue([spellingOccurrenceRow]),
    connectSpelling: jest.fn().mockResolvedValue(),
  };

  const mockProps = {
    discourseUuid: spellingOccurrenceRow.discourseUuid,
    spelling: 'spelling',
    searchSpellings: mockServer.searchSpellings,
    getTexts: mockServer.getSpellingTextOccurrences,
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: false,
    },
    hasPermission: () => true,
  };

  const setup = () => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', mockServer);
    sl.set('store', mockStore);
  };

  beforeEach(setup);

  const createWrapper = (props = mockProps) =>
    mount(ConnectSpellingOccurrence, {
      localVue,
      vuetify,
      propsData: props,
      stubs: ['router-link'],
    });

  it('gets dictionary info and text occurrences', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockProps.searchSpellings).toHaveBeenCalledWith(mockProps.spelling);

    const word = await wrapper.findAll('.test-word').at(0);
    expect(word.exists()).toBe(true);
    const reading = await wrapper.findAll('.test-reading').at(0);
    expect(reading.exists()).toBe(true);
  });

  it('shows error when mount fails', async () => {
    const props = {
      ...mockProps,
      searchSpellings: jest
        .fn()
        .mockRejectedValue('Error, unable to retrieve text occurrences'),
    };
    createWrapper(props);
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('submit button hidden from someone without permission', async () => {
    sl.set('store', {
      hasPermission: () => false,
    });
    const wrapper = createWrapper();
    await flushPromises();
    const submit = wrapper.find('.test-submit-btn');
    expect(submit.exists()).toBe(false);
  });

  it('submits', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.test-connect input').at(0).trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    const confirmationDialog = wrapper.find('.test-confirmation-dialog');
    expect(confirmationDialog.isVisible()).toBe(true);
    await wrapper.findAll('.test-submit-btn').at(1).trigger('click');
    await flushPromises();
    expect(mockServer.connectSpelling).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });
});
