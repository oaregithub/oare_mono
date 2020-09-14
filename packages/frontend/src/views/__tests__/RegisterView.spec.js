import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import RegisterView from "../LoginView.vue";
import flushPromises from "flush-promises";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("RegisterView test", () => {
  const mockProps = {
    router: {
      push: jest.fn(),
    },
    store: {
      dispatch: jest.fn().mockResolvedValue(true),
    },
  };
  const createWrapper = (props = mockProps) =>
    mount(RegisterView, {
      localVue,
      vuetify,
      propsData: props,
      mocks: {
        $t: jest.fn(),
      },
      stubs: ["router-link"],
    });

  it("matches snapshot", () => {
    expect(createWrapper()).toMatchSnapshot();
  });
});
