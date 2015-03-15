module.exports = (function(ds){

    return {
        readJSONFile: function(filename){
            return ds.readJSONFile(filename);
        },
        
        writeJSONFile: function(filename, object){
            return ds.writeJSONFile(filename, object);
        }
    };
}(require('./ds')));
