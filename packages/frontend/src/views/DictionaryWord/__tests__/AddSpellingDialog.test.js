import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import AddSpellingDialog from '../AddSpellingDialog.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddSpellingDialog test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    addSpelling: jest.fn().mockResolvedValue({ uuid: 'new-uuid' }),
    searchSpellings: jest.fn().mockResolvedValue([
      {
        wordUuid: 'word-uuid',
        word: 'word',
        form: {
          form: 'form',
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
  };

  const addSpellingToForm = jest.fn();
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('globalActions', actions || mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', mockLodash);

    return mount(AddSpellingDialog, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      propsData: {
        value: true,
        form: {
          uuid: 'form-uuid',
          form: 'form',
          spellings: [
            {
              uuid: 'spelling-uuid',
              spelling: 'spelling',
              texts: [],
            },
          ],
        },
        addSpellingToForm,
      },
    });
  };

  it('submit button is disabled with no input', async () => {
    const wrapper = createWrapper();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
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
        limit: 10,
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
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.addSpelling).toHaveBeenCalledWith({
      formUuid: 'form-uuid',
      spelling: 'new spelling',
    });
    expect(addSpellingToForm).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error when adding fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addSpelling: jest.fn().mockRejectedValue('Failed to add spelling'),
      },
    });
    await wrapper.get('.test-spelling-field input').setValue('new spelling');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(addSpellingToForm).not.toHaveBeenCalled();
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
