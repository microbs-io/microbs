/*
 * utils.test.js
 *
 * Unit tests for ./cli/src/utils.js
 */

describe('utils', () => {

  test('utils.exec()', () => {
    const utils = require('../src/utils')
    const s = utils.exec('echo "hello"', true)
    expect(s.stdout.trim()).toBe('hello')
  })

  test('utils.expandvars()', () => {
    const utils = require('../src/utils')
    const vars = { A: "foo", B: 123, C: '', D: null }
    const str = [ 'A=${A}', 'B=${B}', 'C=${C}', 'D=${D}', 'E=${E}' ].join('\n')
    const expected = [ 'A=foo', 'B=123', 'C=', 'D=null', 'E=undefined' ].join('\n')
    const actual = utils.expandvars(str, vars)
    expect(actual).toBe(expected)
  })

  test('utils.objToEnv()', () => {
    const utils = require('../src/utils')
    const obj = {
      'A': {
        'B.C': '1.2.3'
      },
      'D.E': '4',
      'F': 3.14,
      'G': 1,
      'H': -1,
      'I': 0,
      'J': true,
      'K': false,
      'L': '',
      'M': null,
      'N': undefined
    }
    const expected = `
A_B_C=1.2.3
D_E=4
F=3.14
G=1
H=-1
I=0
J=true
K=false
L=
N=undefined`.trim()
    const actual = utils.objToEnv(obj)
    expect(actual).toBe(expected)
  })
})
