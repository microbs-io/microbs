/*
 * destroy.js
 *
 * Destroy minikube cluster.
 */

// Main packages
const utils = require('../../../utils.js')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  console.log('')
  console.log('Destroying minikube cluster...')
  utils.exec('minikube delete')

  // Verify that the minikube cluster was destroyed.
  console.log('')
  console.log('Verifying that minikube cluster is destroyed...')
  if (!(await probe.status())) {
    process.stdout.write('...acknowledged. minikube is destroyed.\n')
  } else {
    process.stdout.write('...failure. minikube was not destroyed.\n')
    process.exit(1)
  }
}
