import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // 入口
  outDir: 'dist', // 打包输出目录
  clean: true, // 每次打包前清空目录
  format: ['esm'], // 打包格式
  dts: true, // 输出 d.ts 文件
  minify: true, // 压缩代码
  shims: true, // 处理 node 内置模块
});

