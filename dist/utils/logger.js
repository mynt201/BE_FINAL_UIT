"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.LOG_LEVEL === 'debug') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }
};
exports.logger = logger;
//# sourceMappingURL=logger.js.map