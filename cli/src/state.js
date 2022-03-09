/*
 * state.js
 *
 * Parses the .state file used by the CLI.
 */

// Standard packages
const fs = require('fs')
const path = require('path')
const process = require('process')

// Third-party packages
const _ = require('lodash')
const yaml = require('js-yaml')

// Main packages
const config = require('./config')
const utils = require('./utils')

// Get .state file
const stateFilepath = path.join(process.cwd(), '.state')
var stateFile
try {
  stateFile = fs.readFileSync(stateFilepath, 'utf8')
} catch (err) {
  if (err.code === 'ENOENT') {
    // .state file doesn't exist. Create an empty one.
    fs.closeSync(fs.openSync(stateFilepath, 'w'))
    stateFile = fs.readFileSync(stateFilepath, 'utf8')
  } else {
    throw err
  }
}

const get = (path) => {
  return path ? _.get(state, path) : state
}

const set = (path, value) => {
  _.set(state, path, value)
  delete state._context // Exclude the command-line context
}

const merge = (obj) => {
  _.merge(state, obj)
  delete state._context // Exclude the command-line context
}

const save = (path) => {
  fs.writeFileSync(stateFilepath, yaml.dump(utils.flatten(state), { sortKeys: true }), 'utf8', (err) => console.error(err))
}

// Parse state file
const state = yaml.load(stateFile) || {}

// Merge config with state, overriding state with config
merge(config.get())

// Export state
module.exports = {
  get: get,
  set: set,
  merge: merge,
  save: save
}
