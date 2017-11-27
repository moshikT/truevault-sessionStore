"use strict";

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var nodemon = require('gulp-nodemon');
//var jshint = require('gulp-jshint');

gulp.task('mocha', function () {
    return gulp.src(['test/*js'], {read : false})
        .pipe(mocha({reporter : 'list'}))
        .on('error', gutil.log);
});

gulp.task('watch-mocha' ,function () {
    gulp.run('mocha');
    gulp.watch(['./**/*.js', 'test/**/*.js'], ['mocha']);
});


//gulp.task('lint', function () {
//    gulp.src('./**/*.js')
//        .pipe(jshint())
//});

gulp.task('develop', function () {
    var stream = nodemon({ script: 'app.js'
        , ext: 'ejs js css'
        , ignore: ['ignored.js']
        , tasks: ['watch-mocha'] })

    stream
        .on('restart', function () {
            console.log('restarted!')
        })
        .on('crash', function() {
            console.error('Application has crashed!\n')
            stream.emit('restart', 10)  // restart the server in 10 seconds
        })
});

gulp.task('default', ['develop']);