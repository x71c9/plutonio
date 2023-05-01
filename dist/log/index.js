"use strict";
/**
 *
 * Log Module
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grey = exports.white = exports.cyan = exports.magenta = exports.yellow = exports.black = exports.blue = exports.green = exports.red = exports.success = exports.error = exports.warn = exports.info = exports.debug = exports.trace = void 0;
const chalk_1 = __importDefault(require("chalk"));
var ConsoleMethod;
(function (ConsoleMethod) {
    ConsoleMethod["LOG"] = "LOG";
    ConsoleMethod["WARN"] = "WARN";
    ConsoleMethod["ERROR"] = "ERROR";
})(ConsoleMethod || (ConsoleMethod = {}));
var Color;
(function (Color) {
    Color["RED"] = "red";
    Color["GREEN"] = "green";
    Color["BLUE"] = "blue";
    Color["BLACK"] = "black";
    Color["YELLOW"] = "yellow";
    Color["MAGENTA"] = "magenta";
    Color["CYAN"] = "cyan";
    Color["WHITE"] = "white";
    Color["GREY"] = "grey";
})(Color || (Color = {}));
function trace(...data) {
    _print_full_objects(ConsoleMethod.LOG, data, Color.GREY);
}
exports.trace = trace;
function debug(...data) {
    _print_full_objects(ConsoleMethod.LOG, data, Color.MAGENTA);
}
exports.debug = debug;
function info(...data) {
    _print_full_objects(ConsoleMethod.LOG, data, Color.BLUE);
}
exports.info = info;
function warn(...data) {
    _print_full_objects(ConsoleMethod.WARN, data, Color.YELLOW);
}
exports.warn = warn;
function error(...data) {
    _print_full_objects(ConsoleMethod.ERROR, data, Color.RED);
}
exports.error = error;
function success(...data) {
    _print_full_objects(ConsoleMethod.LOG, data, Color.GREEN);
}
exports.success = success;
const red = (msg) => {
    console.log(chalk_1.default.red(msg));
};
exports.red = red;
const green = (msg) => {
    console.log(chalk_1.default.green(msg));
};
exports.green = green;
const blue = (msg) => {
    console.log(chalk_1.default.blue(msg));
};
exports.blue = blue;
const black = (msg) => {
    console.log(chalk_1.default.black(msg));
};
exports.black = black;
const yellow = (msg) => {
    console.log(chalk_1.default.yellow(msg));
};
exports.yellow = yellow;
const magenta = (msg) => {
    console.log(chalk_1.default.magenta(msg));
};
exports.magenta = magenta;
const cyan = (msg) => {
    console.log(chalk_1.default.cyan(msg));
};
exports.cyan = cyan;
const white = (msg) => {
    console.log(chalk_1.default.white(msg));
};
exports.white = white;
const grey = (msg) => {
    console.log(chalk_1.default.grey(msg));
};
exports.grey = grey;
function _print_full_objects(method, data, color) {
    for (const arg of data) {
        _print_full_object(method, arg, color);
    }
}
function _print_full_object(method, data, color) {
    if (typeof data === 'object' && data !== null) {
        return _print_primitive(method, JSON.stringify(data, null, 2), color);
    }
    return _print_primitive(method, data, color);
}
function _print_primitive(method, data, color) {
    switch (method) {
        case ConsoleMethod.LOG: {
            if (color) {
                console.log(chalk_1.default[color](data));
            }
            else {
                console.log(data);
            }
            break;
        }
        case ConsoleMethod.WARN: {
            if (color) {
                console.warn(chalk_1.default[color](data));
            }
            else {
                console.warn(data);
            }
            break;
        }
        case ConsoleMethod.ERROR: {
            if (color) {
                console.error(chalk_1.default[color](data));
            }
            else {
                console.error(data);
            }
            break;
        }
    }
}
//# sourceMappingURL=index.js.map