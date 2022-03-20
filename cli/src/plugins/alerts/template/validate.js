/*
 * validate.js
 */

// Main packages
const logger = require('../../../logger')
const validate = require('../../../commands/validate')

/**
 * Display an acknowledgement during the validation command.
 */
const run = () => {
  try {
    validate.logSuccess('you ran the validate command for the template alerts plugin.')
  } catch (e) {
    logger.error(e)
  }
}

module.exports = async () => {
  run()
}
