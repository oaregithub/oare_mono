import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import sl from '@/serviceLocator';
import flushPromises from 'flush-promises';
import Stoplight from '../Stoplight.vue';
import { EpigraphyReloadKey } from '../../../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Stoplight', () => {
  const mockServer = {
    getTranslitOptions: jest.fn().mockResolvedValue([
      {
        color: 'Green',
        colorMeaning: 'test-meaning',
      },
      {
        color: 'Red',
        colorMeaning: 'test-meaning',
      },
    ]),
    updateTranslitStatus: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn().mockResolvedValue(),
    showSnackbar: jest.fn().mockResolvedValue(),
  };

  const mockStore = {
    hasPermission: name => ['EDIT_TRANSLITERATION_STATUS'].includes(name),
  };

  const reload = jest.fn();

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  };

  beforeEach(setup);

  const createWrapper = color =>
    mount(Stoplight, {
      vuetify,
      localVue,
      provide: {
        [EpigraphyReloadKey]: reload,
      },
      propsData: {
        showEditDialog: true,
        textUuid: 'test-uuid',
        transliteration: {
          color,
          colorMeaning: 'test-color-meaning',
        },
      },
    });

  const lightClasses = color => color.split('/').map(c => c.toLowerCase());
  const darkClasses = color =>
    ['red', 'yellow', 'green'].filter(c => !lightClasses(color).includes(c));

  it('correctly displays colors', () => {
    ['Red', 'Yellow', 'Green', 'Yellow/Green', 'Yellow/Red'].forEach(color => {
      const wrapper = createWrapper(color);
      const lights = lightClasses(color);
      const darks = darkClasses(color);

      lights.forEach(c => {
        expect(wrapper.get(`.sl-light-${c}`));
      });

      darks.forEach(c => {
        expect(wrapper.get(`.sl-dark-${c}`));
      });
    });
  });

  it('updates transliteration status', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-stoplight').trigger('click');
    expect(wrapper.get('.test-stoplight-dialog').exists()).toBe(true);
    await wrapper.findAll('.test-translit-option input').at(0).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.updateTranslitStatus).toHaveBeenCalled();
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar on failed transliteration update', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      updateTranslitStatus: jest
        .fn()
        .mockRejectedValue('failed to update translit status'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-stoplight').trigger('click');
    await wrapper.findAll('.test-translit-option input').at(0).trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
