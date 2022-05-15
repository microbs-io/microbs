/*
 * index.test.js
 */

// Standard packages
const path = require('path')

// Main packages
const { utils } = require('@microbs.io/core')

// Path to main config file for tests
const conf = './test/configs/generic-nested.yaml'

describe('package.json', () => {

  test('package.json exists', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json).toBeTruthy()
  })

  test('package.json declares "main"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.main).toBe('./src/index.js')
  })

  test('package.json declares "license"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.license).toBe('Apache-2.0')
  })

  test('package.json declares "version"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.version).toBeTruthy()
  })

  test('package.json declares "bin"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.bin.microbs).toBe('./microbs')
  })

  test('package.json declares "url"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.url).toBe('https://microbs.io')
  })

  test('package.json has no microbs apps or plugins in "dependencies" or "packages"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    for (var key in json.dependencies) {
      expect(key.includes('@microbs.io/app-')).toBe(false)
      expect(key.includes('microbs-app-')).toBe(false)
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
    for (var key in json.packages) {
      expect(key.includes('@microbs.io/app-')).toBe(false)
      expect(key.includes('microbs-app-')).toBe(false)
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
  })

  test('package-lock.json exists', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    expect(json).toBeTruthy()
  })

  test('package-lock.json has no microbs apps or plugins in "dependencies" or "packages"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    for (var key in json.dependencies) {
      expect(key.includes('@microbs.io/app-')).toBe(false)
      expect(key.includes('microbs-app-')).toBe(false)
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
    for (var key in json.packages) {
      expect(key.includes('@microbs.io/app-')).toBe(false)
      expect(key.includes('microbs-app-')).toBe(false)
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
  })

  test('package.json and package-lock.json have same version', () => {
    const pkg = utils.loadJson(path.join(process.cwd(), 'package.json'))
    const pkgLock = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    expect(pkg.version).toBe(pkgLock.version)
  })
})

describe('microbs help', () => {

  test('microbs', () => {
    const str = utils.exec(`./microbs --no-color`, true).stdout
    expect(str).toMatch(/^\s*microbs - microservices observability/)
    expect(str).toMatch(/Contribute: https:\/\/github.com\/microbs-io\/microbs\s*$/)
  })

  test('microbs help', () => {
    const str = utils.exec(`./microbs help --no-color`, true).stdout
    expect(str).toMatch(/^\s*microbs - microservices observability/)
    expect(str).toMatch(/Contribute: https:\/\/github.com\/microbs-io\/microbs\s*$/)
  })
})

describe('microbs version', () => {

  test('microbs version', () => {
    const actual = utils.exec(`./microbs version`, true).stdout
    const expected = utils.loadJson(path.join(__dirname, '..', 'package.json'))
    expect(actual).toMatch(expected.version)
  })
})
