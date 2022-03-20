/*
 * setup.js
 *
 * Setup minikube cluster.
 */

// Main packages
const utils = require('../../../utils.js')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  console.log('')
  console.log('Creating minikube cluster...')
  utils.exec('minikube start', true)

  // Verify that the minikube cluster was created.
  console.log('')
  console.log('Verifying that minikube is available...')
  if (await probe.status()) {
    process.stdout.write('...acknowledged. minikube is ready.\n')
  } else {
    process.stdout.write('...failure. minikube did not start successfully.\n')
    process.exit(1)
  }
}
