// const path = require('path');

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  entry: path.resolve(__dirname, "/src/index.js"),
  output: {
    filename: "pack.js",
    path: path.resolve(__dirname, "bundle"),
  },
  mode: "development",
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 9000,
  },
  devtool: "inline-source-map",
};

export default config;
