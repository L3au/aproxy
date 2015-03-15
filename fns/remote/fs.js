module.exports = (function(Promise, fs){
    var FILENAME = 'data/remotes.json';
    
    return {
        read: function(){
            return fs.readJSONFile(FILENAME);
        },
        write: function(obj){
            return fs.writeJSONFile(FILENAME, obj);
        }
    };
}(require('promise'), require('../fs.js')));
