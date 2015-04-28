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

启动后

![](http://gtms03.alicdn.com/tps/i3/TB1_Z6GHFXXXXbXXXXXVqNfLXXX-1144-730.png_570x10000.jpg)

请安装Aproxy的[Chrome扩展](https://chrome.google.com/webstore/detail/aproxy-config/njconeaigoafkdkcoaioddgmcioocabh)进行配置

![](http://ww4.sinaimg.cn/large/621d64c1gw1erl3ujrwtaj20970hk75w.jpg)

### 更新记录

> - v2.2.0
     - fix https bug
     - fix aproxy config

> - v2.1.2
     - 更新说明，一些配置调整

> - v2.1.0
     - 修复combo bug、https bug
     - 使用方式上以配置代理代替hosts绑定的
     - 增加Aproxy Chrome扩展管理代理配置

> - v2.0.0
     - 去除定义域名，规则匹配只与用户配置规则有关，所以不需要指定域名对应IP
     - 增加css对应less文件预处理

> - v1.0.12
     - 修复版本更新用户数据丢失的问题;
     - 完善路径匹配规则，支持跨项目路径匹配

> - v1.0.13
     - 增加头部信息支持
