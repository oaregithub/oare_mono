import Vuetify from "vuetify";
import VueCompositionApi from "@vue/composition-api";
import { mount, createLocalVue } from "@vue/test-utils";
import OareBreadcrumbs from "@/components/base/OareBreadcrumbs.vue";

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe("OareBreadcrumbs test", () => {
  const breadcrumbItems = [
    {
      link: "/item1",
      text: "Item 1",
    },
    {
      link: "/item2",
      text: "Item 2",
    },
    {
      link: "/item3",
      text: "Item 3",
    },
  ];
  const createWrapper = () =>
    mount(OareBreadcrumbs, {
      localVue,
      vuetify,
      propsData: {
        items: breadcrumbItems,
      },
      stubs: ["router-link"],
    });

  test("matches snapshot", () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  test("shows separator between breadcrumb items", () => {
    const breadcrumbTexts = createWrapper()
      .text()
      .split(">")
      .map((t) => t.trim());

    expect(breadcrumbTexts).toEqual(breadcrumbItems.map((item) => item.text));
  });

  test("does not show > character at end of items", () => {
    const breadcrumbTexts = createWrapper().text().trim();
    expect(breadcrumbTexts.slice(-1)).not.toBe(">");
  });
});
