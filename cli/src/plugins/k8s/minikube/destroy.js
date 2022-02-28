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
  var verified = false
  var ready = false
  while (!verified) {
    if (!await probe.status()) {
      process.stdout.write('...verified.\n')
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
