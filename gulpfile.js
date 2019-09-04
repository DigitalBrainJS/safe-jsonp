const path = require('path');
const gulp = require('gulp');
const rollup = require('gulp-better-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const plumber = require('gulp-plumber');
const connect = require('connect');
const serveStatic = require('serve-static');
const child_process = require('child_process');
const rename = require('gulp-rename');
const terser = require('gulp-minify');
const through = require("through2");

const noop = () => through.obj();

const ENTRY_FILE = "src/safe-jsonp.js";
const BASE_NAME = path.basename(ENTRY_FILE, '.js');
const EXPORT_NAME = 'JSONP';
const DIST_DIR = __dirname + '/dist';
const PORT= 3000;

let isDevMode= false;

function createBuildTask(entryFile, buildOptions) {

    const {name, base, ext} = path.parse(entryFile),
        {
            exportName = name,
            destPath = DIST_DIR,
            format = 'umd',
            toES5 = false,
            outFile = `${name}.${format}${ext}`,
            taskTargetName = outFile,
            include = 'node_modules/**',
            exclude,
            minify
        } = buildOptions || {};

    const taskName = `build:${taskTargetName}`;

    const rollupPlugins = [
        resolve({mainFields: ['module', 'main']}),
        commonjs({
            include: include !== false ? include : undefined,
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
            }, {
                name: exportName,
                format,
                preferConst: true
            }))
            .pipe(outFile !== base ? rename(outFile) : noop())

            .pipe(gulp.dest(destPath))
            .pipe(minify ? terser({
                ext: {
                    min: '.min.js'
                },

                noSource: true
            }) : noop())
            .pipe(minify ? gulp.dest(destPath) : noop());
    });

    return taskName;
}

const webserver = () => {
    connect()
        .use(serveStatic('./'))
        .use(serveStatic('./public'))
        .use(serveStatic('./dist'))
        .use(serveStatic('./src'))
        .use(serveStatic('./test'))
        .listen(PORT);

    console.log(`Server listening on http://localhost:${PORT}`);
};

const buildTask = createBuildTask(ENTRY_FILE, {exportName: EXPORT_NAME, toES5: true, minify: true});
const buildTaskES = createBuildTask(ENTRY_FILE, {format: 'esm'});
const buildTests = createBuildTask(`test/${BASE_NAME}.spec.js`, {
    taskTargetName: 'test',
    format: 'cjs',
    include: ['node_modules/**', 'dist/**'],
    toES5: true,
    destPath: './test/'
});

const build = gulp.series(isDevMode ? gulp.series(buildTask) : gulp.series(gulp.parallel(buildTask, buildTaskES), buildTests));

let spawned_process= null;

const startJSONPServer = function (done) {
    if(spawned_process){
        spawned_process.kill();
        spawned_process = null;
        console.log('JSONP server process killed');
    }

    spawned_process = child_process.fork("./test/jsonp-server.js");

    spawned_process.on("exit", (code) => {
        console.log(`JSONP server exited with code ${code}`);
    });

    done();
};

const setDevEnv = (done) => {
    isDevMode= true;
    done();
};

const watchSources = () => {
    console.log('Sources watcher started');
    gulp.watch('./src/**/*.js', gulp.series(build), function (file) {
        console.log(`File [${file.path}] has been changed`);
    });
};

const watchTests = () => {
    console.log('Tests watcher started');
    gulp.watch('./test/**/*.js', gulp.series(build), function (file) {
        console.log(`File [${file.path}] has been changed`);
    })
};

const watch = gulp.series(isDevMode ? watchSources : gulp.series(watchSources, watchTests));

const dev = gulp.series(setDevEnv, build, gulp.parallel(startJSONPServer, webserver, watch));

module.exports = {
    default: dev,
    dev,
    build,
    watch,
    'jsonp-server': startJSONPServer
};





