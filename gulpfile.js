var gulp = require('gulp');
var path = require('path');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var smoosher = require('gulp-smoosher');
var minifyHTML = require('gulp-minify-html');
var livereload = require('gulp-livereload');
var ghPages = require('gulp-gh-pages');
var gulpif = require('gulp-if');
var imageResize = require('gulp-image-resize');
var changed = require('gulp-changed');
var twig = require('./tools/gulpTwig');
var rename = require("gulp-rename");
var argv = require('yargs').argv;

var buildType = 'dev';
if (argv.dist) buildType = 'dist'

var sourcePaths = {
   dev: {
       js: ['src/js/**/*.js', 'tools/livereload.js'],
       mainless: ['src/less/main.less'],
       less: ['src/less/**/*.less'],
       maintwig: ['src/twig/*.twig'],
       twig: ['src/twig/**/*.twig'],       
       img: ['src/img/*.png', 'src/img/*.jpg'],
       gallery: ['src/gallery/**/*.png', 'src/gallery/**/*.jpg']
   },
   dist: {
       js: ['src/js/**/*.js'],
       mainless: ['src/less/main.less'],
       less: ['src/less/**/*.less'],
       maintwig: ['src/twig/*.twig'],
       twig: ['src/twig/**/*.twig'],         
       img: ['src/img/*.png', 'src/img/*.jpg'],
       gallery: ['src/gallery/**/*.png', 'src/gallery/**/*.jpg']       
   }    
};

var targetPaths = {
    dev: {
        maintwig: 'dev',
        img: 'dev/img',
        gallery: 'dev/gallery'
    },
    dist: {
        maintwig: 'dist',
        img: 'dist/img',
        gallery: 'dist/gallery'        
    }
};

gulp.task('img', function() {
  return gulp.src(sourcePaths[buildType].img)    
    .pipe(gulp.dest(targetPaths[buildType].img));
});

gulp.task('js', function() {
  return gulp.src(sourcePaths[buildType].js)
    .pipe(concat('min.js'))
    .pipe(gulpif(buildType === 'dist', uglify()))
    .pipe(gulp.dest('temp'));
});

gulp.task('less', function() {
  return gulp.src(sourcePaths[buildType].mainless)
    .pipe(gulpif(buildType === 'dist', less({paths: [path.join(__dirname, 'src', 'less')], compress: true})))
    .pipe(gulpif(buildType === 'dev', less({paths: [path.join(__dirname, 'src', 'less')], compress: false})))
    .pipe(concat('min.css'))
    .pipe(gulp.dest('temp'));
});

gulp.task('gallery', ['thumb'], function() {
  return gulp.src(sourcePaths[buildType].gallery)
    .pipe(changed(targetPaths[buildType].gallery))  
    .pipe(imageResize({
      height : 800,        
      crop : false,
      upscale : false,
      quality: 0.8,
      imageMagick: true
    }))
    .pipe(imageResize({
      width : 800,        
      crop : false,
      upscale : false,
      quality: 0.8,
      imageMagick: true
    }))    
    .pipe(gulp.dest(targetPaths[buildType].gallery));    
})

gulp.task('thumb', function() {
  return gulp.src(sourcePaths[buildType].gallery)
    .pipe(changed(targetPaths[buildType].gallery))  
    .pipe(imageResize({
      height : 200,
      width: 200,        
      crop : false,
      upscale : false,
      quality: 0.8,
      imageMagick: true
    }))
    .pipe(rename({suffix: '-thumb'}))
    .pipe(gulp.dest(targetPaths[buildType].gallery));    
})

gulp.task('twig', ['js', 'less'], function() {
  return gulp.src(sourcePaths[buildType].maintwig)
    .pipe(twig())        
    .pipe(smoosher())  
    .pipe(gulpif(buildType === 'dist', minifyHTML({})))
    .pipe(gulp.dest(targetPaths[buildType].maintwig))
});

gulp.task('dev-server', function(){
  require('./tools/devserver');
});

gulp.task('main', ['img', 'gallery', 'twig']);

gulp.task('deploy', function(){
  gulp.src('dist/**/*')
    .pipe(ghPages());  
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(sourcePaths.dev.twig, ['twig']);    
  gulp.watch(sourcePaths.dev.js, ['twig']);
  gulp.watch(sourcePaths.dev.less, ['twig']);
  gulp.watch('dev/**/*.html').on('change', function(){setTimeout(livereload.changed, 150)});
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'dev-server', 'main']);
