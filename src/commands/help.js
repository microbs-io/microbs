/*
 * help.js
 *
 * Displays help for the CLI.
 */

// Third-party packages
const chalk = require('chalk')

// Help doc
const doc = `
${chalk.bold.cyanBright('microbs - microservices observability')}

Usage: ${chalk.cyan('microbs COMMAND [options]')}

Main commands:

  ${chalk.cyan('microbs setup')}       Setup all or some of the configured deployment
    [-k|--k8s]        Setup the Kubernetes cluster
    [-o|--obs]        Setup the observability solution
    [-a|--app]        Deploy the application services
    [-l|--alerts]     Setup the alerts channel

  ${chalk.cyan('microbs destroy')}     Destroy all or some of the configured deployment
    [-k|--k8s]        Destroy the Kubernetes cluster
    [-o|--obs]        Destroy the observability solution
    [-a|--app]        Remove the application services
    [-l|--alerts]     Destroy the alerts channel

  ${chalk.cyan('microbs rollout')}     Rollout a variant of a deployed application
    [VARIANT_NAME]    Name of the variant to rollout

  ${chalk.cyan('microbs stabilize')}   Revert a deployed application to its main profile
  
Plugin management commands:

  ${chalk.cyan('microbs plugins list')}                         List installed plugins
  ${chalk.cyan('microbs plugins search')}                       Search official plugins
  ${chalk.cyan('microbs plugins install PLUGIN_NAME')} [...]    Install plugin(s) by name, URL, or file path
  ${chalk.cyan('microbs plugins update PLUGIN_NAME')} [...]     Update plugin(s) by name, URL, or file path
  ${chalk.cyan('microbs plugins uninstall PLUGIN_NAME')} [...]  Uninstall plugin(s) by name, URL, or file path
  
App management commands:

  ${chalk.cyan('microbs apps list')}                            List installed apps
  ${chalk.cyan('microbs apps search')}                          Search official apps
  ${chalk.cyan('microbs apps install APP_NAME')} [...]          Install apps(s) by name, URL, or file path
  ${chalk.cyan('microbs apps update APP_NAME')} [...]           Update apps(s) by name, URL, or file path
  ${chalk.cyan('microbs apps uninstall APP_NAME')} [...]        Uninstall plugin(s) by name, URL, or file path
  
General management commands:
  
  ${chalk.cyan('microbs init')}                                 Create config path and config.yaml
  
Help commands:
  
  ${chalk.cyan('microbs validate')}    Validate microbs installation and config
  ${chalk.cyan('microbs version')}     Display the installed version of microbs
  ${chalk.cyan('microbs help')}        Display this help screen

Global options:

  [-c|--config]       Path to config directory (default: $CWD or else $HOME/.microbs)
  [-L|--log-level]    Filter logs by: debug, info, warn, error (default: info)
  [  |--no-color]     Disable colors in log messages
  [-v|--verbose]      Display timestamps and log levels with log messages

${chalk.dim(`
microbs is an open source, vendor-inclusive framework to demo, test, or learn
about microservices observability.

Learn more: https://microbs.io
Contribute: https://github.com/microbs-io/microbs`)}
`

module.exports.run = async () => console.log(doc)
