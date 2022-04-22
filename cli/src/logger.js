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
const stringify = (value) => value === undefined ? 'undefined' : value.toString()

/**
 * Include timestamps and log levels with messages when using --verbose, but
 * only for the first line in the case of multi-line log messages.
 */
const verboseMessage = (message, level, lineNum) => {
  const ts = lineNum ? ''.padEnd(24, ' ') : new Date().toISOString()
  var levelFormatted = level
  var messageFormatted = message
  if (level == 'warn')
    levelFormatted = chalk.yellowBright((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  else if (level == 'error')
    levelFormatted = chalk.redBright((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  else
    levelFormatted = chalk.dim((lineNum ? '' : level).padEnd(5, ' ') + ' |')
  if (level == 'debug')
    messageFormatted = chalk.dim(message)
  return `${chalk.dim(ts)} ${levelFormatted} ${messageFormatted}`
}

/**
 * Serializes messages as strings, or as formatted JSON objects or arrays.
 */
const serialize = (message) => {
  if (typeof message === 'object' || Array.isArray(message)) {
    try {
      return JSON.stringify(message, null, 2)
    } catch (e) {
      
      // Handle circular references by serializing only the first level of keys.
      if (typeof message === 'object') {
        
        // Serialize the first level of an object with circular references.
        const obj = {}
        for (var key in message)
          obj[key] = stringify(message[key])
        try {
          return JSON.stringify(obj, null, 2)
        } catch (e) {
          return stringify(message)
        }
      } else {
        
        // Serialize the first level of an array with circular references.
        const arr = []
        for (var i in message) {
          if (typeof message[i] === 'object') {
            const obj = {}
            for (var key in message[i])
              obj[key] = stringify(message[i][key])
            arr.push(obj)
          } else {
            arr.push(stringify(message[i]))
          }
          try {
            return JSON.stringify(arr, null, 2)
          } catch (e) {
            return stringify(message)
          }
        }
      }
    }
  } else {
    return stringify(message)
  }
}

const debug = (message, lineNum) => {
  message = serialize(message)

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
  message = serialize(message)

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
  message = serialize(message)

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
  message = serialize(message)

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
