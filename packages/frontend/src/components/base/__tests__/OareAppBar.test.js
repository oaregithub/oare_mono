import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OareAppBar from '@/components/base/OareAppBar';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareAppBar.vue', () => {
  const mockProps = {
    store: {
      dispatch: jest.fn(action => {
        if (action === 'refreshToken') {
          return Promise.resolve();
        }
      }),
      commit: jest.fn(),
    },
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
    const user = {
      firstName: 'Test',
      last_name: 'User',
      is_admin: isAdmin,
      email: 'test@email.com',
      id: 0,
    };
    const wrapper = mount(OareAppBar, {
      localVue,
      vuetify,
      mocks: {
        $store: {
          getters: {
            user,
            isAuthenticated,
            isAdmin,
          },
        },
      },
      propsData: mockProps,
      stubs: ['router-link'],
    });
    await flushPromises();
    return wrapper;
  };

  it('calls refreshToken on load', async () => {
    await createWrapper();
    expect(mockProps.store.dispatch).toHaveBeenCalledWith('refreshToken');
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
