var gulp = require('gulp');
var glob = require('glob');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var concatCss = require('gulp-concat-css');
var replace = require('gulp-replace');
var csso = require('gulp-csso');
var clean = require('gulp-clean');
var config = require('../config/config');
var src = require('../config/src');
var helper = require('./helper');

var builder = {
    buildScript: function (sourceMap, targetDest, targetFileName, isMinify) {
        var listFilesDocBlockRails = helper.renderIncludedList(sourceMap);
        var gulp1 = gulp.src(sourceMap, { sourcemaps: true })
            .pipe(concat(targetFileName))
            .pipe(replace(build.firstCharExp, listFilesDocBlockRails + '\n\n$1'));
        if(isMinify === true) {
            gulp1 = gulp1.pipe(minify());
        }
        gulp1.pipe(gulp.dest(targetDest));
    },
    buildStyle: function (sourceMap, targetDest, targetFileName, isMinify) {
        var listFilesDocBlockStyle = helper.renderIncludedList(sourceMap);
        var gulp1 = gulp.src(sourceMap)
            .pipe(concatCss(targetFileName))
            .pipe(replace(build.firstCharExp, listFilesDocBlockStyle + '\n\n$1'));
        if(isMinify === true) {
            gulp1 = gulp1
                .pipe(csso())
                .pipe(minify());
        }
        gulp1.pipe(gulp.dest(targetDest));
    },
    buildPage: function (scriptList, styleList, targetDest) {
        scriptList = helper.replaceInArray(scriptList, './', '/');
        styleList = helper.replaceInArray(styleList, './', '/');
        var code = helper.generateScriptTags(scriptList);
        var style = helper.generateStyleTags(styleList);
        gulp.src([config.src.path + '/index.html'])
            .pipe(replace('<!--SCRIPT_PLACEHOLDER-->', code))
            .pipe(replace('<!--STYLE_PLACEHOLDER-->', style))
            .pipe(gulp.dest(targetDest));
    },
};

var build = {
    firstCharExp: /^([\s\S]{1})/g,

    /**
     * Собираем проект для продакшн
     * 
     * Шаги:
     * - собираем стили
     * - собираем скрипты
     * - собираем шаблоны
     * - мнифицируем
     */
    prod: function () {
        builder.buildStyle(src.style, './dist/assets/style', 'build.css', true);
        builder.buildScript(src.all, './dist/assets/script', 'build.js', true);

        var scriptList = ['assets/script/build-min.js'];
        var styleList = ['assets/style/build.css'];

        scriptList = helper.replaceInArray(scriptList, '/src/', '/');
        styleList = helper.replaceInArray(styleList, '/src/', '/');

        builder.buildPage(scriptList, styleList, './dist');
    },

    /**
     * Собираем проект для разработки
     * 
     * Шаги:
     * - собираем стили в разные файлы (вендоры, рельсы)
     * - собираем скрипты в разные файлы (вендоры, рельсы)
     */
    dev: function () {
        builder.buildStyle(src.style, './src/assets/style', 'vendor.css');
        builder.buildScript(src.vendor, './src/assets/script', 'vendor.js');
        //builder.buildScript(src.rails, './src/assets/script', 'rails.js');

        var vendorScriptList = ['./src/assets/script/vendor.js'];
        var bundleScriptList = helper.getFileList(src.rails);
        var appScriptList = helper.getFileList(src.app);
        var scriptList = vendorScriptList.concat(bundleScriptList.concat(appScriptList));
        var styleList = ['./src/assets/style/vendor.css'];
        builder.buildPage(scriptList, styleList, '.');
    },

    /**
     * Собираем рельсы
     *
     * Шаги:
     * - собираем стили отдельно
     * - собираем скрипты отдельно
     */
    rails: function () {
        builder.buildScript(src.rails, './src/assets/script', 'rails.js', true);
    },

    clean: function () {
        return gulp.src([
            './src/assets',
            './dist',
        ], {read: false})
            .pipe(clean());
    },
};

module.exports = build;
