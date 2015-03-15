#!/usr/bin/env node

var ip = require('ip');
var program = require('commander');
var color = require('colorful');
var fs = require("fs");
var path = require("path");
var http = require('http');
var express = require('express');
var proxy = require("anyproxy");
var packageInfo = require("./package.json");

var localIp = 'http://' + (ip.address() || '127.0.0.1') + ':';

// reset log
//console.log = function () {};

function log(msg) {
    process.stdout.write(msg);
}

// generate rootCA file
if (!proxy.isRootCAFileExists()) {
    proxy.generateRootCA();

    log(color.green('\n请双击rootCA.crt文件，安装并信任根证书，重启浏览器后重新启动aproxy。\n\n'))
}

// commander options
program
    .version(packageInfo.version)
    .description('A proxy for static resources')
    .option('-p, --port [value]', 'proxy port, 9001 for default')
    .option('-c, --config [value]', 'config page port, 9999 for default');

program.on('--help', function(){
    console.log('  Examples:');
    console.log('');
    console.log('    $ aproxy -p 9001');
    console.log('    $ aproxy -p 80 -c 9999');
    console.log('');
});

program.parse(process.argv);


var proxyPort = program.port || '9001';
var configPort = program.config || '9999';

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

log(color.green('config page: ' + localIp  + configPort + '\n'));


// start proxy server
var options = {
    type: 'http',
    port: proxyPort,
    disableWebInterface: true
};

new proxy.proxyServer(options);

log(color.green('proxy start: ' + localIp + proxyPort + '\n'));
