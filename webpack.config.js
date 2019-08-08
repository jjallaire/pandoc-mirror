
// NOTE: We currently use webpack only for creating a hot reloading
// development server. The npm build command uses ts to directly
// create the contents of 'dist' 

const path = require('path');
const express = require('express');
const child_process = require('child_process')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, '/src/editor.ts'),
  output: {
    filename: 'editor.js',
    path: path.join(__dirname, '/dist'),
    library: "PandocMirror",
    libraryTarget: "var"
  },
  devServer: {
    contentBase: [path.join(__dirname, 'dev'), path.join(__dirname, 'node_modules')],
    watchContentBase: true,
    port: 8080,
    before: function(app, server) {

      function pandoc({ from, to, input }) {
        return new Promise(resolve => {
          let spawn = child_process.spawn;
          pandoc = spawn('pandoc', ['--from', from, '--to', to]);
          pandoc.stdout.on('data', data => {
            let ast = JSON.parse(data);
            resolve(ast);
          });
          pandoc.stdin.setEncoding = 'utf-8';
          pandoc.stdin.write(input);
          pandoc.stdin.end();
        })
      }
              
      app.post('/pandoc/ast', express.json(), function(request, response) {
        let spawn = child_process.spawn;
        pandoc = spawn('pandoc', ['--from', request.body.format, '--to', 'json']);
        pandoc.stdout.on('data', data => {
          let ast = JSON.parse(data);
          response.json( { ast });
        });
        pandoc.stderr.on('data', data => {
          response.status(500).send(`${data}`);
        })
        pandoc.stdin.setEncoding = 'utf-8';
        pandoc.stdin.write(request.body.markdown);
        pandoc.stdin.end();
      });

      app.post('/pandoc/markdown', express.json(), function(request, response) {
        let spawn = child_process.spawn;
        pandoc = spawn('pandoc', ['--from', 'json', '--to', request.body.format]);
        pandoc.stdout.on('data', data => {
          response.json( { markdown: `${data}` });
        });
        pandoc.stderr.on('data', data => {
          response.status(500).send(`${data}`);
        })
        pandoc.stdin.setEncoding = 'utf-8';
        pandoc.stdin.write(JSON.stringify(request.body.ast));
        pandoc.stdin.end();
      })
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
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
