/*
 * Rollout the "main" skaffold profile to a deployed application.
 */

// Main packages
const rollout = require('./rollout')

module.exports.run = async (opts) => {
  var opts = opts || {}
  if (!opts.profile)
    opts.profile = 'main'
  return await rollout.run(opts)
}
