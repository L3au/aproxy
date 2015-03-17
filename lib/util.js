/**
 * Created by Leshu on 3/16/15.
 */

var fs = require('fs');
var path = require('path');

function log(msg) {
    process.stdout.write(msg + '\n');
}

function getType(file) {
    var ext = path.extname(file).slice(1);
    var mineTypes = {
        'js': 'text/javascript; charset=utf-8',
        'css': 'text/css; charset=utf-8',
        'less': 'text/css; charset=utf-8'
    };

    return mineTypes[ext];
}

function getRules() {
    var rules = [];
    var homePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    var rulesPath = path.join(homePath, '.aproxy/data/rules.json');

    if (fs.existsSync(rulesPath)) {
        rules = JSON.parse(fs.readFileSync(rulesPath) || '[]');

        rules = rules.filter(function (rule) {
            return rule.disabled !== true;
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

exports.log = log;
exports.getType = getType;
exports.getRules = getRules;
