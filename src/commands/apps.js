/*
 * apps.js
 * 
 * Manage microbs app.
 */

// Standard packages
const glob = require('glob')
const fs = require('fs')
const path = require('path')

// Third-party packages
const chalk = require('chalk')
const isInstalledGlobally = require('is-installed-globally')
const semver = require('semver')

// Main packages
const { context, logger, utils } = require('@microbs.io/core')

const VALID_SUBCOMMANDS = [ 'list', 'search', 'install', 'update', 'uninstall' ]

const logSuccess = (msg) => logger.info(`${chalk.bold.greenBright('✓')} ${chalk.dim(msg)}`)
const logInfo = (msg) => logger.warn(`${chalk.bold.cyanBright('i')} ${msg}`)
const logFailure = (msg) => logger.error(`${chalk.bold.redBright('⨯')} ${msg}`)

const validate = (subcommand, args) => {
  if (!subcommand.length || !VALID_SUBCOMMANDS.includes(subcommand[0])) {
    logger.error(`microbs apps expects one of these subcommands:`)
    logger.error('')
    logger.error(`    ${VALID_SUBCOMMANDS.join('\n    ')}`)
    logger.error('')
    process.exit(1)
  }
  if (!args.all && (subcommand.length < 2 && [ 'install', 'update', 'uninstall' ].includes(subcommand[0]))) {
    logger.error(`microbs apps ${subcommand[0]} requires at least one app name.`)
    process.exit(1)
  }
}

/**
 * Get official microbs apps from the npm registry.
 */
const getPackagesFromRegistry = () => {
  const result = utils.exec('npm search @microbs.io/app- --json --prefer-online', true)
  if (result.stderr) {
    logger.error(result.stderr)
    process.exit(1)
  }
  return JSON.parse(result.stdout)
}

/**
 * Get microbs apps installed locally.
 */
const getPackagesInstalled = () => {
  const g = isInstalledGlobally ? ` -g` : ''
  const result = utils.exec(`npm list${g} --depth=1 --json --long`, true)
  if (result.stderr) {
    logger.error(result.stderr)
    process.exit(1)
  }
  const results = JSON.parse(result.stdout).dependencies
  const deps = {}
  for (var name in results) {
    if (name == '@microbs.io/cli' && results[name].dependencies) {
      for (var name1 in results[name].dependencies) {
        try {
          let package = utils.loadJson(path.join(results[name].dependencies[name1].path, 'package.json'))
          let keywords = package.keywords || []
          if (!keywords.includes('microbs') || !keywords.includes('app'))
            continue
          deps[name1] = results[name].dependencies[name1]
          deps[name1].keywords = package.keywords
        } catch (e) {
          if (e.code === 'ENOENT') {
            continue
          } else {
            logger.error(e)
            continue
          }
        }
      }
    }
    try {
      let package = utils.loadJson(path.join(results[name].path, 'package.json'))
      let keywords = package.keywords || []
      if (!keywords.includes('microbs') || !keywords.includes('app'))
        continue
      deps[name] = results[name]
      deps[name].keywords = package.keywords
    } catch (e) {
      if (e.code === 'ENOENT') {
        continue
      } else {
        logger.error(e)
        continue
      }
    }
  }
  return deps
}

/**
 * Get a list of names of official microbs apps from the npm registry.
 */
const getNamesFromRegistry = () => {
  const names = []
  const results = getPackagesFromRegistry()
  for (var i in results) {
    const result = results[i]
    const name = result.name.replace(/^\@microbs\.io\/app\-/, '')
    names.push(name)
  }
  return names
}

/**
 * Get a list of names of microbs apps installed locally.
 */
const getNamesInstalled = () => {
  const names = []
  const results = getPackagesInstalled()
  for (var i in results) {
    const result = results[i]
    var name = results.name
    if (name.startsWith('@'))
      name = name.replace(/^\@microbs\.io\/app\-/, '')
    else if (name.contains('/microbs-app-'))
      name = name.split('/microbs-app-')[1]
    names.push(name)
  }
  return names
}

/**
 * Verify if an app is installed.
 */
const isInstalled = (name) => {
  const deps = getInstalledApps()
  const package = `@microbs.io/app-${name}`
  return deps[package] ? true : false
}

/**
 * Get information on all installed microbs apps.
 */
const getInstalledApps = () => {
  const results = getPackagesInstalled()
  const deps = {}
  for (var name in results) {
    const package = utils.loadJson(path.join(results[name].path, 'package.json'))
    const keywords = package.keywords || []
    if (!keywords.includes('microbs') || !keywords.includes('app'))
      continue
    deps[name] = results[name]
    deps[name].keywords = package.keywords
  }
  return deps
}

/**
 * Update one or more apps.
 */
const update = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesInstalled()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  for (var i in names) {
    const name = names[i]
    // If the app name contains a slash, assume it's a URL or file path.
    // Otherwise assume it's an official app and prefix it with @microbs.io/app-
    var package
    if (name.includes('/') && !name.startsWith('@'))
      package = name
    else
      package = `@microbs.io/app-${name}`
    logger.info(`Updating app: ${name}`)
    if (!isInstalled(name)) {
      logInfo(`...app not installed: ${name}`)
      continue
    }
    const result = utils.exec(`npm update${g} ${utils.sanitize(package)} --legacy-peer-deps --preserve-symlinks`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown app: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...updated: ${name}`)
    }
  }
  logger.info('')
}

/**
 * Install one or more apps.
 */
const install = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesFromRegistry()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  for (var i in names) {
    const name = names[i]
    // If the app name contains a slash, assume it's a URL or file path.
    // Otherwise assume it's an official app and prefix it with @microbs.io/app-
    var package
    if (name.includes('/') && !name.startsWith('@'))
      package = name
    else
      package = `@microbs.io/app-${name}`
    logger.info(`Installing app: ${name}`)
    const result = utils.exec(`npm install${g} ${utils.sanitize(package)} --legacy-peer-deps --preserve-symlinks`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown app: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...installed: ${name}`)
    }
  }
  logger.info('')
}

