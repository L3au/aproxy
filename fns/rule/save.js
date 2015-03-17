/**
 * Created by Leshu on 3/17/15.
 */
module.exports = (function(fs){
    return function(req, res){
        var rules = req.param('rules') || '[]';

        rules = JSON.parse(decodeURIComponent(rules));

        fs.write(rules).done(function(){
            res.json({ success: true });
        }, function(){
            res.json({ success: false });
        });
    };
}(require('./fs.js')));
