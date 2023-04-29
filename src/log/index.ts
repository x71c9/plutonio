/**
 *
 * Log Module
 *
 */

enum ConsoleMethod {
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export function trace(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data);
}
export function debug(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data);
}
export function info(...data: any): void {
  _print_full_objects(ConsoleMethod.LOG, data);
}
export function warn(...data: any): void {
  _print_full_objects(ConsoleMethod.WARN, data);
}
export function error(...data: any): void {
  _print_full_objects(ConsoleMethod.ERROR, data);
}
export function time(label: string): void {
  console.time(`[P] ${label}`);
}
export function time_end(label: string): void {
  console.timeEnd(`[P] ${label}`);
}

function _print_full_objects(method: ConsoleMethod, data: any): void {
  for (const arg of data) {
    _print_full_object(method, arg);
  }
}

function _print_full_object(method: ConsoleMethod, data: any): void {
  if (typeof data === 'object' && data !== null) {
    return _print_primitive(method, `[P]` + JSON.stringify(data, null, 2));
  }
  return _print_primitive(method, data, '[P] ');
}

function _print_primitive(method: ConsoleMethod, data: any, prefix = ''): void {
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
