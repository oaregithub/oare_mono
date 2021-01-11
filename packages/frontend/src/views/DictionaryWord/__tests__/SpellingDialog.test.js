import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import { ReloadKey } from '../index.vue';
import SpellingDialog from '../SpellingDialog.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('SpellingDialog test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
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
  };

  const reload = jest.fn();

  const createWrapper = ({ spelling, server, actions } = {}) => {
    sl.set('globalActions', actions || mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', mockLodash);

    return mount(SpellingDialog, {
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
});
