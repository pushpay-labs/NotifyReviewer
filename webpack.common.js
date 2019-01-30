const path = require("path");
var glob = require("glob");
const _ = require('lodash');

module.exports = {
  entry: Object.assign({},
    _.reduce(glob.sync("./src/**/**.ts*"),
      (obj, val) => {
        const filenameRegex = /([\w\d_-]*)\.?[^\\\/]*$/i;
        obj[val.match(filenameRegex)[1]] = val;
        return obj;
      },
      {}),
    {
      vendor: [
        'lodash'
      ]
    }
  ),
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
        }, {
          loader: 'postcss-loader', // Run post css actions
          options: {
            plugins: function () { // post css plugins, can be exported to postcss.config.js
              return [
                require('precss'),
                require('autoprefixer')
              ];
            }
          }
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  }
};
