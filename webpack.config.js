const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, '/src/index.ts'),
  output: {
    filename: 'index.js',
    path: path.join(__dirname, '/dist'),
  },
  devServer: {
    contentBase: path.join(__dirname, 'dev'),
    port: 8080
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        enforce: 'pre',
        use: [
          {
            loader: 'tslint-loader',
            options: { /* Loader options go here */ }
          }
        ]
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
  },
  devtool: 'inline-source-map'
};
