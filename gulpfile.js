const DIST_DIR = __dirname + '/dist';
const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const rollup = require('gulp-better-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const {noop} = require('gulp-util');
const plumber = require('gulp-plumber');
const connect = require('connect');
const serveStatic = require('serve-static');
const child_process= require('child_process');

const PORT= 3000;

let isDevMode= false;

function createBuildTask(entryFile, buildOptions) {

    const {
        exportName= path.basename(entryFile, '.js'),
        destPath= DIST_DIR + '/',
        format= 'umd',
        taskTargetName = exportName
    } = buildOptions || {};


    const taskName = `build:${taskTargetName}`;

    gulp.task(taskName, () => {
        return gulp.src(entryFile)
            .pipe(isDevMode ? plumber() : noop())
            .pipe(rollup({
                plugins: [
                    resolve({jsnext: true}),
                    commonjs({
                        include: 'node_modules/**'
                    })
                ],

                preferConst: true
            }, {
                name: exportName,
                format
            }))

            .pipe(gulp.dest(destPath))
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

const clientBuildTask= createBuildTask('src/safe-jsonp.client.js', {exportName: 'JSONP', minify: false});
const serverBuildTask= createBuildTask('src/safe-jsonp.node.js', {format: 'cjs'});
const testBuildTask = createBuildTask('test/safe-jsonp.spec.js', {
    format: 'cjs',
    destPath: path.resolve(DIST_DIR, '/test')
});

gulp.task('build', [clientBuildTask, serverBuildTask]);

let spawned_process= null;

gulp.task('kill-server', function(){
    if(spawned_process){
        spawned_process.kill();
        console.log('Child process killed');
    }
});

gulp.task('run-server-sandbox',function(){
    spawned_process = child_process.fork('./test/jsonp-server.js', {
        //'execArgv': ['inspect']
    });

    spawned_process.on('exit', (code)=>{
        console.log(`Child exited with code ${code}`);
    });

});

const shellTask = (name, command) => {
    gulp.task(name, function (done) {
        spawned_process = child_process.exec(command);

        spawned_process.on('exit', (code) => {
            console.log(`Child proccess for ${name} exited with code ${code}`);
            code ? done(new Error(`Process exit code ${code}`)) : done();
        });
    });

    return name;
};

const npmBuildTest = shellTask('npm:test:build', 'npm run test:build');


gulp.task('dev', function (done) {
    isDevMode= true;

    runSequence(['build', 'webserver'], npmBuildTest, 'run-server-sandbox', function () {
        console.log('File watcher started');
        gulp.watch('./src/**/*.js', ['kill-server', 'build', npmBuildTest, 'run-server-sandbox'], function (file) {
            console.log(`File [${file.path}] has been changed`);
        });

        gulp.watch('./test/**/*.js', ['kill-server', npmBuildTest, 'run-server-sandbox'], function (file) {
            console.log(`File [${file.path}] has been changed`);
        })
    });

});

gulp.task('default', ['build']);



