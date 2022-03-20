/*
 * List all available apps.
 */

// Standard packages
const glob = require('glob')
const path = require('path')

// Main packages
const plugins = require('../plugins')

module.exports.run = async (opts) => {
  console.log('')
  console.log('alerts:')
  for (var plugin in plugins.alerts)
    console.log(`  - ${plugin}`)
  console.log('')
  console.log('k8s:')
  for (var plugin in plugins.k8s)
    console.log(`  - ${plugin}`)
  console.log('')
  console.log('observability:')
  for (var plugin in plugins.obs)
    console.log(`  - ${plugin}`)
  console.log('')
}
