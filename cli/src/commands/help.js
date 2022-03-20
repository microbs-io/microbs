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

  ${chalk.cyan('microbs setup')}      Setup all or some of the configured deployment
    [-c|--config]    Path to config file (default: ./config.yaml)
    [-k|--k8s]       Setup the Kubernetes cluster
    [-o|--obs]       Setup the observability solution
    [-a|--app]       Deploy the application services
    [-l|--alerts]    Setup the alerts channel

  ${chalk.cyan('microbs destroy')}    Destroy all or some of the configured deployment
    [-c|--config]    Path to config file (default: ./config.yaml)
    [-k|--k8s]       Destroy the Kubernetes cluster
    [-o|--obs]       Destroy the observability solution
    [-a|--app]       Remove the application services
    [-l|--alerts]    Destroy the alerts channel

  ${chalk.cyan('microbs rollout')}    Rollout a variant of a deployed application
    [VARIANT_NAME]   Name of the variant to rollout
    [-c|--config]    Path to config file (default: ./config.yaml)

  ${chalk.cyan('microbs stabilize')}  Revert a deployed application to its stable scenario
    [-c|--config]    Path to config file (default: ./config.yaml)

  ${chalk.cyan('microbs validate')}   Validate microbs installation and config
    [-c|--config]    Path to config file (default: ./config.yaml)

  ${chalk.cyan('microbs apps')}       List all deployable applications
  ${chalk.cyan('microbs plugins')}    List all available plugins
  ${chalk.cyan('microbs help')}       Display this help screen

${chalk.dim(`
microbs is an open source, vendor-inclusive framework to demo, test, or learn
about microservices observability.

Learn more: https://microbs.io
Contribute: https://github.com/microbs-io/microbs`)}

`

module.exports.run = async () => console.log(doc)
