/*
 * probej.s
 *
 * Check the status of various resources.
 */

// Third-party packages
const axios = require('axios')

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')

module.exports.statusSlackChannel = async (channelName) => {
  try {
    let response = await axios.request({
      method: 'get',
      url: 'https://slack.com/api/conversations.list',
      headers: constants.slackApiHeaders(),
      params: {
        limit: 1000
      },
      timeout: 60000,
      validateStatus: () => true
    })
    logger.info(response.data)
    if (response.status == 200 && response.data.ok === true) {
      for (var i in response.data.channels) {
        if (response.data.channels[i].name == channelName)
          return true
      }
    } else {
      logger.debug(response.data)
    }
  } catch (err) {
    logger.error(err.message)
  }
  return false
}
