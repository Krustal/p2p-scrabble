const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const dotenv = require("dotenv");
const webpack = require("webpack");

dotenv.config();

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader" }
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            query: {
              importLoaders: 1,
              localIdentName: "[path]___[name]__[local]___[hash:base64:5]"
            }
          },
          { loader: "postcss-loader" },
          { loader: "resolve-url-loader" },
          { loader: "sass-loader", query: { sourceMap: true } }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".js", ".jsx"]
  },
  plugins: [
    new webpack.EnvironmentPlugin([
      "NODE_ENV",
      "PUSHER_APP_ID",
      "PUSHER_KEY",
      "FN_BASE"
    ]),
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    new HtmlWebpackPlugin({
      title: "404",
      filename: "404.html",
      inject: false
    })
  ],
  devtool: "inline-source-map",
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 9001,
    overlay: true,
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:9000",
        pathRewrites: { "^/.netlify/functions": "" }
      }
    },
    historyApiFallback: {
      rewrites: [{ from: /[^\/#\?\&]*$/, to: "/index.html" }]
    }
  }
};
