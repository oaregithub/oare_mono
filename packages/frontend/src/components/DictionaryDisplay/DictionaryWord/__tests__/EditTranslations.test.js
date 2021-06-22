import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EditTranslations from '../EditTranslations.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EditTranslations test', () => {
  const translations = [
    {
      uuid: 'uuid1',
      translation: 'translation1',
    },
  ];

  const createWrapper = props =>
    mount(EditTranslations, {
      localVue,
      vuetify,
      propsData: props || {
        wordUuid: 'word-uuid',
        translations,
      },
    });

  const actions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const server = {
    editTranslations: jest.fn().mockResolvedValue(),
  };

  const store = {
    getters: {
      permissions: [
        {
          name: 'UPDATE_TRANSLATION',
        },
      ],
    },
  };

  beforeEach(() => {
    sl.set('globalActions', actions);
    sl.set('serverProxy', server);
    sl.set('store', store);
  });

  it('edits an existing translation', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-translation input').setValue('new translation');
    await wrapper.get('.test-save-translations').trigger('click');
    await flushPromises();
    expect(server.editTranslations).toHaveBeenCalledWith('word-uuid', {
      translations: [
        {
          uuid: 'uuid1',
          translation: 'new translation',
        },
      ],
    });
  });

  it('deletes an existing translation', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-remove-translation').trigger('click');
    await wrapper.get('.test-save-translations').trigger('click');
    await flushPromises();
    expect(actions.showSnackbar).toHaveBeenCalled();
    expect(server.editTranslations).toHaveBeenCalledWith('word-uuid', {
      translations: [],
    });
  });

  it('adds a new translation', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-new-translation').trigger('click');
    await wrapper
      .findAll('.test-translation')
      .at(1)
      .get('input')
      .setValue('new translation');
    await wrapper.get('.test-save-translations').trigger('click');
    await flushPromises();
    expect(server.editTranslations).toHaveBeenCalledWith('word-uuid', {
      translations: [
        ...translations,
        {
          uuid: '',
          translation: 'new translation',
        },
      ],
    });
  });

  it("doesn't allow blank translations", async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-translation input').setValue('');
    await wrapper.get('.test-save-translations').trigger('click');
    await flushPromises();
    expect(actions.showErrorSnackbar).toHaveBeenCalled();
    expect(server.editTranslations).not.toHaveBeenCalled();
  });

  it("doesn't show up or down arrows when there is only one translation", () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.test-move-up').exists()).toBe(false);
    expect(wrapper.find('.test-move-down').exists()).toBe(false);
  });

  it('moves translations', async () => {
    const newTranslations = [
      ...translations,
      {
        uuid: 'uuid2',
        translation: 'translation2',
      },
    ];
    const wrapper = createWrapper({
      wordUuid: 'word-uuid',
      translations: newTranslations,
    });

    await wrapper.get('.test-move-down').trigger('click');
    await wrapper.get('.test-save-translations').trigger('click');
    await flushPromises();
    expect(server.editTranslations).toHaveBeenCalledWith('word-uuid', {
      translations: [newTranslations[1], newTranslations[0]],
    });
  });
});