/**
 * Uninstall one or more apps.
 */
const uninstall = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesInstalled()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  const resultsInstalled = getInstalledApps()
  for (var i in names) {
    const name = names[i]
    const package = `@microbs.io/app-${name}`
    logger.info(`Uninstalling app: ${name}`)
    if (!resultsInstalled[package]) {
      logInfo(`...already not installed: ${name}`)
      continue
    }
    const result = utils.exec(`npm uninstall${g} ${utils.sanitize(package)}`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown app: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...uninstalled: ${name}`)
    }
  }
  logger.info('')
}

/**
 * List official microbs apps.
 */
const search = () => {
  const results = getPackagesFromRegistry()
  const resultsInstalled = getInstalledApps()
  
  // Transform results into formatted rows
  const padding = 2
  const lengths = {
    name: 'name'.length,
    version: 'latest'.length,
  }
  const rows = []
  for (var i in results) {
    const result = results[i]
    const name = result.name.replace(/^\@microbs\.io\/app\-/, '')
    const version = result.version ? `v${result.version}` : 'unknown'
    var status = chalk.dim('not installed')
    if (resultsInstalled[result.name]) {
      const resultInstalled = resultsInstalled[result.name]
      const versionInstalled = resultInstalled.version ? `v${resultInstalled.version}` : 'unknown'
      if (version == 'unknown' || versionInstalled == 'unknown' || semver.lt(semver.clean(versionInstalled), semver.clean(version)))
        status = `${chalk.bold.green('installed')} [${chalk.yellowBright(versionInstalled)}]`
      else
        status = `${chalk.bold.green('installed')} [${chalk.green(versionInstalled)}]`
    }
    else
      chalk.dim('not installed')
    lengths.name = Math.max(lengths.name, name.length)
    lengths.version = Math.max(lengths.version, version.length)
    rows.push({
      name: name,
      version: version,
      status: status
    })
  }
  rows.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })
  const rowsFormatted = []
  for (var i in rows) {
    const row = rows[i]
    rowsFormatted.push([
      chalk.bold(row.name.padEnd(lengths.name + padding, ' ')),
      row.version.padEnd(lengths.version + padding, ' '),
      row.status,
    ].join(''))
  }
  const header = [
    chalk.cyan('name'.padEnd(lengths.name + padding, ' ')),
    chalk.cyan('latest'.padEnd(lengths.version + padding, ' ')),
    chalk.cyan('status'.padEnd(lengths.status + padding, ' ')),
  ].join('')
  console.log('')
  console.log('Official microbs apps:')
  console.log('')
  console.log(`  ${header}`)
  console.log(`  ${rowsFormatted.join(`\n  `)}`)
  console.log('')
  console.log(chalk.dim('Source: https://www.npmjs.com/~microbs.io'))
  console.log('')
}

/**
 * List installed microbs apps.
 */
const list = () => {
  const deps = getInstalledApps()
  logger.debug('Found dependencies:')
  logger.debug(deps)
  
  // Transform results into formatted rows
  const padding = 2
  const lengths = {
    name: 'name'.length,
    version: 'version'.length,
  }
  const rows = []
  for (var name in deps) {
    const dep = deps[name]
    name = name.replace(/^\@microbs\.io\/app\-/, '')
    const version = dep.version ? `v${dep.version}` : 'unknown'
    var source = dep.resolved || dep.path || 'unknown'
    if (source.startsWith('file:'))
      source = path.resolve(context.get('path.cli'), dep.resolved.split('file:')[1])
    lengths.name = Math.max(lengths.name, name.length)
    lengths.version = Math.max(lengths.version, version.length)
    rows.push({
      name: name,
      version: version,
      source: source,
    })
  }
  if (!rows.length) {
    console.log('')
    console.log('No apps installed.')
    console.log('')
    return
  }
  rows.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })
  const rowsFormatted = []
  for (var i in rows) {
    const row = rows[i]
    rowsFormatted.push([
      chalk.bold(row.name.padEnd(lengths.name + padding, ' ')),
      row.version.padEnd(lengths.version + padding, ' '),
      chalk.dim(row.source),
    ].join(''))
  }
  const header = [
    chalk.cyan('name'.padEnd(lengths.name + padding, ' ')),
    chalk.cyan('version'.padEnd(lengths.version + padding, ' ')),
    chalk.cyan('source'),
  ].join('')
  console.log('')
  console.log('Installed apps:')
  //console.log('Official microbs apps')
  //console.log(chalk.dim('https://www.npmjs.com/~microbs.io'))
  console.log('')
  console.log(`  ${header}`)
  console.log(`  ${rowsFormatted.join(`\n  `)}`)
  console.log('')
}

const run = async () => {
  const subcommand = context.get('args._')
  validate(subcommand, context.get('args'))
  switch (subcommand[0]) {
    case 'list':
      return list()
    case 'search':
      return search()
    case 'install':
      return install(subcommand.slice(1))
    case 'update':
      return update(subcommand.slice(1))
    case 'uninstall':
      return uninstall(subcommand.slice(1))
  }
}

module.exports = {
  getInstalledApps: getInstalledApps,
  run: run
}
