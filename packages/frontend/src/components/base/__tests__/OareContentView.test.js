import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, shallowMount, createLocalVue } from "@vue/test-utils";
import OareContentView from "@/components/base/OareContentView.vue";

const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareContentView", () => {
  const TITLE = "Content view title";

  const createWrapper = (props = {}) =>
    mount(OareContentView, {
      localVue,
      vuetify: new Vuetify(),
      propsData: {
        title: TITLE,
        ...props,
      },
    });

  it("matches snapshot", () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it("shows title", () => {
    expect(createWrapper().find(".test-content-title").text()).toBe(TITLE);
  });

  it("shows loading bar when given loading prop", () => {
    let wrapper = createWrapper({ loading: true });

    expect(wrapper.findComponent({ name: "v-progress-linear" })).not.toBe(null);
  });
});
