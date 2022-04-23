/*
 * probej.s
 *
 * Check the status of various resources.
 */

// Third-party packages
const _ = require('lodash')

// Main packages
const logger = require('../../../logger')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')

module.exports.statusGrafanaCloud = async () => {
  try {
    let response = await utils.http({
      method: 'get',
      url: `https://grafana.com/api/instances/${state.get('plugins.grafana_cloud.stack_slug')}`,
      headers: constants.grafanaCloudApiHeaders()
    })
    if (_.range(200, 300).includes(response.status) && response.data.status == 'active')
      return true
    if (_.range(400, 600).includes(response.status) && !_.range(404, 411).includes(response.status))
      throw new Error(response)
  } catch (err) {
    logger.error(err.message)
  }
  return false
}
