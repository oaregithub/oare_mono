import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import UserPreferences from '../UserPreferences.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('UserPreferences test', () => {
  const mockServer = {
    allowBetaAccess: jest.fn().mockResolvedValue(),
    revokeBetaAccess: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: true,
      user: {
        betaAccess: true,
      },
    },
  };

  beforeEach(() => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  });

  const createWrapper = () =>
    mount(UserPreferences, {
      vuetify,
      localVue,
    });

  it('displays beta access switch if user is admin', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.get('.test-beta-switch'));
  });

  it('does not display beta switch if not admin', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        isAdmin: false,
      },
    });
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.html()).toContain('Coming Soon');
    const betaSwitch = wrapper.find('.test-beta-switch');
    expect(betaSwitch.exists()).toBe(false);
  });

  it('enables beta access on switch click', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        user: {
          betaAccess: false,
        },
      },
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-beta-switch input').trigger('click');
    await flushPromises();
    expect(mockServer.allowBetaAccess).toHaveBeenCalled();
  });

  it('shows error snackbar on failed beta access allowance', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        user: {
          betaAccess: false,
        },
      },
    });
    sl.set('serverProxy', {
      ...mockServer,
      allowBetaAccess: jest.fn().mockRejectedValue('failed to allow'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-beta-switch input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('disables beta access on switch click', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-beta-switch input').trigger('click');
    await flushPromises();
    expect(mockServer.revokeBetaAccess).toHaveBeenCalled();
  });

  it('shows error snackbar on failed beta access revocation', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      revokeBetaAccess: jest.fn().mockRejectedValue('failed to revoke'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-beta-switch input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
