const { Capabilities, Builder } = require('selenium-webdriver');
const { By, Key, until } = require('selenium-webdriver');

async function getDriver() {
    const capabilities = Capabilities.firefox();
    capabilities.setAcceptInsecureCerts(true);
    return new Builder().forBrowser('firefox').withCapabilities(capabilities).build();
}

async function login(driver, username, password) {
    const alert = await driver.wait(until.alertIsPresent(), 20000);
    await alert.sendKeys(username + Key.TAB + password);
    await alert.accept();
}

async function loadPage(driver, page, username, password) {
    await driver.manage().window().setRect({ width: 1600, height: 800 });
    await driver.get(page);
    await login(driver, username, password);
    await driver.wait(until.titleIs('JES Explorer'), 2000);
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 */
async function findAndClickApplyButton(driver) {
    const applyButton = await driver.findElement(By.id('filters-apply-button'));
    await driver.wait(until.elementIsVisible(applyButton), 10000);
    await applyButton.click();
    await driver.sleep(1000); // Make sure we don't just notice the old jobs
    await driver.wait(until.elementLocated(By.className('job-instance')), 10000);
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 */
async function reloadAndOpenFilterPannel(driver) {
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.className('job-instance')), 10000);
    const element = await driver.findElement(By.id('filter-view'));
    await element.click();
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 */
async function waitForAndExtractJobs(driver) {
    await driver.sleep(1000);
    await driver.wait(until.elementLocated(By.className('job-instance')), 10000);
    const jobs = await driver.findElements(By.className('job-instance'));
    return jobs;
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} statusIdSelection id of status field in status dropdown
 */
async function setStatusFilter(driver, statusIdSelection) {
    const statusSelector = await driver.findElement(By.id('filter-status-field'));
    await statusSelector.click();
    await driver.wait(until.elementLocated(By.id(statusIdSelection)));
    const activeStatus = await driver.findElement(By.id(statusIdSelection));
    await activeStatus.click();
    await driver.wait(until.elementIsNotVisible(activeStatus), 10000);
    await driver.sleep(1000); // wait for css transition
}

module.exports = {
    getDriver,
    loadPage,
    findAndClickApplyButton,
    reloadAndOpenFilterPannel,
    waitForAndExtractJobs,
    setStatusFilter,
};
