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
const currentLogLevel = () => context.get('args')['log-level']

const SHOW_DEBUG = [ 'debug' ]
const SHOW_INFO = [ 'debug', 'info' ]
const SHOW_WARN = [ 'debug', 'info', 'warn' ]
const SHOW_ERROR = [ 'debug', 'info', 'warn', 'error' ]

const showDebug = () => SHOW_DEBUG.includes(currentLogLevel())
const showInfo = () => SHOW_INFO.includes(currentLogLevel())
const showWarn = () => SHOW_WARN.includes(currentLogLevel())
const showError = () => SHOW_ERROR.includes(currentLogLevel())

const debug = (message) => {
  if (!showDebug())
    return
  console.debug(message)
}

const info = (message) => {
  if (!showInfo())
    return
  console.info(message)
}

const warn = (message) => {
  if (!showWarn())
    return
  console.warn(message)
}

const error = (message) => {
  if (!showError())
    return
  console.error(message)
}

module.exports = {
  debug: debug,
  info: info,
  warn: warn,
  error: error
}
