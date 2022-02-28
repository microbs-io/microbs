/*
 * utils.js
 *
 * Common utility functions.
 */

// Standard packages
const { execSync } = require('child_process')
const fs = require('fs')

// Third-party packages
const _ = require('lodash')

// Regular expressions
RE_EXPAND_VARS = new RegExp(/\${([^}]*)}/g)

/**
 * Expand environment variables in a string like Bash (e.g. $VARIABLE).
 */
module.exports.expandvars = (str, values) => {
  return str.replace(RE_EXPAND_VARS, (r, k) => _.get(values, k))
}

/**
 * Read a file.
 */
module.exports.loadFile = (filepath) => {
  return fs.readFileSync(filepath, 'utf8')
}

/**
 * Read a file and populate its variables
 */
module.exports.loadTemplate = (filepath, values) => {
  return module.exports.expandvars(module.exports.loadFile(filepath).trim(), values)
}

/**
 * Read a file containing a JSON template, populate its variables,
 * and convert it to a JSON object.
 */
module.exports.loadTemplateJson = (filepath, values) => {
  return JSON.parse(module.exports.loadTemplate(filepath, values))
}

/**
 * Sleep for a given number of milliseconds.
 */
module.exports.sleep = (ms) => {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Execute a shell command.
 *
 * For security purposes, be sure to use require('shell-quote').quote() to
 * sanitize any inputs to the command variable prior to running this function.
 */
module.exports.exec = (command, hideStdout) => {
  try {
    const stdout = execSync(command, hideStdout ? { stdio: 'pipe' } : { stdio: 'inherit' })
    return {
      code: 0,
      stdout: (stdout || '').toString()
    }
  } catch (err) {
    return {
      code: err.code,
      stderr: (err.stderr || '').toString(),
      stdout: (err.stdout || '').toString(),
      err: err
    }
  }
}

/**
 * Convert a nested object to a flattened object.
 *
 * Before: { 'a': { 'b': { 'c.d': 'foo' }}}
 * After: { 'a.b.c.d': 'foo' }
 */
module.exports.flatten = (obj) => {
	const objNew = {}
	for (var key in obj) {
		if (!obj.hasOwnProperty(key))
      continue
		if ((typeof obj[key]) == 'object') {
			const objFlat = module.exports.flatten(obj[key])
			for (var key2 in objFlat) {
				if (!objFlat.hasOwnProperty(key2))
          continue
				objNew[key + '.' + key2] = objFlat[key2]
			}
		} else {
			objNew[key] = obj[key]
		}
	}
	return objNew
}

/**
 * Flatten a nested object, convert its keys to environment variable names,
 * and merge the key-value pairs into an .env file syntax.
 */
module.exports.objToEnv = (obj) => {
  const objFlat = module.exports.flatten(obj)
  const env = []
  for (var key in objFlat)
    env.push(`${key.toUpperCase().split('.').join('_')}=${objFlat[key]}`)
  return env.join('\n')
}

/**
 * Create a temporary .env file holding secrets to be deployed to Kubernetes.
 */
module.exports.createEnvFile = (obj, outPath) => {
  const env = module.exports.objToEnv(obj)
  fs.writeFileSync(outPath, env)
}

/**
 * Validate whether config.yaml has values for the given fields.
 */
module.exports.configHas = (fields) => {
  for (var i in fields)
    if (!require('./config').get(fields[i]))
      return false
  return true
}
