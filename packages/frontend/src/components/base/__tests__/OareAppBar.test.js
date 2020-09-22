import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OareAppBar from '@/components/base/OareAppBar';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareAppBar.vue', () => {
  const mockProps = {
    store: {
      dispatch: jest.fn(),
    },
    router: {
      push: jest.fn(),
    },
    i18n: {
      t: jest.fn(),
      locale: 'us',
    },
  };

  const createWrapper = (
    { isAdmin, isAuthenticated } = { isAdmin: false, isAuthenticated: true }
  ) => {
    const user = {
      first_name: 'Test',
      last_name: 'User',
      is_admin: isAdmin,
      email: 'test@email.com',
      id: 0,
    };
    return mount(OareAppBar, {
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
  };

  it('matches snapshot', () => {
    expect(
      createWrapper({ isAdmin: false, isAuthenticated: false })
    ).toMatchSnapshot();
  });

  it("doesn't show Admin button when user is not admin", () => {
    expect(
      createWrapper({ isAdmin: false })
        .find('.test-admin-btn')
        .exists()
    ).toBe(false);
  });

  it('shows Admin button when user is admin', () => {
    expect(
      createWrapper({ isAdmin: true })
        .find('.test-admin-btn')
        .exists()
    ).toBe(true);
  });

  it('shows Login button when not logged in', () => {
    expect(
      createWrapper({ isAuthenticated: false })
        .find('.test-login-btn')
        .exists()
    ).toBe(true);
  });

  it('shows Words, Names, and Places when an admin', () => {
    const wrapper = createWrapper({ isAdmin: true, isAuthenticated: true });
    ['words', 'names', 'places', 'texts', 'search'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(true);
    });
  });

  it('shows only Texts and Search when not an admin', () => {
    const wrapper = createWrapper({ isAdmin: false });

    ['texts', 'search'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(true);
    });

    ['words', 'names', 'places'].forEach(link => {
      expect(wrapper.find(`.test-${link}`).exists()).toBe(false);
    });
  });
});
