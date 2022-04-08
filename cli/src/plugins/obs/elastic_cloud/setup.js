// Standard packages
const path = require('path')
const { URL } = require('url')

// Third-party packages
const _ = require('lodash')
const axios = require('axios')

// Main packages
const config = require('../../../config')
const context = require('../../../context')
const logger = require('../../../logger')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')
const probe = require('./probe')
const rollout = require('./rollout')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.elastic_cloud.api_key',
    'plugins.elastic_cloud.region',
    'plugins.elastic_cloud.version',
  ]
  if (!utils.configHas(requiredFields)) {
    logger.error()
    logger.error(`You must set these variables in ${context.get('filepath')} to setup Elastic Cloud:`)
    logger.error()
    logger.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' exists on Elastic Cloud
  var deploymentExists = false
  if (state.get('plugins.elastic_cloud.deployment_id')) {
    logger.info('')
    logger.info(`Deployment ID exists in .state file: ${state.get('plugins.elastic_cloud.deployment_id')}`)
    logger.info('')
    logger.info('Checking if the deployment exists on Elastic Cloud...')
    deploymentExists = await probe.statusElasticCloud()
    if (deploymentExists)
      logger.info(`...deployment exists on Elastic Cloud: 'microbs-${config.get('deployment.name')}' [deployment_id=${state.get('plugins.elastic_cloud.deployment_id')}]`)
    else
      logger.info('...deployment does not exist on Elastic Cloud. A new one will be created, and the .state file will be updated.')
  }

  // Create deployment if it doesn't exist on Elastic Cloud
  if (!deploymentExists) {
    logger.info('')
    logger.info('Creating Elastic Cloud deployment...')
    var filepath = path.join(constants.pluginHome(), 'assets', 'elastic_cloud_deployment_template.json')
    var deployment_template = utils.loadTemplateJson(filepath, config.get())
    var response
    try {
      response = await axios.request({
        method: 'post',
        url: 'https://api.elastic-cloud.com/api/v1/deployments',
        data: deployment_template,
        headers: constants.elasticCloudApiHeaders(),
        timeout: 60000,
        validateStatus: () => true
      })
      logger.debug(response.status)
      logger.debug(response.data)
    } catch (err) {
      logger.error(err.message)
    }

    // Get deployment info
    if (response.data.created === true) {
      logger.info(`...created: 'microbs-${config.get('deployment.name')}' [deployment_id=${response.data.id}]`)
    } else {
      logger.error('...failure:')
      logger.error(response.data)
      process.exit(1)
    }

    // Get deployment_id and update .state file before anything else,
    // to ensure that the deployment isn't duplicated in the event of multiple
    // failed or abandoned attempts.
    state.set('plugins.elastic_cloud.deployment_id', response.data.id)
    state.save()

    // Get deployment info and update .state file
    for (var i in response.data.resources) {
      let resource = response.data.resources[i]
      if (resource.kind == 'elasticsearch') {
        state.set('plugins.elastic_cloud.cloud_id',  _.get(resource, 'cloud_id'))
        state.set('plugins.elastic_cloud.elasticsearch.username', _.get(resource, 'credentials.username'))
        state.set('plugins.elastic_cloud.elasticsearch.password', _.get(resource, 'credentials.password'))
      }
      if (resource.kind == 'integrations_server') {
        state.set('plugins.elastic_cloud.integrations_server.secret_token', _.get(resource, 'secret_token'))
      }
    }
    state.save()

    // Get endpoints and update .state file
    let components = [ 'elasticsearch', 'kibana', 'integrations_server' ]
    for (var i in components) {
      let component = components[i]
      logger.info('')
      logger.info(`Finding endpoint for ${component}...`)
      var found = false
      while (!found) {
        try {
          var response = await axios.request({
            method: 'get',
            url: `https://api.elastic-cloud.com/api/v1/deployments/${state.get('plugins.elastic_cloud.deployment_id')}/${component}/main-${component}`,
            headers: constants.elasticCloudApiHeaders(),
            timeout: 60000,
            validateStatus: () => true
          })
          var url = _.get(response.data, 'info.metadata.service_url')
          if (url) {
            if (component == 'elasticsearch') {
              state.set('plugins.elastic_cloud.elasticsearch.url', url)
            } else if (component == 'kibana') {
              state.set('plugins.elastic_cloud.kibana.url', url)
            } else if (component == 'integrations_server') {
              state.set('plugins.elastic_cloud.integrations_server.url', url)
              state.set('plugins.elastic_cloud.integrations_server.exporter_endpoint', `${(new URL(url)).hostname}:443`)
            }
            logger.info(`...found: ${url}`)
            state.save()
            found = true
          } else {
            await utils.sleep(1000)
          }
        } catch (err) {
          logger.error(err.message)
        }
      }
    }

    logger.info('')
    logger.info('The Elastic Cloud deployment will be ready in ~5 minutes.')
    logger.info('')
    logger.info(`Kibana URL:              ${state.get('plugins.elastic_cloud.kibana.url')}`)
    logger.info(`Elasticsearch URL:       ${state.get('plugins.elastic_cloud.elasticsearch.url')}`)
    logger.info(`  - Username:            ${state.get('plugins.elastic_cloud.elasticsearch.username')}`)
    logger.info(`  - Password:            ${state.get('plugins.elastic_cloud.elasticsearch.password')}`)
    logger.info(`Integration Server URL:  ${state.get('plugins.elastic_cloud.integrations_server.url')}`)
  }

  // Deploy the Beats services to Kubernetes
  await rollout()
}
