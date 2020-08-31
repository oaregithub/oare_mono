module.exports = {
  presets: ["@babel/preset-env"],
  env: {
    test: {
      presets: [["env", { targets: { node: "current" } }]]
    }
  }
};
