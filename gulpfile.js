const { src, dest, series, parallel } = require("gulp");
const del = require("del");
const rename = require("gulp-rename");
const removeSourcemaps = require("./gulp-remove-sourcemap");

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

function js_popper() {
    return src("node_modules/popper.js/dist/umd/popper.min.js")
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

const svg_flags = parallel(svg_flags_de, svg_flags_en, svg_flags_fr, svg_flags_it);
const svg = parallel(svg_flags);
const js = parallel(js_bootstrap, js_jquery, js_popper);
const build = parallel(css, js, svg);

exports.default = series(clean, build);
exports.build = build;
exports.clean = clean;
