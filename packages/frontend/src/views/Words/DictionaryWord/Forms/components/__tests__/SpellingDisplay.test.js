import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { SendUtilList } from '../../../index.vue';
import SpellingDisplay from '../SpellingDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('SpellingDisplay test', () => {
  const spelling = {
    uuid: 'spelling-uuid',
    spelling: 'spelling',
  };

  const form = {
    form: 'form',
    spellings: [],
  };

  const wordUuid = 'testUuid';

  const mockStore = {
    getters: {
      permissions: [{ name: 'UPDATE_FORM' }],
    },
  };

  const mockOccurrences = {
    totalResults: 1,
    rows: [
      {
        textName: 'text-name',
        textUuid: 'text-uuid',
        readings: ['spelling reading'],
      },
    ],
  };

  const mockServer = {
    updateSpelling: jest.fn().mockResolvedValue(null),
    removeSpelling: jest.fn().mockResolvedValue(null),
    getSpellingTextOccurrences: jest.fn().mockResolvedValue([
      {
        textName: 'text-name',
        textUuid: 'text-uuid',
      },
    ]),
    getSpellingTotalOccurrences: jest.fn().mockResolvedValue(12),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const lodash = {
    debounce: cb => cb,
  };

  const toUtilList = jest.fn();

  const createWrapper = ({ server, store } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', lodash);
    return mount(SpellingDisplay, {
      vuetify,
      localVue,
      propsData: {
        spelling,
        form,
        wordUuid,
      },
      stubs: ['router-link'],
      provide: {
        [SendUtilList]: toUtilList,
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
    expect(wrapper.get('.test-text').text()).toBe(
      mockOccurrences.rows[0].textName
    );
  });

  it('sends spelling deletion request', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.testing-spelling').trigger('click');
    expect(toUtilList).toHaveBeenCalled();
  });

  it("doesn't allow editing without permissions", async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          permissions: [],
        },
      },
    });

    await wrapper.get('.test-spelling').trigger('click');

    expect(wrapper.find('.test-pencil').exists()).toBe(false);
    expect(wrapper.find('.test-close').exists()).toBe(false);
  });
});
