// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

/**
 * GKE requires the cluster-admin ClusterRoleBinding to install kube-state-metrics.
 * https://github.com/kubernetes/kube-state-metrics/tree/v2.4.2#kubernetes-deployment
 */
const after_setup_k8s = async () => {
  /*
  // TODO: Implement
  logger.info('')
  logger.info('Creating cluster-admin-binding for kube-state-metrics on GKE...')
  utils.exec(`kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$(gcloud info --format='value(config.account)')`)
  logger.info('...done.')
  */
}

module.exports = {
  after_setup_k8s: after_setup_k8s,
}
