const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");
const replace = require("@rollup/plugin-replace");
const commonjs = require("@rollup/plugin-commonjs");

const path = require("path");
const VERSION = require("./package.json").version;
const input = { index: path.resolve(__dirname, "./prebuild/index.ts") };

module.exports = () => {
  const options = {
    dir: path.resolve(__dirname, "./build/fesm"),
    tsconfig: path.resolve(__dirname, "./tsconfig.json")
  };
  
  return {
    input,
    context: "this",
    plugins: [
      {
        name: "remove-scss-imports",
        load: (id) => {
          if (id.match(/\.scss$/)) return "";
        }
      },
      //force take correct .js file for papaparse dependency
      nodeResolve({ browser: true }),
      commonjs(),
      typescript({ 
        inlineSources: true, 
        sourceMap: true, 
        tsconfig: options.tsconfig, 
        compilerOptions: {
          declaration: false,
          declarationDir: null
        } 
      }),
      replace({
        preventAssignment: false,
        values: {
          "process.env.RELEASE_DATE": JSON.stringify(new Date().toISOString().slice(0, 10)),
          "process.env.VERSION": JSON.stringify(VERSION),
        }
      })
    ],
    output: [
      {
        dir: options.dir,
        entryFileNames: "[name].mjs",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  };
};