import { mount } from "@vue/test-utils";
import wrapperOptions from "../wrapperOptions";
import OareAppBar from "../../src/components/base/OareAppBar";

describe("OareAppBar.vue", () => {
  let wrapper;
  let user = {
    first_name: "Test",
    last_name: "User",
    is_admin: false,
    email: "test@email.com",
    id: 0
  };

  let getters = {
    user,
    isAuthenticated: true
  };

  beforeAll(() => {
    wrapper = mount(OareAppBar, {
      ...wrapperOptions,
      mocks: {
        $store: {
          getters
        }
      }
    });
  });

  it("is a Vue instance", () => {
    expect(wrapper.isVueInstance()).toBe(true);
  });

  it("doesn't show Admin button when user is not admin", () => {
    user.is_admin = false;
    expect(wrapper.find("[data-admin-btn]").exists()).toBe(false);
  });

  it("shows Admin button when user is admin", () => {
    user.is_admin = true;
    expect(wrapper.find("[data-admin-btn]").exists()).toBe(true);
  });

  it("shows Login button when not logged in", () => {
    getters.isAuthenticated = false;
    expect(wrapper.find("[data-login-btn]").exists()).toBe(true);
  });
});
