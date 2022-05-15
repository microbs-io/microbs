/*
 * List all available plugins.
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
    logger.error(`microbs plugins expects one of these subcommands:`)
    logger.error('')
    logger.error(`    ${VALID_SUBCOMMANDS.join('\n    ')}`)
    logger.error('')
    process.exit(1)
  }
  if (!args.all && (subcommand.length < 2 && [ 'install', 'update', 'uninstall' ].includes(subcommand[0]))) {
    logger.error(`microbs plugins ${subcommand[0]} requires at least one plugin name.`)
    process.exit(1)
  }
}

/**
 * Get official microbs plugins from the npm registry.
 */
const getPackagesFromRegistry = () => {
  const result = utils.exec('npm search @microbs.io/plugin- --json --prefer-online', true)
  if (result.stderr) {
    logger.error(result.stderr)
    process.exit(1)
  }
  return JSON.parse(result.stdout)
}

/**
 * Get microbs plugins installed locally.
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
          if (!keywords.includes('microbs') || !keywords.includes('plugin'))
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
      if (!keywords.includes('microbs') || !keywords.includes('plugin'))
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
 * Get a list of names of official microbs plugins from the npm registry.
 */
const getNamesFromRegistry = () => {
  const names = []
  const results = getPackagesFromRegistry()
  for (var i in results) {
    const result = results[i]
    const name = result.name.replace(/^\@microbs\.io\/plugin\-/, '')
    names.push(name)
  }
  return names
}

/**
 * Get a list of names of microbs plugins installed locally.
 */
const getNamesInstalled = () => {
  const names = []
  const results = getPackagesInstalled()
  for (var i in results) {
    const result = results[i]
    const name = result.name.replace(/^\@microbs\.io\/plugin\-/, '')
    names.push(name)
  }
  return names
}

/**
 * Verify if a plugin is installed.
 */
const isInstalled = (name) => {
  const deps = getInstalledPlugins()
  const package = `@microbs.io/plugin-${name}`
  return deps[package] ? true : false
}

/**
 * Get information on all installed plugins.
 */
const getInstalledPlugins = () => {
  const results = getPackagesInstalled()
  const deps = {}
  for (var name in results) {
    const package = utils.loadJson(path.join(results[name].path, 'package.json'))
    const keywords = package.keywords || []
    if (!keywords.includes('microbs') || !keywords.includes('plugin'))
      continue
    deps[name] = results[name]
    deps[name].keywords = package.keywords
  }
  return deps
}

/**
 * Infer the plugin type based on the keywords in its package.json.
 */
const inferPluginType = (keywords) => {
  keywords = keywords || []
  if (keywords.includes('kubernetes') && !keywords.includes('observability') && !keywords.includes('alerts'))
    return 'kubernetes'
  if (keywords.includes('observability') && !keywords.includes('kubernetes') && !keywords.includes('alerts'))
    return 'observability'
  if (keywords.includes('alerts') && !keywords.includes('kubernetes') && !keywords.includes('observability'))
    return 'alerts'
  return 'unknown'
}

/**
 * Update one or more plugins.
 */
const update = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesInstalled()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  for (var i in names) {
    const name = names[i]
    // If the plugin name contains a slash, assume it's a URL or file path.
    // Otherwise assume it's an official plugin and prefix it with @microbs.io/plugin-
    var package
    var command = update
    if (name.includes('/') && !name.startsWith('@')) {
      package = name
    } else {
      package = `@microbs.io/plugin-${name}`
    }
    logger.info(`Updating plugin: ${name}`)
    if (!isInstalled(name)) {
      logInfo(`...plugin not installed: ${name}`)
      continue
    }
    const result = utils.exec(`npm update${g} ${utils.sanitize(package)} --legacy-peer-deps --preserve-symlinks`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown plugin: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...updated: ${name}`)
    }
  }
  logger.info('')
}

/**
 * Install one or more plugins.
 */
const install = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesFromRegistry()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  for (var i in names) {
    const name = names[i]
    // If the plugin name contains a slash, assume it's a URL or file path.
    // Otherwise assume it's an official plugin and prefix it with @microbs.io/plugin-
    var package
    var command
    if (name.includes('/') && !name.startsWith('@')) {
      package = name
      command = 'link'
    } else {
      package = `@microbs.io/plugin-${name}`
      command = 'install'
    }
    logger.info(`Installing plugin: ${name}`)
    const result = utils.exec(`npm ${command}${g} ${utils.sanitize(package)} --legacy-peer-deps --preserve-symlinks`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown plugin: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...installed: ${name}`)
    }
  }
  logger.info('')
}

/**
 * Uninstall one or more plugins.
 */
