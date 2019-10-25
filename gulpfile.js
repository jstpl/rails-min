var gulp = require('gulp');
var build = require('./gulp/script/build');

gulp.task('clean', build.clean);
gulp.task('build-dev', build.dev);
gulp.task('build-prod', build.prod);
gulp.task('build-rails', build.rails);