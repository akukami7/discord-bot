import chalk from 'chalk';

/**
 * Simple structured logger
 * Outputs formatted logs with timestamps and levels
 */
const levels = {
  info: { label: 'INFO', color: chalk.blue, icon: 'ℹ' },
  warn: { label: 'WARN', color: chalk.yellow, icon: '⚠' },
  error: { label: 'ERROR', color: chalk.red, icon: '✗' },
  debug: { label: 'DEBUG', color: chalk.gray, icon: '•' },
};

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  const { label, color, icon } = levels[level] || levels.info;
  const timestamp = formatTimestamp();
  const prefix = color(`[${timestamp}] ${icon} [${label}]`);

  if (data) {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, data);
  } else {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }
}

export const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  debug: (message, data) => log('debug', message, data),
};
