const DIST_DIR = __dirname + '/dist';
const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const rollup = require('gulp-better-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const {noop} = require('gulp-util');
const plumber = require('gulp-plumber');
const connect = require('connect');
const serveStatic = require('serve-static');
const child_process= require('child_process');
const rename = require('gulp-rename');
const terser = require('gulp-minify');

const PORT= 3000;

let isDevMode= false;

const clientEntryFile = 'src/safe-jsonp.js';

function createBuildTask(entryFile, buildOptions) {

    const {name, base, ext} = path.parse(entryFile),
        {
            exportName = name,
            destPath = DIST_DIR,
            format = 'umd',
            toES5 = false,
            outFile = `${name}.${format}${ext}`,
            taskTargetName = outFile,
            minify = false,
            include = 'node_modules/**',
            exclude,
            targets,
            useBuiltIns = 'usage'
        } = buildOptions || {};


    const taskName = `build:${taskTargetName}`;

    const rollupPlugins = [
        resolve({jsnext: true}),
        commonjs({
            include: include === false ? undefined : include,
            exclude
        })
    ];


    if (toES5) {
        rollupPlugins.push(babel())
    }

    gulp.task(taskName, () => {
        return gulp.src(entryFile)
            .pipe(isDevMode ? plumber() : noop())
            .pipe(rollup({
                plugins: rollupPlugins,

                preferConst: true
            }, {
                name: exportName,
                format
            }))
            .pipe(outFile !== base ? rename(outFile) : noop())

            .pipe(gulp.dest(destPath))
            .pipe(minify ? terser({
                ext: {
                    min: ".min.js"
                },

                noSource: true
            }) : noop())
            .pipe(minify ? gulp.dest(destPath) : noop())
    });

    return taskName;
}

gulp.task('webserver', function() {
    connect()
        .use(serveStatic('./'))
        .use(serveStatic('./public'))
        .use(serveStatic('./dist'))
        .use(serveStatic('./src'))
        .use(serveStatic('./test'))
        .listen(PORT);

    console.log(`Server listening on http://localhost:${PORT}`);
});

const clientBuildTask = createBuildTask(clientEntryFile, {exportName: 'JSONP', toES5: true, minify: true});
const clientBuildTaskES = createBuildTask(clientEntryFile, {format: 'esm', minify: true});


gulp.task('build', [clientBuildTask, clientBuildTaskES]);
gulp.task('build:dev', [clientBuildTask]);



let spawned_process= null;

gulp.task('kill-server', function(){
    if(spawned_process){
        spawned_process.kill();
        console.log('Child process killed');
    }
});

gulp.task('jsonp-server', function () {
    spawned_process = child_process.fork('./test/jsonp-server.js');

    spawned_process.on('exit', (code)=>{
        console.log(`JSONP server exited with code ${code}`);
    });

});

const shellTask = (name, command) => {
    gulp.task(name, function (done) {
        spawned_process = child_process.exec(command);

        spawned_process.on('exit', (code) => {
            console.log(`Child process for ${name} exited with code ${code}`);
            code ? done(new Error(`Process for task ${name} exited with code ${code}`)) : done();
        });
    });

    return name;
};

const npmBuildTest = shellTask('test:build', 'npm run test:build');


gulp.task('dev', function (done) {
    isDevMode= true;

    runSequence(['build:dev', 'webserver'], npmBuildTest, 'jsonp-server', function () {
        console.log('File watcher started');
        gulp.watch('./src/**/*.js', ['kill-server', 'build:dev', npmBuildTest, 'jsonp-server'], function (file) {
            console.log(`File [${file.path}] has been changed`);
        });

        gulp.watch('./test/**/*.js', ['kill-server', npmBuildTest, 'jsonp-server'], function (file) {
            console.log(`File [${file.path}] has been changed`);
        })
    });

});

gulp.task('default', ['build']);



