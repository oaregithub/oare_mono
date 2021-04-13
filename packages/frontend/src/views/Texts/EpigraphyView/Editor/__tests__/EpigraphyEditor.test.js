import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EpigraphyEditor from '../EpigraphyEditor.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EpigraphyEditor test', () => {
  const mockProps = {
    draft: {
      content: [],
      notes: '',
      uuid: null,
    },
    textUuid: 'test-uuid',
  };

  const mockServer = {
    createDraft: jest.fn().mockResolvedValue({ draftUuid: 'draft-uuid' }),
    updateDraft: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const mockRouter = {
    push: jest.fn(),
  };

  const createWrapper = (propsData = mockProps, { server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);

    return mount(EpigraphyEditor, {
      vuetify,
      localVue,
      propsData: {
        ...mockProps,
        ...propsData,
      },
      stubs: ['router-link'],
    });
  };

  it('saves draft with notes', async () => {
    const wrapper = createWrapper();
    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');
    await flushPromises();
    expect(mockServer.createDraft).toHaveBeenCalledWith({
      textUuid: mockProps.textUuid,
      content: JSON.stringify(mockProps.draft.content),
      notes: 'Test note',
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('updates draft if it already exists', async () => {
    const wrapper = createWrapper({
      ...mockProps,
      draft: {
        ...mockProps.draft,
        uuid: 'draft-uuid',
      },
    });

    const notesInput = wrapper.find('.test-notes input');
    const saveButton = wrapper.find('.test-save');

    await notesInput.setValue('Test note');
    await saveButton.trigger('click');
    await flushPromises();
    expect(mockServer.updateDraft).toHaveBeenCalledWith('draft-uuid', {
      content: JSON.stringify(mockProps.draft.content),
      notes: 'Test note',
      textUuid: mockProps.textUuid,
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
      ...mockProps,
      draft: {
        ...mockProps.draft,
        content: [
          {
            side: 'obv.',
            text: 'Test edits',
          },
        ],
      },
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
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/epigraphies/${mockProps.textUuid}`
    );
  });

  it('saves draft with edits', async () => {
    const wrapper = createWrapper({
      ...mockProps,
      draft: {
        ...mockProps.draft,
        content: [
          {
            side: 'obv.',
            text: '',
          },
        ],
      },
    });

    await wrapper.vm.$nextTick();
    const textarea = wrapper.find('.test-side-text textarea');
    await textarea.setValue('New reading');
    await wrapper.find('.test-save').trigger('click');

    expect(mockServer.createDraft).toHaveBeenCalledWith({
      textUuid: mockProps.textUuid,
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
