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
  utils.exec('minikube start')

  // Verify that the minikube cluster was created.
  console.log('')
  console.log('Waiting for minikube cluster to be available...')
  var verified = false
  var ready = false
  while (!verified) {
    if (await probe.status()) {
      process.stdout.write('...ready.\n')
      ready = true
      verified = true
    } else {
      await utils.sleep(1000)
      process.stdout.write('.')
    }
  }
  if (!ready)
    process.exit(1)
}
