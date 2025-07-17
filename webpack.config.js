const PnpWebpackPlugin = require('pnp-webpack-plugin');

module.exports = {
  resolve: {
    // allow Webpack to resolve via .pnp.cjs
    plugins: [PnpWebpackPlugin]
  },
  resolveLoader: {
    // ensure loaders also resolve correctly
    plugins: [PnpWebpackPlugin.moduleLoader(module)]
  }
};
