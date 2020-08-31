import { mount } from "@vue/test-utils";
import wrapperOptions from "../wrapperOptions";

import GroupView from "../../src/components/GroupView";
import flushPromises from "flush-promises";

describe("GroupView.vue", () => {
  let wrapper;
  let groupData, textTextData, userData, groupRwData;
  beforeAll(() => {
    // Create mock return values
    groupData = {
      id: 1,
      name: "My group",
      users: [
        {
          user_id: 0,
          name: "Barrack Obama",
          email: "bar@rack.obama"
        },
        {
          user_id: 1,
          name: "Joe Biden",
          email: "joe@bid.en"
        }
      ]
    };

    textTextData = [
      {
        text_id: 0,
        alias_name: "Text0"
      },
      {
        text_id: 1,
        alias_name: "Text1"
      },
      {
        text_id: 2,
        alias_name: "Text2"
      }
    ];

    userData = [
      {
        id: 0,
        name: "User1",
        email: "user1@email.com",
        is_admin: false
      },
      {
        id: 0,
        name: "User2",
        email: "user2@email.com",
        is_admin: false
      },
      {
        id: 0,
        name: "User3",
        email: "user3@email.com",
        is_admin: false
      }
    ];

    groupRwData = {
      group_id: 1,
      permissions: [
        {
          text_id: 0,
          can_write: true,
          alias_name: "Text0"
        }
      ]
    };

    wrapper = mount(GroupView, {
      ...wrapperOptions,
      propsData: {
        groupId: 1
      },
      mocks: {
        $axios: {
          get: path => {
            let route = path.split("/")[1];
            switch (route) {
              case "group":
                return Promise.resolve({ data: groupData });
              case "users":
                return Promise.resolve({ data: userData });
              case "text_text":
                return Promise.resolve({ data: textTextData });
              case "group_rw":
                return Promise.resolve({ data: groupRwData });
            }
          },
          post: (path, { texts }) => {
            let route = path.split("/")[1];
            switch (route) {
              case "group_rw":
                texts.forEach(text => {
                  groupRwData.permissions.push(text);
                });
                return Promise.resolve({ data: groupRwData });
            }
          },
          put: (path, { texts }) => {
            let route = path.split("/")[1];
            switch (route) {
              case "group_rw":
                let remainingTexts = groupRwData.permissions.filter(
                  perm => !texts.includes(perm.text_id)
                );
                return Promise.resolve({ data: remainingTexts });
            }
          }
        }
      }
    });
  });

  it("is a Vue instance", () => {
    expect(wrapper.isVueInstance()).toBe(true);
  });

  it("Group view displays correct title", async () => {
    await flushPromises();
    let titleTag = wrapper.find("[data-content-title]");
    expect(titleTag.text()).toBe(groupData.name);
  });

  it("displays correct number of text permissions in table", async () => {
    await flushPromises();
    let rows = wrapper
      .find("[data-group-rw-table]")
      .find("tbody")
      .findAll("tr");
    expect(rows.length).toBe(groupRwData.permissions.length);
  });

  it("correctly adds new group permission", async () => {
    await flushPromises();
    let rowCount = wrapper
      .find("[data-group-rw-table]")
      .find("tbody")
      .findAll("tr").length;
    // Click add text button
    wrapper.find("[data-add-text-btn]").trigger("click");

    // Click first checkbox in dialog
    wrapper
      .findAll("[data-add-text-row]")
      .at(0)
      .find("input[type='checkbox']")
      .trigger("click");

    // Click save button
    wrapper.find("[data-save-text-perms-btn]").trigger("click");
    await flushPromises();

    let newRowCount = wrapper
      .find("[data-group-rw-table]")
      .find("tbody")
      .findAll("tr").length;

    expect(newRowCount).toBe(rowCount + 1);
  });

  it("correctly deletes text permission", async () => {
    await flushPromises();
    let rowCount = wrapper
      .find("[data-group-rw-table]")
      .find("tbody")
      .findAll("tr").length;

    // Click checkbox before existing permission
    wrapper
      .find("[data-group-rw-table]")
      .find("tbody > tr")
      .find(".v-simple-checkbox")
      .trigger("click");

    // Click the delete permissions button
    wrapper.find("[data-rm-sel-perms-btn]").trigger("click");
    wrapper.find("[data-conf-del-text-btn]").trigger("click");
    await flushPromises();

    let newRowCount = wrapper
      .find("[data-group-rw-table]")
      .find("tbody")
      .findAll("tr").length;

    if (rowCount == 1) {
      expect(newRowCount).toBe(1);
      let row = wrapper
        .find("[data-group-rw-table]")
        .find("tbody")
        .find("tr");
      expect(row.text()).toBe("No data available");
    } else {
      expect(newRowCount).toBe(rowCount - 1);
    }
  });
});
