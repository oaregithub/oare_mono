import { mount } from "@vue/test-utils";
import wrapperOptions from "../wrapperOptions";
import RegisterView from "../../src/components/RegisterView";
import flushPromises from "flush-promises";
import VueRouter from "vue-router";

describe("RegisterView.vue", () => {
  let wrapper;
  let router = new VueRouter();
  beforeAll(() => {
    wrapper = mount(RegisterView, {
      ...wrapperOptions,
      router,
      mocks: {
        $store: {
          dispatch(action) {
            if (action === "register") {
              return Promise.resolve(true)
            }
          }
        }
      }
    })
  })

  it("correctly registers new user", async () => {
    router.push = jest.fn()
    wrapper.find("[data-first-name-tf]").setValue("First")
    wrapper.find("[data-last-name-tf]").setValue("Last")
    wrapper.find("[data-email-tf]").setValue("test@email.com")
    wrapper.find("[data-pass-tf]").setValue("password")
    wrapper.find("[data-rep-pass-tf]").setValue("password")
    wrapper.find("[data-conf-register-btn]").trigger("click")
    await flushPromises()
    expect(router.push).toHaveBeenCalledWith("/landing")
  })
})