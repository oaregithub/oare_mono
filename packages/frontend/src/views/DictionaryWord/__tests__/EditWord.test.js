import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import EditWord from '../EditWord.vue';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EditWord test', () => {
  const mockServer = {
    editWord: jest.fn().mockResolvedValue({
      translations: [],
    }),
  };
  const mockSnackbar = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };
  const mockProps = {
    uuid: 'uuid',
    wordInfo: {
      word: 'test word',
      forms: [],
      partsOfSpeech: [],
      verbalThematicVowelTypes: [],
      specialClassifications: [],
      translations: [],
    },
    serverProxy: mockServer,
    actions: mockSnackbar,
  };
  const createWrapper = (props = mockProps) =>
    mount(EditWord, {
      vuetify,
      localVue,
      propsData: {
        ...mockProps,
        ...props,
      },
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('edits word spelling', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.test-edit-word input').setValue('new word');
    await wrapper.find('.test-save-btn').trigger('click');
    await flushPromises();
    expect(mockServer.editWord).toHaveBeenCalledWith('uuid', {
      word: 'new word',
      translations: [],
    });
    expect(mockSnackbar.showSnackbar).toHaveBeenCalledWith('Edit saved');
  });

  it("shows error when edit doesn't work", async () => {
    const errorServer = {
      editWord: jest.fn().mockRejectedValue(null),
    };
    const wrapper = createWrapper({
      serverProxy: errorServer,
    });

    await wrapper.find('.test-edit-word input').setValue('new word');
    await wrapper.find('.test-save-btn').trigger('click');
    await flushPromises();
    expect(mockSnackbar.showErrorSnackbar).toHaveBeenCalledWith(
      'Error saving word'
    );
  });
});
