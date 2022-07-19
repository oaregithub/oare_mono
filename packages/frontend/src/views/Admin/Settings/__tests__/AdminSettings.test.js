import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AdminSettings from '../AdminSettings.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Admin Settings View', () => {
  const mockServer = {
    getCacheStatus: jest.fn().mockResolvedValue(true),
    enableCache: jest.fn().mockResolvedValue(),
    disableCache: jest.fn().mockResolvedValue(),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockLodash = {
    debounce: cb => cb,
  };

  const renderOptions = {
    localVue,
    vuetify,
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);
    return mount(AdminSettings, renderOptions);
  };

  it('fetches cache status', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getCacheStatus).toHaveBeenCalled();
  });

  it('displays error on failed cache status retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getCacheStatus: jest
          .fn()
          .mockRejectedValue('failed to retrieve cache status'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully disables cache status', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const cacheSwitch = wrapper.get('.cache-status-switch input');
    await cacheSwitch.trigger('click');
    await flushPromises();
    expect(mockServer.disableCache).toHaveBeenCalled();
  });

  it('displays error on failed cache disabling', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        disableCache: jest.fn().mockRejectedValue('failed to disable cache'),
      },
    });
    await flushPromises();
    const cacheSwitch = wrapper.get('.cache-status-switch input');
    await cacheSwitch.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully enables cache status', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getCacheStatus: jest.fn().mockResolvedValue(false),
      },
    });
    await flushPromises();
    const cacheSwitch = wrapper.get('.cache-status-switch input');
    await cacheSwitch.trigger('click');
    await flushPromises();
    expect(mockServer.enableCache).toHaveBeenCalled();
  });

  it('displays error on failed cache enabling', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getCacheStatus: jest.fn().mockResolvedValue(false),
        enableCache: jest.fn().mockRejectedValue('failed to enable cache'),
      },
    });
    await flushPromises();
    const cacheSwitch = wrapper.get('.cache-status-switch input');
    await cacheSwitch.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
