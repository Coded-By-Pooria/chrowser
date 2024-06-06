const typescript = require('@rollup/plugin-typescript');
const { dts } = require('rollup-plugin-dts');

const config = [
  {
    input: 'build/compiled/index.js',
    output: {
      file: 'build/chrowser.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [typescript()],
  },
  {
    input: 'build/compiled/index.d.ts',
    output: {
      file: 'build/chrowser.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
module.exports = config;
