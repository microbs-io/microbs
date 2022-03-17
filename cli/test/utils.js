// Third-party packages
const { execSync } = require('child_process')

/**
 * Execute a shell command.
 *
 * For security purposes, be sure to use require('shell-quote').quote() to
 * sanitize any inputs to the command variable prior to running this function.
 */
module.exports.exec = (command) => (execSync(command, { stdio: 'pipe' }) || '').toString()

/**
 * Strip colors from stdout
 * Source: https://stackoverflow.com/a/29497680
 */
const RE_ANSI = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
module.exports.colorless = (string) => {
  return string.replace(RE_ANSI, '')
}
