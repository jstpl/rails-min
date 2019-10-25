var glob = require('glob');

var helper = {
    getFileList: function (list) {
        var fileArray = [];
        for(var k in list) {
            var file = list[k];
            var files = glob.sync(file);
            fileArray = fileArray.concat(files);
        }
        return fileArray;
    },
    replaceInArray: function (list, from, to) {
        for(var k in list) {
            var item = list[k];
            list[k] = item.replace(from, to);
        }
        return list;
    },
    generateScriptTags: function (list) {
        var code = [];
        for(var k in list) {
            var url = list[k];
            code = code + '<script src="'+url+'"></script>\n';
        }
        return code;
    },
    generateStyleTags: function (list) {
        var code = [];
        for(var k in list) {
            var url = list[k];
            code = code + '<link  href="'+url+'" rel="stylesheet">\n';
        }
        return code;
    },
    renderIncludedList: function (fileMap) {
        var list = helper.getFileList(fileMap);
        var listFiles = '';
        for(var k in list) {
            var url = list[k];
            var item = ''+url+'';
            listFiles = listFiles + "\n" + item;
        }
        return '/**\nIncluded files:'+listFiles+'\n*/';
    },
};

module.exports = helper;
