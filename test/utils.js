const {Capabilities, Builder} = require('selenium-webdriver');
const {By, Key, until} = require('selenium-webdriver');
const expect = require('chai').expect;

async function getDriver() {
	const capabilities = Capabilities.firefox();
	capabilities.setAcceptInsecureCerts(true);
	return new Builder().forBrowser('firefox').withCapabilities(capabilities).build()
} 

async function loadPage(driver, page, username, password) {
	await driver.manage().window().setRect({width: 1600, height: 800});
	await driver.get(page);
	await login(driver, username, password);
	await driver.wait(until.titleIs('JES Explorer'), 2000);
}

async function login(driver, username, password) {
	const alert = await driver.wait(until.alertIsPresent(), 20000);
	await alert.sendKeys(username + Key.TAB + password);
    await alert.accept();
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} id 	html id
 * @param {int} count 	expected occurences
 */
async function testElementAppearsXTimes(driver, id, count){
	try {
		const elements = await driver.findElements(By.id(id));
		expect(elements).to.be.an('array').that.has.lengthOf(count);
	} catch (e) {
		console.log(e.toString());
		return false
	}
	return true
}

/**
 * 
 * @param {WebDriver} driver 	selenium-webdriver
 * @param {string} id 			html id
 * @param {string} replaceText 	optional replace text, defaults to "TEST"
 */
async function testTextInputFieldCanBeModified(driver, id, replaceText = 'TEST'){
	try {
		const element = await driver.findElement(By.id(id));
		await element.clear();
		await element.sendKeys(replaceText)
	} catch (e) {
		console.log(e.toString());
		return false;
	}
	return true;
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} id html id
 * @param {string} expectedValue expected text field value
 */
async function testTextInputFieldValue(driver, id, expectedValue){
	try{
		const element = await driver.findElement(By.id(id));
		expect(await element.getAttribute('value')).to.equal(expectedValue);
	} catch (e) {
		console.log(e.toString());
		return false
	}
	return true;
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 */
async function findAndClickApplyButton(driver){
	const applyButton = await driver.findElement(By.id('filters-apply-button'));
	await driver.wait(until.elementIsVisible(applyButton), 10000);
	await applyButton.click();
	await driver.sleep(1000);	//Make sure we don't just notice the old jobs
	await driver.wait(until.elementLocated(By.className('job-instance')), 10000)
}

/**
 * 
 * @param {WebDriver} driver selenium-webdirver
 * @param {string} status status to be checked e.g ACTIVE, ABEND, etc.
 */
async function testJobInstancesShowsStatus(driver, status){
	await driver.wait(until.elementLocated(By.className('job-instance')));
	const jobs = await driver.findElements(By.className('job-instance'));
	let statusFound = false;
	for(const job of jobs){
		const text = await job.getText();
		if(text.includes(status)){
			statusFound = true;
			break;
		}
	}
	return statusFound;
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 */
async function reloadAndOpenFilterPannel(driver){
	await driver.navigate().refresh();
	await driver.wait(until.elementLocated(By.className('job-instance')), 10000)
	const element = await driver.findElement(By.id('filter-view'));
	await element.click();
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 */
async function waitForAndExtractJobs(driver){
	await driver.sleep(1000);
	await driver.wait(until.elementLocated(By.className('job-instance')),10000)
	const jobs = await driver.findElements(By.className('job-instance'));
	return jobs;
}

/**
 * 
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} statusIdSelection id of status field in status dropdown
 */
async function setStatusFilter(driver, statusIdSelection){
	const statusSelector = await driver.findElement(By.id('filter-status-field'));
	await statusSelector.click();
	const activeStatus = await driver.findElement(By.id(statusIdSelection));
	await activeStatus.click();
	await driver.wait(until.elementIsNotVisible(activeStatus), 10000);
	await driver.sleep(1000); //wait for css transition
}

/**
 * 
 * @param {WebDriver} driver selinium-webdriver
 * @param {string} prefix filter prefix
 */
async function testPrefixFlterFetching(driver, prefix){
	expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
	expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', prefix), 'filter-prefix-field wrong').to.be.true;
	await findAndClickApplyButton(driver);

	const jobs = await waitForAndExtractJobs(driver);
	expect(jobs).to.be.an('array').that.has.lengthOf.at.least(1);
	
	let allMatchFlag = true;
	const searchPrefix = prefix.endsWith('*') ? prefix.substr(0, prefix.length - 1) : prefix;
	for(let job of jobs) {
		const text = await job.getText();
		if (!text.startsWith(searchPrefix)){
			allMatchFlag = false;
		}
	}
	return allMatchFlag;
}

module.exports = {
	getDriver,
	loadPage,
    testElementAppearsXTimes,
    testJobInstancesShowsStatus,
    testTextInputFieldCanBeModified,
    testTextInputFieldValue,
	findAndClickApplyButton,
	reloadAndOpenFilterPannel,
	waitForAndExtractJobs,
	setStatusFilter,
	testPrefixFlterFetching,
}