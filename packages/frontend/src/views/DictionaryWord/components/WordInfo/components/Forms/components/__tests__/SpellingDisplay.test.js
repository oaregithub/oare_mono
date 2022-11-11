import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '@/views/DictionaryWord/index.vue';
import SpellingDisplay from '../SpellingDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('SpellingDisplay test', () => {
  const spelling = {
    uuid: 'spelling-uuid',
    spelling: 'spelling',
    hasOccurrence: true,
  };

  const form = {
    form: 'form',
    spellings: [],
  };

  const wordUuid = 'testUuid';

  const mockStore = {
    hasPermission: name => ['UPDATE_FORM'].includes(name),
  };

  const mockServer = {
    updateSpelling: jest.fn().mockResolvedValue(null),
    removeSpelling: jest.fn().mockResolvedValue(null),
    getSpellingOccurrencesTexts: jest.fn().mockResolvedValue([
      {
        textName: 'text-name',
        textUuid: 'text-uuid',
      },
    ]),
    getSpellingOccurrencesCounts: jest.fn().mockResolvedValue([
      {
        uuid: 'spelling-uuid',
        count: 12,
      },
    ]),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const lodash = {
    debounce: cb => cb,
  };
  const mockRouter = {
    currentRoute: {
      name: 'testName',
    },
  };
  const reload = jest.fn();

  const createWrapper = ({ server, store } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', lodash);
    sl.set('router', mockRouter);
    return mount(SpellingDisplay, {
      vuetify,
      localVue,
      propsData: {
        spelling,
        form,
        wordUuid,
        spellingOccurrencesCount: 12,
      },
      stubs: ['router-link'],
      provide: {
        [ReloadKey]: reload,
      },
    });
  };

  it('shows number of texts next to spelling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.get('.test-num-texts').text()).toBe('12');
  });

  it('shows dialog when clicking on number of texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-num-texts').trigger('click');
    expect(wrapper.get('.test-dialog-title').text()).toBe(
      `Texts for ${spelling.spelling}`
    );
  });

  it('shows texts associated with spelling', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-num-texts').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-text-occurrences-display').exists()).toBe(true);
  });

  it("doesn't allow editing without permissions", async () => {
    const wrapper = createWrapper({
      store: {
        hasPermission: () => false,
      },
    });

    await wrapper.get('.test-spelling').trigger('click');

    expect(wrapper.find('.test-pencil').exists()).toBe(false);
    expect(wrapper.find('.test-close').exists()).toBe(false);
  });
});
