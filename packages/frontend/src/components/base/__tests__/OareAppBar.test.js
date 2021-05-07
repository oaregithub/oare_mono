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
      permissions: [],
      displayAdminBadge: {
        error: false,
        comments: false,
      },
    },
    logout: jest.fn(),
    setUser: jest.fn(),
    setPermissions: jest.fn(),
    setAuthComplete: jest.fn(),
    setAdminBadge: jest.fn(),
  };

  const mockServer = {
    refreshToken: jest.fn().mockResolvedValue({
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      isAdmin: false,
    }),
    getUserPermissions: jest.fn().mockResolvedValue([]),
    newErrorsExist: jest.fn().mockResolvedValue(false),
    newThreadsExist: jest.fn().mockResolvedValue(false),
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
    { isAdmin, isAuthenticated, server } = {
      isAdmin: false,
      isAuthenticated: true,
      server: mockServer,
    }
  ) => {
    sl.set('store', {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        isAdmin,
        isAuthenticated,
        permissions: isAdmin
          ? [
              {
                name: 'WORDS',
              },
              {
                name: 'NAMES',
              },
              {
                name: 'PLACES',
              },
            ]
          : [],
      },
    });
    sl.set('serverProxy', server);
    const wrapper = mount(OareAppBar, {
      localVue,
      vuetify,
      propsData: mockProps,
      stubs: ['router-link'],
    });
    await flushPromises();
    return wrapper;
  };

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

  it('shows indicator for admins when new errors exist', async () => {
    const wrapper = await createWrapper({
      isAdmin: true,
      server: {
        ...mockServer,
        newErrorsExist: jest.fn().mockResolvedValue(true),
      },
    });
    expect(wrapper.find('.test-admin-badge').exists()).toBe(true);
  });

  it('shows indicator for admins when new comments exist', async () => {
    const wrapper = await createWrapper({
      isAdmin: true,
      server: {
        ...mockServer,
        newThreadsExist: jest.fn().mockResolvedValue(true),
      },
    });
    expect(wrapper.find('.test-admin-badge').exists()).toBe(true);
  });

  it('hides indicator for non-admins', async () => {
    const wrapper = await createWrapper({
      isAdmin: false,
    });
    expect(wrapper.find('.test-admin-badge').exists()).toBe(false);
  });
});
