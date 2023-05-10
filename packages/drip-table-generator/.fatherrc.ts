import dotenv from 'dotenv';
import { defineConfig } from 'father';
import path from 'path';

export default defineConfig({
  umd: {
    entry: {
      'src/index': {
        output: 'dist',
      },
    },
    chainWebpack(config, { webpack }) {
      const configs = dotenv.config({
        path: path.resolve(__dirname, '../../.env'),
        encoding: 'utf8',
      });
      const env = {};
      for (const key of Object.keys(configs)) {
        env[key] = configs[key];
      }
      config.plugin('define').use(webpack.DefinePlugin, [{
        'process.env': JSON.stringify(env),
      }]);
      return config;
    },
  },
  cjs: {
    platform: 'browser',
    output: 'lib',
  },
  esm: { output: 'es' },
});
