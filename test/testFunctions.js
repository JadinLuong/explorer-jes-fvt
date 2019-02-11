const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const {
    findAndClickApplyButton,
    waitForAndExtractJobs,
    setStatusFilter,
    reloadAndOpenFilterPannel,
} = require('./utilities');

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} id html id
 * @param {int} count expected occurences
 */
async function testElementAppearsXTimesById(driver, id, count) {
    try {
        const elements = await driver.findElements(By.id(id));
        expect(elements).to.be.an('array').that.has.lengthOf(count);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} id html css path
 * @param {int} count expected occurences
 */
async function testElementAppearsXTimesByCSS(driver, css, count) {
    try {
        const elements = await driver.findElements(By.css(css));
        expect(elements).to.be.an('array').that.has.lengthOf(count);
    } catch (e) {
        return false;
    }
    return true;
}

async function testWindowHeightChangeForcesComponentHeightChange(driver, component, browserOffSet) {
    let allResized = true;
    for (let i = 300; i <= 1000 && allResized; i += 100) {
        await driver.manage().window().setRect({ width: 1600, height: i });
        const contentViewer = await driver.findElement(By.id(component));
        const height = await contentViewer.getCssValue('height');
        const heightInt = parseInt(height.substr(0, height.length - 2), 10);
        if (heightInt + browserOffSet !== i) allResized = false;
    }
    return allResized;
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} id html id
 * @param {string} replaceText optional replace text, defaults to "TEST"
 */
async function testTextInputFieldCanBeModified(driver, id, replaceText = 'TEST') {
    try {
        const element = await driver.findElement(By.id(id));
        await element.clear();
        await element.sendKeys(replaceText);
    } catch (e) {
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
async function testTextInputFieldValue(driver, id, expectedValue) {
    try {
        const element = await driver.findElement(By.id(id));
        expect(await element.getAttribute('value')).to.equal(expectedValue);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 *
 * @param {WebDriver} driver selenium-webdirver
 * @param {string} status status to be checked e.g ACTIVE, ABEND, etc.
 */
async function testJobInstancesShowsStatus(driver, status) {
    await driver.wait(until.elementLocated(By.className('job-instance')));
    const jobs = await driver.findElements(By.className('job-instance'));
    let statusFound = false;
    for (const job of jobs) {
        const text = await job.getText();
        if (text.includes(status)) {
            statusFound = true;
            break;
        }
    }
    return statusFound;
}

/**
 *
 * @param {WebDriver} driver selenium-webdriver
 * @param {string} statusText status to check colour of
 * @param {string} expectedColour rgb color we're expecting e.g 'rgb(128, 128, 128)'
 */
async function testColourOfStatus(driver, statusText, expectedColour) {
    // TODO:: When better classname available to get label change the way we get elements
    await driver.findElements(By.css('.job-instance > li > div > span > span > div'));
    const statuses = await driver.findElements(By.css('.job-instance > li > div > span > span > div'));
    let correctColourFlag = true;
    for (const jobStatus of statuses) {
        const text = await jobStatus.getText();
        if (text.includes(statusText)) {
            const css = await jobStatus.getCssValue('color');
            if (css !== expectedColour) {
                correctColourFlag = false;
            }
        }
    }
    return correctColourFlag;
}

/**
 *
 * @param {WebDriver} driver selinium-webdriver
 * @param {string} prefix filter prefix
 */
async function testPrefixFilterFetching(driver, prefix) {
    await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*');
    await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', prefix);
    await findAndClickApplyButton(driver);

    const jobs = await waitForAndExtractJobs(driver);

    let allMatchFlag = true;
    const searchPrefix = prefix.endsWith('*') ? prefix.substr(0, prefix.length - 1) : prefix;
    for (const job of jobs) {
        const text = await job.getText();
        if (!text.startsWith(searchPrefix)) {
            allMatchFlag = false;
            console.log(`${text} is not expected`);
        }
    }
    return allMatchFlag;
}

/**
 *
 * @param {WebDriver} driver selinium-webdriver
 * @param {string} prefix filter owner
 * @param {Array<String>} potentialJobs job prefixes that could be present in fetch
 */
async function testOwnerFilterFetching(driver, owner, potentialJobs) {
    await testTextInputFieldCanBeModified(driver, 'filter-owner-field', owner);
    await findAndClickApplyButton(driver);

    const jobs = await waitForAndExtractJobs(driver);

    if (potentialJobs.length >= 1) {
        let allMatchFlag = true;
        for (const job of jobs) {
            const text = await job.getText();
            if (!potentialJobs.some(potentialJob => { return text.startsWith(potentialJob); })) {
                allMatchFlag = false;
                console.log(`${text} is not expected status`);
            }
        }
        return allMatchFlag;
    }
    // If we have no potential jobs to match then we're expecting no jobs
    return jobs.length === 0;
}

async function testStatusFilterFetching(driver, status, potentialStatuses) {
    await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*');
    await setStatusFilter(driver, `status-${status}`);
    await findAndClickApplyButton(driver);

    const jobs = await waitForAndExtractJobs(driver);

    let allMatchFlag = true;
    for (const job of jobs) {
        const text = await job.getText();
        if (!potentialStatuses.some(potentialStatus => { return text.includes(potentialStatus); })) {
            allMatchFlag = false;
            console.log(`${text} is not an expected status`);
        }
    }
    return allMatchFlag;
}

async function testJobFilesLoad(driver, ownerFilter, prefixFilter, statusFilter) {
    await reloadAndOpenFilterPannel(driver);
    await testTextInputFieldCanBeModified(driver, 'filter-owner-field', ownerFilter);
    await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', prefixFilter);
    await setStatusFilter(driver, statusFilter);

    await findAndClickApplyButton(driver);
    const jobs = await waitForAndExtractJobs(driver);
    if (jobs.length === 0) return false; // Couldnt find any jobs

    let foundFiles = true;
    for (const job of jobs) {
        await job.click();
        await driver.wait(until.elementLocated(By.className('job-file')));
        const jobFiles = await driver.findElements(By.className('job-file'));
        if (jobFiles.length < 1) foundFiles = false;
    }
    return foundFiles;
}

module.exports = {
    testElementAppearsXTimesById,
    testElementAppearsXTimesByCSS,
    testWindowHeightChangeForcesComponentHeightChange,
    testJobInstancesShowsStatus,
    testColourOfStatus,
    testTextInputFieldCanBeModified,
    testTextInputFieldValue,
    testPrefixFilterFetching,
    testOwnerFilterFetching,
    testStatusFilterFetching,
    testJobFilesLoad,
};
