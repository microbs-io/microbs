/*
 * state.js
 *
 * Parses the .state file used by the CLI.
 */

// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const _ = require('lodash')
const yaml = require('js-yaml')

// Main packages
const config = require('./config')
const utils = require('./utils')

// Global state object
const state = {}

/**
 * Read .state file.
 */
const read = (filepath) => {
  filepath = filepath || path.join(process.cwd(), '.state')
  try {
    return fs.readFileSync(filepath, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      // .state file doesn't exist. Create an empty one.
      fs.closeSync(fs.openSync(filepath, 'w'))
      return fs.readFileSync(filepath, 'utf8')
    } else {
      throw err
    }
  }
}

/**
 * Parse the contents of a .state file to a YAML object, and then flatten the
 * structure of the object. Normally the .state file would already be flattened,
 * but it's possible for a user to add nested fields to the file directly.
 */
const parse = (contents) => utils.flatten(yaml.load(contents || {}))

/**
 * Read and parse the .state file.
 * Merge config into .state, overriding .state with config.
 */
const load = (filepath) => parse(read(filepath))

/**
 * Load the .state file and persist it in a mutable state object.
 * Merge config into .state, overriding .state with config.
 */
const init = (filepath) => {
  for (var key in state)
    delete state[key]
  for (const [key, value] of Object.entries(_.merge(load(filepath), config.get())))
    state[key] = value
  return state
}

/**
 * Persist the state object to the .state file.
 */
const save = (filepath) => {
  filepath = filepath || path.join(process.cwd(), '.state')

  // Save .state file
  fs.writeFileSync(
    filepath,
    yaml.dump(utils.flatten(state), { sortKeys: true }),
    'utf8',
    (err) => console.error(err)
  )
}

/**
 * Get a value from the state object at a given path (i.e. dotted key),
 * or get the entire state object if no path is given.
 */
const get = (path) => path ? _.get(_.isEmpty(state) ? init() : state, path) : _.isEmpty(state) ? init() : state

/**
 * Set a value in the state object at a given path (i.e. dotted key).
 */
const set = (path, value) => _.set(_.isEmpty(state) ? init() : state, path, value)

// Export state
module.exports = {
  get: get,
  set: set,
  init: init,
  load: load,
  parse: parse,
  read: parse,
  save: save
}
