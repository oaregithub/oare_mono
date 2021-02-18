module.exports = {
  devServer: {
    proxy: 'http://localhost:8081',
  },
  configureWebpack: {
    devtool: 'source-map',
  },
  transpileDependencies: ['vuetify'],
};