const uninstall = (names) => {
  logger.info('')
  if (context.get('args.all'))
    names = getNamesInstalled()
  const g = isInstalledGlobally ? ` --prefix=${utils.sanitize(context.get('path.cli'))}` : ''
  const deps = getInstalledPlugins()
  for (var i in names) {
    const name = names[i]
    const package = `@microbs.io/plugin-${name}`
    logger.info(`Uninstalling plugin: ${name}`)
    if (!deps[package]) {
      logInfo(`...already not installed: ${name}`)
      continue
    }
    const result = utils.exec(`npm uninstall${g} ${utils.sanitize(package)}`, true)
    if (result.stderr) {
      if (result.stderr.includes('E404'))
        logFailure(`...unknown plugin: ${name}`)
      else
        logFailure(result.stderr)
    } else {
      logSuccess(`...uninstalled: ${name}`)
    }
  }
  logger.info('')
}

/**
 * List official microbs plugins.
 */
const search = () => {
  const results = getPackagesFromRegistry()
  const resultsInstalled = getInstalledPlugins()
  
  // Transform results into formatted rows
  const padding = 2
  const lengths = {
    name: 'name'.length,
    type: 'type'.length,
    version: 'latest'.length,
  }
  const rows = []
  for (var i in results) {
    const result = results[i]
    const name = result.name.replace(/^\@microbs\.io\/plugin\-/, '')
    const type = inferPluginType(result.keywords)
    const version = result.version ? `v${result.version}` : 'unknown'
    var status = chalk.dim('not installed')
    if (resultsInstalled[result.name]) {
      const resultInstalled = resultsInstalled[result.name]
      const versionInstalled = resultInstalled.version ? `v${resultInstalled.version}` : 'unknown'
      const source = resultInstalled.resolved || resultInstalled.path
      if (version == 'unknown' || versionInstalled == 'unknown' || semver.lt(semver.clean(versionInstalled), semver.clean(version)))
        status = `${chalk.bold.green('installed')} [${chalk.yellowBright(versionInstalled)}]`
      else
        status = `${chalk.bold.green('installed')} [${chalk.green(versionInstalled)}]`
    }
    else
      chalk.dim('not installed')
    lengths.name = Math.max(lengths.name, name.length)
    lengths.type = Math.max(lengths.type, type.length)
    lengths.version = Math.max(lengths.version, version.length)
    rows.push({
      name: name,
      type: type,
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
      row.type.padEnd(lengths.type + padding, ' '),
      row.version.padEnd(lengths.version + padding, ' '),
      row.status,
    ].join(''))
  }
  const header = [
    chalk.cyan('name'.padEnd(lengths.name + padding, ' ')),
    chalk.cyan('type'.padEnd(lengths.type + padding, ' ')),
    chalk.cyan('latest'.padEnd(lengths.version + padding, ' ')),
    chalk.cyan('status'.padEnd(lengths.status + padding, ' ')),
  ].join('')
  console.log('')
  console.log('Official microbs plugins:')
  console.log('')
  console.log(`  ${header}`)
  console.log(`  ${rowsFormatted.join(`\n  `)}`)
  console.log('')
  console.log(chalk.dim('Source: https://www.npmjs.com/~microbs.io'))
  console.log('')
}

/**
 * List installed microbs plugins.
 */
const list = () => {
  const deps = getInstalledPlugins()
  
  // Transform results into formatted rows
  const padding = 2
  const lengths = {
    name: 'name'.length,
    type: 'type'.length,
    version: 'version'.length,
  }
  const rows = []
  for (var name in deps) {
    const dep = deps[name]
    name = name.replace(/^\@microbs\.io\/plugin\-/, '')
    const type = inferPluginType(dep.keywords)
    const version = dep.version ? `v${dep.version}` : 'unknown'
    const source = dep.resolved || dep.path || 'unknown'
    lengths.name = Math.max(lengths.name, name.length)
    lengths.type = Math.max(lengths.type, type.length)
    lengths.version = Math.max(lengths.version, version.length)
    rows.push({
      name: name,
      type: type,
      version: version,
      source: source,
    })
  }
  if (!rows.length) {
    console.log('')
    console.log('No plugins installed.')
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
      row.type.padEnd(lengths.type + padding, ' '),
      row.version.padEnd(lengths.version + padding, ' '),
      chalk.dim(row.source),
    ].join(''))
  }
  const header = [
    chalk.cyan('name'.padEnd(lengths.name + padding, ' ')),
    chalk.cyan('type'.padEnd(lengths.type + padding, ' ')),
    chalk.cyan('version'.padEnd(lengths.version + padding, ' ')),
    chalk.cyan('source'),
  ].join('')
  console.log('')
  console.log('Installed plugins:')
  //console.log('Official microbs plugins')
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
  getInstalledPlugins: getInstalledPlugins,
  run: run
}
