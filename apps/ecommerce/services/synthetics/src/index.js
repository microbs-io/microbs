// Standarcd packages
const process = require('process')

// Third-party packages
const _ = require('lodash')
const { chromium } = require('playwright')
const concurrently = require('concurrently')
const generator = require('creditcard-generator')
const parseArgs = require('minimist')

const SERVICE_HOST_WEB_GATEWAY = process.env.SERVICE_HOST_WEB_GATEWAY || 'web-gateway.default.svc.cluster.local'
const SERVICE_PORT_WEB_GATEWAY = process.env.SERVICE_HOST_WEB_GATEWAY || 80
const BASE_URL = `http://${SERVICE_HOST_WEB_GATEWAY}:${SERVICE_PORT_WEB_GATEWAY}`

const randomTime = () => {
  return _.random(200, 2000)
}

/**
 * Synthetic journey for shopping and submitting an order.
 */
const journey = async () => {

  // Setup
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Load home
  await page.goto(BASE_URL)
  await page.waitForTimeout(randomTime())

  // Select a random product and click the "Add to cart" button
  n = _.random(0, await page.locator('.card').count())
  await page.locator('.card > .extra button').nth(n).click()
  await page.waitForTimeout(randomTime())

  // Click the "View Cart" button
  await page.locator('.top .blue').click()
  await page.waitForSelector('.bottom .blue')
  await page.waitForTimeout(randomTime())

  // Click the "Proceed to Checkout" button
  await page.locator('.bottom .blue').click()
  await page.waitForSelector('.bottom .teal')
  await page.waitForTimeout(randomTime())

  // Provide a random valid card number
  const cardNumber = generator.GenCC('VISA')[0]
  await page.fill('input[placeholder="Card Number"]', cardNumber)
  await page.waitForTimeout(randomTime())

  // Click the "Submit Order" button
  await page.locator('.bottom .teal').click()
  await page.waitForSelector('text="Hooray!"')
  await page.waitForTimeout(randomTime())

  // Teardown
  await context.close()
  await browser.close()
}

/**
 * Run journey in a loop.
 */
const run = async () => {
  while (true) {
    try {
      await journey()
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * Run multiple journeys in a loop.
 */
const runConcurrently = async (num) => {
  const processes = []
  for (var i in _.range(0, num))
    processes.push('node ./index.js')
  concurrently(processes)
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2))
  var num = 1
  for (var key in args) {
    if (!Array.isArray(args[key]))
      args[key] = [ args[key] ]
    for (var i in args[key]) {
      switch (key) {
        case 'n':
        case 'num':
          num = parseInt(args[key][i]) || 1
          break
      }
    }
  }
  if (num > 1)
    runConcurrently(num)
  else
    run()
}
