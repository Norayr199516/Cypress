/// <reference types="cypress" />
import { And } from "cypress-cucumber-preprocessor/steps";
import addCustomerPage from '../../support/page-objects/add-customer-page'
import commonPage from '../../support/page-objects/common-page'
import taskPage from '../../support/page-objects/task-page'
import customerPanelPage from '../../support/page-objects/customer-panel-page'
import { sendEScript } from '../api-integration/api-methods'
const faker = require('faker')
const initUtils = require('../../support/initUtils')
var dateForEScript = initUtils.getTodaysDate('YYYY-MM-DD');
const randomMessageID = initUtils.getRandomNumber(33);
const addCustomer = new addCustomerPage()
const commonPageObj = new commonPage()
const Task = new taskPage()
const customerPanel = new customerPanelPage();
export var FN
export var LN
export var email
var contactNumber;
var identificationNumber;
export var quantity;
export var ndc = null;
beforeEach(() => {
    if (Cypress.env('customer')) {
        FN = Cypress.env('customer').split(' ')[0]
        LN = Cypress.env('customer').split(' ')[1]
    }
})

function getRandomMobileNumber() {
    var number = '9'.concat(Math.random().toString().slice(2, 11));
    return number;
}
function getRandomNumber(number) {
    var number = Math.random().toString().slice(2, 2 + (number - 1));
    return number;
};

And('@add-customer I click on {string}', function (link) {
    if (link == "add customer") {
        addCustomer.getCustomerbutton().click()
    }
    else if (link == "Task") {
        addCustomer.getTaskbutton().click()
    }

})

And('@add-customer I enter customer details from json {string} and node {string}', function (json, node) {
    contactNumber = getRandomMobileNumber()
    FN = faker.name.firstName()
    LN = faker.name.lastName()
    cy.log('first name ' + FN + '  Last Name  ' + LN)
    cy.fixture(json).then(data => {
        contactNumber = getRandomMobileNumber()
        addCustomer.getFirstnametextbox().type(FN)
        addCustomer.getLastnametextbox().type(LN)
        addCustomer.getSpeciesdropdown().contains('Human')
        addCustomer.getDateofbirthdatefield().type(data[node].dob)
        if (data[node].gender === 'M') {
            addCustomer.getMalebutton().eq(0).click()
            addCustomer.getMalebutton().eq(1).invoke('attr', 'class').should('contain', 'activeBtn')
        }
        else {
            addCustomer.getFemalebutton().eq(0).click()
            addCustomer.getFemalebutton().eq(1).invoke('attr', 'class').should('contain', 'activeBtn')
        }
        addCustomer.getContacttextbox().type(contactNumber)
    })
})

And('@add-customer I add identification as {string}', function (identification) {
    identificationNumber = getRandomNumber(5)
    addCustomer.getAddidentification().click()
    addCustomer.getSelectidentification().select(identification).blur()
    addCustomer.getIdentificationid().type(identificationNumber)
})

And('@add-customer I select Language choice as {string}', function (lan) {
    addCustomer.getLanguageChoice().select(lan).blur()
})

And('@add-customer I select communication choice as {string}', function (communication) {
    addCustomer.getCommunicationChoice().select(communication).blur()
})

function addAddress(json, node) {
    cy.fixture(json).then(data => {
        addCustomer.getCustomerProfileAddressLink().click()

        if (data[node].type == "customer") {
            addCustomer.getAddressLabel().clear().type(data[node].label)
            addCustomer.getAddressSearchBox().clear().type(data[node].address)
            cy.wait(2000)
            addCustomer.getAddressSearchBox().type('{downarrow}{enter}')
            addCustomer.getAddressDeliveryInstruction().clear().type(data[node].deliveryInstruction)
        }
        else if (data[node].type == "provider") {
            addCustomer.getProviderRadioBtn().click()
            addCustomer.getProviderSearchBox().clear().type(data[node].name)
            cy.wait(1000)
            addCustomer.getProviderSearchBox().type('{enter}')

        }
        addCustomer.getAddressLabel().click()
        cy.wait(1000)
        addCustomer.getAddressSaveBtn().click()
        //addCustomer.getAddressCard().should('be.visible')
    })
}


