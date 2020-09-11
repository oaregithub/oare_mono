import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import OareSubheader from "@/components/base/OareSubheader";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareSubheader test", () => {
  const createWrapper = (label) =>
    mount(OareSubheader, {
      vuetify,
      localVue,
      slots: {
        default: label,
      },
    });

  it("matches snapshot", () => {
    expect(createWrapper("Test Subheader")).toMatchSnapshot();
  });

  it("displays passed in slot", () => {
    const text = "Test Subheader";
    expect(createWrapper(text).text()).toBe(text);
  });
});
