import { mount } from "@vue/test-utils";
import wrapperOptions from "../wrapperOptions";
import flushPromises from "flush-promises";
import AdminView from "../../src/components/AdminView";

describe("AdminView.vue", () => {
  let wrapper;
  const mockGroupResponse = [
    {
      id: 0,
      name: "User1",
      num_users: 3,
    },
    {
      id: 1,
      name: "User2",
      num_users: 2,
    },
  ];

  const mockPostGroupResponse = {
    id: 2,
    name: "New Group",
    num_users: 0,
  };
  beforeAll(() => {
    wrapper = mount(AdminView, {
      ...wrapperOptions,
      mocks: {
        $axios: {
          get(path) {
            let route = path.split("/")[1];
            switch (route) {
              case "group":
                return Promise.resolve({ data: mockGroupResponse });
            }
          },

          post(path) {
            let route = path.split("/")[1];
            switch (route) {
              case "group":
                return Promise.resolve({ data: mockPostGroupResponse });
            }
          },

          put(path, { group_ids }) {
            let route = path.split("/")[1];
            switch (route) {
              case "group":
                let filteredGroups = mockGroupResponse.filter(
                  (group) => !group_ids.includes(group.id)
                );
                return Promise.resolve({ data: filteredGroups });
            }
          },
        },
      },
    });
  });

  it("correctly displays group information", async () => {
    await flushPromises();
    expect(
      wrapper.find("[data-group-table]").find("tbody").findAll("tr").length
    ).toBe(mockGroupResponse.length);
  });

  it("correctly adds new group", async () => {
    await flushPromises();
    const groupCount = wrapper
      .find("[data-group-table]")
      .find("tbody")
      .findAll("tr").length;
    wrapper.find("[data-add-group-btn]").trigger("click");
    wrapper.find("[data-group-name-tf]").setValue("New group");
    wrapper.find("[data-submit-group-btn]").trigger("click");
    await flushPromises();
    expect(
      wrapper.find("[data-group-table]").find("tbody").findAll("tr").length
    ).toBe(groupCount + 1);
  });

  it("correctly deletes existing group", async () => {
    await flushPromises();

    const groupCount = wrapper
      .find("[data-group-table]")
      .find("tbody")
      .findAll("tr").length;

    // Click checkbox before existing group
    wrapper
      .find("[data-group-table]")
      .find("tbody > tr")
      .find(".v-simple-checkbox")
      .trigger("click");

    // Click on actions button
    wrapper.find("[data-actions-btn]").trigger("click");
    wrapper.find("[data-del-group-btn]").trigger("click");
    wrapper.find("[data-conf-group-del-btn]").trigger("click");
    await flushPromises();

    expect(
      wrapper.find("[data-group-table]").find("tbody").findAll("tr").length
    ).toBe(groupCount - 1);
  });
});
