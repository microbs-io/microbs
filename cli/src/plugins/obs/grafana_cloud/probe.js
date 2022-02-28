/*
 * probej.s
 *
 * Check the status of various resources.
 */

// Standard packages
const process = require('process')

// Third-party packages
const _ = require('lodash')
const axios = require('axios')

// Main packages
const config = require('../../../config.js')
const state = require('../../../state.js')
const utils = require('../../../utils.js')

// Plugin packages
const constants = require('./constants.js')

module.exports.statusGrafanaCloud = async () => {
  try {
    let response = await axios.request({
      method: 'get',
      url: `https://grafana.com/api/instances/${state.get('plugins.obs.grafana_cloud.stack_slug')}`,
      headers: constants.grafanaCloudApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    console.log(response)
    if (_.range(200, 300).includes(response.status) && response.data.status == 'active')
      return true
    if (_.range(400, 600).includes(response.status) && !_.range(404, 411).includes(response.status))
      throw new Error(response)
  } catch (err) {
    console.error(err.message)
  }
  return false
}
