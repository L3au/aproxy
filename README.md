# Aproxy

### 安装

npm install -g aproxy

### 使用

````bash
aproxy -h 查看帮助
aproxy [-c number] [-p number]
        -c: 配置端口, 默认9999
        -p: 代理端口, 默认9998
````

启动后请安装Aproxy的Chrome扩展 或者访问 http://127.0.0.1:9999 进行配置

### 更新记录

> - v2.1.2
     - 更新说明，一些配置调整

> - v2.1.0
     - 修复combo bug、https bug
     - 使用方式上以配置代理代替hosts绑定的
     - 增加Aproxy Chrome扩展管理代理配置

> - v2.0.0
     - 全新改版，底层基于[Anyproxy](https://github.com/alibaba/anyproxy)，只做中间件
     - 去除定义域名，规则匹配只与用户配置规则有关，所以不需要指定域名对应IP
     - 增加css对应less文件预处理

> - v1.0.12
     - 修复版本更新用户数据丢失的问题;
     - 完善路径匹配规则，支持跨项目路径匹配

> - v1.0.13
     - 增加头部信息支持
