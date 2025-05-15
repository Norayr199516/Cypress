/// <reference types="cypress" />
import { And } from "cypress-cucumber-preprocessor/steps";
import fillPage from '../../support/page-objects/fill-page'
import { rxNumber, rxNumbers } from './eScript.js'
import { ndc, quantity } from './add-customer.js'
const initUtils = require('../../support/initUtils')
// var date = initUtils.getTodaysDate('YYYY-MM-DD');
export var filldate
const fillPageObj = new fillPage()
const eScriptPageObj = new eScriptPage()
const commonPageObj = new commonPage()
export var newNdc;
export var otc;
export var lotNumber;


const faker = require('faker')
import { FN, LN } from './add-customer.js'
import eScriptPage from "../../support/page-objects/eScript-Page";
import commonPage from "../../support/page-objects/common-page";

function fillNDC() {
    cy.log(ndc)
    if (ndc == null) {
        fillPageObj.getNDCtextBox().clear().click()
        cy.wait(2000)
        fillPageObj.getNDCtextBox().type('{enter}').then(() => {
            fillPageObj.getNDCtextBox().invoke('prop', 'value').then(($newNdc) => {
                newNdc = ($newNdc.split(" "))[0]
                cy.log(newNdc)
            })
        })

    }
    else {
        fillPageObj.getNDCtextBox().clear().type(ndc)
        cy.wait(2000)
        fillPageObj.getNDCtextBox().type('{enter}')
    }
};

And('@fill I fill rx from json {string} and node {string}', function (json, node) {
    cy.fixture(json).then(data => {
        cy.log(ndc)
        fillNDC()
        if (data[node].fillDateType == "future") {
            cy.getFutureDate().then((date) => {
                fillPageObj.getFillDateBox().click().type(date)
                filldate=date;
            })
        }
        else {
            cy.getPreviousDate().then((date) => {
                fillPageObj.getFillDateBox().click().type(date)
                filldate=date;
            })
    }
       
      cy.get('button').contains(data[node].paymentMode).click()
        if (data[node].paymentMode == "Insurances") {
            cy.get('app-insurance-processing').then(($el) => {
                if ($el.find('[title="Remove from Selected"]').length > 0) {
                    fillPageObj.getInsuranceRemoveIcon().should('be.visible')
                }
                else {
                    fillPageObj.getInsurancePlusIcon().click()
                }
                cy.get('button').contains('PROCESS INSURANCE', { timeout: 3000 }).click()
            })
        }
        else {
            fillPageObj.getCoPayTextBox().clear().type(data[node].copay)
            // fillPageObj.getDeliveryChargeTextBox().clear().type(data[node].deliveryCharges)
        }
        // fillPageObj.getDeliveryAddress().click().type('{downarrow}{enter}')
        //fillPageObj.getDeliveryAddress().select(1)

        fillPageObj.getDeliveryAddress().contains(data[node].address).invoke('index').then((index) => {
            fillPageObj.getDeliveryAddress().select(index)
        })
        cy.get('button:contains("' + data[node].consultation + '")', { timeout: 4000 }).click()
        cy.get('button:contains("' + data[node].paymentType + '")', { timeout: 4000 }).click()
        lotNumber =data[node].lotNumber
        cy.log(lotNumber)
    })
})

And('@fill I enter data in prepare pop-up from json {string} and node {string}', function (json, node) {
    cy.fixture(json).then(data => {
        fillPageObj.getRxBoxInPreparePopUp().type(rxNumber)
        cy.log(ndc)
        if (ndc == null) {
            fillPageObj.getNDCBoxInPreparePopUp().type(newNdc)
            cy.wait(2000)
            fillPageObj.getNDCBoxInPreparePopUp().type('{enter}')
        }
        else {
            fillPageObj.getNDCBoxInPreparePopUp().type(ndc)
            cy.wait(2000)
            fillPageObj.getNDCBoxInPreparePopUp().type('{enter}')
        }
        fillPageObj.getLotNumInPreparePopUp().clear().type(data[node].lotNumber)
        fillPageObj.getExpDateInPreparePopUp().type(data[node].expiryDate)
        if ('quantity' in data[node]) {
            fillPageObj.getFillQtyInPreparePopUp().clear().type(data[node].quantity)
        }
        else {
            fillPageObj.getFillQtyInPreparePopUp().clear().type(quantity)
        }
    })
})

