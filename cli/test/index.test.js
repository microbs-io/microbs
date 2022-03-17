/*
 * index.test.js
 *
 * Integration tests for the microbs CLI
 */

// Test packages
const utils = require('./utils')

// Path to main config file for tests
const conf = './cli/test/configs/generic-nested.yaml'

describe('microbs help', () => {

  test('microbs', () => {
    const s = utils.exec(`./microbs`)
    expect(utils.colorless(s)).toMatch(/^\s*microbs - microservices observability/)
    expect(utils.colorless(s)).toMatch(/Contribute: https:\/\/github.com\/microbs-io\/microbs\s*$/)
  })

  test('microbs help', () => {
    const s = utils.exec(`./microbs help`)
    expect(utils.colorless(s)).toMatch(/^\s*microbs - microservices observability/)
    expect(utils.colorless(s)).toMatch(/Contribute: https:\/\/github.com\/microbs-io\/microbs\s*$/)
  })
})

describe('microbs validate', () => {

  test('microbs validate [generic-flat.yaml]', () => {
    const s = utils.exec(`./microbs validate -c ./cli/test/configs/generic-flat.yaml`)
    expect(s).toMatch(/no problems detected in config file/)
  })

  test('microbs validate [generic-nested.yaml]', () => {
    const s = utils.exec(`./microbs validate -c ${conf}`)
    expect(s).toMatch(/no problems detected in config file/)
  })
})

describe('microbs setup [template plugins]', () => {

  test('microbs setup -k', () => {
    const s = utils.exec(`./microbs setup -k -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup --k8s', () => {
    const s = utils.exec(`./microbs setup --k8s -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup -o', () => {
    const s = utils.exec(`./microbs setup -o -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup --obs', () => {
    const s = utils.exec(`./microbs setup --obs -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup -l', () => {
    const s = utils.exec(`./microbs setup -l -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs setup --alerts', () => {
    const s = utils.exec(`./microbs setup --alerts -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs setup -ko', () => {
    const s = utils.exec(`./microbs setup -ko -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup --k8s --obs', () => {
    const s = utils.exec(`./microbs setup --k8s --obs -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs setup -okl', () => {
    // Expect a specific execution order
    const s = utils.exec(`./microbs setup -okl -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/.*alerts.*\n*.*k8s.*\n*.*obs.*/)
  })

  test('microbs setup --obs --k8s --alerts', () => {
    // Expect a specific execution order
    const s = utils.exec(`./microbs setup --obs --k8s --alerts -c ${conf}`)
    expect(s).toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/.*alerts.*\n*.*k8s.*\n*.*obs.*/)
  })
})

describe('microbs rollout [template plugins]', () => {

  test('microbs rollout -k', () => {
    const s = utils.exec(`./microbs rollout -k -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs rollout --k8s', () => {
    const s = utils.exec(`./microbs rollout --k8s -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs rollout -o', () => {
    const s = utils.exec(`./microbs rollout -o -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs rollout --obs', () => {
    const s = utils.exec(`./microbs rollout --obs -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs rollout -l', () => {
    const s = utils.exec(`./microbs rollout -l -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs rollout --alerts', () => {
    const s = utils.exec(`./microbs rollout --alerts -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs rollout -ko', () => {
    const s = utils.exec(`./microbs rollout -ko -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs rollout --k8s --obs', () => {
    const s = utils.exec(`./microbs rollout --k8s --obs -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).toMatch(/rollout/)
    expect(s).not.toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })
})

describe('microbs destroy [template plugins]', () => {

  test('microbs destroy -k', () => {
    const s = utils.exec(`./microbs destroy -k -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy --k8s', () => {
    const s = utils.exec(`./microbs destroy --k8s -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy -o', () => {
    const s = utils.exec(`./microbs destroy -o -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy --obs', () => {
    const s = utils.exec(`./microbs destroy --obs -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy -l', () => {
    const s = utils.exec(`./microbs destroy -l -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs destroy --alerts', () => {
    const s = utils.exec(`./microbs destroy --alerts -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).not.toMatch(/k8s/)
    expect(s).not.toMatch(/obs/)
    expect(s).toMatch(/alerts/)
  })

  test('microbs destroy -ko', () => {
    const s = utils.exec(`./microbs destroy -ko -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy --k8s --obs', () => {
    const s = utils.exec(`./microbs destroy --k8s --obs -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/k8s/)
    expect(s).toMatch(/obs/)
    expect(s).not.toMatch(/alerts/)
  })

  test('microbs destroy -kol', () => {
    // Expect a specific execution order
    const s = utils.exec(`./microbs destroy -kol -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/.*alerts.*\n*.*obs.*\n*.*k8s.*/)
  })

  test('microbs destroy --k8s --obs --alerts', () => {
    // Expect a specific execution order
    const s = utils.exec(`./microbs destroy --k8s --obs --alerts -c ${conf}`)
    expect(s).not.toMatch(/setup/)
    expect(s).not.toMatch(/rollout/)
    expect(s).toMatch(/destroy/)
    expect(s).toMatch(/.*alerts.*\n*.*obs.*\n*.*k8s.*/)
  })
})
