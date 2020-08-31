export default {
  get() {
    return Promise.resolve({
      data: [
        {
          id: 0,
          name: "Category",
          type: "hierarchyCategory",
          parent: null,
          textId: null
        }
      ]
    });
  }
};
