/*
 * probe.js
 *
 * Probe the status of minikube.
 */

// Main packages
const utils = require('../../../utils')

module.exports.status = async () => {
  const command = 'minikube status -o json'
  const result = utils.exec(command, true)
  if (result.code > 0) {
    console.error('Error from minikube:')
    console.error('')
    console.error(result.stderr || result.stdout)
    process.exit(1)
  }
  const stdout = result.stdout.trim()
  try {
    const d = JSON.parse(stdout)
    return d['Host'] == 'Running' && d['Kubelet'] == 'Running' && d['APIServer'] == 'Running' && d['Kubeconfig'] == 'Configured'
  } catch (e) {
    return false
  }
}
