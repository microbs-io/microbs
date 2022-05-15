/*
 * version.js
 *
 * Displays the installed version of microbs.
 */

// Standard packages
const path = require('path')

// Main packages
const { utils } = require('@microbs.io/core')

/**
 * Display the version of microbs as declared in package.json. 
 */
const run = () => {
  const pkg = utils.loadJson(path.join(__dirname, '..', '..', 'package.json'))
  console.log(`v${pkg.version}`)
}

module.exports.run = run