And('@fill I enter data for a New Rx from json {string} and node {string}', function (json, node) {
    cy.fixture(json).then(data => {
        cy.get('button:contains("' + data[node].rxType + '")').click()
        fillPageObj.getPrescriberNameField().type(`${data[node].firstName} ${data[node].lastName}`)
        cy.contains(`${data[node].lastName}, ${data[node].firstName}`).click()
        fillPageObj.getMedicationTextBox().type(data[node].medicationName)
        cy.wait(1500)
        fillPageObj.getMedicationTextBox().type('{enter}')
        fillPageObj.getDirectionBox().type(data[node].direction)
        fillPageObj.getQuantityTextBox().type(data[node].quantity)
        fillPageObj.getDaysSupply().type(data[node].daysSupply)
        cy.get("body").then($body => {
                    if ($body.find('[id="refills"][disabled]').length > 0) {
                        cy.log("Refill is not allowed")

                    }else{
                        fillPageObj.getRefills().type(data[node].refills)
                    }
                })       
        fillPageObj.getWrittenDate().click().type(data[node].dateWritten)
        var OwedQuantity = initUtils.getQuantityOwed(data[node].quantity, data[node].refills)
        fillPageObj.getQuantityOwed().should('have.value', OwedQuantity)
        if('controlledRxId' in data[node]){
            fillPageObj.getControlledRxId().type(data[node].controlledRxId)
        }
    })
})

And('@fill I verify customer flyout opens to approve V1', function () {
    fillPageObj.getCustomerNameField().should('be.visible')
    fillPageObj.getCustomerNameField().should('contain.text', `${LN}, ${FN}`)
})

And('@fill I validate status as {string}', function (status) {
    if (status == 'DONE') {
        for (let i = 0; i < rxNumbers.length; i++) {
            eScriptPageObj.getPrescriptionTableRxNum().should('be.visible')
            eScriptPageObj.getPrescriptionSearch().clear().type(rxNumbers[i])
            cy.get('[title="' + rxNumbers[i] + '"]').click()
            eScriptPageObj.getRxNumberOnFlyout().should('be.visible')
            fillPageObj.getFillStatus(status).should('exist')
            cy.log("Fill " + rxNumbers[i] + " is delivered.")
            commonPageObj.getCloseIcon().scrollIntoView().click()
        }
        cy.log("All fills are delivered.")
    }
    else {
        fillPageObj.getFillStatus(status).should('exist')
    }
})


And('@fill I click on {string} link', function (link) {
    if (link == "IN") {
        fillPageObj.getLink(link).eq(1).should('be.visible').click()
    }
    else {
        fillPageObj.getLink(link).should('be.visible').click()
    }
})

And('@fill I fill split quanity as {string}', function (qty) {
    fillPageObj.getSplitFillQty().click().type(qty)
    fillPageObj.getSplitBtn().click()
    fillPageObj.getSplitQty().should('contain.text', qty)
})


And('@fill I validate {string} option', function (link) {
    cy.wait(1500)
    let printCalled = false
    cy.stub(cy.state('window'), 'print', () => {
        printCalled = true
    })
    cy.get('span:contains("' + link + '")').click().should(() => expect(printCalled).to.eq(true))
})
// And('@fill I add address and delivery time details from json {string} and node {string}', function (json, node) {
//     cy.get('#fillrx-delivery-address').click().type('{downarrow}{enter}')
//     cy.fixture(json).then(data => {
//         cy.xpath('//button[contains(text(),' + data[node].paymentType + ')]').click()
//         cy.xpath('//button[contains(text(),' + data[node].consultation + ')]').click()
//         fillPageObj.getDeliveryDate().should('have.value', date)
//     })
// })

