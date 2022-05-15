[![Build Status](https://github.com/microbs-io/microbs/workflows/Commit/badge.svg?branch=main)](https://github.com/microbs-io/microbs/actions)
[![npm](https://img.shields.io/npm/v/@microbs.io/cli?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/cli)
![Apache 2.0](https://img.shields.io/npm/l/@microbs.io/cli?color=%23f6f8fa)

# microbs - microservices observability

microbs creates immersive and realistic observability experiences:

- **Demo** - Create interactive observability stories for your applications and infrastructure.
- **Test** - Test your application and infrastructure observability under realistic circumstances.
- **Learn** - Hone your skills in microservices and observability.

With little [configuration](https://microbs.io/docs/usage/configuration) and one
[command](https://microbs.io/docs/usage/cli), you can deploy a tech stack with
your choice of:

- **[Sample apps](http://microbs.io/docs/apps)** (e.g. [ecommerce](http://microbs.io/docs/apps/ecommerce), or make your own)
- **[Simulated issues](http://microbs.io/docs/overview/concepts#variants)** (e.g. bugs, traffic spikes, or make your own)
- **[Synthetics](http://microbs.io/docs/overview/concepts#synthetics)** (e.g. realistic user traffic generation)
- **[Kubernetes platforms](http://microbs.io/docs/overview/concepts#kubernetes)** (e.g. [GKE](https://microbs.io/docs/plugins/kubernetes/gke), [minikube](https://microbs.io/docs/plugins/kubernetes/minikube), [kind](https://microbs.io/docs/plugins/kubernetes/kind))
- **[Observability solutions](http://microbs.io/docs/overview/concepts#observability)** (e.g. [Grafana Cloud](https://microbs.io/docs/plugins/observability/grafana-cloud), [Elastic Cloud](https://microbs.io/docs/plugins/observability/elastic-cloud))

You can develop your own [apps](https://microbs.io/docs/development/apps) or
[plugins](https://microbs.io/docs/development/plugins) for a more customized
experience in microbs. More plugins are planned for the future.

microbs is a vendor-inclusive project of the open source community. microbs is
not officially supported by any vendors named in the project, though people who
work for them may contribute to the project.


## Quick start

Read the [**getting started guide**](https://microbs.io/docs/overview/getting-started/) for more details.

1. Install dependencies: [node](https://nodejs.org/en/download/), [docker](https://docs.docker.com/engine/install/), [kubectl](https://kubernetes.io/docs/tasks/tools/), [skaffold](https://skaffold.dev/docs/install/)
2. Install microbs: `curl -Ls https://microbs.io/install.js | node`
3. Modify [`$HOME/.microbs/config.yaml`](https://microbs.io/docs/usage/configuration) (Note: [Plugins](https://microbs.io/docs/plugins/) may have additional dependencies and configuration)
4. Validate installation: `microbs validate`


## Projects

|Project|Github|npm|
|-------|------|---|
|**Apps**|||
|@microbs.io/app-ecommerce|[Github](https://github.com/microbs-io/microbs-app-ecommerce)|[![npm](https://img.shields.io/npm/v/@microbs.io/app-ecommerce?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/app-ecommerce)|
|**Plugins**|||
|@microbs.io/plugin-elastic-cloud|[Github](https://github.com/microbs-io/microbs-plugin-elastic-cloud)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-elastic-cloud?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-elastic-cloud)|
|@microbs.io/plugin-gke|[Github](https://github.com/microbs-io/microbs-plugin-gke)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-gke?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-gke)|
|@microbs.io/plugin-grafana-cloud|[Github](https://github.com/microbs-io/microbs-plugin-grafana-cloud)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-grafana-cloud?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-grafana-cloud)|
|@microbs.io/plugin-kind|[Github](https://github.com/microbs-io/microbs-plugin-kind)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-kind?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-kind)|
|@microbs.io/plugin-minikube|[Github](https://github.com/microbs-io/microbs-plugin-minikube)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-minikube?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-minikube)|
|@microbs.io/plugin-slack|[Github](https://github.com/microbs-io/microbs-plugin-slack)|[![npm](https://img.shields.io/npm/v/@microbs.io/plugin-slack?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/plugin-slack)|
|**Libraries**|||
|@microbs.io/cli|[Github](https://github.com/microbs-io/microbs)|[![npm](https://img.shields.io/npm/v/@microbs.io/cli?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/cli)|
|@microbs.io/core|[Github](https://github.com/microbs-io/microbs-core)|[![npm](https://img.shields.io/npm/v/@microbs.io/core?color=%2300B5AD&label=Latest)](https://www.npmjs.com/package/@microbs.io/core)|
