import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import LoginView from "../LoginView.vue";
import flushPromises from "flush-promises";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("LoginView test", () => {
  const mockProps = {
    router: {
      push: jest.fn(),
    },
    store: {
      dispatch: jest.fn().mockResolvedValue(true),
    },
  };
  const createWrapper = (props = mockProps) =>
    mount(LoginView, {
      localVue,
      vuetify,
      mocks: {
        $t: jest.fn(),
      },
      propsData: props,
      stubs: ["router-link"],
    });

  it("matches snapshot", () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it("redirects to home page on successful login", async () => {
    const wrapper = createWrapper();
    const emailInput = wrapper.find(".test-email input");
    const passwordInput = wrapper.find(".test-password input");

    await emailInput.setValue("myemail@test.com");
    await passwordInput.setValue("password");

    const signinBtn = wrapper.find(".test-signin-btn");
    await signinBtn.trigger("click");
    await flushPromises();

    expect(mockProps.store.dispatch).toHaveBeenCalledWith("login", {
      email: "myemail@test.com",
      password: "password",
    });
  });

  it("sign in button is only active when fields are filled in", async () => {
    const wrapper = createWrapper();

    const signinButton = wrapper.find(".test-signin-btn");
    expect(signinButton.element).toBeDisabled();

    const emailInput = wrapper.find(".test-email input");
    await emailInput.setValue("email");
    expect(signinButton.element).toBeDisabled();

    const passwordInput = wrapper.find(".test-password input");
    await passwordInput.setValue("password");
    expect(signinButton.element).toBeEnabled();
  });

  it("displays error message on unsuccessful login", async () => {
    const wrapper = createWrapper({
      ...mockProps,
      store: {
        dispatch: jest.fn().mockRejectedValue("Invalid login"),
      },
    });

    const emailInput = wrapper.find(".test-email input");
    const passwordInput = wrapper.find(".test-password input");
    const signinButton = wrapper.find(".test-signin-btn");

    await emailInput.setValue("email");
    await passwordInput.setValue("password");
    await signinButton.trigger("click");
    await flushPromises();

    const errorText = wrapper.find(".test-error-text");
    expect(errorText.text()).toBe("Invalid login");
  });
});
