import winston from 'winston';
import chalk from 'chalk';

const customLevels = {
  error: 0,
  warn: 1,
  success: 2,
  info: 3,
  debug: 4,
};

// Assign colors to the custom levels using chalk
const levelColor = (level) => {
  switch (level) {
  case 'error': {
      return chalk.red.bold(level);
    }
  case 'warn': {
      return chalk.yellow(level);
    }
  case 'success': {
      return chalk.green.bold(level);
    }
  case 'info': {
      return level;
    }
  default: {
      return level;
    }
  }
};

// Create the logger
const log = winston.createLogger({
  levels: customLevels,
  format: winston.format.combine(
    winston.format.printf(({ level, message }) => {
      return `[${levelColor(level)}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: 'flying-z-install-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'flying-z-install-combined.log',
    }),
  ],
});

log.add(
  new winston.transports.Console({
    format: winston.format.printf(({ level, message }) => {
      return `[${levelColor(level)}]: ${message}`;
    }),
  })
);

// Add a "success" method to the logger
log.success = function (message) {
  this.log({ level: 'success', message });
};

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const reasonStr =
    typeof reason === 'object' && reason.stack
      ? reason.stack
      : JSON.stringify(reason);
  log.error(`Unhandled Rejection at: ${promise}\nReason: ${reasonStr}`);
  // process.exit(1);
});

export { log };
