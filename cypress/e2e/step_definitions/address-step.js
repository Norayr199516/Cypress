import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonPage from '../../support/page-objects/common-page';
import { FN, LN } from "./add-customer";
import { Utility } from "../../support/utility";
import { associateLogin, trigger, ndcInfo, addingStock } from "../api-integration/api-methods";
import { newNdc, lotNumber } from "./fill";

const url = new Utility().getUrl();
const commonPageObj = new commonPage();

Given('I open the website', function () {
  const envi = Cypress.env('ENV');
  cy.log('ENV value is: ' + envi);
  cy.log('Opening URL is: ' + url);
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("https://int.quickfill.dev/");
});

When('I enter Email, Password of {string}', function (userRole) {
  cy.fixture('loginCredentials').then(data => {
    commonPageObj.getuserId().type(data[userRole].email);
    commonPageObj.getpassword().type(data[userRole].password);
    commonPageObj.getLoginBtn().click();
  });
});

And('I enter location as {string}', function (location) {
  cy.get("body").then($body => {
    if ($body.find(".modal-content", { timeout: 10000 }).length > 0) {
      commonPageObj.getSearchLocationfield().type(location);
      commonPageObj.getSearchLocationValue().click();
      commonPageObj.getAddLocationButton().click();
      cy.wait(1000);
    }
  });
});

And('I enter address from json {string} and node {string}', function (json, node) {
  cy.fixture(json).then(data => {
    const address = data[node];
    // Implement how to enter the address based on your page objects
    commonPageObj.getAddressField().type(address.street);
    commonPageObj.getCityField().type(address.city);
    commonPageObj.getStateField().type(address.state);
    commonPageObj.getZipField().type(address.zip);
  });
});

And('I click on {string} icon', function (icon) {
  cy.get('[title="' + icon + '"]', { timeout: 5000 }).click();
});

And('I click on customer tab', function () {
  cy.intercept("GET", "/v2/user/*").as('user');
  cy.get('[title="' + LN + ', ' + FN + '"]', { timeout: 3000 }).click();
  cy.wait('@user').its('response.statusCode').should('eq', 200);
});

And('I click on close icon', function () {
  commonPageObj.getCloseIcon().scrollIntoView().click({ force: true });
});

And('I wait for 3 sec', function () {
  cy.wait(3000);
});

And('I check status of {string} button to be {string}', function (button, status) {
  commonPageObj.getBtn(button).scrollIntoView().should('be.visible');
  if (status === "disabled") {
    commonPageObj.getBtn(button).should('be.disabled');
  } else if (status === "enabled") {
    commonPageObj.getBtn(button).should('be.enabled');
  }
});

And('I search for patient from top searchbar {string}', function (name) {
  cy.wait(1500);
  const searchText = name === '' ? `${FN} ${LN}` : name;
  commonPageObj.getSearchBar().type(searchText, { force: true });
  cy.wait(1500);
  commonPageObj.getSearchBar().type('{downarrow}{enter}', { force: true });
});

And('I verify {string} toast message from json {string}', function (msg, json) {
  cy.fixture(json).then(data => {
    if (msg === "success") {
      commonPageObj.getSuccessToast().should('have.text', data.TaskUpdate);
    } else if (msg === "failure") {
      commonPageObj.getFailureToast().should('have.text', data.UpdateDrugs);
    }
  });
});

And('I {string} from user menu', function (link) {
  commonPageObj.getUserIcon().click();
  commonPageObj.getLink(link).click();
});

And('I change pharmacy location to {string}', function (loc) {
  commonPageObj.getPharmacyLocation().click();
  commonPageObj.getSearchforSwitching().type(loc);
  cy.wait(2000);
  commonPageObj.getSearchforSwitching().type('{downarrow}{enter}');
  commonPageObj.getChangeButton().click();
});

And('I verify {string} button to {string}', function (btn, presence) {
  if (presence === "exist") {
    commonPageObj.getBtn(btn).should('exist');
  } else {
    commonPageObj.getBtn(btn).should('not.exist');
  }
});

And('I trigger {string} job', function (job) {
  commonPageObj.getJob(job).should('be.visible').click();
});

And('I fill delivery date change reason', () => {
  fillPageObj.getDeliveryChangePopupTextarea().type("Want to deliver fill now");
});

And('I trigger refill candidate job', async function () {
  cy.fixture('loginCredentials').then(async (data) => {
    const userLogin = await associateLogin(data.admin.email, data.admin.password);
    expect(userLogin).to.have.property("status", 200);
    const bearerToken = userLogin.data.token;
    const trigger_response = await trigger(bearerToken);
    expect(trigger_response).to.have.property("status", 204);
  });
});

And('I click on span button {string}', function (btn) {
  commonPageObj.getLink(btn).should('be.visible').click();
});

And('I validate Rx number not available in queue', function () {
  commonPageObj.getQueueEmptyText().should('be.visible').should('have.text', "Queue is Empty");
});

And('I add ndc via API', () => {
  const ndc = newNdc.replace(/-/g, "");
  cy.fixture('loginCredentials').then(async (data) => {
    const userLogin = await associateLogin(data.admin.email, data.admin.password);
    expect(userLogin).to.have.property("status", 200);
    const bearerToken = userLogin.data.token;
    const ndcInfoRes = await ndcInfo(bearerToken, ndc);
    expect(ndcInfoRes).to.have.property("status", 200);
    const medId = ndcInfoRes.data.medication[0].medid;
    const addedStockRes = await addingStock(bearerToken, ndc, medId, lotNumber);
    expect(addedStockRes).to.have.property("status", 201);
  });
});
