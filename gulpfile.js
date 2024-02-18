const { src, dest, series, parallel, watch } = require("gulp");
const del = require("del");
const { EOL } = require("os");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const removeSourcemaps = require("./gulp-remove-sourcemap");
const fs = require("fs");
const package = require("./package.json");
const sass = require("gulp-sass")(require("sass"));
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const uglify = require('gulp-uglify');

const dir_css = "app/static/css/";
const dir_js = "app/static/js/";
const dir_svg = "app/static/svg/";
const file_scss = dir_css + "style.scss"
const file_name_app = "app.js";
const file_app = dir_js+ file_name_app;

function addMin() {
    return rename(function (file) {
        file.basename = file.basename + ".min";
    })
}


function bootstrap_css() {
    return src("node_modules/bootstrap/dist/css/bootstrap.min.css")
        .pipe(removeSourcemaps())
        .pipe(dest(dir_css));
}
function scss() {
    return src(file_scss)
        .pipe(sass({
            outputStyle: "compressed",
        }).on("error", sass.logError))
        .pipe(addMin())
        .pipe(dest(dir_css));
}

function ts_compile(){
    return browserify({
        basedir: "./ts",
        debug: true,
        entries: ["main.ts"],
        cache: {},
        packageCache: {},
    })
    .plugin(tsify)
    .bundle()
    .pipe(source(file_name_app))
    .pipe(dest(dir_js));
}
function ts_compress (){
    return src(file_app)
        .pipe(uglify())
        .pipe(addMin())
        .pipe(dest(dir_js));
}

function js_bootstrap() {
    return src("node_modules/bootstrap/dist/js/bootstrap.min.js")
        .pipe(removeSourcemaps())
        .pipe(dest(dir_js));
}

function js_jquery() {
    return src("node_modules/jquery/dist/jquery.slim.min.js")
        .pipe(removeSourcemaps())
        .pipe(dest(dir_js));
}

function svg_flags_de() {
    return src("node_modules/svg-country-flags/svg/de.svg").pipe(dest(dir_svg));
}
function svg_flags_en() {
    return src("node_modules/svg-country-flags/svg/gb.svg").pipe(rename("en.svg")).pipe(dest(dir_svg));
}
function svg_flags_fr() {
    return src("node_modules/svg-country-flags/svg/fr.svg").pipe(dest(dir_svg));
}
function svg_flags_it() {
    return src("node_modules/svg-country-flags/svg/it.svg").pipe(dest(dir_svg));
}

function clean() {
    return del([
        dir_css + "*.min.css",
        dir_js + "*.js",
        dir_svg + "*.svg",
    ]);
}

function readFiles(path, res) {
    if (!res) res = [];
    let tab = fs.readdirSync(path, {withFileTypes :true});
    for(let i = 0 ; i < tab.length ; i++) {
        let it = tab[i];
        let item = `${path}/${it.name}`
        if (it.isDirectory()){
            readFiles(item, res)
        } else if (!item.endsWith(".scss") && !item.endsWith(file_name_app)) {
            res.push(item)
        }
    }
    return res
}

function swJs() {
    let files = readFiles("app/static");
    files.push("app/")
    files.sort();
    let res = "";
    for (let i = 0; i < files.length; i++) {
        res = `${res}${i === 0 ? "" : ","}${EOL}    '${files[i].substring(3)}'`;
    }
    res = `${res}${EOL}`
    return src("app/sw.js")
        .pipe(replace(/(const CACHE_URLS = \[)([\s\S]+)(\];)/, `$1${res}$3`))
        .pipe(replace(/version = \"([\d\.]+)\"/, `version = "${package.version}"`))
        .pipe(dest("app"))
}

const iconsList = {
    "BiArchive": "archive",
    "BiArrowRepeat": "arrow-repeat",
    "BiCloud": "cloud",
    "BiExclamationTriangleFill": "exclamation-triangle-fill",
}

function icons(cb) {
    let content = '';
    for (let key in iconsList){
        if (!iconsList.hasOwnProperty(key)) continue;
        let value = iconsList[key];
        let svg = fs.readFileSync(`node_modules/bootstrap-icons/icons/${value}.svg`).toString()
        svg = svg
            .replaceAll('\n  ', '')
            .replaceAll('\n', '')
            .replaceAll('\r', '')
            .replace('width="16"', 'width="1em"')
            .replace('height="16"', 'height="1em"')
        ;
        content = `${content}export const ${key}: string = '${svg}';${EOL}`
    }
    fs.writeFile('ts/icons.ts', content, cb);
}

const ts = series(icons, ts_compile, ts_compress)
const css = parallel(bootstrap_css, scss);
const svg_flags = parallel(svg_flags_de, svg_flags_en, svg_flags_fr, svg_flags_it);
const svg = parallel(svg_flags);
const js = parallel(js_bootstrap, js_jquery, ts);
const build = series(parallel(css, js, svg), swJs);

exports.default = series(clean, build);
exports.build = build;
exports.clean = clean;
exports.ts = ts;
exports.icons = icons;
exports.watch = _ => {
    watch(file_scss, scss);
    watch("ts/*.ts", ts);
}