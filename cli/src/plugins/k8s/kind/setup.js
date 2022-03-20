/*
 * setup.js
 *
 * Setup kind cluster.
 */

// Main packages
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  console.log('')
  console.log('Creating kind cluster...')
  utils.exec('kind create cluster')

  // Verify that the kind cluster was created.
  console.log('')
  console.log('Verifying that kind is available...')
  if (await probe.status()) {
    process.stdout.write('...acknowledged. kind is ready.\n')
  } else {
    process.stdout.write('...failure. kind did not start successfully.\n')
    process.exit(1)
  }
}
