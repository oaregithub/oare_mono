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
    editWord: jest.fn().mockResolvedValue(null),
  };
  const createWrapper = () =>
    mount(EditWord, {
      vuetify,
      localVue,
      propsData: {
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
    });
    expect(wrapper.get('.test-edit-snackbar'));
  });
});
