/**
 * Created by Leshu on 3/16/15.
 */

var fs = require('fs');
var path = require('path');

module.exports = {
    log: function () {
        process.stdout.write(msg + '\n');
    },

    getHomePath: function () {
        return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    },

    getContentType: function (url) {
        var ext = path.extname(url).slice(1);
        var mineTypes = {
            'css': 'text/css; charset=UTF-8',
            'less': 'text/css; charset=UTF-8',
            'js': 'javascript/x-javascript; charset=utf-8'
        };

        return mineTypes[ext];
    },

    getProxyRules: function () {
        var rules = [];
        var homePath = this.getHomePath();
        var rulesPath = path.join(homePath, '.aproxy/rules.json');

        try {
            rules = JSON.parse(fs.readFileSync(rulesPath));
        } catch (e) {
            return [];
        }

        return rules;
    },

    saveProxyRules: function (req, callback) {
        var len = 0;
        var bufferData = [];

        req.on('data', function (chunk) {
            bufferData.push(chunk);
            len += chunk.length;
        });

        req.on('end', function () {
            var buffer = Buffer.concat(bufferData, len);
            var content = buffer.toString().replace('rules=', '');

            content = decodeURIComponent(content);

            try {
                JSON.parse(content);
            } catch (e) {
                callback(e);
                return;
            }

            saveRules(content);
        });

        var self = this;

        function saveRules(rules) {
            var homePath = self.getHomePath();
            var rulesPath = path.join(homePath, '.aproxy/rules.json');

            fs.writeFile(rulesPath, rules, function (e) {
                callback(e);
            });
        }
    }
};
