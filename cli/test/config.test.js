/*
 * config.test.js
 *
 * Unit tests for ./cli/src/config.js
 */

// Test packages
const utils = require('./utils')

describe('config', () => {

  test('config.load() [generic-flat.yaml]', () => {
    const config = require('../src/config')
    config.load('./cli/test/configs/generic-flat.yaml')
    expect(config.get('deployment.name')).toBe('test')
    expect(config.get('deployment.app')).toBe('templates')
    expect(config.get('deployment.plugins.alerts')).toBe('template')
    expect(config.get('deployment.plugins.k8s')).toBe('template')
    expect(config.get('deployment.plugins.obs')).toBe('template')
    expect(config.get('deployment.environment')).toBe('test')
    expect(config.get('docker.registry')).toBeUndefined()
    expect(config.get('otlp.receiver.host')).toBe('otel-collector')
    expect(config.get('otlp.receiver.port')).toBe(4317)
  })

  test('config.load() [generic-nested.yaml]', () => {
    const config = require('../src/config')
    config.load('./cli/test/configs/generic-nested.yaml')
    expect(config.get('deployment.name')).toBe('test')
    expect(config.get('deployment.app')).toBe('templates')
    expect(config.get('deployment.plugins.alerts')).toBe('template')
    expect(config.get('deployment.plugins.k8s')).toBe('template')
    expect(config.get('deployment.plugins.obs')).toBe('template')
    expect(config.get('deployment.environment')).toBe('test')
    expect(config.get('docker.registry')).toBeUndefined()
    expect(config.get('otlp.receiver.host')).toBe('otel-collector')
    expect(config.get('otlp.receiver.port')).toBe(4317)
  })
})