And('@add-customer I enter address from json {string} and node {string}', function (json, node) {
    var flag=false;
    addCustomer.getCustomerProfileAddressLink().scrollIntoView()
    cy.fixture(json).then(data => {
        cy.get("body").then($body => {
            cy.wait(2000)
            if ($body.find('[ng-reflect-klass="addressText"] span').length > 0) {
                cy.get('[ng-reflect-klass="addressText"] span').each(($el) => {
                    var address = $el.text()
                    if (address.includes(data[node].address)) {
                        cy.log("Address already added")
                       flag = "true"
                        //cy.log(flag)
                    }
                }).then(() => {
                    if (flag == "false") {
                        cy.log('I have come to this If with false value')
                        addAddress(json, node)
                        cy.wait(2000)
                        cy.get("body").then($body => {
                            if ($body.find('.modal-body').length > 0) {
                                commonPageObj.getBtn("NO (Esc)").should('be.enabled').click()
                            }
                        })
                    }
                    else {
                            cy.log("Address is already added")
                        }
                    })
            }
            else {
                cy.log("Address is not added")
                addAddress(json, node)
                cy.wait(2000)
                cy.get("body").then($body => {
                    if ($body.find('.modal-body').length > 0) {
                        commonPageObj.getBtn("NO (Esc)").should('be.enabled').click()
                    }
                })
            }
        })
    })
})


And('@add-customer I click on {string} submit', function (link) {
    if (link == "Add Customer") {
        addCustomer.getAddCustomerBtn().click()
    }
})

