import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import OareAppBar from "@/components/base/OareAppBar";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareAppBar.vue", () => {
  let user = {
    first_name: "Test",
    last_name: "User",
    is_admin: false,
    email: "test@email.com",
    id: 0,
  };

  let getters = {
    user,
    isAuthenticated: true,
  };

  const mockProps = {
    store: {
      dispatch: jest.fn(),
    },
    router: {
      push: jest.fn(),
    },
    i18n: {
      t: jest.fn(),
      locale: "us",
    },
  };

  const createWrapper = () =>
    mount(OareAppBar, {
      localVue,
      vuetify,
      mocks: {
        $store: {
          getters,
        },
        // $i18n: {},
      },
      propsData: mockProps,
      stubs: ["router-link"],
    });

  it("matches snapshot", () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it("doesn't show Admin button when user is not admin", () => {
    user.is_admin = false;
    expect(createWrapper().find("[data-admin-btn]").exists()).toBe(false);
  });

  it("shows Admin button when user is admin", () => {
    user.is_admin = true;
    expect(createWrapper().find("[data-admin-btn]").exists()).toBe(true);
  });

  it("shows Login button when not logged in", () => {
    getters.isAuthenticated = false;
    expect(createWrapper().find("[data-login-btn]").exists()).toBe(true);
  });
});
