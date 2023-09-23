const { src, dest, series, parallel } = require("gulp");
const del = require("del");
const rename = require("gulp-rename");
const removeSourcemaps = require("./gulp-remove-sourcemap");
const modifyFile = require('gulp-modify-file')
const fs = require("fs");

const dir_css = "app/static/css/";
const dir_js = "app/static/js/";
const dir_svg = "app/static/svg/";

function css() {
    return src("node_modules/bootstrap/dist/css/bootstrap.min.css")
        .pipe(removeSourcemaps())
        .pipe(dest(dir_css));
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
        dir_js + "*.min.js",
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
        } else {
            res.push(item)
        }
    }
    return res
}

function swPath() {
    return src("app/sw.js")
        .pipe(modifyFile(content => {
            let files = readFiles("app/static");
            files.push("app/")
            files.sort();
            let p1 = content.indexOf("CACHE_URLS = [") + 14;
            let crlf = content.substring(p1, p1 + 2);
            if (crlf[1] === " ") crlf = crlf.substring(0, 1);
            let p2 = content.indexOf("]", p1);
            let res = content.substring(0, p1);
            for (let i = 0; i < files.length; i++) {
                res = `${res}${i === 0 ? "" : ","}${crlf}    '${files[i].substring(3)}'`;
            }
            return `${res}${crlf}${content.substring(p2)}`;
        }))
        .pipe(dest('app'))
}

const svg_flags = parallel(svg_flags_de, svg_flags_en, svg_flags_fr, svg_flags_it);
const svg = parallel(svg_flags);
const js = parallel(js_bootstrap, js_jquery);
const build = series(parallel(css, js, svg), swPath);

exports.default = series(clean, build);
exports.build = build;
exports.clean = clean;
