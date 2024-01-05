import winston, { transports, format } from 'winston';

class Logger {
  private logger = winston.createLogger({
    transports: [
      new transports.Console({ format: format.combine(format.timestamp(), format.json()) }),
    ],
  });

  public info(message: string, meta = {}) {
    this.logger.log('info', message, { meta: meta });
  }

  public debug(message: string, meta = {}) {
    this.logger.log('debug', message, { meta: meta });
  }

  public warn(message: string, meta = {}) {
    this.logger.log('warn', message, { meta: meta });
  }

  public error(message: string, meta = {}) {
    this.logger.log('error', message, { meta: meta });
  }
}

export default new Logger();
