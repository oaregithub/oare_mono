import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EpigraphyFullDisplay from '../EpigraphyFullDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EpigraphyFullDisplay View', () => {
  const mockStore = {
    getters: {
      isAdmin: true,
    },
    hasPermission: name =>
      [
        'VIEW_TEXT_DISCOURSE',
        'CONNECT_SPELLING',
        'DISCONNECT_SPELLING',
      ].includes(name),
  };

  const mockRouter = {
    currentRoute: {
      name: 'fullDisplay',
    },
  };

  const mockServer = {
    getDictionaryInfoByDiscourseUuid: jest.fn().mockResolvedValue({
      uuid: 'test-word-uuid',
      word: 'test-word',
      forms: [],
      properties: [],
      translationsForDefinition: [],
      discussionLemmas: [],
    }),
    getSpellingByDiscourseUuid: jest
      .fn()
      .mockResolvedValue({ spelling: 'spelling' }),
    searchSpellings: jest.fn().mockResolvedValue([]),
    getSpellingOccurrencesTexts: jest.fn().mockResolvedValue([]),
    disconnectSpellings: jest.fn().mockResolvedValue([]),
  };

  const mostEpigraphicUnits = [
    {
      charOnLine: 4,
      charOnTablet: 4,
      column: 0,
      discourseUuid: 'test-discourse-uuid',
      epigReading: 'GIN',
      epigType: 'sign',
      line: 1,
      markups: [],
      objOnTablet: null,
      reading: 'GIN',
      readingUuid: 'test-reading-uuid',
      side: 'obv.',
      signUuid: 'test-sign-uuid',
      type: 'logogram',
      uuid: 'test-uuid',
      value: 'GIN',
    },
  ];

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
    closeSnackbar: jest.fn(),
  };

  const renderOptions = epigraphicUnits => ({
    localVue,
    vuetify,
    propsData: {
      epigraphicUnits,
      markupUnits: [],
      discourseUnits: [],
    },
  });

  const createWrapper = ({ store, server, actions, epigraphicUnits } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('router', mockRouter);

    return mount(
      EpigraphyFullDisplay,
      renderOptions(epigraphicUnits || mostEpigraphicUnits)
    );
  };

  it('displays discourses when user has permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-discourses').exists()).toBe(true);
  });

  it('does not display discourses when user does not have permission', async () => {
    const wrapper = createWrapper({
      store: {
        ...mockStore,
        hasPermission: () => false,
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-discourses').exists()).toBe(false);
  });

  it('display epigraphy reading dialog when word is selected', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const readings = await wrapper.get('.test-epigraphies');
    expect(readings.html()).toContain('GIN');
    expect(mockActions.showSnackbar).not.toHaveBeenCalled();

    let dialogExists = await wrapper
      .find('.test-rendering-word-dialog')
      .exists();
    expect(dialogExists).toBe(false);
    await readings.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();

    dialogExists = await wrapper.find('.test-rendering-word-dialog').exists();
    expect(dialogExists).toBe(true);
  });

  it('displays disconnect button when user has permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-disconnect-word').exists()).toBe(true);
  });

  it('does not display disconnect button when user does not have permission', async () => {
    const wrapper = createWrapper({
      store: {
        ...mockStore,
        hasPermission: () => false,
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-disconnect-word').exists()).toBe(false);
  });

  it('disconnects the word from its spelling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    await wrapper.get('.test-disconnect-word').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.disconnectSpellings).toHaveBeenCalledTimes(1);
  });

  it('displays snackbar if attempt to disconnect spelling is unsuccessful', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        disconnectSpellings: jest.fn().mockRejectedValue(),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    await wrapper.get('.test-disconnect-word').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('display snackbar if no spelling for discourseUuid and dialog does not display', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          isAdmin: false,
        },
        hasPermission: name => ['VIEW_TEXT_DISCOURSE'].includes(name),
      },
      server: {
        getDictionaryInfoByDiscourseUuid: jest.fn().mockResolvedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalledTimes(2);

    const dialogExists = await wrapper
      .find('.test-rendering-word-dialog')
      .exists();
    expect(dialogExists).toBe(false);
  });

  it('display connect spelling dialog if no dictionary info for a given discourseUuid', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getDictionaryInfoByDiscourseUuid: jest.fn().mockResolvedValue(null),
      },
      store: {
        ...mockStore,
        hasPermission: () => true,
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalledTimes(1);

    const dialogExists = await wrapper
      .find('.test-spelling-occurrence-display')
      .exists();
    expect(dialogExists).toBe(true);
  });

  it('display error snackbar when unable to retrieve word info for rendered word', async () => {
    const wrapper = createWrapper({
      server: {
        getDictionaryInfoByDiscourseUuid: jest
          .fn()
          .mockRejectedValue('Unable to retrieve word info by discourseUuid'),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays snackbar when discourse uuid is missing', async () => {
    const wrapper = createWrapper({
      epigraphicUnits: [
        {
          ...mostEpigraphicUnits[0],
          discourseUuid: null,
        },
      ],
    });
    await flushPromises();
    await wrapper.findAll('.test-rendered-word').at(0).trigger('click');
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalledTimes(2);

    const dialogExists = await wrapper
      .find('.test-rendering-word-dialog')
      .exists();
    expect(dialogExists).toBe(false);
  });
});
