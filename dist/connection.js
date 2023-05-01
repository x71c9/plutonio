"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionClient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const log = __importStar(require("./log/index"));
class ConnectionClient {
    constructor() {
        log.trace(`Initializing Plutonio...`);
        this.connection_ready_state = 0;
        this._database_url = process.env.DATABASE_URL || '';
    }
    connect() {
        if (this._connection) {
            return this._connection;
        }
        log.trace(`Connecting...`);
        this._connection = mongoose_1.default.createConnection(this._database_url);
        this._connection.on('connecting', () => {
            this._on_connecting();
        });
        this._connection.on('connected', () => {
            this._on_connected();
        });
        this._connection.on('disconnecting', () => {
            this._on_disconnecting();
        });
        this._connection.on('disconnected', () => {
            this._on_disconnected();
        });
        this._connection.on('close', () => {
            this._on_close();
        });
        this._connection.on('reconnected', () => {
            this._on_reconnected();
        });
        this._connection.on('error', (err) => {
            this._on_error(err);
        });
        this._connection.on('reconnectFailed', () => {
            this._on_reconnect_failed();
        });
        this._connection.on('reconnectTries', () => {
            this._on_reconnect_tries();
        });
        return this._connection;
    }
    async disconnect() {
        await mongoose_1.default.disconnect();
    }
    _on_connecting() {
        log.debug(`Connecting ...`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_connected() {
        log.success(`Connected`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_disconnecting() {
        log.warn(`Disconnecting...`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_disconnected() {
        log.warn(`Disconnected`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_close() {
        log.debug(`Connection closed`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_reconnected() {
        log.debug(`Reconnected`);
        if (this._connection) {
            this.connection_ready_state = this._connection.readyState;
        }
    }
    _on_error(e) {
        throw e;
    }
    _on_reconnect_failed() {
        log.debug(`Reconnect Failed`);
    }
    _on_reconnect_tries() {
        log.debug(`Reconnect Tries`);
    }
}
exports.ConnectionClient = ConnectionClient;
//# sourceMappingURL=connection.js.map