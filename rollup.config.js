import path from 'path';
import babel from 'rollup-plugin-babel';
import babelMinify from 'rollup-plugin-babel-minify';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sass from 'rollup-plugin-sass';

const cssOutput = process.env.CSS_OUTPUT;

export default {
  format: 'iife',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    nodeResolve({
      jsnext: true,
      browser: true
    }),
    commonjs({
      sourceMap: false
    }),
    sass({
      output: path.join(cssOutput, 'bundle.css')
    })
  ]
}