And('@fill I check provider address missing warning from json {string} and node {string}', function (json, node) {
    cy.wait(2000)
    fillNDC()
    cy.fixture(json).then(data => {
        cy.get('button').contains('Self-Pay').click()
        fillPageObj.getCoPayTextBox().clear().type(data[node].copay)
        cy.get('span').contains('FILL RX').click()
        cy.wait(3000)
        fillPageObj.getProviderAddressWarnText().eq(1).should('contain.text', data[node].addressWarningMessage)
        cy.log('Provider address warning message verified')
    })
})

And('@fill I add otc from json {string} and node {string}', function (json, node) {
    cy.fixture(json).then(data => {
        otc = data[node].ndc
        fillPageObj.getOTCndc().type(otc)
        fillPageObj.getMedicationNamefield().should('have.value', data[node].name)
        fillPageObj.getPrice().clear().type(data[node].price)
        fillPageObj.getPackage().clear().type(data[node].packages)
    })
})

And('@fill I add address in fill', function () {
    fillPageObj.getFillDeliveryAddress().select(1)
})

And('@fill I click on process button', function () {
    fillPageObj.getFillProcessBtn().eq(1).click({ force: true })
    cy.wait(10000)
})
And('@fill I charge from fill', function () {
    cy.intercept("POST", "**/v2/user/*/payment").as('payment')
    cy.intercept("GET", "**/v2/standing-order/active-count?*").as('activeCount')
    cy.intercept("POST", '**/qf_event').as('event')
    fillPageObj.getFillChargeButton().click()
    cy.wait('@payment').its('response.statusCode').should('eq', 200)
    cy.wait('@event').its('response.statusCode').should('eq', 200)
    cy.wait('@activeCount').its('response.statusCode').should('eq', 200)

})

And('@fill I refund the amount', function () {
    fillPageObj.getTotalAmount().each(el => {
        var amount = el.text().split("$")[1]
        cy.log(amount)
        fillPageObj.getRefundAmountTextBox().type(amount)
    })
})

And('@fill I verify refund for {string} delivery recieved from json {string} and node {string}', function (type_of_delivery, json, node) {
    eScriptPageObj.getPrescriptionTableRxNum().should('be.visible')
    eScriptPageObj.getPrescriptionSearch().clear().type(rxNumbers[0])
    cy.get('[title="' + rxNumbers[0] + '"]').click()
    eScriptPageObj.getRxNumberOnFlyout().should('be.visible')
    commonPageObj.getBtn("REFUND").should('be.enabled').click()
        cy.fixture(json).then(data => {
            fillPageObj.getRefundAmount().each(el => {
                let refundAmount = el.text().split("$")[1]
                expect(refundAmount).to.be.equal(data[node][type_of_delivery])
                cy.log("Refund Recieved = " + refundAmount)
            })
        })
})

And('@fill I validate success message', function () {
    fillPageObj.getRefundSuccessMsg().should('have.text', "Amount refunded successfully")
})

And('@fill I validate {string} delivery charge from json {string} and node {string} from fill panel', function (type, json, node) {
    fillPageObj.getDeliveryChargeTextBox().invoke('prop', 'value').then((amount) => {
        cy.log(amount)
        cy.fixture(json).then(data => {
            if (type === "No" || type === "threshold") {
                expect(amount).to.be.equal(data[node].noCharge)
            }
            else {
                expect(amount).to.be.equal(data[node][type])
            }
        })
    })
})


And('@fill I select delivery slot time as {string} and {string}', function (start, end) {
    fillPageObj.getStartTime().contains(start).invoke('index').then((index) => {
        fillPageObj.getStartTime().select(index)
    })
    fillPageObj.getEndTime().contains(end).invoke('index').then((index) => {
        fillPageObj.getEndTime().select(index)
    })

})

And('@fill I update refill setting to {string}', function (type) {
    fillPageObj.getRefillSetting().find('option')
        .contains(`${type}`)
        .as('selectOption')
        .then(() => {
            fillPageObj.getRefillSetting().select(`${this.selectOption.text().trim()}`)
        })
})

And('@fill I validate Reject button is disabled', function () {
    cy.wait(1000)
    fillPageObj.getRejectButton().should('be.visible').should('be.disabled')
})

