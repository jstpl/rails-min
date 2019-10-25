var config = require('./config');

var src = {
    style: [
        /*'./node_modules/bootstrap/dist/css/bootstrap.css',
        './node_modules/bootstrap/dist/css/bootstrap-theme.css',
        './node_modules/toastr/build/toastr.min.css',*/
    ],
    vendor: [
        //'./node_modules/jquery/dist/jquery.min.js',
        './node_modules/lodash/lodash.min.js',
        //'./node_modules/bootstrap/dist/js/bootstrap.min.js',
        //'./node_modules/director/build/director.min.js',
        //'./node_modules/redux/dist/redux.min.js',
        //'./node_modules/vue/dist/vue.min.js',
        //'./node_modules/toastr/build/toastr.min.js',
        //'./node_modules/jquery-ui/jquery-ui.min.js',
    ],
    rails: [
        './node_modules/jrails/kernel/namespace.js',
        './node_modules/jrails/kernel/container.js',
        './node_modules/jrails/kernel/bootstrap.js',
        './node_modules/jrails/kernel/func.js',

        './node_modules/jrails/helper/*.js',
        './node_modules/jrails/event/*.js',
    ],
    app: [

        config.src.path + '/module/**/config/*.js',

        config.src.path + '/module/app/bootstrap.js',
        config.src.path + '/module/app/run.js',
    ],
};

src.all = src.vendor.concat(src.rails).concat(src.app);

module.exports = src;
