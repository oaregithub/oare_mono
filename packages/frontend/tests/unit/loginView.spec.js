import { mount } from "@vue/test-utils";
import wrapperOptions from "../wrapperOptions";
import LoginView from "../../src/components/LoginView";
import flushPromises from "flush-promises";
import VueRouter from "vue-router";

describe("LoginView.vue", () => {
  let wrapper;
  let router = new VueRouter();
  beforeAll(() => {
    wrapper = mount(LoginView, {
      ...wrapperOptions,
      router,
      mocks: {
        $store: {
          dispatch(action) {
            if (action === "login") {
              return Promise.resolve(true);
            }
          }
        }
      }
    });
  });

  it("redirects to landing page on successful login", async () => {
    router.push = jest.fn();
    wrapper.find("[data-login-email]").setValue("test@email.com");
    wrapper.find("[data-login-password]").setValue("password");
    wrapper.find("[data-login-btn]").trigger("click");
    await flushPromises();

    expect(router.push).toHaveBeenCalledWith("/landing");
  });
});
