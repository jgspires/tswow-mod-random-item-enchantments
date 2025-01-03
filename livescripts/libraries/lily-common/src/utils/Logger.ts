export const enum LogLevel {
  DEBUG = 3,
  INFO = 2,
  WARN = 1,
  ERROR = 0,
}

const DEFAULT_LOG_LEVEL = LogLevel.INFO;

export class Logger {
  private prefix: string;
  private debugLevel: number;

  constructor(prefix: string, debugLevel: LogLevel = DEFAULT_LOG_LEVEL) {
    this.prefix = prefix;
    this.debugLevel = debugLevel;
  }

  private shouldLog(level: number): boolean {
    return level <= this.debugLevel;
  }

  private formatMessage(levelName: string, message: string): string {
    return `${this.prefix}[${levelName.toUpperCase()}]: ${message}`;
  }

  debug(message: string): void {
    if (this.shouldLog(3)) {
      console.log(this.formatMessage("debug", message)); // Debug messages use console.log to avoid compatibility issues
    }
  }

  info(message: string): void {
    if (this.shouldLog(2)) {
      console.log(this.formatMessage("info", message)); // Info messages use console.log
    }
  }

  warn(message: string): void {
    if (this.shouldLog(1)) {
      console.warn(this.formatMessage("warn", message)); // Warn messages use console.warn
    }
  }

  error(message: string): void {
    console.error(this.formatMessage("error", message)); // Error messages always use console.error
  }
}
