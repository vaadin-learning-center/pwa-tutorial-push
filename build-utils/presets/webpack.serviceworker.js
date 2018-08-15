const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = ({ mode }) => ({
  plugins: [
    new WorkboxPlugin.InjectManifest({
      swSrc: './src/sw.js'
    })
  ]
});
