declare interface ILogger {
    info: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    child: (bindings: Record<string, any>) => ILogger;
}

declare const logger: ILogger;
export = logger;

