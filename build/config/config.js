
var config = {
    dev: {},
    dist: {},
    min: {},
    src: {},
    temp: {}
};

config.src.path = './src';

config.dev.path = './src/vendor';
config.dev.scriptOutputPath = config.dev.path + '/';
config.dev.styleOutputPath = config.dev.path + '/';
config.dev.scriptFileName = 'app.js';
config.dev.styleFileName = 'app.css';

config.dist.path = './dist';
config.dist.scriptOutputPath = config.dist.path + '/script/';
config.dist.styleOutputPath = config.dist.path + '/style/';

config.min.path = './dist/min';
config.min.scriptOutputPath = config.min.path + '/script/';
config.min.styleOutputPath = config.min.path + '/style/';

config.temp.path = './temp';

module.exports = config;
