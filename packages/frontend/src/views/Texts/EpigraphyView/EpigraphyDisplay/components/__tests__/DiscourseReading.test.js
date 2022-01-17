import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import DiscourseReading from '../DiscourseReading.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DiscourseReading test', () => {
  const translations = [
    {
      uuid: 'uuid1',
      translation: 'translation1',
    },
  ];

  const createWrapper = props =>
    mount(DiscourseReading, {
      localVue,
      vuetify,
      propsData: props || {
        wordUuid: 'word-uuid',
        translations,
      },
    });

  const actions = {
    showErrorSnackbar: jest.fn(),
  };

  const server = {
    discourseReadings: jest.fn().mockResolvedValue(),
  };

  const store = {
    getters: {
      permissions: [
        {
          name: 'EDIT_TRANSLATION',
        },
      ],
    },
  };

  beforeEach(() => {
    sl.set('globalActions', actions);
    sl.set('serverProxy', server);
    sl.set('store', store);
  });

  it('Verify that only users with permission can see the edit button', async () => {
    setup();
    let response = await sendRequest(false);
    expect(response.status).toBe(401);

    setup({
      UserDao: {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      },
    });
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    response = await sendRequest();

    expect(response.status).toBe(403);
  });

  it('Verifies that clicking save calls the server function', async () => {
    const wrapper = createWrapper({
      ...mockProps,
      draft: {
        ...mockProps.draft,
        content: [
          {
            wordUuid: 'word-uuid',
            translations,
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

  it('Verifies that a failed server call results in an error snackbar', async () => {
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
