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
      permissions: [
        {
          name: 'VIEW_TEXT_DISCOURSE',
        },
      ],
      isAdmin: true,
    },
  };

  const mockServer = {
    getDictionaryInfoByDiscourseUuid: jest.fn().mockResolvedValue({
      uuid: 'test-word-uuid',
      word: 'test-word',
      forms: [],
      partsOfSpeech: [],
      verbalThematicVowelTypes: [],
      specialClassifications: [],
      translations: [],
    }),
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
        getters: {
          permissions: [],
        },
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

  it('display snackbar if no spelling for discourseUuid and dialog does not display', async () => {
    const wrapper = createWrapper({
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
