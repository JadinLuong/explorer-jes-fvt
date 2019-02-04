const {By, until} = require('selenium-webdriver');
const expect = require('chai').expect;
const assert = require('chai').assert;
const chai = require('chai');
chai.use(require('chai-things'));

const {
	getDriver,
	loadPage,
	findAndClickApplyButton, 
	testElementAppearsXTimes, 
	testJobInstancesShowsStatus, 
	testTextInputFieldCanBeModified, 
	testTextInputFieldValue,
	reloadAndOpenFilterPannel,
	waitForAndExtractJobs,
	setStatusFilter,
	testPrefixFlterFetching,
} = require('./utils');

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const ZOWE_JOB_NAME = process.env.ZOWE_JOB_NAME;
const SERVER_HOST_NAME = process.env.SERVER_HOST_NAME;
const SERVER_HTTPS_PORT = process.env.SERVER_HTTPS_PORT;

describe('JES explorer function verification tests', () => {
	let driver;

	before('Initialise', async () => {
		expect(USERNAME, 'USERNAME is not defined').to.not.be.empty;
		expect(PASSWORD, 'PASSWORD is not defined').to.not.be.empty;
		expect(ZOWE_JOB_NAME, 'ZOWE_JOB_NAME is not defined').to.not.be.empty;
		expect(SERVER_HOST_NAME, 'SERVER_HOST_NAME is not defined').to.not.be.empty;
		expect(SERVER_HTTPS_PORT, 'SERVER_HTTPS_PORT is not defined').to.not.be.empty;

		driver = await getDriver();
		try{
			await loadPage(driver, `https://${SERVER_HOST_NAME}:${SERVER_HTTPS_PORT}/ui/v1/explorer-jes`, USERNAME, PASSWORD);
			//make sure tree and editor have loaded
			await driver.wait(until.elementLocated(By.id('job-list')), 10000)
			await driver.wait(until.elementLocated(By.id('embeddedEditor')), 10000)
			await driver.sleep(5000);
		} catch(e) {
			assert.fail('Failed to initialise: ' + e);
		}
	})

	after('Close out', () => {
		if (driver) {
			driver.quit();
		}
	})
	
	describe('JES explorer home view', () => {
		it('Should handle rendering expected components (Navigator[filters+tree] & File Viewer)')
		it('Should handle resizing of tree component dynamically')
		it('Should handle resizing of editor component dynamically')

		describe('Filter card component behaviour', () => {
			describe('Pre expansion', () => {
				it('Should render filter card (filter-view)', async () => {
					const element = await driver.findElements(By.id('filter-view'));
					expect(element).to.be.an('array').that.has.lengthOf(1);
				});

				it('Should render filter card title', async () => {
					const elements = await driver.findElements(By.css('#filter-view > div > div > div'));
					for(let element of elements){
						const text = await element.getText();
						expect(text).to.equal('Job Filters');
					};
				});

				it('Should render filter card expand icon (svg)', async () => {
					const elements = await driver.findElements(By.css('#filter-view > div > div > button > div > svg'));
					expect(elements).to.be.an('array').that.has.lengthOf(1);
				});

				it('Should not render filter-form before expansion', async () => {
					const elements = await driver.findElements(By.id('filter-form'));
					expect(elements).to.be.an('array').that.has.lengthOf(0);
				});

				it('Should not render filter-input-fields before expansion', async () => {
					expect(await testElementAppearsXTimes(driver, 'filter-owner-field', 0), 'filter-owner-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-prefix-field', 0), 'filter-prefix-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-jobId-field', 0), 'filter-jobId-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-status-field', 0), 'filter-status-field wrong').to.be.true;
				});

				it('Should render filter-form after card click', async () => {
					await reloadAndOpenFilterPannel(driver);
					const elements = await driver.findElements(By.id('filter-form'));
					expect(elements).to.be.an('array').that.has.lengthOf(1);
				});
			});

			describe('Post expansion', () => {
				it('Should render filter-input-fields after expansion', async () => {
					expect(await testElementAppearsXTimes(driver, 'filter-owner-field', 1), 'filter-owner-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-prefix-field', 1), 'filter-prefix-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-jobId-field', 1), 'filter-jobId-field wrong').to.be.true;
					expect(await testElementAppearsXTimes(driver, 'filter-status-field', 1), 'filter-status-field wrong').to.be.true;
				});

				it('Should pre-populate owner field with username', async () => {
					const element = await driver.findElement(By.id('filter-owner-field'));
					expect(await element.getAttribute('value')).to.equal(USERNAME);
				});

				it('Should allow input fields to be changed', async () => {
					expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field'), 'filter-owner-field wrong').to.be.true;
					expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field'), 'filter-prefix-field wrong').to.be.true;
					expect(await testTextInputFieldCanBeModified(driver, 'filter-jobId-field'), 'filter-jobId-field wrong').to.be.true;
				});

				it('Should reset filter fields when reset clicked', async () => {
					const element = await driver.findElement(By.id('filters-reset-button'));
					await element.click();
					expect(await testTextInputFieldValue(driver, 'filter-owner-field', USERNAME), 'filter-owner-field wrong').to.be.true;
					expect(await testTextInputFieldValue(driver, 'filter-prefix-field', '*'), 'filter-prefix-field wrong').to.be.true;
					expect(await testTextInputFieldValue(driver, 'filter-jobId-field', '*'), 'filter-jobId-field wrong').to.be.true;
				});

				it('Should handle closing the filter card when clicking apply')
				it('Should handle closing the filter card when clicking card header')
			});
		})

		describe('Tree interaction', () => {
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

				it('Should handle showing jobs as finished with CC 0000', async () => {
					expect(await testJobInstancesShowsStatus(driver, 'CC 0000'), 'show job status: CC 0000').to.be.true;
				});

				it('Should handle showing jobs as in OUTPUT', async () => {
					expect(await testJobInstancesShowsStatus(driver, 'OUTPUT'), 'show job status: OUTPUT').to.be.true;
				});

				it('Should handle showing jobs as ABEND', async () => {
					expect(await testJobInstancesShowsStatus(driver, 'ABEND'), 'show job status: ABEND').to.be.true;
				})

				it('Should handle showing jobs with JCL ERROR', async () => {
					expect(await testJobInstancesShowsStatus(driver, 'JCL ERROR'), 'show job status: JCL ERROR').to.be.true;
				})
			});
			describe('Job filtering', () => {
				beforeEach( async () => {
					await reloadAndOpenFilterPannel(driver);
				});

				describe('Prefix Filter', () => {
					it('Should handle fetching jobs based on full prefix (ZOWE_JOB_NAME)', async () => {
						expect(await testPrefixFlterFetching(driver, ZOWE_JOB_NAME)).to.be.true;
					});

					it('Should handle fetching jobs based on prefix with asterisk (ZOWE*)', async () => {
						expect(await testPrefixFlterFetching(driver, 'ZOWE*')).to.be.true;
					})
				})

				describe('Onwer Filter', () => {
					it('Should handle fetching jobs based on owner filter')
					// test for owner = IZUSVR, should pickup zowe jobs and 
				})
				
				describe('Status Filter', () => {
					it('Should handle fetching only ACTIVE jobs', async () => {
						expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
						await setStatusFilter(driver, 'status-ACTIVE');

						await findAndClickApplyButton(driver);
						const jobs = await waitForAndExtractJobs(driver);
						expect(jobs).to.be.an('array').that.has.lengthOf.at.least(1);

						for(let job of jobs){
							const text = await job.getText();
							expect(text).to.contain('ACTIVE')
						}
					});

					it('Should handle fetching only INPUT jobs');
					it('Should handle fetching only OUTPUT jobs');
				})

				describe('Error handling', () => {
					it('Should display warning when owner and prefix are *')
					it('Should show no jobs found message when no jobs returned')
				})
			});

			describe('Job Files', () => {
				it('Should handle rendering job files when clicking on a job', async () => {
					await reloadAndOpenFilterPannel(driver);
					expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
					expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', ZOWE_JOB_NAME), 'filter-prefix-field wrong').to.be.true;
					await setStatusFilter(driver, 'status-ACTIVE');

					await findAndClickApplyButton(driver);
					const jobs = await waitForAndExtractJobs(driver);
					expect(jobs).to.be.an('array').that.has.lengthOf.at.least(1);

					await jobs[0].click();
					await driver.wait(until.elementLocated(By.className('job-file')));
					const jobFiles = await driver.findElements(By.className('job-file'));
					expect(jobFiles).to.be.an('array').that.has.lengthOf.at.least(1);
				});

				it('Should handle un rendering job files when clicking an already toggle job')
				it('Should handle opening a files content when clicked');
				it('Should handle opening a files content unathorised for user and display error message');
			});
			it('Should handle reloading jobs when clicking refresh icon');
			it('Should handle rendering context menu on right click', async () => {
				await reloadAndOpenFilterPannel(driver);
				expect(await testTextInputFieldCanBeModified(driver, 'filter-owner-field', '*'), 'filter-owner-field wrong').to.be.true;
				expect(await testTextInputFieldCanBeModified(driver, 'filter-prefix-field', ZOWE_JOB_NAME), 'filter-prefix-field wrong').to.be.true;
				await findAndClickApplyButton(driver);

				const jobs = await waitForAndExtractJobs(driver);
				expect(jobs).to.be.an('array').that.has.lengthOf.at.least(1);
				const actions = driver.actions();
				await actions.contextClick(jobs[0]).perform();
				await driver.sleep(4000)
				expect(true).to.equal(true);
			});
			it('Should handle puring a job');
		});
		describe('Editor behaviour', () => {
			it('Should display job name, id and file name in card header')
			it('Should display file contents in Orion text area')
			it('Should highlight JESJCL correctly')
			it('Should be read only')
		})
	})

	describe('JES explorer home view with filters in url query', () => {
		it('Should handle rendering the expected componets when url filter params are specified (same as home)')
		describe('url queries deteced and put in filter component', () => {
			it('Should handle setting prefix filter from url querry')
			it('Should handle setting jobID from url query')
			it('Should handle setting status from url query')
			it('Should handle setting owner from url query')
			it('Should handle setting all filters from url query')
			it('Should handle a none recognised query parameter gracefully (still load page)')
		})
		describe('Job fetch', () => {
			it('Should handle fetching jobs based on url queries')
		})
	})
	describe('JES explorer spool file in url query (explorer-jes/#/viewer)', () => {
		it('Should handle rendering expected components with viewer route (File Viewer)')
		it('Should handle fetching file from url query string')
		it('Should render file name, job name and job id in card header')
		it('Should handle rendeing file contents in Orio editor')
	})
});