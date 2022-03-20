// Third-party packages
const axios = require('axios')

// Main packages
const config = require('../../../config')
const context = require('../../../context')
const logger = require('../../../logger')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')
const rollout = require('./rollout')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'plugins.elastic_cloud.api_key',
  ]
  if (!utils.configHas(requiredFields)) {
    logger.error()
    logger.error(`You must set these variables in ${context.get('filepath')} to destroy Elastic Cloud:`)
    logger.error()
    logger.error(required)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Remove the Beats services from Kubernetes
  await rollout({ action: 'delete' })

  // Destroy the Elastic Cloud deployment
  if (!state.get('plugins.elastic_cloud.deployment_id'))
    return logger.warn('There is no plugins.elastic_cloud.deployment_id to remove.')
  logger.info('')
  logger.info(`Removing Elastic Cloud deployment: 'microbs-${config.get('deployment.name')}' [deployment_id=${state.get('plugins.elastic_cloud.deployment_id')}]`)
  var response
  try {
    response = await axios.request({
      method: 'post',
      url: `https://api.elastic-cloud.com/api/v1/deployments/${state.get('plugins.elastic_cloud.deployment_id')}/_shutdown`,
      headers: constants.elasticCloudApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
  } catch (err) {
    logger.error(err.message)
  }
  if (response.data.orphaned) {
    state.set('plugins.elastic_cloud.deployment_id', `${state.get('plugins.elastic_cloud.deployment_id')}-destroyed`)
    state.save()
    logger.info('...acknowledged. Elastic Cloud deployment will be destroyed in ~5 minutes.')
  } else if (response.status == 404) {
    logger.info(`...Elastic could not find the deployment. It might have been destroyed already.`)
  } else {
    logger.debug(response.status)
    logger.debug(response.data)
  }
}
