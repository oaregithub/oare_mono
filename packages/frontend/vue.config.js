module.exports = {
  devServer: {
    proxy: 'http://localhost:8888',
  },
  configureWebpack: {
    devtool: 'source-map',
  },
  transpileDependencies: ['vuetify'],
  chainWebpack: config => {
    config.module.rules.delete('eslint');
  },
};
