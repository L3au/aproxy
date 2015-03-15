/**
 * Created by Leshu on 3/15/12.
 */
var ip = require('ip');
var fs = require('fs');
var URL = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var less = require('less');
var color = require('colorful');

function log(msg) {
    process.stdout.write(msg + '\n');
}

function getType(file) {
    var ext = path.extname(file).slice(1);
    var mineTypes = {
        'js': 'text/javascript',
        'css': 'text/css'
    };

    return mineTypes[ext];
}

function getRules() {
    var homePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    var rulesPath = path.join(homePath, '.aproxy/data/rules.json');
    var rules = [];

    if (fs.existsSync(rulesPath)) {
        var buffer = fs.readFileSync(rulesPath);

        rules = JSON.parse(buffer.toString());

        rules = rules.filter(function (rule) {
            return !rule.disabled;
        });

        rules = rules.map(function (rule) {
            var from = rule.from;
            var to = rule.to;

            var match = from.match(/([\w-]+)/g);

            if (match && match.length >= 2) {
                return {
                    group: match[0],
                    project: match[1],
                    path: to
                }
            }

            return {};
        });
    }

    return rules;
}

module.exports = {
    //summary: function () {
    //    return '';
    //},

    shouldUseLocalResponse: function (req, reqBody) {
        var rules = getRules();

        if (rules.length == 0) {
            return false;
        }

        var host = req.headers.host;
        var protocol = (!!req.connection.encrypted && !/http:/.test(req.url)) ? "https" : "http";

        var urlPattern = URL.parse(req.url);
        var urlPath = urlPattern.path;
        var origin = protocol + '://' + host;
        var url = origin + urlPath;

        if (['.js', '.css'].indexOf(path.extname(url)) == -1) {
            return false;
        }

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
                if (path.group !== rule.group || path.project !== rule.project) {
                    return false;
                }

                var fullPath = rule.path.replace(/\/$/, '') + '/' + path.path;

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

        return true;
    },

    dealLocalResponse: function (req, reqBody, callback) {
        var files = JSON.parse(req.localFiles || '[]');
        var lastModified = '';

        if (!files.length) {
            return;
        }

        Promise.all(files.map(function (url) {
            return new Promise(function (res, rej) {
                if (/^http/.test(url)) {
                    var req = (/^https/.test(url) ? https : http).get(url);

                    req.ignore = true;
                    req.on('error', function () {
                        rej();
                    });
                } else {
                    fs.stat(url, function (err, stat) {
                        if (+stat.mtime > +lastModified) {
                            lastModified = stat.mtime;
                        }
                    });

                    var lessPath = url.replace(/\.css$/, '.less');
                    if (path.extname(lessPath) == '.less' && fs.existsSync(lessPath)) {
                        var dirname = path.dirname(lessPath);
                        var basename = path.basename(lessPath);

                        fs.readFile(lessPath, function (err, buffer) {
                            if (err) {
                                rej();
                                return;
                            }

                            less.render(buffer.toString(), {
                                paths: [dirname],
                                filename: basename
                            }, function (e, output) {
                                if (!e) {
                                    res(output.css);
                                } else {
                                    rej(e);
                                }
                            });
                        });
                    } else {
                        fs.readFile(url, function (err, buffer) {
                            if (err) {
                                rej();
                                return;
                            }

                            res(buffer);
                        });
                    }
                }
            });
        })).then(function (results) {
            var contents = '';
            var contentType = getType(files[0]);

            results.forEach(function (item) {
                if (Buffer.isBuffer(item)) {
                    contents += item.toString();
                } else {
                    contents += item;
                }

                contents += '\n';
            });

            callback(200, {
                'Content-Length': contents.length,
                'Content-Type': contentType,
                'Server': 'aproxy',
                'Last-Modified': lastModified.toString()
            }, contents);
        }, function () {
            callback(404, {
                'Content-Type': 'text/html',
                'Server': 'aproxy'
            }, '<h1>404 Not Found</h1>');
        });
    },

    //replaceRequestProtocol: function (req, protocol) {
    //    return 'http';
    //},
    //
    //replaceRequestOption: function (req, option) {
    //    return option;
    //},
    //
    //replaceRequestData: function (req, data) {
    //    return data;
    //},
    //
    //replaceResponseStatusCode: function (req, res, statusCode) {
    //    return statusCode;
    //},
    //
    //replaceResponseHeader: function (req, res, header) {
    //    return header;
    //},
    //
    //replaceServerResDataAsync: function (req, res, serverResData, callback) {
    //    callback(serverResData);
    //},
    //
    //pauseBeforeSendingResponse: function (req, res) {
    //    return 0;
    //},

    shouldInterceptHttpsReq: function (req) {
        return true;
    }
};
