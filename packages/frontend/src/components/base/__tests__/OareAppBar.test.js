import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OareAppBar from '@/components/base/OareAppBar';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareAppBar.vue', () => {
  const mockStore = {
    getters: {
      isAdmin: false,
      isAuthenticated: true,
      user: {
        firstName: 'Test',
      },
      permissions: {
        dictionary: [],
        pages: [],
      },
    },
    logout: jest.fn(),
    setUser: jest.fn(),
    setPermissions: jest.fn(),
    setAuthComplete: jest.fn(),
  };

  const mockServer = {
    refreshToken: jest.fn().mockResolvedValue({
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      isAdmin: false,
    }),
    getPermissions: jest.fn().mockResolvedValue({
      dictionary: [],
      pages: [],
    }),
  };

  const mockProps = {
    router: {
      push: jest.fn(),
    },
    i18n: {
      t: jest.fn(),
      locale: 'us',
    },
  };

  const createWrapper = async (
    { isAdmin, isAuthenticated } = { isAdmin: false, isAuthenticated: true }
  ) => {
    sl.set('store', {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        isAdmin,
        isAuthenticated,
        permissions: {
          dictionary: [],
          pages: isAdmin ? ['WORDS', 'NAMES', 'PLACES'] : [],
        },
      },
    });
    sl.set('serverProxy', mockServer);
    const wrapper = mount(OareAppBar, {
      localVue,
      vuetify,
      propsData: mockProps,
      stubs: ['router-link'],
    });
    await flushPromises();
    return wrapper;
  };

  it('sets the user on load', async () => {
    await createWrapper();
    expect(mockServer.refreshToken).toHaveBeenCalled();
    expect(mockStore.setUser).toHaveBeenCalled();
  });

  it('sets permissions on load', async () => {
    await createWrapper();
    expect(mockServer.getPermissions).toHaveBeenCalled();
    expect(mockStore.setPermissions).toHaveBeenCalled();
  });

  it('sets auth complete when finished loading', async () => {
    await createWrapper();
    expect(mockStore.setAuthComplete).toHaveBeenCalled();
  });

  it("doesn't show Admin button when user is not admin", async () => {
    const wrapper = await createWrapper({ isAdmin: false });
    expect(wrapper.find('.test-admin-btn').exists()).toBe(false);
  });

  it('shows Admin button when user is admin', async () => {
    const wrapper = await createWrapper({ isAdmin: true });
    expect(wrapper.find('.test-admin-btn').exists()).toBe(true);
  });

  it('shows Login button when not logged in', async () => {
    const wrapper = await createWrapper({ isAuthenticated: false });
    expect(wrapper.find('.test-login-btn').exists()).toBe(true);
  });

  it('shows Words, Names, and Places when an admin', async () => {
    const wrapper = await createWrapper({
      isAdmin: true,
      isAuthenticated: true,
    });
    ['words', 'names', 'places', 'texts', 'search'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(true);
    });
  });

  it('shows only Texts and Search when not an admin', async () => {
    const wrapper = await createWrapper({ isAdmin: false });

    ['texts', 'search'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(true);
    });

    ['words', 'names', 'places'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(false);
    });
  });
});
