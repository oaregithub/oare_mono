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
  const createWrapper = (propsData = mockProps) =>
    mount(EpigraphyEditor, {
      vuetify,
      localVue,
      propsData: {
        ...mockProps,
        ...propsData,
      },
    });

  it('saves draft with notes', async () => {
    const wrapper = createWrapper();
    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');

    expect(mockProps.server.createDraft).toHaveBeenCalledWith(
      mockProps.textUuid,
      {
        content: JSON.stringify(mockProps.sides),
        notes: 'Test note',
      }
    );
  });

  it('adds side', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-add-side').trigger('click');
    expect(wrapper.get('.test-side-select'));
    expect(wrapper.get('.test-side-text'));
  });

  it('removes side', async () => {
    const wrapper = createWrapper({
      sides: [
        {
          side: 'obv.',
          text: 'Test edits',
        },
      ],
    });

    await wrapper.vm.$nextTick();
    await wrapper.get('.test-remove-side').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(wrapper.find('.test-side-select').exists()).toBe(false);
    expect(wrapper.find('.test-side-text').exists()).toBe(false);
  });

  it('closes editor', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.test-close-editor').trigger('click');
    expect(wrapper.emitted()['close-editor']).toBeTruthy();
  });

  it('saves draft with edits', async () => {
    const wrapper = createWrapper({
      sides: [
        {
          side: 'obv.',
          text: 'Test reading',
        },
      ],
    });

    await wrapper.vm.$nextTick();
    const textarea = wrapper.find('.test-side-text textarea');
    await textarea.setValue('New reading');
    await wrapper.find('.test-save').trigger('click');

    expect(mockProps.server.createDraft).toHaveBeenCalledWith(
      mockProps.textUuid,
      {
        content: JSON.stringify([
          {
            side: 'obv.',
            text: 'New reading',
          },
        ]),
        notes: '',
      }
    );
  });
});
