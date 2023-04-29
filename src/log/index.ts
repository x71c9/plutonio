/**
 *
 * Log Module
 *
 */

import chalk from 'chalk';

enum ConsoleMethod {
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

enum Color {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  BLACK = 'black',
  YELLOW = 'yellow',
  MAGENTA = 'magenta',
  CYAN = 'cyan',
  WHITE = 'white',
  GREY = 'grey',
}

export function trace(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data, Color.GREY);
}
export function debug(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data, Color.MAGENTA);
}
export function info(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data, Color.BLUE);
}
export function warn(...data: any): void {
  _print_full_objects(ConsoleMethod.WARN, data, Color.YELLOW);
}
export function error(...data: any): void {
  _print_full_objects(ConsoleMethod.ERROR, data, Color.RED);
}
export function success(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data, Color.GREEN);
}

export const red = (msg: string) => {
  console.log(chalk.red(msg));
};

export const green = (msg: string) => {
  console.log(chalk.green(msg));
};

export const blue = (msg: string) => {
  console.log(chalk.blue(msg));
};

export const black = (msg: string) => {
  console.log(chalk.black(msg));
};

export const yellow = (msg: string) => {
  console.log(chalk.yellow(msg));
};

export const magenta = (msg: string) => {
  console.log(chalk.magenta(msg));
};

export const cyan = (msg: string) => {
  console.log(chalk.cyan(msg));
};

export const white = (msg: string) => {
  console.log(chalk.white(msg));
};

export const grey = (msg: string) => {
  console.log(chalk.grey(msg));
};

function _print_full_objects(
  method: ConsoleMethod,
  data: any,
  color?: Color
): void {
  for (const arg of data) {
    _print_full_object(method, arg, color);
  }
}

function _print_full_object(
  method: ConsoleMethod,
  data: any,
  color?: Color
): void {
  if (typeof data === 'object' && data !== null) {
    return _print_primitive(method, JSON.stringify(data, null, 2), color);
  }
  return _print_primitive(method, data, color);
}

function _print_primitive(
  method: ConsoleMethod,
  data: any,
  color?: Color
): void {
  switch (method) {
    case ConsoleMethod.LOG: {
      if (color) {
        console.log(chalk[color](data));
      } else {
        console.log(data);
      }
      break;
    }
    case ConsoleMethod.WARN: {
      if (color) {
        console.warn(chalk[color](data));
      } else {
        console.warn(data);
      }
      break;
    }
    case ConsoleMethod.ERROR: {
      if (color) {
        console.error(chalk[color](data));
      } else {
        console.error(data);
      }
      break;
    }
  }
}
