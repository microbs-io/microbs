/*
 * probe.js
 *
 * Check the status of various resources.
 */

// Third-party packages
const _ = require('lodash')
const axios = require('axios')

// Main packages
const config = require('../../../config')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants.js')

module.exports.statusElasticCloud = async () => {
  try {
    let response = await axios.request({
      method: 'get',
      url: `https://api.elastic-cloud.com/api/v1/deployments/${state.get('plugins.elastic_cloud.deployment_id')}`,
      headers: constants.elasticCloudApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    const resources = _.get(response.data, 'resources.elasticsearch') || []
    const status = resources.length > 0 ? _.get(resources[0], 'info.status') || null : null
    if (_.range(200, 300).includes(response.status) && status != 'stopped')
      return true
    if (_.range(400, 600).includes(response.status) && !_.range(404, 411).includes(response.status))
      throw new Error(response)
  } catch (err) {
    console.error(err.message)
  }
  return false
}
