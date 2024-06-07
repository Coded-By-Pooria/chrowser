const typescript = require('@rollup/plugin-typescript');
const { dts } = require('rollup-plugin-dts');
const terser = require('@rollup/plugin-terser');
const copy = require('rollup-plugin-copy');
const path = require('path');

const isDev = !!process.argv.find((e) => e === '--config-dev');
const destRootDir = path.join('dist', 'chrowser_module');

const config = [
  {
    input: 'src/index.ts',
    output: {
      file: path.join(destRootDir, 'chrowser.js'),
      format: 'cjs',
      sourcemap: isDev,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser(),
      copy({
        targets: [{ src: 'src/package.json', dest: destRootDir }],
      }),
    ],
  },
  {
    input: path.join(destRootDir, 'compiled', 'index.d.ts'),
    output: {
      file: path.join(destRootDir, 'chrowser.d.ts'),
      format: 'es',
    },
    plugins: [dts()],
  },
];
module.exports = config;
