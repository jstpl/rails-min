var railsSrc = require('../../node_modules/jrails/gulp/config/src');

var src = {
    style: {
        vendorApp: []
    },
    script: {
        vendorApp: [],
        railsApp: [],
        app: [
            './src/module/**/config/*.js',
            './src/module/app/bootstrap.js',
            './src/module/app/run.js',
        ]
    }
};

src.script.vendor = railsSrc.script.vendorRequired.concat(src.script.vendorApp);
src.script.rails = railsSrc.script.railsRequired.concat(src.script.railsApp);
src.script.all = src.script.vendor.concat(src.script.rails).concat(src.script.app);

src.style.all = src.style.vendorApp;

module.exports = src;
