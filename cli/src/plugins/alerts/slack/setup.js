/*
 * setup.js
 *
 * Setup Slack channel.
 */

// Standard packages
const process = require('process')

// Third-party packages
const axios = require('axios')

// Main packages
const config = require('../../../config.js')
const state = require('../../../state.js')
const utils = require('../../../utils.js')

// Plugin packages
const constants = require('./constants.js')
const probe = require('./probe.js')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.slack.bot_user_oauth_access_token',
  ]
  if (!utils.configHas(requiredFields)) {
    console.error()
    console.error(`You must set these variables in ${config.get('_context.filepath')} to setup Slack:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' channel exists on Slack
  var channelExists = false
  if (state.get('plugins.slack.channel_id')) {
    console.log('')
    console.log(`Channel ID exists in .state file: ${state.get('plugins.slack.channel_id')}`)
    console.log('')
    console.log('Checking if the channel exists on Slack...')
    channelExists = await probe.statusSlackChannel(state.get('plugins.slack.channel'))
    if (channelExists)
      console.log(`...channel exists on Slack: 'microbs-${state.get('plugins.slack.channel')}' [id=${state.get('plugins.slack.channel_id')}]`)
    else
      console.log('...channel does not exist on Slack. A new one will be created, and the .state file will be updated.')
  }

  // Create channel if it doesn't exist on Slack
  if (!channelExists) {
    const channelName = `microbs-${config.get('deployment.name')}`
    console.log('')
    console.log(`Creating Slack channel [name=${channelName}]...`)
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
      console.debug(response.status)
      console.debug(response.data)
    } catch (err) {
      console.error(err.message)
    }

    // Get stack info
    if (response.status == 200) {
      console.log(`...created: '${channelName}'`)
    } else {
      console.log('...failure:')
      console.log(JSON.stringify(response.data, null, indent=2))
      process.exit(1)
    }

    // Get channel info and update .state file
    state.set('plugins.slack.channel', response.data.channel.name)
    state.set('plugins.slack.channel_id', response.data.channel.id)
    state.save()
  }

  console.log('')
  console.log('Slack is ready.')
  console.log('')
  console.log(`Channel:       ${state.get('plugins.slack.channel')}`)
}
