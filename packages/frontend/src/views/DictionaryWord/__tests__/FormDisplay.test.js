import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import FormDisplay from '../FormDisplay.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('FormsDisplay test', () => {
  const mockServer = {
    updateForm: jest.fn().mockResolvedValue(null),
  };
  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };
  const mockStore = {
    getters: {
      permissions: {
        dictionary: ['UPDATE_FORM'],
      },
    },
  };
  const mockForm = {
    uuid: 'testUuid',
    form: 'test form',
    spellings: [],
    stems: [],
    morphologicalForms: [],
    tenses: [],
    persons: [],
    genders: [],
    grammaticalNumbers: [],
    cases: [],
    states: [],
    moods: [],
    clitics: [],
  };

  const updateForm = jest.fn();

  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', mockStore);

    return mount(FormDisplay, {
      vuetify,
      localVue,
      propsData: {
        form: mockForm,
        updateForm,
      },
      stubs: ['add-spelling-dialog'],
    });
  };

  it('allows form editing when clicking on pencil', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-pencil').trigger('click');
    expect(wrapper.get('.test-check'));
    expect(wrapper.get('.test-close'));
  });

  it('closes form editor when clicking on close button', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-close').trigger('click');

    expect(wrapper.find('.test-pencil'));
  });

  it('successfully edits form', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-edit input').setValue('new form');
    await wrapper.get('.test-check').trigger('click');
    await flushPromises();

    const updatedForm = {
      ...mockForm,
      form: 'new form',
    };
    expect(mockServer.updateForm).toHaveBeenCalledWith(updatedForm);
    expect(updateForm).toHaveBeenCalledWith(updatedForm);
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows errors snackbar when server fails', async () => {
    const failServer = {
      updateForm: jest.fn().mockRejectedValue(null),
    };
    const wrapper = createWrapper({ server: failServer });
    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-edit input').setValue('new form');
    await wrapper.get('.test-check').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
