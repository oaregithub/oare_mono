import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import EpigraphyEditor from '../EpigraphyEditor.vue';
import sl from '../../../serviceLocator';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EpigraphyEditor test', () => {
  const mockProps = {
    sides: [],
    notes: '',
    textUuid: 'test-uuid',
  };

  const mockServer = {
    createDraft: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = (propsData = mockProps, { server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    return mount(EpigraphyEditor, {
      vuetify,
      localVue,
      propsData: {
        ...mockProps,
        ...propsData,
      },
    });
  };

  it('saves draft with notes', async () => {
    const wrapper = createWrapper();
    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');
    await flushPromises();
    expect(mockServer.createDraft).toHaveBeenCalledWith(mockProps.textUuid, {
      content: JSON.stringify(mockProps.sides),
      notes: 'Test note',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
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

    expect(mockServer.createDraft).toHaveBeenCalledWith(mockProps.textUuid, {
      content: JSON.stringify([
        {
          side: 'obv.',
          text: 'New reading',
        },
      ]),
      notes: '',
    });
  });

  it('shows error snackbar when save draft fails', async () => {
    const wrapper = createWrapper(
      {},
      {
        server: {
          createDraft: jest.fn().mockRejectedValue(null),
        },
      }
    );
    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
