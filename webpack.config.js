
// NOTE: We currently use webpack only for creating a hot reloading
// development server. The npm build command uses ts to directly
// create the contents of 'dist' 

const path = require('path');
const express = require('express');
const child_process = require('child_process')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, '/src/index.ts'),
  output: {
    filename: 'pandoc-mirror.js',
    path: path.join(__dirname, '/dist'),
    library: "PandocMirror",
    libraryTarget: "var"
  },
  devServer: {
    contentBase: [path.join(__dirname, 'dev'), path.join(__dirname, 'node_modules')],
    watchContentBase: true,
    port: 8080,
    before: function(app, server) {

      function pandoc(args, input, response_fn) {

        let spawn = child_process.spawn;
        let process = spawn('pandoc', args)
         
        let output = ''
        process.stdout.setEncoding = 'utf-8';
        process.stdout.on('data', data => {
          output = output + data;
        });

        let error = ''
        process.stderr.setEncoding = 'utf-8';
        process.stderr.on('data', data => {
          error = error + data;
        })

        process.on('close', status => {
          if (status === 0) {
            response_fn(output)
          } else {
            response_fn( { error: error.trim() })
          }
        })
       
        process.stdin.setEncoding = 'utf-8';
        process.stdin.write(input);
        process.stdin.end();
      }
              
      app.post('/pandoc/ast', express.json(), function(request, response) {
        pandoc(
          ['--from', request.body.format, '--to', 'json'],
          request.body.markdown,
          output => { response.json( { ast: JSON.parse(output) } ) } 
        )
      });

      app.post('/pandoc/markdown', express.json(), function(request, response) {
        pandoc(
          ['--from', 'json', '--to', request.body.format].concat(request.body.options),
          JSON.stringify(request.body.ast),
          output => { response.json( { markdown: output }) }
        )
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
