import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import EpigraphyEditor from '../EpigraphyEditor.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EpigraphyEditor test', () => {
  const mockProps = {
    sides: [],
    notes: '',
    textUuid: 'test-uuid',
    server: {
      createDraft: jest.fn().mockResolvedValue(null),
    },
  };
  const createWrapper = () =>
    mount(EpigraphyEditor, {
      vuetify,
      localVue,
      propsData: mockProps,
    });

  it('saves draft with notes', async () => {
    const wrapper = createWrapper();
    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');

    expect(mockProps.server.createDraft).toHaveBeenCalledWith(
      mockProps.textUuid,
      JSON.stringify(mockProps.sides),
      'Test note'
    );
  });
});
