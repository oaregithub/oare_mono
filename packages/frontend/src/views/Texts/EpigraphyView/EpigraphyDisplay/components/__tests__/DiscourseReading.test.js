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
  const discourseUnits = [
    {
      uuid: 'uuid1',
      type: 'translation',
      units: [],
      spelling: 'abcde',
      transcription: 'fghij',
      line: 1,
      wordOnTablet: 2,
      paragraphLabel: '',
      translation: 'test-translation',
    },
  ];

  const createWrapper = props =>
    mount(DiscourseReading, {
      localVue,
      vuetify,
      propsData: {
        discourseUnits,
      },
    });

  const actions = {
    showErrorSnackbar: jest.fn(),
  };

  const server = {
    updateDiscourseTranslation: jest.fn().mockResolvedValue(),
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

  it('Verify that users without permission cannot see the edit button', async () => {
    sl.set('store', {
      getters: {
        permissions: [],
      },
    });
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-discourse-startedit').exists()).toBe(false);
  });

  it('Verifies that clicking save calls the server function', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-discourse-startedit').trigger('click');
    await wrapper
      .get('.test-discourse-box textarea')
      .setValue('new translation');
    await wrapper.get('.test-discourse-button').trigger('click');
    await flushPromises();
    expect(server.updateDiscourseTranslation).toHaveBeenCalledWith(
      'uuid1',
      'new translation'
    );
  });

  it('Verifies that a failed server call results in an error snackbar', async () => {
    sl.set('serverProxy', {
      updateDiscourseTranslation: jest.fn().mockRejectedValue(),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-discourse-startedit').trigger('click');
    await wrapper.get('.test-discourse-box textarea').setValue('');
    await wrapper.get('.test-discourse-button').trigger('click');
    await flushPromises();
    expect(actions.showErrorSnackbar).toHaveBeenCalled();
  });
});
