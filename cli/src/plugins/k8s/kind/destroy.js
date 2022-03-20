/*
 * destroy.js
 *
 * Destroy kind cluster.
 */

// Main packages
const utils = require('../../../utils.js')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  console.log('')
  console.log('Destroying kind cluster...')
  utils.exec('kind delete cluster')

  // Verify that the kind cluster was destroyed.
  console.log('')
  console.log('Verifying that kind cluster is destroyed...')
  if (!(await probe.status())) {
    process.stdout.write('...acknowledged. kind is destroyed.\n')
  } else {
    process.stdout.write('...failure. kind was not destroyed.\n')
    process.exit(1)
  }
}