And('@add-customer I send eScript from json {string} and node {string}', function (json, node) {
    cy.log('entered method')
    cy.fixture(json).then(async function (data) {
        cy.log("entered block")
        quantity = data[node].quantity.split(' ')[0]
        ndc = data[node].NDC
        var refills = data[node].refills.split(' ')[0]
        //  var effectiveDate= data[node].EffectiveDate Diagnosis
        var xmlbody1 = `<?xml version="1.0"?><Message xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" DatatypesVersion="20170715" TransportVersion="20170715" TransactionDomain="SCRIPT" TransactionVersion="20170715" StructuresVersion="20170715" ECLVersion="20170715"><Header><To Qualifier="P">5656559</To><From Qualifier="D">9258399725001</From><MessageID>${randomMessageID}</MessageID><SentTime>${dateForEScript}T06:20:35.5304856Z</SentTime><SenderSoftware><SenderSoftwareDeveloper>Surescripts</SenderSoftwareDeveloper><SenderSoftwareProduct>ErxMessageManager</SenderSoftwareProduct><SenderSoftwareVersionRelease>1.15.0</SenderSoftwareVersionRelease></SenderSoftware><PrescriberOrderNumber>${data.prescriberData.prescriberOrder}</PrescriberOrderNumber><DigitalSignature Version="1.1"><DigitalSignatureIndicator>true</DigitalSignatureIndicator></DigitalSignature></Header><Body><NewRx><Patient><HumanPatient><Name><LastName>${LN}</LastName><FirstName>${FN}</FirstName><MiddleName>P.</MiddleName></Name><Gender>M</Gender><DateOfBirth><Date>${data.customerProfile.dob}</Date></DateOfBirth><Address><AddressLine1>125 Blue Jay Ln</AddressLine1><City>Pittsville</City><StateProvince>VA</StateProvince><PostalCode>94041</PostalCode><CountryCode>US</CountryCode></Address><CommunicationNumbers><PrimaryTelephone><Number>3018620035</Number></PrimaryTelephone></CommunicationNumbers></HumanPatient></Patient><Pharmacy><Identification><NCPDPID>5656559</NCPDPID><StateLicenseNumber>PHY53836</StateLicenseNumber><NPI>1306213384</NPI></Identification><BusinessName>NowRx MtnV</BusinessName><Address><AddressLine1>2224 Old Middlefield Way</AddressLine1><AddressLine2>Suite J</AddressLine2><City>Mountain View</City><StateProvince>CA</StateProvince><PostalCode>94043</PostalCode><CountryCode>US</CountryCode></Address><CommunicationNumbers><PrimaryTelephone><Number>6503865761</Number></PrimaryTelephone><Fax><Number>6509633204</Number></Fax></CommunicationNumbers></Pharmacy><Prescriber><NonVeterinarian><Identification><StateLicenseNumber>34343443</StateLicenseNumber><DEANumber>BL8426529</DEANumber><NPI>1679524268</NPI><Data2000WaiverID>XL8426529</Data2000WaiverID></Identification><Name><LastName>${data.prescriberData.prescriberlastName}</LastName><FirstName>${data.prescriberData.prescriberFirstName}</FirstName><MiddleName>Danielle</MiddleName></Name><Address><AddressLine1>305 E 99th St</AddressLine1><City>Jeffersonville</City><StateProvince>IN</StateProvince><PostalCode>471306016</PostalCode><CountryCode>US</CountryCode></Address><CommunicationNumbers><PrimaryTelephone><Number>8122832949</Number></PrimaryTelephone><Fax><Number>1122116595</Number></Fax></CommunicationNumbers></NonVeterinarian></Prescriber><MedicationPrescribed><DrugDescription>${data[node].medication}</DrugDescription><DrugCoded><ProductCode><Code>${ndc}</Code><Qualifier>ND</Qualifier></ProductCode><Strength><StrengthValue>6.25</StrengthValue><StrengthUnitOfMeasure><Code>C28253</Code></StrengthUnitOfMeasure></Strength><DrugDBCode><Code>854896</Code><Qualifier>SBD</Qualifier></DrugDBCode><DEASchedule><Code>C48677</Code></DEASchedule></DrugCoded><Quantity><Value>${quantity}</Value><CodeListQualifier>38</CodeListQualifier><QuantityUnitOfMeasure><Code>C48542</Code></QuantityUnitOfMeasure></Quantity><DaysSupply>${data[node].daysSupply}</DaysSupply><WrittenDate><DateTime>2022-05-26T06:19:46.463565Z</DateTime></WrittenDate><Substitutions>0</Substitutions><NumberOfRefills>${refills}</NumberOfRefills><Diagnosis><ClinicalInformationQualifier>2</ClinicalInformationQualifier><Primary><Code>F5109</Code><Qualifier>ABF</Qualifier><Description>Other insomnia not due to a substance or known physiological condition</Description></Primary></Diagnosis><Sig><SigText>Take 1 tablet orally per day before bedtime for 30 days</SigText><CodeSystem><SNOMEDVersion>20170131</SNOMEDVersion><FMTVersion>16.03d</FMTVersion></CodeSystem><Instruction><DoseAdministration><DoseDeliveryMethod><Text>Take</Text><Qualifier>SNOMED</Qualifier><Code>419652001</Code></DoseDeliveryMethod><Dosage><DoseQuantity>1</DoseQuantity><DoseUnitOfMeasure><Text>tablet</Text><Qualifier>DoseUnitOfMeasure</Qualifier><Code>C48542</Code></DoseUnitOfMeasure></Dosage><RouteOfAdministration><Text>oral route</Text><Qualifier>SNOMED</Qualifier><Code>26643006</Code></RouteOfAdministration></DoseAdministration><TimingAndDuration><AdministrationTiming><AdministrationTimingModifier><Text>before</Text><Qualifier>SNOMED</Qualifier><Code>288556008</Code></AdministrationTimingModifier><AdministrationTimingEvent><Text>bedtime</Text><Qualifier>SNOMED</Qualifier><Code>21029003</Code></AdministrationTimingEvent></AdministrationTiming></TimingAndDuration><TimingAndDuration><Frequency><FrequencyNumericValue>1</FrequencyNumericValue><FrequencyUnits><Text>day</Text><Qualifier>SNOMED</Qualifier><Code>258703001</Code></FrequencyUnits></Frequency></TimingAndDuration><TimingAndDuration><Duration><DurationNumericValue>30</DurationNumericValue><DurationText><Text>day</Text><Qualifier>SNOMED</Qualifier><Code>258703001</Code></DurationText></Duration></TimingAndDuration></Instruction></Sig><OtherMedicationDate><OtherMedicationDate><Date>2022-05-25</Date></OtherMedicationDate><OtherMedicationDateQualifier>EffectiveDate</OtherMedicationDateQualifier></OtherMedicationDate></MedicationPrescribed><ProhibitRenewalRequest>true</ProhibitRenewalRequest></NewRx></Body></Message>`
        cy.log(xmlbody1)
        const response = await sendEScript(xmlbody1)
        expect(response).to.have.property("status", 200)
        cy.log('eScript sent via API')
    })
})

And('@add-customer I verify email for new added customer from json {string} and node {string}', (json, node) => {
    cy.fixture(json).then(data => {
        email = `${FN}.${LN}${data[node].emailDomain}`
        if(email.includes("'")){
         email = email.replace("'","")
        }
        addCustomer.getEmailtextbox().should('have.value', `support.${contactNumber}@nowrx.com`)
        addCustomer.getEmailtextbox().clear().type(`${data[node].invalidEmail}`)
        cy.get('body').click()
        addCustomer.getEmailError().should('have.text', "Email is invalid.")

        addCustomer.getEmailtextbox().clear().type(email)
    })

})