And('@fill I validate allergies from {string} page', function (page) {
    fillPageObj.getAllergy().should('be.visible')
    cy.fixture('commonData').then(data => {
        if (page === "Verification") {
            fillPageObj.getAllergy().parent().next().children().should('have.text', data.customerProfile.allergy)
        }
        else {
            fillPageObj.getAllergy().next().should('have.text', data.customerProfile.allergy)
        }
    })
})

And('@fill I select reject reason as {string} from dropdown',function(reason){
    deleteCoorections()
    fillPageObj.getRejectDueToDropdown().each((el,index)=>{
       let reasonText= el.text()
       if(reasonText===reason){
        fillPageObj.getRejectDueToDropdown().eq(index).scrollIntoView().should('be.visible').click()
       }
    })
})

function deleteCoorections(){
    cy.get("body").then($body => {
       let count= $body.find('[class="search-panel"] table tr,div.correctionsContainer div[class*=row]').length
       cy.log(count)
        if (count>0){
        for(let i=0;i<count;i++){
            fillPageObj.getDeleteIcon().its(i).click()
        }
        cy.get('button:contains("REJECT DUE TO")').click()
    }
    else{
        cy.log('No corrections available')
    }
})
    
}

And ('@fill I validate error message for {string} in fill',function(reason){
    if(reason=="MD clarification"){
       fillPageObj.getMDRejectheaderText().should('have.text',`Needs ${reason}.`)
    }
    else{
        fillPageObj.getRejectedErrorText().should('have.text',`Correction: Rejected due to ${reason}.`)
    }
    })

And('@fill I update rejected medication details for {string} from json {string} and node {string}',function(type,json,node){
   cy.fixture(json).then(data=>{
        fillPageObj.getMedicationTextBox().clear().type(data[node].medicationName)
        cy.wait(1000)
        fillPageObj.getMedicationTextBox().type('{enter}')
        if(type=='fill'){
            fillPageObj.getNDCtextBox().clear().click()
            cy.wait(2000)
            fillPageObj.getNDCtextBox().type('{enter}')
        }
    })
    })

And('@fill I validate correction table reason as {string}',function(reason){
    if(reason=="MD clarification"){
       fillPageObj.getCorrectionlabel().should('have.text','Md Clarification')
        fillPageObj.getMDClarificationReason().should('have.value',`Needs ${reason}.`)
        }
    else{
        fillPageObj.getCorrectionlabel().should('contain.text','Medication')
        fillPageObj.getMedicationRejectionReason().should('have.value',`Rejected due to ${reason}.`)
       }
    })

And('@fill I update cancel fill date',()=>{
    fillPageObj.getCancelFilldate().type(filldate)
   })

And ('@fill I update cancel fill comment and choose type as {string}',(type)=>{
    fillPageObj.getCancelCommentTextArea().invoke('attr','placeholder').should('contain','Write Cancel Fill Note')
    fillPageObj.getCancelCommentTextArea().type("Testing cancel fill for automation")
    fillPageObj.getCancelTypeButton(type).click()
    if(type=="Discard"){
        fillPageObj.getCancelCommentTextArea().last().invoke('attr','placeholder').should('contain','Write reason for discard')
        fillPageObj.getCancelCommentTextArea().last().type("Discard test in automation")
    }
    else{
       cy.log("No need for adding extra comment")
    }
})

And ('@fill I fetch fill date for OTC',()=>{
  fillPageObj.getFillDateBox().invoke('prop', 'value').then($date=>{
    filldate = $date
    cy.log(filldate)
  })
 
})

    And('@fill I add controlled Rx Id', function () {
        cy.fixture('fillData.json').then(data => {
        fillPageObj.getControlledRxId().type(data.C3Fill.controlledRxId)
        })
    })

And ('@fill I verify that extra amount of {string} is charged on the fill',function(chargeAmount){
    fillPageObj.getChargedAmount().should('be.visible')
    fillPageObj.getChargedAmount().should('have.text', chargeAmount)
    fillPageObj.getChargeStatus().should('be.visible')
})
