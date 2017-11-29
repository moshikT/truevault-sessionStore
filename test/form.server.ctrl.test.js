"use strict";

const form_ctrl = require('../controllers/form.server.controller.js');
const addCandidate_ctrl = require('../controllers/addCandidate.server.controller.js');
const formGenerator_ctrl = require('../controllers/formGenerator.server.controller.js');

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

chai.should();   // Add the should option to all functions in file.

function demoFunc(x) {
    return x === 0;
}

describe('testDescription/functionName', function() {
    /* allow to separate the test to different sections */

    beforeEach(function() {
        /** BeforeEach runs before each function */
    });
    afterEach(function() {
        /** afterEach runs after each function */
    });

    it('should return true if the number is equal to zero ', function() {
        demoFunc(0).should.be.true;
    });

    it('should return false if the number is not equal to zero ', function() {
        expect(demoFunc(1)).to.be.false;
    });
});

/** Not in use at the moment
describe('generateForm call back test unit', function() {
    it('should call the callback with the form', function() {
        var spy = sinon.spy();
        formGenerator_ctrl.generateForm(false, 'AYALON', spy);
        spy.called.should.be.any;
    });
});
*/

describe('addCandidate test unit: ', function () {
    // TODO: Create mock of new user data (using stub). before each test unit
    /*const newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.customer.name, req.body['gender'],
        req.body['recruitmentSource'], req.body['linkToCV']);*/
    // TODO: Remember that validation of the parameters should be at the client - reassure that

    describe('Form generation test unit: ', function () {
        // TODO: Test form generation by creating a mock params of client
        // formGenerator_Ctrl.generateForm(isInEnglish, req.customer.keyword, function (form) { }

        // TODO: test that the return value is an array of JSON elements -
        // TODO: (cont.) In deep test for the form generation will be at the form generator test class

        // TODO: ? test recruiterReport Url ?
        // TODO: ? tes form Url returned from promise ?

        // TODO: Test candidates fields:
        /**
         * const newCandidateEntry = new Candidate({
                    fullName: newUser.fullName,
                    id: newUser.id,
                    cid: req.customer._id,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    company: newUser.company,
                    formDurationInMinutes: 0,
                    form: form,
                    formCompleted: false,
                    session: session,
                    linkToForm: shortUrlToForm,
                    linkToReport: newUser.linkToReport,
                    gender: newUser.gender,
                    report: report,
                    recruitmentSource: newUser.recruitmentSource,
                    dateCompleted: '',
                    dateTimeCreated: new Date(),
                    linkToCV: newUser.linkToCV
                });
         */

    });
    //it('')
});

