/*
 * probe.js
 *
 * Probe the status of kind.
 */

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

module.exports.status = async () => {
  const command = 'kubectl cluster-info --context kind-kind'
  const result = utils.exec(command, true)
  if (result.code > 0) {
    logger.error('Error from kubectl:')
    logger.error('')
    logger.error(result.stderr || result.stdout)
    process.exit(1)
  }
  const stdout = result.stdout.trim()
  try {
    return stdout.match(/is running/)
  } catch (e) {
    return false
  }
}
