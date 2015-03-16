#!/usr/bin/env node

var program = require('commander');
var color = require('colorful');
var express = require('express');
var proxy = require("anyproxy");
var packageInfo = require("./package.json");
var spawn = require('child_process').spawn;

// commander options
program
    .version(packageInfo.version)
    .description('A proxy for static resources')
    .option('-p, --port [value]', 'proxy port, 9998 for default')
    .option('-c, --config [value]', 'config page port, 9999 for default');

program.on('--help', function () {
    console.log('  Examples:');
    console.log('');
    console.log('    $ aproxy -p 9998');
    console.log('    $ aproxy -p 80 -c 9999');
    console.log('');
});

program.parse(process.argv);

// reset log
console.log = function () {
};

function log(msg) {
    process.stdout.write(msg);
}

// generate rootCA file
if (!proxy.isRootCAFileExists()) {
    proxy.generateRootCA();

    log(color.green('\n请双击rootCA.crt文件，安装并信任根证书，重启浏览器后重新启动aproxy。\n\n'));
    return;
}

if (program.port || program.config) {
    log(color.red('注意：修改默认端口后，Aproxy Chrome扩展无法工作。。\n'));
}

var proxyPort = program.port || '9998';
var configPort = program.config || '9999';

// start proxy server
var options = {
    type: 'http',
    port: proxyPort,
    disableWebInterface: true
};

new proxy.proxyServer(options);

log(color.green('proxy start: 127.0.0.1:' + proxyPort + '\n'));

// deprecated config page
var server = express();
server.use('/', express.static(__dirname + '/web'));
server.use(function (req, res, next) {
    try {
        require('./fns' + req.path + '.js')(req, res);
    } catch (e) {
        next();
    }
});
server.listen(configPort);

log(color.green('config page: 127.0.0.1:' + configPort + '\n'));
