const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf } = format;
require('winston-daily-rotate-file');

const customFormat = printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`); // eslint-disable-line no-shadow

const transportDailyRotateLog = new transports.DailyRotateFile({
  filename: 'ipn-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = createLogger({
  format: combine(
    timestamp(),
    customFormat,
  ),
  transports: [
    new transports.Console(),
    transportDailyRotateLog,
  ],
});

module.exports = logger;
