var gulp = require('gulp'),

    autoprefixer = require('gulp-autoprefixer'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    html2js = require('gulp-html2js'),
    livereload = require('gulp-livereload'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    webserver = require('gulp-webserver');

var folder = './';

gulp.task('docs:compile', function() {
    return gulp.src([
            './docs/sass/**/*.scss',
            '!/**/_*.scss',
        ], {
            base: '.'
        })
        .pipe(sass().on('docs:compile.error', function(error) {
            console.log('docs:compile:error', error);
        }))
        .pipe(rename('docs.css'))
        .pipe(gulp.dest('./docs/css')) // save .css
        .pipe(autoprefixer()) // autoprefixer
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./docs/css')); // save .min.css
});
gulp.task('docs:watch', function() {
    return gulp.watch('./docs/sass/**/*.scss', ['docs:compile'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});
gulp.task('docs', ['docs:compile', 'docs:watch']);

gulp.task('sass:compile', function() {
    return gulp.src([
            './sass/**/*.scss',
            '!/**/_*.scss',
        ], {
            base: '.'
        })
        .pipe(sass().on('sass:compile.error', function(error) {
            console.log('sass:compile:error', error);
        }))
        .pipe(rename('hash.css'))
        .pipe(gulp.dest('./docs/dist')) // save .css
        .pipe(autoprefixer()) // autoprefixer
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./docs/dist')); // save .min.css
});
gulp.task('sass:watch', function() {
    return gulp.watch('./sass/**/*.scss', ['sass:compile'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});
gulp.task('sass', ['sass:compile', 'sass:watch']);

var jsbundle = [
    './module/b.js',
    './module/module.js',
    './module/configs/configs.js',
    './module/controllers/controllers.js',
    './module/directives/directives.js',
    './module/filters/filters.js',
    './module/models/models.js',
    './module/services/services.js',
    './module/templates/templates.js',
    './module/e.js',
];
gulp.task('js:bundle:0', function() {
    return gulp.src(jsbundle, {
            base: '.'
        })
        .pipe(rename({
            dirname: '', // flatten directory
        }))
        .pipe(concat('./docs/dist/hash.js')) // concat bundle
        .pipe(gulp.dest('.')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('.')) // save .map
        .pipe(gulp.dest('.')); // save .min.js
});
gulp.task('js:bundles', ['js:bundle:0'], function(done) {
    done();
});
gulp.task('js:watch', function() {
    return gulp.watch(jsbundle, ['js:bundles'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});

gulp.task('webserver', function() {
    return gulp.src(folder)
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            port: 5555,
            open: 'http://localhost:5555/docs/index.html',
            fallback: 'docs/index.html'
        }));
});

gulp.task('compile', ['sass:compile', 'js:bundles', 'docs:compile'], function(done) {
    done();
});

gulp.task('watch', ['sass:watch', 'js:watch', 'docs:watch'], function(done) {
    done();
});

gulp.task('default', ['compile', 'webserver', 'watch']);