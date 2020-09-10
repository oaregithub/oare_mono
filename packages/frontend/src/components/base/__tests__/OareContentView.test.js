import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { shallowMount, createLocalVue } from "@vue/test-utils";
import OareContentView from "@/components/base/OareContentView.vue";

const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareContentView", () => {
  let wrapper;
  const TITLE = "Content view title";

  beforeEach(() => {
    wrapper = shallowMount(OareContentView, {
      localVue,
      vuetify: new Vuetify(),
      propsData: {
        title: TITLE,
      },
    });
  });

  it("matches snapshot", () => {
    expect(wrapper).toMatchSnapshot();
  });

  it("shows title", () => {
    expect(wrapper.find("v-card-title-stub").text()).toBe(TITLE);
  });

  it("shows loading bar when given loading prop", () => {
    wrapper = shallowMount(OareContentView, {
      vuetify: new Vuetify(),
      propsData: {
        title: TITLE,
        loading: true,
      },
    });

    expect(wrapper.find("v-progress-linear-stub")).not.toBe(null);
  });
});
