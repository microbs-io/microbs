/*
 * setup.js
 *
 * Setup Slack channel.
 */

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
const probe = require('./probe')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.slack.bot_user_oauth_access_token',
  ]
  if (!utils.configHas(requiredFields)) {
    logger.error()
    logger.error(`You must set these variables in ${context.get('filepath')} to setup Slack:`)
    logger.error()
    logger.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' channel exists on Slack
  var channelExists = false
  if (state.get('plugins.slack.channel_id')) {
    logger.info('')
    logger.info(`Channel ID exists in .state file: ${state.get('plugins.slack.channel_id')}`)
    logger.info('')
    logger.info('Checking if the channel exists on Slack...')
    channelExists = await probe.statusSlackChannel(state.get('plugins.slack.channel'))
    if (channelExists)
      logger.info(`...channel exists on Slack: 'microbs-${state.get('plugins.slack.channel')}' [id=${state.get('plugins.slack.channel_id')}]`)
    else
      logger.info('...channel does not exist on Slack. A new one will be created, and the .state file will be updated.')
  }

  // Create channel if it doesn't exist on Slack
  if (!channelExists) {
    const channelName = `microbs-${config.get('deployment.name')}`
    logger.info('')
    logger.info(`Creating Slack channel [name=${channelName}]...`)
    var response
    try {
      response = await axios.request({
        method: 'post',
        url: 'https://slack.com/api/conversations.create',
        params: {
          name: channelName
        },
        headers: constants.slackApiHeaders(),
        timeout: 60000,
        validateStatus: () => true
      })
      logger.debug(response.status)
      logger.debug(response.data)
    } catch (err) {
      logger.error(err.message)
    }

    // Get stack info
    if (response.status == 200) {
      if (response.error && response.error == 'name_taken')
        logger.info(`...exists: '${channelName}'`)
      else
        logger.info(`...created: '${channelName}'`)
    } else {
      logger.error('...failure:')
      logger.error(response.data)
      process.exit(1)
    }

    // Get channel info and update .state file
    state.set('plugins.slack.channel', response.data.channel.name)
    state.set('plugins.slack.channel_id', response.data.channel.id)
    state.save()
  }

  logger.info('')
  logger.info('Slack is ready.')
  logger.info('')
  logger.info(`Channel:       ${state.get('plugins.slack.channel')}`)
}
