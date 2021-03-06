const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const puppeteer = require('puppeteer');

const { Assertion, expect } = chai;
const { promisify } = require('util');

chai.use(chaiAsPromised);

const utils = {};

utils.sleep = promisify(setTimeout);

// Get a new browser instance
utils.getNewBrowser = async () => {
  return puppeteer.launch({
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
};

// Get a new page instance
utils.getNewPage = async (that, url, opts) => {
  const options = Object.assign({}, {
    timeout: 7500,
    waitUntil: 'networkidle2',
    delay: 0,
    width: 1000,
    height: 1000,
    browser: that.currentTest.browser,
  }, opts);
  
  const page = await options.browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({
    width: options.width,
    height: options.height,
  });
  await utils.navigatePage(page, url, options);
  return page;
};

// Navigate a page instance
utils.navigatePage = async (page, url, opts) => {
  const options = Object.assign({}, {
    timeout: 7500,
    waitUntil: 'networkidle2',
    delay: 0,
  });
  while (true) {
    try {
      await page.goto('about:blank', {
        timeout: options.timeout,
        waitUntil: options.waitUntil,
      });
      const navigationPromise = page.waitForNavigation();
      await page.goto(url, {
        timeout: options.timeout,
        waitUntil: options.waitUntil,
      });
      await Promise.all([
        navigationPromise,
        utils.sleep(options.delay),
      ]);
      return utils.sleep(1000);
    } catch (e) {
      await utils.sleep(1000);
    }
  }
};

// Evaluate JavaScript
utils.eval = async (that, expression) => {
  return await that.test.page.evaluate(expression);
};

beforeEach(async function() {
  this.currentTest.browser = await utils.getNewBrowser();
  this.currentTest.page = await utils.getNewPage(this, 'http://localhost:8000');
  await utils.eval({test: this.currentTest}, () => {
    window.consoleWarns = [];
    var oldConsoleWarn = console.warn;
    console.warn = function(...args) {
      window.consoleWarns.push(args);
      return oldConsoleWarn.apply(console, args);
    };
    window.consoleLogs = [];
    var oldConsoleLog = console.log;
    console.log = function(...args) {
      window.consoleLogs.push(args);
      return oldConsoleLog.apply(console, args);
    };
  });
  this.currentTest.load = utils.eval({test: this.currentTest}, () => {
    return Coldbrew.load();
  });
});

afterEach(async function() {
  await this.currentTest.browser.close();
});

module.exports = utils;
