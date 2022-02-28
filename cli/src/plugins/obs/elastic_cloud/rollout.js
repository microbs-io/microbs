/*
 * rollout.js
 *
 * Deploy the Beats services to Kubernetes.
 */

// Standard packages
const path = require('path')

// Main packages
const rollout = require('../../../rollout.js')

module.exports = async (opts) => {
  var opts = opts || {}
  opts.skaffoldFilepath = path.join(__dirname, 'skaffold.yaml')
  return await rollout(opts)
}
