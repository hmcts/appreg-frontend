declare module '@hmcts/nodejs-logging' {
  export interface HmctsLogger {
    info(message: string, ...meta: unknown[]): void;

    warn(message: string, ...meta: unknown[]): void;

    error(message: string | Error, ...meta: unknown[]): void;

    debug?(message: string, ...meta: unknown[]): void;
  }

  export const Logger: {
    getLogger(name: string): HmctsLogger;
  };
}
