import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import DiscourseReading from '../DiscourseReading.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

/*
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

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

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

  });

  it('Verifies that clicking save calls the server function', async () => {

  });

  it('Verifies that a failed server call results in an error snackbar', async () => {

  });
});
*/
