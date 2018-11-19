import appRoot from 'app-root-path';
import winston from 'winston';

let options = {
  file: {
    level: 'info',
    name: 'file.info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  },
  errorFile: {
    level: 'error',
    name: 'file.error',
    filename: `${appRoot}/logs/error.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }
};

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console)
    // new winston.transports.File(options.errorFile),
    // new winston.transports.File(options.file)
  ],
  exitOnError: false // do not exit on handled exceptions
});