// And('@add-customer I validate customer details from json {string} and node {string} in customer tab', (json, node) => {
//     addCustomer.getCustomerName().should('be.visible')
//     addCustomer.getCustomerName().should('have.text',` ${LN}, ${FN} `)
//     addCustomer.getProfilePhonenumberField().should('have.text',` ${contactNumber} `)
//     cy.fixture(json).then(data=>{
//         addCustomer.getProfileEmail().should('have.text',`${FN}.${LN}${data[node].emailDomain}`)
// })
// })

And('@add-customer I add family member for customer from json {string} and node {string} in customer tab', (json, node) => {
    addCustomer.getFamilyMemberIcon().click()
    cy.fixture(json).then(data => {
        addCustomer.getFirstnametextbox().eq(0).type(data[node].firstName)
        addCustomer.getLastnametextbox().eq(0).type(data[node].lastName)
        addCustomer.getSpeciesdropdown().contains('Human')
        addCustomer.getDateofbirthdatefield().type(data[node].dob)
        if (data[node].gender === 'M') {
            addCustomer.getMalebutton().eq(0).click()
            addCustomer.getMalebutton().eq(1).invoke('attr', 'class').should('contain', 'activeBtn')
        }
        else {
            addCustomer.getFemalebutton().eq(0).click()
            addCustomer.getFemalebutton().eq(1).invoke('attr', 'class').should('contain', 'activeBtn')
        }
        addCustomer.getContacttextbox().type(contactNumber)
    })
})

And('@add-customer I verify customer is added', function () {
    addCustomer.getCustomerName().should('be.visible')
})

And('@add-customer Add Health Information from json {string} and node {string}', function (json, node) {
    addCustomer.getHealthAlleryLabel().should('have.text', "Allergies - ")
    addCustomer.getAllergyValue().should('have.text', "NA")
    addCustomer.getHealthConditionLabel().should('have.text', "Conditions - ")
    addCustomer.getConditionValue().should('have.text', "NA")
    addCustomer.getEditIcon().eq(0).click()
    cy.fixture(json).then(data => {
        addCustomer.getAllergyTextBox().eq(0).type(data[node].allergy)
        cy.wait(1000)
        addCustomer.getAllergyTextBox().eq(0).type('{enter}')
        cy.wait(1000)
        addCustomer.getConditionTextBox().type(data[node].condition)
    })
})

And('@add-customer Add card details from json {string} and node {string}', function (json, node) {
    addCustomer.getAddCardlink().scrollIntoView()
    cy.get("body").then($body => {
        cy.wait(2000)
        if ($body.find('[class="cardBg p-2"]').length > 0) {
            cy.log("Card is already added")
        }
        else {
            addCustomer.getAddCardlink().click()
            addCustomer.getFirstnametextbox().should('have.value', FN)
            addCustomer.getLastnametextbox().should('have.value', LN)
            cy.wait(2000)
            cy.fixture(json).then(data => {
                addCustomer.getAddCardTextBox().its('0.contentDocument.body')
                    .should('be.visible')
                    .then(cy.wrap).click().type(data[node].cardNumber)
            })
            addCustomer.getSetPrefferedBox().should('be.visible').click()
            cy.get('button:contains("SAVE")').click()
        }
    })
})

And('@add-customer Add Insurance details', function () {
    cy.contains('ADD INSURANCE').click()
    cy.get('span:contains("+ Provider")').click()
    addCustomer.getInsurancePayer().type(FN)
    addCustomer.getBinField().type(initUtils.getRandomNumber(6))
    addCustomer.getPcnField().type(initUtils.getRandomNumber(8))
    cy.contains('SAVE').click()
    addCustomer.getCardHolderId().type(initUtils.getRandomNumber(8))
    addCustomer.getGroupId().type(initUtils.getRandomNumber(8))
        .type(initUtils.getRandomNumber(3))
})


And('@add-customer I click on {string} checkbox', function (ele) {
    // commonPageObj.getBtn(btn).scrollIntoView().should('be.enabled').click()
    cy.get('[id="' + ele + '"]', { timeout: 3000 }).scrollIntoView().check()
})


