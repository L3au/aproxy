module.exports = (function(fs){
    return function(req, res){
        var index = +req.param('index', -1);
        
        if(index < 0){
            res.json({ success: false });
        }else {
            fs.read().done(function(rules){
                if(index >= rules.length){
                    res.json({ success: false });
                }else{
                    rules = rules.filter(function(e, i){
                        return i !== index;
                    });
                    fs.write(rules).done(function(){
                        res.json({ success: true });
                    }, function(){
                        res.json({ success: false });
                    });
                }
            }, function(){
                res.json({ success: false });
            });
        }
    };
}(require('./fs')));