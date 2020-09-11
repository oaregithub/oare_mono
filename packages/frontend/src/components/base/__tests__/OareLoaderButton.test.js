import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import OareLoaderButton from "@/components/base/OareLoaderButton";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareLoaderButton test", () => {
  const createWrapper = (loading) =>
    mount(OareLoaderButton, {
      localVue,
      vuetify,
      propsData: {
        loading,
      },
      slots: {
        default: "Test Button",
      },
    });

  it("matches snapshot", () => {
    expect(createWrapper(false)).toMatchSnapshot();
  });

  it("displays given text when not loading", () => {
    const wrapper = createWrapper(false);
    expect(wrapper.text()).toBe("Test Button");
  });

  it("displays circular progress when loading", () => {
    const wrapper = createWrapper(true);
    expect(wrapper.find(".test-spinner").exists()).toBe(true);
  });
});
