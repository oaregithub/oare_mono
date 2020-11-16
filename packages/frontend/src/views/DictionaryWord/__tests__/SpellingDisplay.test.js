import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import SpellingDisplay from '../SpellingDisplay.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('SpellingDisplay test', () => {
  const updateSpelling = jest.fn();

  const spelling = {
    uuid: 'spelling-uuid',
    spelling: 'spelling',
    texts: [
      {
        uuid: 'text-uuid',
        text: 'text',
      },
    ],
  };

  const mockStore = {
    getters: {
      permissions: {
        dictionary: ['UPDATE_FORM'],
      },
    },
  };

  const mockServer = {
    updateSpelling: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('store', mockStore);
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    return mount(SpellingDisplay, {
      vuetify,
      localVue,
      propsData: {
        updateSpelling,
        spelling,
      },
      stubs: ['router-link'],
    });
  };

  it('shows number of texts next to spelling', () => {
    const wrapper = createWrapper();
    expect(Number(wrapper.get('.test-num-texts').text())).toBe(
      spelling.texts.length
    );
  });

  it('shows dialog when clicking on number of texts', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-num-texts').trigger('click');
    expect(wrapper.get('.test-dialog-title').text()).toBe(
      `Texts for ${spelling.spelling}`
    );
  });

  it('shows texts associated with spelling', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-num-texts').trigger('click');
    expect(wrapper.get('.test-text').text()).toBe(spelling.texts[0].text);
  });

  it('edits spelling', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-edit-spelling input').setValue('new spelling');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.updateSpelling).toHaveBeenCalledWith(
      spelling.uuid,
      'new spelling'
    );
    expect(updateSpelling).toHaveBeenCalledWith({
      ...spelling,
      spelling: 'new spelling',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar with response error message on 400', async () => {
    const wrapper = createWrapper({
      server: {
        updateSpelling: jest.fn().mockRejectedValue({
          response: {
            status: 400,
            data: {
              message: 'Fail message',
            },
          },
        }),
      },
    });

    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-edit-spelling input').setValue('new spelling');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalledWith('Fail message');
  });

  it('shows error snackbar on all other errors', async () => {
    const wrapper = createWrapper({
      server: {
        updateSpelling: jest
          .fn()
          .mockRejectedValue('Failed to update spelling'),
      },
    });
    await wrapper.get('.test-pencil').trigger('click');
    await wrapper.get('.test-edit-spelling input').setValue('new spelling');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
