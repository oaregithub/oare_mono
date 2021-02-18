import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import EpigraphyFullDisplay from '../EpigraphyFullDisplay.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EpigraphyFullDisplay View', () => {
  const mockStore = {
    getters: {
      permissions: [
        {
          name: 'VIEW_TEXT_DISCOURSE',
        },
      ],
    },
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      epigraphicUnits: [],
      markupUnits: [],
      discourseUnits: [],
    },
  };

  const createWrapper = ({ store } = {}) => {
    sl.set('store', store || mockStore);

    return mount(EpigraphyFullDisplay, renderOptions);
  };

  it('displays discourses when user has permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-discourses').exists()).toBe(true);
  });

  it('does not display discourses when user does not have permission', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          permissions: [],
        },
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-discourses').exists()).toBe(false);
  });
});
