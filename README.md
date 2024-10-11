# nmg-manage
简易项目管理工具，快速切换 npm 源打开项目目录

## 安装
```bash
npm install -g nmg-manage
```

## 快速上手

### 操纵 npm 源
```bash
nmg ls # 查看设置的所有npm源
nmg add <tag> <url> # 添加npm源
nmg cur # 查看当前使用的npm源
nmg use <tag> # 切换npm源
nmg clean # 清除所有npm源
```


### 操纵仓库启动



```bash
nmg ls -r # 查看设置的所有仓库
nmg add <tag> [url] -r # 添加仓库地址，默认当前目录
nmg clean -r # 清除所有仓库
nmg code <tag> -i [vscode/ws] # 打开仓库目录，需要配置vscode的code命令或者wbstorm的ws命令才可以使用，默认使用vscode，使用-i参数指定一次ws之后后面默认为对应的编译器
```