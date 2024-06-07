const typescript = require('@rollup/plugin-typescript');
const { dts } = require('rollup-plugin-dts');
const terser = require('@rollup/plugin-terser');
const copy = require('rollup-plugin-copy');

const isDev = !!process.argv.find((e) => e === '--config-dev');

const config = [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/chrowser.js',
      format: 'cjs',
      sourcemap: isDev,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser(),
      copy({
        targets: [{ src: 'src/package.json', dest: 'dist' }],
      }),
    ],
  },
  {
    input: 'dist/compiled/index.d.ts',
    output: {
      file: 'dist/chrowser.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
module.exports = config;
