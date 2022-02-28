// Standard packages
const path = require('path')
const process = require('process')
const { URL } = require('url')

// Third-party packages
const _ = require('lodash')
const axios = require('axios')

// Main packages
const config = require('../../../config.js')
const state = require('../../../state.js')
const utils = require('../../../utils.js')

// Plugin packages
const constants = require('./constants.js')
const probe = require('./probe.js')
const rollout = require('./rollout.js')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.obs.elastic_cloud.api_key',
    'plugins.obs.elastic_cloud.region',
    'plugins.obs.elastic_cloud.version',
  ]
  if (!utils.configHas(requiredFields)) {
    console.error()
    console.error(`You must set these variables in ${config.get('_context.filepath')} to setup Elastic Cloud:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' exists on Elastic Cloud
  var deploymentExists = false
  if (state.get('plugins.obs.elastic_cloud.deployment_id')) {
    console.log('')
    console.log(`Deployment ID exists in .state file: ${state.get('plugins.obs.elastic_cloud.deployment_id')}`)
    console.log('')
    console.log('Checking if the deployment exists on Elastic Cloud...')
    deploymentExists = await probe.statusElasticCloud()
    if (deploymentExists)
      console.log(`...deployment exists on Elastic Cloud: 'microbs-${config.get('deployment.name')}' [deployment_id=${state.get('plugins.obs.elastic_cloud.deployment_id')}]`)
    else
      console.log('...deployment does not exist on Elastic Cloud. A new one will be created, and the .state file will be updated.')
  }

  // Create deployment if it doesn't exist on Elastic Cloud
  if (!deploymentExists) {
    console.log('')
    console.log('Creating Elastic Cloud deployment...')
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
      console.debug(response.status)
      console.debug(response.data)
    } catch (err) {
      console.error(err.message)
    }

    // Get deployment info
    if (response.data.created === true) {
      console.log(`...created: 'microbs-${config.get('deployment.name')}' [deployment_id=${response.data.id}]`)
    } else {
      console.log('...failure:')
      console.log(JSON.stringify(response.data, null, indent=2))
      process.exit(1)
    }

    // Get deployment_id and update .state file before anything else,
    // to ensure that the deployment isn't duplicated in the event of multiple
    // failed or abandoned attempts.
    state.set('plugins.obs.elastic_cloud.deployment_id', response.data.id)
    state.save()

    // Get deployment info and update .state file
    for (var i in response.data.resources) {
      let resource = response.data.resources[i]
      if (resource.kind == 'elasticsearch') {
        state.set('plugins.obs.elastic_cloud.cloud_id',  _.get(resource, 'cloud_id'))
        state.set('plugins.obs.elastic_cloud.elasticsearch.username', _.get(resource, 'credentials.username'))
        state.set('plugins.obs.elastic_cloud.elasticsearch.password', _.get(resource, 'credentials.password'))
      }
      if (resource.kind == 'integrations_server') {
        state.set('plugins.obs.elastic_cloud.integrations_server.secret_token', _.get(resource, 'secret_token'))
      }
    }
    state.save()

    // Get endpoints and update .state file
    let components = [ 'elasticsearch', 'kibana', 'integrations_server' ]
    for (var i in components) {
      let component = components[i]
      console.log('')
      console.log(`Finding endpoint for ${component}...`)
      var found = false
      while (!found) {
        try {
          var response = await axios.request({
            method: 'get',
            url: `https://api.elastic-cloud.com/api/v1/deployments/${state.get('plugins.obs.elastic_cloud.deployment_id')}/${component}/main-${component}`,
            headers: constants.elasticCloudApiHeaders(),
            timeout: 60000,
            validateStatus: () => true
          })
          var url = _.get(response.data, 'info.metadata.service_url')
          if (url) {
            if (component == 'elasticsearch') {
              state.set('plugins.obs.elastic_cloud.elasticsearch.url', url)
            } else if (component == 'kibana') {
              state.set('plugins.obs.elastic_cloud.kibana.url', url)
            } else if (component == 'integrations_server') {
              state.set('plugins.obs.elastic_cloud.integrations_server.url', url)
              state.set('plugins.obs.elastic_cloud.integrations_server.exporter_endpoint', `${(new URL(url)).hostname}:443`)
            }
            process.stdout.write('\n')
            console.log(`...found: ${url}`)
            state.save()
            found = true
          } else {
            process.stdout.write('.')
            await utils.sleep(1000)
          }
        } catch (err) {
          console.error(err.message)
        }
      }
    }

    console.log('')
    console.log('The Elastic Cloud deployment will be ready in ~5 minutes.')
    console.log('')
    console.log(`Kibana URL:              ${state.get('plugins.obs.elastic_cloud.kibana.url')}`)
    console.log(`Elasticsearch URL:       ${state.get('plugins.obs.elastic_cloud.elasticsearch.url')}`)
    console.log(`  - Username:            ${state.get('plugins.obs.elastic_cloud.elasticsearch.username')}`)
    console.log(`  - Password:            ${state.get('plugins.obs.elastic_cloud.elasticsearch.password')}`)
    console.log(`Integration Server URL:  ${state.get('plugins.obs.elastic_cloud.integrations_server.url')}`)
  }

  // Deploy the Beats services to Kubernetes
  await rollout()
}
