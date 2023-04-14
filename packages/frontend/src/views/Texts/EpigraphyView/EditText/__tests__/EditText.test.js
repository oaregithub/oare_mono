import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EditText from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EditText test', () => {
  const mockServer = {
    // Mocked Value is large because it needs to support testing each individual edit action
    getEpigraphicInfo: jest.fn().mockResolvedValue({
      text: {
        name: 'test-name',
      },
      units: [
        {
          uuid: 'test-1',
          side: null,
          column: null,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 1,
          epigType: 'epigraphicUnit',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-2',
          side: 'obv.',
          column: null,
          line: null,
          epigReading: 'obv.',
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 2,
          epigType: 'section',
          signUuid: null,
          readingUuid: null,
          reading: 'obv.',
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-3',
          side: 'obv.',
          column: 1,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 3,
          epigType: 'column',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-4',
          side: 'obv.',
          column: 1,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: 'discourse-1',
          objOnTablet: 4,
          epigType: 'region',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-4',
              type: 'broken',
              value: null,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-5',
          side: 'obv.',
          column: 1,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: 'discourse-2',
          objOnTablet: 5,
          epigType: 'region',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-5',
              type: 'ruling',
              value: 1,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-6',
          side: 'obv.',
          column: 1,
          line: null,
          epigReading: 'A',
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 6,
          epigType: 'region',
          signUuid: null,
          readingUuid: null,
          reading: 'A',
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-6',
              type: 'isSealImpression',
              value: null,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-7',
          side: 'obv.',
          column: 1,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: 'discourse-3',
          objOnTablet: 7,
          epigType: 'region',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-7',
              type: 'uninscribed',
              value: 1,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-8',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 8,
          epigType: 'line',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-9',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: 'a',
          charOnLine: 1,
          charOnTablet: 1,
          discourseUuid: 'discourse-4',
          objOnTablet: 9,
          epigType: 'sign',
          signUuid: 'sign-1',
          readingUuid: 'reading-1',
          reading: 'a',
          type: 'phonogram',
          value: 'a',
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-10',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: 'na',
          charOnLine: 2,
          charOnTablet: 2,
          discourseUuid: 'discourse-4',
          objOnTablet: 10,
          epigType: 'sign',
          signUuid: 'sign-2',
          readingUuid: 'reading-2',
          reading: 'na',
          type: 'phonogram',
          value: 'na',
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-11',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: null,
          charOnLine: 3,
          charOnTablet: 3,
          discourseUuid: 'discourse-4',
          objOnTablet: 11,
          epigType: 'undeterminedSigns',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-11',
              type: 'damage',
              value: null,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
            {
              referenceUuid: 'test-11',
              type: 'undeterminedSigns',
              value: 2,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-12',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: '|',
          charOnLine: 4,
          charOnTablet: 4,
          discourseUuid: null,
          objOnTablet: 12,
          epigType: 'separator',
          signUuid: 'sign-3',
          readingUuid: 'reading-3',
          reading: '|',
          type: 'punctuation',
          value: '|',
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-13',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: 'TÚG',
          charOnLine: 5,
          charOnTablet: 5,
          discourseUuid: 'discourse-5',
          objOnTablet: 13,
          epigType: 'sign',
          signUuid: 'sign-4',
          readingUuid: 'reading-4',
          reading: 'TÚG',
          type: 'logogram',
          value: 'TÚG',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-14',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: 'ḪI',
          charOnLine: 6,
          charOnTablet: 6,
          discourseUuid: 'discourse-5',
          objOnTablet: 14,
          epigType: 'sign',
          signUuid: 'sign-5',
          readingUuid: 'reading-5',
          reading: 'ḪI',
          type: 'logogram',
          value: 'ḪI',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-15',
          side: 'obv.',
          column: 1,
          line: 1.01,
          epigReading: 'A',
          charOnLine: 7,
          charOnTablet: 7,
          discourseUuid: 'discourse-5',
          objOnTablet: 15,
          epigType: 'sign',
          signUuid: 'sign-1',
          readingUuid: 'reading-6',
          reading: 'A',
          type: 'logogram',
          value: 'A',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-16',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 16,
          epigType: 'line',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-17',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: 'a',
          charOnLine: 1,
          charOnTablet: 8,
          discourseUuid: 'discourse-6',
          objOnTablet: 17,
          epigType: 'sign',
          signUuid: 'sign-1',
          readingUuid: 'reading-1',
          reading: 'a',
          type: 'phonogram',
          value: 'a',
          spellingUuid: 'spelling-2',
          markups: [],
        },
        {
          uuid: 'test-18',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: 'na',
          charOnLine: 2,
          charOnTablet: 9,
          discourseUuid: 'discourse-6',
          objOnTablet: 18,
          epigType: 'sign',
          signUuid: 'sign-2',
          readingUuid: 'reading-2',
          reading: 'na',
          type: 'phonogram',
          value: 'na',
          spellingUuid: 'spelling-2',
          markups: [],
        },
        {
          uuid: 'test-19',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: 'TÚG',
          charOnLine: 3,
          charOnTablet: 10,
          discourseUuid: 'discourse-7',
          objOnTablet: 19,
          epigType: 'sign',
          signUuid: 'sign-4',
          readingUuid: 'reading-4',
          reading: 'TÚG',
          type: 'logogram',
          value: 'TÚG',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-20',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: 'ḪI',
          charOnLine: 4,
          charOnTablet: 11,
          discourseUuid: 'discourse-7',
          objOnTablet: 20,
          epigType: 'sign',
          signUuid: 'sign-5',
          readingUuid: 'reading-5',
          reading: 'ḪI',
          type: 'logogram',
          value: 'ḪI',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-21',
          side: 'obv.',
          column: 1,
          line: 2.01,
          epigReading: 'A',
          charOnLine: 5,
          charOnTablet: 12,
          discourseUuid: 'discourse-7',
          objOnTablet: 21,
          epigType: 'sign',
          signUuid: 'sign-1',
          readingUuid: 'reading-6',
          reading: 'A',
          type: 'logogram',
          value: 'A',
          spellingUuid: 'spelling-1',
          markups: [],
        },
        {
          uuid: 'test-22',
          side: 'obv.',
          column: 1,
          line: 3.01,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: 'discourse-8',
          objOnTablet: 22,
          epigType: 'undeterminedLines',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [
            {
              referenceUuid: 'test-22',
              type: 'undeterminedLines',
              value: 1,
              startChar: null,
              endChar: null,
              altReading: null,
              altReadingUuid: null,
            },
          ],
        },
        {
          uuid: 'test-23',
          side: 'obv.',
          column: 2,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 23,
          epigType: 'column',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-24',
          side: 'rev.',
          column: null,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 24,
          epigType: 'section',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
        {
          uuid: 'test-25',
          side: 'rev.',
          column: 1,
          line: null,
          epigReading: null,
          charOnLine: null,
          charOnTablet: null,
          discourseUuid: null,
          objOnTablet: 25,
          epigType: 'column',
          signUuid: null,
          readingUuid: null,
          reading: null,
          type: null,
          value: null,
          spellingUuid: null,
          markups: [],
        },
      ],
    }),
    editText: jest.fn().mockResolvedValue(),
    getFormattedSign: jest.fn().mockResolvedValue(['a']),
    getSignCode: jest.fn().mockResolvedValue({
      uuid: 'test-uuid',
      signUuid: 'test-sign-uuid',
      readingUuid: 'test-reading-uuid',
      type: 'image',
      code: '1',
      post: '-',
      sign: 'test-sign',
      reading: 'test-reading',
      value: 'test-value',
      readingType: 'logogram',
    }),
    searchSpellings: jest.fn().mockResolvedValue([]),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockStore = {
    getters: {
      isAdmin: true,
    },
  };
  const mockRouter = {
    push: jest.fn(),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
    sl.set('router', mockRouter);

    return mount(EditText, {
      vuetify,
      localVue,
      propsData: {
        textUuid: 'test-text-uuid',
      },
    });
  };

  it('displays text', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getEpigraphicInfo).toHaveBeenCalled();
    const words = wrapper.findAll('.test-editor-word');
    expect(words.length).toBe(5);
  });

  it('adds side', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addSide').trigger('click');
    await wrapper.findAll('.test-side-option').at(0).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'addSide', side: 'lo.e.' })
    );
  });

  it('adds column', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addColumn').trigger('click');
    await wrapper.findAll('.test-insert-button').at(0).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'addColumn', column: 1 })
    );
  });

  it('adds broken area', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addRegionBroken').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addRegionBroken',
      })
    );
  });

  it('adds ruling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addRegionRuling').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addRegionRuling',
        regionValue: 1,
      })
    );
  });

  it('adds seal impression', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addRegionSealImpression').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.test-region-label input').setValue('A');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addRegionSealImpression',
        regionLabel: 'A',
      })
    );
  });

  it('adds uninscribed lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addRegionUninscribed').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addRegionUninscribed',
        regionValue: 1,
      })
    );
  });

  it('adds line', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addLine').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.test-line-text textarea').setValue('a');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addLine',
        row: expect.objectContaining({
          text: 'a',
        }),
      })
    );
  });

  it('adds broken lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addUndeterminedLines').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'addUndeterminedLines', number: 1 })
    );
  });

  it('adds word', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addWord').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.test-line-text textarea').setValue('a');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addWord',
        row: expect.objectContaining({
          text: 'a',
        }),
      })
    );
  });

  it('adds sign', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addSign').trigger('click');
    await wrapper.get('.test-editor-word').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.test-line-text textarea').setValue('a');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addSign',
        sign: expect.objectContaining({
          reading: 'a',
        }),
      })
    );
  });

  it('adds broken signs', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addUndeterminedSigns').trigger('click');
    await wrapper.get('.test-editor-word').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addUndeterminedSigns',
        number: 1,
      })
    );
  });

  it('adds divider', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-add-button').trigger('click');
    await wrapper.get('.test-addDivider').trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addDivider',
      })
    );
  });

  it('edits side', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editSide').trigger('click');
    await wrapper.findAll('.v-select__selections').at(0).trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    await wrapper.findAll('.v-select__selections').at(1).trigger('click');
    await wrapper.findAll('.v-list-item__title').at(2).trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editSide',
        originalSide: 'obv.',
        newSide: 'lo.e.',
      })
    );
  });

  it('reorders columns', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editColumn').trigger('click');
    await wrapper.get('.test-move-column-right').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editColumn',
        column: 1,
        direction: 'right',
      })
    );
  });

  it('converts broken area to broken lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editRegionBroken').trigger('click');
    await wrapper.get('.test-editor-region').trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editRegionBroken',
        regionType: 'broken',
        regionValue: 1,
      })
    );
  });

  it('edits ruling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editRegionRuling').trigger('click');
    await wrapper.findAll('.test-editor-region').at(1).trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(1).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editRegionRuling',
        regionType: 'ruling',
        regionValue: 2,
      })
    );
  });

  it('edits seal impression', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editRegionSealImpression').trigger('click');
    await wrapper.findAll('.test-editor-region').at(2).trigger('click');
    await wrapper.get('.test-edit-region-label input').setValue('B');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editRegionSealImpression',
        regionType: 'isSealImpression',
        regionLabel: 'B',
      })
    );
  });

  it('edits uninscribed lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editRegionUninscribed').trigger('click');
    await wrapper.findAll('.test-editor-region').at(3).trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(1).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editRegionUninscribed',
        regionType: 'uninscribed',
        regionValue: 2,
      })
    );
  });

  it('edits broken lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editUndeterminedLines').trigger('click');
    await wrapper.findAll('.test-editor-region').at(4).trigger('click');
    await wrapper.get('.v-select__selections').trigger('click');
    await wrapper.findAll('.v-list-item__title').at(1).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editUndeterminedLines',
        number: 2,
      })
    );
  });

  it('converts broken lines to broken area', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editUndeterminedLines').trigger('click');
    await wrapper.findAll('.test-editor-region').at(4).trigger('click');
    await wrapper.get('.test-convert-to-broken-area input').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editUndeterminedLines',
        convertToBrokenArea: true,
      })
    );
  });

  it('edits sign', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editSign').trigger('click');
    await wrapper.get('.test-editor-sign').trigger('click');
    await wrapper.get('.test-line-text textarea').setValue('na');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editSign',
        sign: expect.objectContaining({
          markup: expect.objectContaining({
            text: 'na',
          }),
        }),
      })
    );
  });

  it('edits sign markup', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editSign').trigger('click');
    await wrapper.get('.test-editor-sign').trigger('click');
    await flushPromises();
    await wrapper.get('.test-edit-markup').trigger('click');
    await wrapper.get('.test-damage-check input').trigger('click');
    expect(wrapper.get('.test-submit-btn').text()).toBe('OK');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(wrapper.findAll('.test-submit-btn').at(1).element).toBeEnabled();
    await wrapper.findAll('.test-submit-btn').at(1).trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.test-submit-btn').at(1).element).toBeEnabled();
    await wrapper.findAll('.test-submit-btn').at(1).trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editSign',
        markup: [expect.objectContaining({ type: 'damage' })],
      })
    );
  });

  it('edits brokens signs number', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editUndeterminedSigns').trigger('click');
    await wrapper.findAll('.test-editor-sign').at(2).trigger('click');
    await flushPromises();
    await wrapper.findAll('.v-select__selections').at(0).trigger('click');
    await wrapper.findAll('.v-list-item__title').at(0).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editUndeterminedSigns',
        number: 1,
      })
    );
  });

  it('edits broken signs markup', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editUndeterminedSigns').trigger('click');
    await wrapper.findAll('.test-editor-sign').at(2).trigger('click');
    await flushPromises();
    await wrapper.get('.test-edit-markup').trigger('click');
    await wrapper.get('.test-damage-check input').trigger('click');
    expect(wrapper.get('.test-submit-btn').text()).toBe('OK');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(wrapper.findAll('.test-submit-btn').at(1).element).toBeEnabled();
    await wrapper.findAll('.test-submit-btn').at(1).trigger('click');
    await flushPromises();
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editUndeterminedSigns',
        markup: [],
      })
    );
  });

  it('edits divider markup', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-editDivider').trigger('click');
    await wrapper.findAll('.test-editor-sign').at(3).trigger('click');
    await wrapper.get('.test-damage-check input').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editDivider',
        markup: [expect.objectContaining({ type: 'damage' })],
      })
    );
  });

  it('splits line', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-split-button').trigger('click');
    await wrapper.get('.test-splitLine').trigger('click');
    await wrapper.get('.test-split-button').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'splitLine',
      })
    );
  });

  it('splits word', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-split-button').trigger('click');
    await wrapper.get('.test-splitWord').trigger('click');
    await wrapper.get('.test-editor-word').trigger('click');
    await wrapper.get('.test-split-button').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'splitWord',
        firstSpelling: 'a',
        secondSpelling: 'na-xx',
      })
    );
  });

  it('merges lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-merge-button').trigger('click');
    await wrapper.get('.test-mergeLine').trigger('click');
    await wrapper.findAll('.test-merge-line input').at(0).trigger('click');
    await wrapper.findAll('.test-merge-line input').at(1).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mergeLine',
        firstLine: 1.01,
        secondLine: 2.01,
      })
    );
  });

  it('merges words', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-merge-button').trigger('click');
    await wrapper.get('.test-mergeWord').trigger('click');
    await wrapper
      .findAll('.test-merge-word-check input')
      .at(2)
      .trigger('click');
    await wrapper
      .findAll('.test-merge-word-check input')
      .at(3)
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mergeWord',
        spelling: 'a-na-TÚG.ḪI.A',
      })
    );
  });

  it('reorders signs', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-reorder-button').trigger('click');
    await wrapper.get('.test-reorderSign').trigger('click');
    await wrapper.get('.test-editor-word').trigger('click');
    await wrapper
      .findAll('.test-reorder-sign-check input')
      .at(0)
      .trigger('click');
    await wrapper
      .findAll('.test-reorder-sign-check input')
      .at(1)
      .trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'reorderSign',
        spelling: 'na-a-xx',
      })
    );
  });

  it('cleans lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-clean-button').trigger('click');
    await wrapper.get('.test-cleanLine').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cleanLine',
      })
    );
  });

  it('removes side', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeSide').trigger('click');
    await wrapper.get('.test-side-option').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'removeSide', side: 'obv.' })
    );
  });

  it('removes column', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeColumn').trigger('click');
    await wrapper.get('.test-remove-column').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'removeColumn', column: 1 })
    );
  });

  it('removes broken area', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeRegionBroken').trigger('click');
    await wrapper.get('.test-remove-region').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeRegionBroken',
      })
    );
  });

  it('removes ruling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeRegionRuling').trigger('click');
    await wrapper.get('.test-remove-region').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeRegionRuling',
      })
    );
  });

  it('removes seal impression', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeRegionSealImpression').trigger('click');
    await wrapper.get('.test-remove-region').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeRegionSealImpression',
      })
    );
  });

  it('removes uninscribed lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeRegionUninscribed').trigger('click');
    await wrapper.get('.test-remove-region').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeRegionUninscribed',
      })
    );
  });

  it('removes line', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeLine').trigger('click');
    await wrapper.get('.test-remove-line').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeLine',
        line: 1.01,
      })
    );
  });

  it('removes broken lines', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeUndeterminedLines').trigger('click');
    await wrapper.get('.test-remove-undetermined-lines').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeUndeterminedLines',
      })
    );
  });

  it('removes word', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeWord').trigger('click');
    await wrapper.get('.test-editor-word').trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeWord',
        line: 1.01,
      })
    );
  });

  it('removes sign', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeSign').trigger('click');
    await wrapper.get('.test-editor-sign').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeSign',
        line: 1.01,
        spelling: 'na-xx',
      })
    );
  });

  it('removes broken signs', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeUndeterminedSigns').trigger('click');
    await wrapper.findAll('.test-editor-sign').at(2).trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeUndeterminedSigns',
        line: 1.01,
        spelling: 'a-na',
      })
    );
  });

  it('removes divider', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-remove-button').trigger('click');
    await wrapper.get('.test-removeDivider').trigger('click');
    await wrapper.findAll('.test-editor-sign').at(3).trigger('click');
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.editText).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removeDivider',
        line: 1.01,
      })
    );
  });
});
