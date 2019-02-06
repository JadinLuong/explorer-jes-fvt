const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { assert } = require('chai');
const chai = require('chai');
chai.use(require('chai-things'));

const {
    getDriver,
    loadPage,
    findAndClickApplyButton,
    findByCssAndClick,
    testElementAppearsXTimesById,
    testElementAppearsXTimesByCSS,
    testJobInstancesShowsStatus,
    testColourOfStatus,
    testTextInputFieldCanBeModified,
    testTextInputFieldValue,
    reloadAndOpenFilterPannel,
    waitForAndExtractJobs,
    testPrefixFilterFetching,
    testOwnerFilterFetching,
    testStatusFilterFetching,
    testJobFilesLoad,
} = require('./utils');

const {
    USERNAME, PASSWORD, ZOWE_JOB_NAME, SERVER_HOST_NAME, SERVER_HTTPS_PORT,
} = process.env;

describe('JES explorer function verification tests', () => {
    let driver;

    before('Initialise', async () => {
        expect(USERNAME, 'USERNAME is not defined').to.not.be.empty;
        expect(PASSWORD, 'PASSWORD is not defined').to.not.be.empty;
        expect(ZOWE_JOB_NAME, 'ZOWE_JOB_NAME is not defined').to.not.be.empty;
        expect(SERVER_HOST_NAME, 'SERVER_HOST_NAME is not defined').to.not.be.empty;
        expect(SERVER_HTTPS_PORT, 'SERVER_HTTPS_PORT is not defined').to.not.be.empty;

        driver = await getDriver();
        try {
            await loadPage(driver, `https://${SERVER_HOST_NAME}:${SERVER_HTTPS_PORT}/ui/v1/explorer-jes`, USERNAME, PASSWORD);
            // make sure tree and editor have loaded
            await driver.wait(until.elementLocated(By.id('job-list')), 10000);
            await driver.wait(until.elementLocated(By.id('embeddedEditor')), 10000);
            await driver.sleep(5000);
        } catch (e) {
            assert.fail(`Failed to initialise: ${e}`);
        }
    });

    after('Close out', () => {
        if (driver) {
            driver.quit();
        }
    });

    describe('JES explorer home view', () => {
        it('Should handle rendering expected components (Navigator[filters+tree] & File Viewer)');
        it('Should handle resizing of tree component dynamically');
        it('Should handle resizing of editor component dynamically');

        describe('Filter card component behaviour', () => {
            describe('Pre expansion', () => {
                it('Should render filter card (filter-view)', async () => {
                    const filterView = await driver.findElements(By.id('filter-view'));
                    expect(filterView).to.be.an('array').that.has.lengthOf(1);
                });

                it('Should render filter card title', async () => {
                    const cardTitle = await driver.findElements(By.css('#filter-view > div > div > div'));
                    const text = await cardTitle[0].getText();
                    expect(text).to.equal('Job Filters');
                });

                it('Should render filter card expand icon (svg)', async () => {
                    const expandIcon = await driver.findElements(By.css('#filter-view > div > div > button > div > svg'));
                    expect(expandIcon).to.be.an('array').that.has.lengthOf(1);
                });

                it('Should not render filter-form before expansion', async () => {
                    const filterForm = await driver.findElements(By.id('filter-form'));
                    expect(filterForm).to.be.an('array').that.has.lengthOf(0);
                });

                it('Should not render filter-input-fields before expansion', async () => {
                    expect(await testElementAppearsXTimesById(driver, 'filter-owner-field', 0), 'filter-owner-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-prefix-field', 0), 'filter-prefix-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-jobId-field', 0), 'filter-jobId-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-status-field', 0), 'filter-status-field wrong').to.be.true;
                });

                it('Should render filter-form after card click', async () => {
                    await reloadAndOpenFilterPannel(driver);
                    const filterForm = await driver.findElements(By.id('filter-form'));
                    expect(filterForm).to.be.an('array').that.has.lengthOf(1);
                });
            });

            describe('Post expansion', () => {
                beforeEach(async () => {
                    await reloadAndOpenFilterPannel(driver);
                });

                it('Should render filter-input-fields after expansion', async () => {
                    expect(await testElementAppearsXTimesById(driver, 'filter-owner-field', 1), 'filter-owner-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-prefix-field', 1), 'filter-prefix-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-jobId-field', 1), 'filter-jobId-field wrong').to.be.true;
                    expect(await testElementAppearsXTimesById(driver, 'filter-status-field', 1), 'filter-status-field wrong').to.be.true;
                });

                it('Should pre-populate owner field with username', async () => {
                    const ownerField = await driver.findElement(By.id('filter-owner-field'));
                    expect(await ownerField.getAttribute('value')).to.equal(USERNAME);
                });

                it('Should allow input fields to be changed', async () => {
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field'), 'filter-owner-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field'), 'filter-prefix-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-jobId-field'), 'filter-jobId-field wrong').to.be.true;
                });

                it('Should reset filter fields when reset clicked', async () => {
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field'), 'filter-owner-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field'), 'filter-prefix-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-jobId-field'), 'filter-jobId-field wrong').to.be.true;
                    const resetButton = await driver.findElement(By.id('filters-reset-button'));
                    await resetButton.click();
                    expect(await testTextInputFieldValue(driver, 'filter-owner-field', USERNAME), 'filter-owner-field wrong').to.be.true;
                    expect(await testTextInputFieldValue(driver, 'filter-prefix-field', '*'), 'filter-prefix-field wrong').to.be.true;
                    expect(await testTextInputFieldValue(driver, 'filter-jobId-field', '*'), 'filter-jobId-field wrong').to.be.true;
                });

                it('Should handle closing the filter card when clicking apply', async () => {
                    await findAndClickApplyButton(driver);
                    expect(await testElementAppearsXTimesById(driver, 'filter-form', 0)).to.be.true;
                });

                it('Should handle closing the filter card when clicking card header', async () => {
                    const cardHeader = await driver.findElements(By.css('#filter-view > div > div'));
                    await cardHeader[0].click();
                    expect(await testElementAppearsXTimesByCSS(driver, 'filter-form', 0)).to.be.true;
                });
            });
        });

        describe('Tree interaction', () => {
            // TODO:: Implement once we have an ID for refresh icon and loading icon
            it.skip('Should handle reloading jobs when clicking refresh icon');
            describe('Job status labels', () => {
                before(async () => {
                    await reloadAndOpenFilterPannel(driver);
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', '*'), 'filter-prefix-field wrong').to.be.true;
                    expect(await testTextInputFieldCanBeModified(driver, 'filter-jobId-field', '*'), 'filter-jobId-field wrong').to.be.true;
                    await findAndClickApplyButton(driver);
                    await driver.wait(until.elementLocated(By.className('job-instance')), 10000);
                });

                it('Should handle showing jobs as ACTIVE', async () => {
                    expect(await testJobInstancesShowsStatus(driver, 'ACTIVE'), 'show job status: ACTIVE').to.be.true;
                });
                // TODO:: Implement once we have the dive wrapper around ACTIVE jobs
                it.skip('Should handle showing ACTIVE jobs with blue status');

                it('Should handle showing jobs as finished with CC 00', async () => {
                    expect(await testJobInstancesShowsStatus(driver, 'CC 00'), 'show job status: CC 00').to.be.true;
                });
                it('Should handle showing CC 00** jobs with grey status', async () => {
                    const GREY_STATUS = 'rgb(128, 128, 128)';
                    expect(await testColourOfStatus(driver, 'CC 00', GREY_STATUS)).to.be.true;
                });

                it('Should handle showing jobs as in OUTPUT', async () => {
                    expect(await testJobInstancesShowsStatus(driver, 'OUTPUT'), 'show job status: OUTPUT').to.be.true;
                });
                it('Should handle showing OUTPUT jobs with grey status', async () => {
                    const GREY_STATUS = 'rgb(128, 128, 128)';
                    expect(await testColourOfStatus(driver, 'OUTPUT', GREY_STATUS)).to.be.true;
                });

                it('Should handle showing jobs as ABEND', async () => {
                    expect(await testJobInstancesShowsStatus(driver, 'ABEND'), 'show job status: ABEND').to.be.true;
                });
                it('Should handle showing ABEND jobs with red status', async () => {
                    const RED_STATUS = 'rgb(255, 0, 0)';
                    expect(await testColourOfStatus(driver, 'ABEND', RED_STATUS)).to.be.true;
                });

                it('Should handle showing jobs with JCL ERROR', async () => {
                    expect(await testJobInstancesShowsStatus(driver, 'JCL ERROR'), 'show job status: JCL ERROR').to.be.true;
                });
                it('Should handle showing JCL ERROR jobs with red status', async () => {
                    const RED_STATUS = 'rgb(255, 0, 0)';
                    expect(await testColourOfStatus(driver, 'ABEND', RED_STATUS)).to.be.true;
                });
            });
            describe('Job filtering', () => {
                beforeEach(async () => {
                    await reloadAndOpenFilterPannel(driver);
                });

                describe('Prefix Filter', () => {
                    it('Should handle fetching jobs based on full prefix (ZOWE_JOB_NAME)', async () => {
                        expect(await testPrefixFilterFetching(driver, ZOWE_JOB_NAME)).to.be.true;
                    });
                    it('Should handle fetching jobs based on prefix with asterisk (ZOWE*)', async () => {
                        expect(await testPrefixFilterFetching(driver, 'ZOWE*')).to.be.true;
                    });
                    // TODO:: remove skip flag and rework test once we have message in the tree showing no jobs found
                    it.skip('Should handle fetching no jobs based on crazy prefix (1ZZZZZZ1)', async () => {
                        expect(await testPrefixFilterFetching(driver, '1ZZZZZZ1')).to.be.true;
                    });
                });

                describe('Onwer Filter', () => {
                    it('Should handle fetching jobs based on owner filter set to ZOWESVR owner (IZUSVR)', async () => {
                        expect(await testOwnerFilterFetching(driver, 'IZUSVR', ['IZU', 'ZOWE'])).to.be.true;
                    });
                    // TODO:: remove skip flag and rework test once we have message in the tree showing no jobs found
                    it.skip('Should handle fetching no jobs based on crazy owner (1ZZZZZZ1)', async () => {
                        expect(await testOwnerFilterFetching(driver, '1ZZZZZZ1', [])).to.be.true;
                    });
                });

                describe('Status Filter', () => {
                    it('Should handle fetching only ACTIVE jobs', async () => {
                        expect(await testStatusFilterFetching(driver, 'ACTIVE', ['ACTIVE'])).to.be.true;
                    });
                    // TODO:: Can't gurantee we will have jobs in INPUT state so skip until we can
                    it.skip('Should handle fetching only INPUT jobs', async () => {
                        expect(await testStatusFilterFetching(driver, 'INPUT')).to.be.true;
                    });
                    it('Should handle fetching only OUTPUT jobs', async () => {
                        expect(await testStatusFilterFetching(driver, 'OUTPUT', ['ABEND S', 'OUTPUT', 'CC ', 'CANCELED', 'JCL ERROR'])).to.be.true;
                    });
                });

                describe('Error handling', () => {
                    it('Should display warning when owner and prefix are *');
                    it('Should show no jobs found message when no jobs returned');
                });
            });

            describe('Job Files', () => {
                it('Should handle rendering job files when clicking on a job', async () => {
                    expect(await testJobFilesLoad(driver, '*', ZOWE_JOB_NAME, 'status-ACTIVE')).to.be.true;
                });

                it('Should handle rendering multiple jobs files', async () => {
                    expect(await testJobFilesLoad(driver, 'IZUSVR', '*', 'status-ACTIVE')).to.be.true;
                });

                it('Should handle un rendering job files when clicking an already toggle job', async () => {
                    expect(await testJobFilesLoad(driver, '*', ZOWE_JOB_NAME, 'status-ACTIVE')).to.be.true;

                    const jobLink = await driver.findElements(By.css('.job-instance > li > div> .content-link'));
                    expect(jobLink).to.be.an('array').that.has.lengthOf.at.least(1);
                    await jobLink[0].click();

                    const jobFiles = await driver.findElements(By.className('job-file'));
                    expect(jobFiles).to.be.an('array').that.has.lengthOf(0);
                });

                it('Should handle opening a files content when clicked', async () => {
                    expect(await testJobFilesLoad(driver, '*', ZOWE_JOB_NAME, 'status-ACTIVE')).to.be.true;
                    const fileLink = await driver.findElements(By.css('.job-instance > ul > li > .content-link'));
                    expect(fileLink).to.be.an('array').that.has.lengthOf.at.least(1);
                    await fileLink[0].click();
                    const viewer = await driver.findElement(By.css('#embeddedEditor > div > div > .textviewContent'));
                    const text = await viewer.getText();
                    expect(text).to.have.lengthOf.greaterThan(1);
                });

                // TODO:: Implement once we have IDs for refresh vs loading icon
                it.skip('Should handle setting refresh icon to loading icon when job file loading', async () => {
                    expect(await testJobFilesLoad(driver, '*', ZOWE_JOB_NAME, 'status-ACTIVE')).to.be.true;
                    await findByCssAndClick(driver, '#tree-text-content > svg');
                });
                it('Should handle opening a files content unathorised for user and display error message');
            });
            it('Should handle rendering context menu on right click', async () => {
                await reloadAndOpenFilterPannel(driver);
                expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
                expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', ZOWE_JOB_NAME), 'filter-prefix-field wrong').to.be.true;
                await findAndClickApplyButton(driver);

                const jobs = await waitForAndExtractJobs(driver);
                expect(jobs).to.be.an('array').that.has.lengthOf.at.least(1);
                const actions = driver.actions();
                await actions.contextClick(jobs[0]).perform();
                await driver.sleep(1000); // TODO:: replace with driver wait for element to be visible
                const contextMenuEntries = await driver.findElements(By.css('.job-instance > nav > div'));
                const text = await contextMenuEntries[0].getText();
                expect(text).to.equal('Purge Job');
            });
            it('Should handle puring a job');
            it('Should handle closing context menu when clicking elsewhere on screen');
        });
        describe('Editor behaviour', () => {
            it('Should display job name, id and file name in card header');
            it('Should display file contents in Orion text area');
            it('Should highlight JESJCL correctly');
            it('Should be read only');
        });
    });

    describe('JES explorer home view with filters in url query', () => {
        it('Should handle rendering the expected componets when url filter params are specified (same as home)');
        describe('url queries detected and put in filter component', () => {
            it('Should handle setting prefix filter from url querry');
            it('Should handle setting jobID from url query');
            it('Should handle setting status from url query');
            it('Should handle setting owner from url query');
            it('Should handle setting all filters from url query');
            it('Should handle a none recognised query parameter gracefully (still load page)');
        });
        describe('Job fetch', () => {
            it('Should handle fetching jobs based on url queries');
        });
    });
    describe('JES explorer spool file in url query (explorer-jes/#/viewer)', () => {
        it('Should handle rendering expected components with viewer route (File Viewer)');
        it('Should handle fetching file from url query string');
        it('Should render file name, job name and job id in card header');
        it('Should handle rendeing file contents in Orio editor');
    });
});
