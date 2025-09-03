"use strict";

const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
var DashedNamePlugin = require("./webpack-dashed-name");
const mergeFiles = require("merge-files");
const packageJson = require("./package.json");

// UMD names mapping for themes
const umdNames = {
  "sc2020": "SC2020",
};

function patchEntries(config) {
  
  Object.keys(config.entry).forEach(key => {
    if (key == "index") return;
    const importEntry = config.entry[key];
    const umdName = umdNames[key] ?? key.replace(/([_-]\w|^\w)/g, k => (k[1] ?? k[0]).toUpperCase());
    config.entry[key] = {
      import: importEntry,
      library: {
        type: "umd",
        export: "default",
        umdNamedDefine: true,
        name: {
          root: ["SurveyTokens", umdName],
          amd: "[dashedname]",
          commonjs: "[dashedname]",
        },
      }
    };
  });
}

module.exports = function (options) {
  const emitDeclarations = !!options.emitDeclarations;
  const emitNonSourceFiles = !!options.emitNonSourceFiles;
  const emitStyles = !!options.emitStyles;
  const buildPath = __dirname + "/build/";
  const isProductionBuild = options.buildType === "prod";

  const compilerOptions = emitDeclarations ? {} : {
    declaration: false,
    declarationDir: null
  };

  var config = {
    mode: isProductionBuild ? "production" : "development",
    entry: {
      "default": path.resolve(__dirname, "./prebuild/defaultTheme.ts"),
      "index": path.resolve(__dirname, "./prebuild/index.ts"),
    },
    resolve: {
      extensions: [".ts", ".js"],
      //plugins: [new TsconfigPathsPlugin(/*{ configFile: "./tsconfig.json" }*/)],
      alias: {
        tslib: path.join(__dirname, "./src/entries/helpers.ts"),
      },
    },
    optimization: {
      minimize: isProductionBuild,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "./tsconfig.json"),
            compilerOptions
          }
        },
      ],
    },
    output: {
      path: buildPath,
      filename: "[name]" + (isProductionBuild ? ".min" : "") + ".js",
      library: {
        root: options.libraryName || "SurveyTokens",
        amd: "[dashedname]",
        commonjs: "[dashedname]",
      },
      libraryTarget: "umd",
      globalObject: "this",
      umdNamedDefine: true
    },
    plugins: [
      new DashedNamePlugin(),
      new webpack.DefinePlugin({
        "process.env.ENVIRONMENT": JSON.stringify(options.buildType),
        "process.env.VERSION": JSON.stringify(packageJson.version),
      }),
      new RemoveEmptyScriptsPlugin(),
      new webpack.WatchIgnorePlugin({ paths: [/svgbundle\.html/] }),
    ],
  };

  // Apply theme-specific entry patching
  patchEntries(config);

  if (isProductionBuild) {
    config.plugins.push = config.plugins.concat([]);
  } else {
    config.devtool = "source-map";
    config.plugins = config.plugins.concat([
      new webpack.LoaderOptionsPlugin({ debug: true }),
    ]);
  }

  return config;
};
