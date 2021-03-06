module.exports = {

  node: {
    global: false,
    __filename: true,
    __dirname: true,
  },
};

// 'use strict';
// const execSync = require('child_process').execSync;
// const packageJson = require('./package.json');
// const path = require('path');
// const webpack = require('webpack');
// const WriteJsonPlugin = require('write-json-webpack-plugin');
// const WriteFilePlugin = require('write-file-webpack-plugin');
// const process = require('process');
// const CopyWebpackPlugin = require('copy-webpack-plugin');

// const getGitVersion = () => execSync('git describe --abbrev=0').toString().trim();

// const FULL_GIT_VERSION = execSync('git describe').toString().trim();

// const makeReleasePackageJson = () => {
//   return {
//     name: packageJson.name,
//     version: getGitVersion(),
//     description:
//       'Bitmovin Analytics Collector collects monitoring devents from video players for the Bitmovin Analytics Service',
//     license: 'MIT',
//     repository: {
//       type: 'git',
//       url: 'git+https://github.com/bitmovin/bitmovin-analytics-collector.git',
//     },
//     main: 'bitmovinanalytics.min.js',
//     types: 'bitmovin-analytics.d.ts',
//     author: 'Bitmovin Inc',
//     homepage: 'https://bitmovin.com/video-analytics/',
//     maintainers: [
//       {
//         name: 'bitadmin',
//         email: 'admin@bitmovin.com',
//       },
//     ],
//   };
// };

// const BANNER =
//   '\n' +
//   'Copyright (C) ' +
//   new Date().getFullYear() +
//   ', Bitmovin, Inc., All Rights Reserved\n' +
//   '\n' +
//   'This source code and its use and distribution, is subject to the terms\n' +
//   'and conditions of the applicable license agreement.\n' +
//   '\n' +
//   packageJson.name +
//   ' version ' +
//   FULL_GIT_VERSION +
//   '\n';

// const BASE_BUILD_FOLDER = 'build';

// const API_EXPORT_MODULE = './js/core/BitmovinAnalyticsExport';

// const mode = process.env.NODE_ENV;

// function isDevMode() {
//   return mode === 'development';
// }

// function makeConfig() {
//   const buildFolder = path.resolve(
//     isDevMode() ? path.join(BASE_BUILD_FOLDER, 'debug') : path.join(BASE_BUILD_FOLDER, 'release')
//   );

//   const config = {
//     mode,
//     devtool: isDevMode() ? 'inline-source-map' : 'source-map',
//     optimization: {
//       minimize: !isDevMode(),
//     },
//     entry: API_EXPORT_MODULE,
//     output: {
//       path: buildFolder,
//       publicPath: buildFolder,
//       libraryTarget: 'umd',
//       library: ['bitmovin', 'analytics'],
//       filename: 'bitmovinanalytics.min.js',
//     },
//     resolve: {
//       extensions: ['.ts', '.js'],
//     },
//     module: {
//       rules: [
//         {
//           test: /\.tsx?$/,
//           use: 'ts-loader',
//           exclude: /node_modules/,
//         },
//       ],
//     },
//     plugins: [
//       new webpack.BannerPlugin(BANNER),
//       new WriteFilePlugin(),
//       new webpack.DefinePlugin({
//         __VERSION__: JSON.stringify(getGitVersion()),
//       }),
//     ],
//     watch: isDevMode(),
//   };
//   if (!isDevMode()) {
//     config.plugins.push(
//       new WriteJsonPlugin({
//         object: makeReleasePackageJson(),
//         // plugin bug: putting an absolute resolved path here does the wrong thing, needs to be relative to output path
//         path: '.',
//         filename: 'package.json',
//       })
//     );
//     config.plugins.push(
//       new CopyWebpackPlugin([
//         {from: 'README.md', to: '.'},
//         {from: 'deployment/types/bitmovin-analytics.d.ts', to: '.'},
//       ])
//     );
//   }

//   return config;
// }

// module.exports = makeConfig();

// function DtsBundlePlugin() {}
// DtsBundlePlugin.prototype.apply = function (compiler) {
//   compiler.plugin('done', function () {
//     var dts = require('dts-bundle');
//     dts.bundle({
//       name: packageJson.name,
//       baseDir: path.join(BASE_BUILD_FOLDER, isDevMode() ? 'debug' : 'release'),
//       main: path.join(path.join(BASE_BUILD_FOLDER, isDevMode() ? 'debug' : 'release'), API_EXPORT_MODULE + '.d.ts'),
//       removeSource: true,
//       outputAsModuleFolder: true, // to use npm in-package typings
//     });
//   });
// };
