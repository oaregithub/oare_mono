import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '../../../index.vue';
import EditWordDialog from '../EditWordDialog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EditWordDialog test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockStore = {
    getters: {
      permissions: [{ name: 'INSERT_DISCOURSE_ROWS' }],
    },
  };

  const mockSpelling = {
    uuid: 'spelling-uuid',
    spelling: 'spelling',
  };

  const mockServer = {
    addSpelling: jest.fn().mockResolvedValue({ uuid: 'new-uuid' }),
    searchSpellings: jest.fn().mockResolvedValue([
      {
        wordUuid: 'word-uuid',
        word: 'word',
        form: {
          uuid: 'form-uuid',
          form: 'form',
          stems: [],
          tenses: [],
          persons: [],
          genders: [],
          grammaticalNumbers: [],
          cases: [],
          states: [],
          moods: [],
          clitics: [],
          morphologicalForms: [],
          suffix: null,
          spellings: [],
        },
        wordInfo: {
          uuid: 'word-uuid',
          word: 'test-word',
          forms: [
            {
              form: 'test-form-1',
            },
            {
              form: 'test-form-2',
            },
          ],
          partsOfSpeech: [
            {
              uuid: 'test-pos-uuid',
              name: 'test-pos-name',
              referenceUuid: 'test-pos-ref-uuid',
              valueUuid: 'test-value-uuid',
            },
          ],
          verbalThematicVowelTypes: [],
          translations: [],
          specialClassifications: [],
        },
      },
    ]),
    searchSpellingDiscourse: jest.fn().mockResolvedValue({
      totalResults: 1,
      rows: [
        {
          line: 1,
          wordOnTablet: 10,
          textUuid: 'text-uuid',
          textName: 'text name',
          readings: [
            {
              wordOnTablet: 10,
              spelling: 'spelling',
            },
          ],
        },
      ],
    }),
    updateSpelling: jest.fn().mockResolvedValue(null),
    checkSpelling: jest.fn().mockResolvedValue({
      errors: [],
    }),
    searchNullDiscourse: jest.fn().mockResolvedValue([
      {
        textUuid: 'testUuid',
        epigraphyUuids: ['1'],
        line: 1,
        textName: 'test name',
        reading: 'test reading',
      },
    ]),
    searchNullDiscourseCount: jest.fn().mockResolvedValue(1),
    insertDiscourseRow: jest.fn().mockResolvedValue(),
  };

  const reload = jest.fn();

  const createWrapper = ({ spelling, server, store } = {}) => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', mockLodash);
    sl.set('store', store || mockStore);

    return mount(EditWordDialog, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      provide: {
        [ReloadKey]: reload,
      },
      propsData: {
        value: true,
        ...(spelling ? { spelling } : null),
        form: {
          uuid: 'form-uuid',
          form: 'form',
          stems: [],
          tenses: [],
          persons: [],
          genders: [],
          grammaticalNumbers: [],
          cases: [],
          states: [],
          moods: [],
          clitics: [],
          morphologicalForms: [],
          suffix: null,
          spellings: [
            {
              uuid: 'spelling-uuid',
              spelling: 'spelling',
              texts: [],
            },
          ],
        },
        spellingInput: 'spelling-input',
        allowDiscourseMode: true,
      },
    });
  };

  it('submit button is disabled with no input', async () => {
    const wrapper = createWrapper();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('immediately performs search for edit spellings', async () => {
    createWrapper({
      spelling: mockSpelling,
    });
    await flushPromises();
    expect(mockServer.searchSpellings).toHaveBeenCalled();
    expect(mockServer.searchSpellingDiscourse).toHaveBeenCalled();
  });

  it('checks spelling for errors', async () => {
    createWrapper({
      spelling: mockSpelling,
    });
    await flushPromises();
    expect(mockServer.checkSpelling).toHaveBeenCalled();
  });

  it('shows error if checking for spellings fails', async () => {
    createWrapper({
      spelling: mockSpelling,
      server: {
        ...mockServer,
        checkSpelling: jest.fn().mockRejectedValue('Failed to check spelling'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it("doesn't allow submission if spelling contains errors", async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
      server: {
        ...mockServer,
        checkSpelling: jest.fn().mockResolvedValue({
          errors: ['Invalid reading: bad', 'Invalid reading: spelling'],
        }),
      },
    });
    await flushPromises();
    await wrapper.get('.test-spelling-field input').setValue('bad spelling');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('updates spellings', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
    });
    await flushPromises();
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.updateSpelling).toHaveBeenCalledWith(
      'spelling-uuid',
      'new spelling',
      []
    );
  });

  it('searches for forms', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    expect(mockServer.searchSpellings).toHaveBeenCalledWith('new spelling');
  });

  it('searches discourses', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    expect(mockServer.searchSpellingDiscourse).toHaveBeenCalledWith(
      'new spelling',
      {
        page: 0,
        limit: 50,
      }
    );
  });

  it('submit button is disabled if searched spelling already exists on form', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-spelling-field input').setValue('spelling');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('successfully adds spelling', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.addSpelling).toHaveBeenCalledWith({
      formUuid: 'form-uuid',
      spelling: 'new spelling',
      discourseUuids: [],
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('shows error when adding fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addSpelling: jest.fn().mockRejectedValue('Failed to add spelling'),
      },
    });
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows error when searching spellings fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchSpellings: jest
          .fn()
          .mockRejectedValue('Failed to search spellings'),
      },
    });
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows error when searching discourse fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        searchSpellingDiscourse: jest
          .fn()
          .mockRejectedValue('Failed to search spellings'),
      },
    });
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('gets null discourses on discourse switch', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await flushPromises();
    expect(mockServer.searchNullDiscourse).toHaveBeenCalledWith(
      'spelling',
      1,
      50,
      false
    );
    expect(mockServer.searchNullDiscourseCount).toHaveBeenCalledWith(
      'spelling',
      false
    );
  });

  it('shows superfluous results on toggle', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-superfluous-toggle input').trigger('click');
    await flushPromises();
    expect(mockServer.searchNullDiscourse).toHaveBeenCalledWith(
      'spelling',
      1,
      50,
      true
    );
    expect(mockServer.searchNullDiscourseCount).toHaveBeenCalledWith(
      'spelling',
      true
    );
  });

  it('hides discourse switch if user does not have permission', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          permissions: [],
        },
      },
    });
    expect(wrapper.find('.test-discourse-mode input').exists()).toBe(false);
  });

  it('shows error on failed null discourse search', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
      server: {
        ...mockServer,
        searchNullDiscourse: jest
          .fn()
          .mockRejectedValue('failed search null discourse'),
      },
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('shows error on failed null discourse count', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
      server: {
        ...mockServer,
        searchNullDiscourseCount: jest
          .fn()
          .mockRejectedValue('failed search null discourse count'),
      },
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully inserts new discourse row', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.insertDiscourseRow).toHaveBeenCalled();
  });

  it('displays error on failed discourse row insert', async () => {
    const wrapper = createWrapper({
      spelling: mockSpelling,
      server: {
        ...mockServer,
        insertDiscourseRow: jest
          .fn()
          .mockRejectedValue('failed to insert new discourse row'),
      },
    });
    await wrapper.get('.test-discourse-mode input').trigger('click');
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
