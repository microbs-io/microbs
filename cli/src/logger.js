/*
 * logger.js
 *
 * Writes log messages.
 */

// Third-party packages
const chalk = require('chalk')

// Main packages
const context = require('./context')

// Get the log level specified in the command-line context
const logLevel = () => context.get('args')['log-level']
const verbose = () => context.get('args')['verbose']

const SHOW_DEBUG = [ 'debug' ]
const SHOW_INFO = [ 'debug', 'info' ]
const SHOW_WARN = [ 'debug', 'info', 'warn' ]
const SHOW_ERROR = [ 'debug', 'info', 'warn', 'error' ]

const showDebug = () => SHOW_DEBUG.includes(logLevel())
const showInfo = () => SHOW_INFO.includes(logLevel())
const showWarn = () => SHOW_WARN.includes(logLevel())
const showError = () => SHOW_ERROR.includes(logLevel())

/**
 * Include timestamps and log levels with messages when using --verbose, but
 * only for the first line in the case of multi-line log messages.
 */
const verboseMessage = (message, level, lineNum) => {
  const ts = lineNum ? ''.padEnd(24, ' ') : new Date().toISOString()
  if (level == 'warn')
    level = chalk.yellowBright((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  else if (level == 'error')
    level = chalk.redBright((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  else
    level = chalk.dim((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  return `${chalk.dim(ts)} ${level} ${message}`
}

const debug = (message, lineNum) => {
  message = message.toString()

  // Filter log message if --log-level is greater than debug
  if (!showDebug())
    return

  // Write log message if not --verbose
  if (!verbose())
    return console.debug(message)

  // Write log message(s) with timestamps and log levels if --verbose.
  const messages = message.split('\n')
  if (messages.length > 1) {
    for (var i in messages)
      debug(messages[i], i)
  } else {
    message = verboseMessage(message, 'debug', lineNum)
    console.debug(message)
  }
}

const info = (message, lineNum) => {
  message = message.toString()

  // Filter log message if --log-level is greater than info
  if (!showInfo())
    return

  // Write log message if not --verbose
  if (!verbose())
    return console.info(message)

  // Write log message(s) with timestamps and log levels if --verbose.
  const messages = message.split('\n')
  if (messages.length > 1) {
    for (var i in messages)
      info(messages[i], i)
  } else {
    message = verboseMessage(message, 'info', lineNum)
    console.info(message)
  }
}

const warn = (message, lineNum) => {
  message = message.toString()

  // Filter log message if --log-level is greater than warn
  if (!showWarn())
    return

  // Write log message if not --verbose
  if (!verbose())
    return console.warn(message)

  // Write log message(s) with timestamps and log levels if --verbose.
  const messages = message.split('\n')
  if (messages.length > 1) {
    for (var i in messages)
      warn(messages[i], i)
  } else {
    message = verboseMessage(message, 'warn', lineNum)
    console.warn(message)
  }
}

const error = (message, lineNum) => {
  message = message.toString()

  // Write log message if not --verbose
  if (!verbose())
    return console.error(message)

  // Write log message(s) with timestamps and log levels if --verbose.
  const messages = message.split('\n')
  if (messages.length > 1) {
    for (var i in messages)
      error(messages[i], i)
  } else {
    message = verboseMessage(message, 'error', lineNum)
    console.error(message)
  }
}

module.exports = {
  debug: debug,
  info: info,
  warn: warn,
  error: error
}
