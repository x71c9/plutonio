"use strict";
/**
 *
 * Log Module
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.time_end = exports.time = exports.error = exports.warn = exports.info = exports.debug = exports.trace = void 0;
var ConsoleMethod;
(function (ConsoleMethod) {
    ConsoleMethod["LOG"] = "LOG";
    ConsoleMethod["WARN"] = "WARN";
    ConsoleMethod["ERROR"] = "ERROR";
})(ConsoleMethod || (ConsoleMethod = {}));
function trace(...data) {
    _print_full_objects(ConsoleMethod.LOG, data);
}
exports.trace = trace;
function debug(...data) {
    _print_full_objects(ConsoleMethod.LOG, data);
}
exports.debug = debug;
function info(...data) {
    _print_full_objects(ConsoleMethod.LOG, data);
}
exports.info = info;
function warn(...data) {
    _print_full_objects(ConsoleMethod.WARN, data);
}
exports.warn = warn;
function error(...data) {
    _print_full_objects(ConsoleMethod.ERROR, data);
}
exports.error = error;
function time(label) {
    console.time(`[P] ${label}`);
}
exports.time = time;
function time_end(label) {
    console.timeEnd(`[P] ${label}`);
}
exports.time_end = time_end;
function _print_full_objects(method, data) {
    for (const arg of data) {
        _print_full_object(method, arg);
    }
}
function _print_full_object(method, data) {
    if (typeof data === 'object' && data !== null) {
        return _print_primitive(method, `[P]` + JSON.stringify(data, null, 2));
    }
    return _print_primitive(method, data, '[P] ');
}
function _print_primitive(method, data, prefix = '') {
    switch (method) {
        case ConsoleMethod.LOG: {
            console.log(`${prefix}${data}`);
            break;
        }
        case ConsoleMethod.WARN: {
            console.warn(`${prefix}${data}`);
            break;
        }
        case ConsoleMethod.ERROR: {
            console.error(`${prefix}${data}`);
            break;
        }
    }
}
//# sourceMappingURL=index.js.map