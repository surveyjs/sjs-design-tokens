"use strict";

const webpackCommonConfig = require("./webpack.config");
const { merge } = require("webpack-merge");
var path = require("path");

const config = {
  output: {
    path: __dirname + "/build"
  },
  entry: {
    "index": path.resolve(__dirname, "./prebuild/index.ts"),
  },
  externals: {
    "survey-creator-core": {
      root: "SurveyCreatorCore",
      commonjs2: "survey-creator-core",
      commonjs: "survey-creator-core",
      amd: "survey-creator-core"
    },
  },
};
const umdNames = {};
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
          root: ["SurveyCreatorTheme", umdName],
          amd: "[dashedname]",
          commonjs: "[dashedname]",
        },
      }
    };
  });
}
module.exports = function (options) {
  options.platform = "";
  options.libraryName = "SurveyCreatorTheme";
  options.tsConfigFile = path.resolve(__dirname, "./tsconfig.themes.json");
  const mainConfig = webpackCommonConfig(options);
  mainConfig.entry = {};
  patchEntries(config);
  return merge(mainConfig, config);
};
