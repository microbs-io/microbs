/*
 * config.test.js
 *
 * Unit tests for ./cli/src/config.js
 */

// Third-party packages
const _ = require('lodash')

// Main packages
const config = require('../src/config')

// Test packages
const utils = require('./utils')

describe('config', () => {

  test('config.load() [generic-flat.yaml]', () => {
    const c = config.load('./cli/test/configs/generic-flat.yaml')
    expect(_.get(c, 'deployment.name')).toBe('test-flat')
    expect(_.get(c, 'deployment.app')).toBe('templates')
    expect(_.get(c, 'deployment.plugins.alerts')).toBe('template')
    expect(_.get(c, 'deployment.plugins.k8s')).toBe('template')
    expect(_.get(c, 'deployment.plugins.obs')).toBe('template')
    expect(_.get(c, 'deployment.environment')).toBe('test')
    expect(_.get(c, 'docker.registry')).toBeUndefined()
    expect(_.get(c, 'otlp.receiver.host')).toBe('otel-collector')
    expect(_.get(c, 'otlp.receiver.port')).toBe(4317)
  })

  test('config.load() [generic-nested.yaml]', () => {
    const c = config.load('./cli/test/configs/generic-nested.yaml')
    expect(_.get(c, 'deployment.name')).toBe('test-nested')
    expect(_.get(c, 'deployment.app')).toBe('templates')
    expect(_.get(c, 'deployment.plugins.alerts')).toBe('template')
    expect(_.get(c, 'deployment.plugins.k8s')).toBe('template')
    expect(_.get(c, 'deployment.plugins.obs')).toBe('template')
    expect(_.get(c, 'deployment.environment')).toBe('test')
    expect(_.get(c, 'docker.registry')).toBeUndefined()
    expect(_.get(c, 'otlp.receiver.host')).toBe('otel-collector')
    expect(_.get(c, 'otlp.receiver.port')).toBe(4317)
  })

  test('config.init() [generic-nested.yaml]', () => {
    config.init('./cli/test/configs/generic-nested.yaml')
    expect(config.get('deployment.name')).toBe('test-nested')
    expect(config.get('deployment.app')).toBe('templates')
    expect(config.get('deployment.plugins.alerts')).toBe('template')
    expect(config.get('deployment.plugins.k8s')).toBe('template')
    expect(config.get('deployment.plugins.obs')).toBe('template')
    expect(config.get('deployment.environment')).toBe('test')
    expect(config.get('docker.registry')).toBeUndefined()
    expect(config.get('otlp.receiver.host')).toBe('otel-collector')
    expect(config.get('otlp.receiver.port')).toBe(4317)

    // Calling init again must not affect the immutable config object.
    config.init('./cli/test/configs/generic-flat.yaml')
    expect(config.get('deployment.name')).toBe('test-nested')
  })
})
