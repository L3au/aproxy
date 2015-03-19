/**
 * Created by Leshu on 3/15/12.
 */
var fs = require('fs');
var URL = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var less = require('less');
var color = require('colorful');
var util = require('./util');

var log = console.log;
console.log = function (msg) {
    var isFilter;
    var args = [].slice.call(arguments);
    var filters = [
        'rules initialize',
        'received request',
        'local rules'
    ];

    filters.some(function (filter) {
        if (~msg.indexOf(filter)) {
            isFilter = true;
            return true;
        }
    });

    if (!isFilter) {
        log.apply(console, args)
    }
};

module.exports = {
    summary: function () {
        return 'Aproxy started';
    },

    shouldUseLocalResponse: function (req, reqBody) {
        var host = req.headers.host;
        var protocol = (!!req.connection.encrypted && !/http:/.test(req.url)) ? "https" : "http";
        var rules = util.getProxyRules();
        var urlPattern = URL.parse(req.url);
        var urlPath = urlPattern.path;
        var origin = protocol + '://' + host;
        var url = origin + urlPath;

        log(color.cyan('process url: ' + url));

        req.url = url;
        urlPattern = URL.parse(url);

        var search = urlPattern.search || '';
        var pathname = urlPattern.pathname || '/';

        var files = {};
        var paths = [pathname];
        var isCombo = search.slice(0, 2) == '??';

        if (isCombo) {
            paths = search.slice(2).split(',').map(function (filename) {
                return pathname + filename;
            });
        }

        paths = paths.map(function (path) {
            var temp = path.slice(1);

            if (temp.match(/\/\d+\.\d+\.\d+\//)) {
                temp = temp.replace(/\/\d+\.\d+\.\d+\//, '/');
            }

            var parts = temp.split('/');

            return {
                group: parts[0],
                project: parts[1],
                path: parts.slice(2).join('/'),
                origPath: path
            }
        });

        paths.forEach(function (path) {
            rules.some(function (rule) {
                if (rule.disabled ||
                    path.group !== rule.group ||
                    path.project !== rule.project) {
                    return false;
                }

                var fullPath = rule.path.replace(/\/$/, '') + '/' + path.path;
                var lessPath = fullPath.replace(/\.css$/, '.less');

                if (lessPath.slice(-5) == '.less' && fs.existsSync(lessPath)) {
                    files[path.origPath] = lessPath;

                    return true;
                }

                if (fs.existsSync(fullPath)) {
                    files[path.origPath] = fullPath;

                    return true;
                }
            });
        });

        if (Object.keys(files).length > 0) {
            files = paths.map(function (path) {
                if (files.hasOwnProperty(path.origPath)) {
                    return files[path.origPath];
                } else {
                    return origin + path.origPath;
                }
            });
        } else {
            return false;
        }

        req.localFiles = JSON.stringify(files);
        log(color.green('forward to local files: [' + files.join(',') + ']'));

        return true;
    },

    dealLocalResponse: function (req, reqBody, callback) {
        var headers = req.headers;
        var files = JSON.parse(req.localFiles);
        var lastModified = '';

        Promise.all(files.map(function (url) {
            return new Promise(function (resolve, reject) {
                if (/^http/.test(url)) {
                    var uri = URL.parse(url);
                    var isHTTPS = uri.protocol === 'https:';

                    var options = {
                        method: 'GET',
                        port: isHTTPS ? '443' : 80,
                        host: uri.host,
                        path: uri.path,
                        headers: headers
                    };

                    var request = (isHTTPS ? https : http).request(options, function (response) {
                        var len = 0;
                        var bufferData = [];

                        response.on('data', function (chunk) {
                            bufferData.push(chunk);
                            len += chunk.length;
                        });

                        response.on('end', function () {
                            var buffer = Buffer.concat(bufferData, len);

                            if (response.statusCode == 200) {
                                resolve(buffer.toString());
                            } else {
                                reject({
                                    code: 404,
                                    file: url
                                });
                            }
                        });

                        response.on('error', function () {
                            reject({
                                code: 404,
                                file: url
                            });
                        });
                    });

                    request.end();
                } else {
                    fs.stat(url, function (err, stat) {
                        if (+stat.mtime > +lastModified) {
                            lastModified = stat.mtime;
                        }
                    });

                    if (url.slice(-5) == '.less') {
                        var dirname = path.dirname(url);
                        var basename = path.basename(url);

                        fs.readFile(url, function (err, buffer) {
                            if (err) {
                                reject({
                                    code: 500,
                                    stack: err.stack || err.toString()
                                });
                                return;
                            }

                            less.render(buffer.toString(), {
                                paths: [dirname],
                                filename: basename
                            }, function (err, output) {
                                if (!err) {
                                    resolve(output.css);
                                } else {
                                    reject({
                                        code: 500,
                                        stack: err.stack || err.toString()
                                    });
                                }
                            });
                        });
                    } else {
                        fs.readFile(url, function (err, buffer) {
                            if (err) {
                                reject({
                                    code: 500,
                                    stack: err.stack || err.toString()
                                });
                                return;
                            }

                            resolve(buffer);
                        });
                    }
                }
            });
        })).then(function (results) {
            var contents = '';
            var contentType = util.getContentType(files[0]);

            results.forEach(function (item) {
                if (Buffer.isBuffer(item)) {
                    contents += item.toString();
                } else {
                    contents += item;
                }

                contents += '\n';
            });

            callback(200, {
                'Content-Type': contentType,
                'Server': 'aproxy',
                'Last-Modified': lastModified.toString(),
                'Pragma': 'no-cache',
                'Expires': 0,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Combo-Files': '[' + files.join(',') + ']'
            }, contents);
        }, function (e) {
            var errorMsg = '';

            if (e.code == 404) {
                errorMsg += '<h1>404 Not Found</h1>';
                errorMsg += '<h2>File: ' + e.file + '</h2>';
            } else {
                errorMsg += '<h1>500 Internal Error</h1>';
                errorMsg += '<h2>' + e.stack + '</h2>';
            }

            callback(e.code, {
                'Content-Type': 'text/html',
                'Server': 'aproxy'
            }, errorMsg);
        });
    },

    shouldInterceptHttpsReq: function (req) {
        return true;
    }
};