And('@add-customer Address should be {string}', function (status) {

    if (status == "editable") {
        addCustomer.getAddressSearchBox().clear().type("1421 Ave A, San Jose, CA 95127")
        cy.wait(2000)
        addCustomer.getAddressSearchBox().type('{downarrow}{enter}')
        cy.wait(1500)
        addCustomer.getAddressSaveBtn().should('be.enabled').click()
        cy.get('span:contains("1421 Ave A, San Jose, CA 95127")').should('be.visible')
    } else {
        addCustomer.getEditAddressDisabled().should('be.visible')
        addCustomer.getAddressDeliveryInstruction().type('updated address')
        addCustomer.getAddressSaveBtn().click()
        cy.wait(1000)
        cy.get('modal-body').should('be.visible')
        cy.realPress('F12')
    }

})

And('@add-customer I click on Edit address on customer panel', function () {
    addCustomer.getEditAddress().click()
})

// And ('@add-customer I click on {string} link',function(link){
//     cy.wait(2000)

// })

And('@add-customer I add {string} address from customer profile page from json {string} and node {string}', function (type, json, node) {
    cy.wait(2000)
    addCustomer.getCustomerProfileAddressLink().click()
    cy.fixture(json).then(data => {
        if (type === "provider") {
            addCustomer.getProviderRadioBtn().click()
            addCustomer.getProviderSearchBox().eq(1).type(data[node].name)
            cy.wait(1000)
            addCustomer.getProviderSearchBox().eq(1).type('{enter}')
        }
        else {
            addCustomer.getAddressLabel().clear().type(data[node].extendedLabel)
            addCustomer.getAddressSearchBox().clear().type(data[node].extendedAddress)
            cy.wait(2000)
            addCustomer.getAddressSearchBox().type('{downarrow}{enter}')

        }
        addCustomer.getAddressDeliveryInstruction().clear().type(data[node].deliveryInstruction)
        addCustomer.getAddressSaveBtn().click()
        cy.wait(2000)
    })
})


And('@add-customer I validate enteries in fields for address from json {string} and node {string}', function (json, node) {
    cy.fixture(json).then(data => {
        addCustomer.getAddressLabel().should('have.value', data[node].label)
        addCustomer.getAddressSearchBox().should('have.value', data[node].address)
        addCustomer.getAddressDeliveryInstruction().should('have.value', data[node].deliveryInstruction)
        addCustomer.getAddressSaveBtn().click()
    })
})

And('@add-customer I add new task for associate', function () {
    //Task.getLocationBox().should('have.text', 'Irvn')
    Task.getTaskType().select('NEW PRESCRIPTION')
    Task.getCustomerSearch().next().type(`${FN} ${LN}`)
    cy.wait(2000)
    // cy.get('label:contains("Customer Name")').next().type('arunima')
    Task.getCustomerSearch().next().type('{enter}')
    Task.getAssociateSearch().type('Test Automation')
    cy.wait(2000)
    Task.getAssociateSearch().type('{downarrow}{enter}')
    // Task.getDueDateBox().invoke('attr', 'placeholder').should('contain','dd-mm-yyyy')
    Task.getTodayLink().click()
    // Task.getDueDateBox().should('have.value', dateForEScript)
    Task.getStatusBox().select('DUE')
    Task.getTaskNotes().next().type('Testing Task feature')
})

And('@add-customer I search customer to merge', function () {
    addCustomer.getMergeCustomerSearch().type(email)
    cy.wait(1500)
    addCustomer.getMergeCustomerSearch().type('{downarrow}{enter}')
})


And('@add-customer I validate merged customer should not be searchable', function () {
    commonPageObj.getSearchBar().type(email)
    cy.get('span:contains("No Matching record found")', { timeout: 4000 }).should('be.visible')
})

And('@add-customer I validate merged customer address', function (datatable) {
    cy.wait(3000)
    datatable.hashes().forEach(async (element, index) => {
        let json = element.Json
        let node = element.Node
        cy.fixture(json).then(data => {
            addCustomer.getSavedAddress().find(' span').then(($el) => {
                const text = $el.eq(index).text().trim()
                expect(text).to.equal(data[node].address)
            })
        })
    })
})


And('@add-customer I validate merged customer prescription', function (datatable) {
    datatable.hashes().forEach(async (element, index) => {
        let json = element.Json
        let node = element.Node
        cy.fixture(json).then(data => {
            addCustomer.getMergedCustPrescription().then(($el) => {
                const text = $el.eq(index).text().trim()
                expect(text).to.equal(data[node].medicationName)
            })
        })
    })
})

And('@add-customer I save the customer name',function(){
   customerPanel.getNameField().each(el=>{
   var name= el.text().trim().split(', ')
   LN=name[0].trim()
   FN=name[1].trim()
   cy.log(`Saved name is ${FN} ${LN}`)
})

})
