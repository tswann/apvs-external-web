const expect = require('chai').expect
const config = require('../../../../knexfile').migrations
const knex = require('knex')(config)
const moment = require('moment')
const tasksEnum = require('../../../../app/constants/tasks-enum')
const taskStatusEnum = require('../../../../app/constants/task-status-enum')

const insertTaskSendFirstTimeClaimNotification = require('../../../../app/services/data/insert-task-send-first-time-claim-notification')

const reference = 'S123456'
var claimId = 123

// TODO refactor to get from common test helper
var visitorData = {
  Title: 'Mr',
  FirstName: 'John',
  LastName: 'Smith',
  NationalInsuranceNumber: 'QQ123456C',
  HouseNumberAndStreet: '1 Test Road',
  Town: '1 Test Road',
  County: 'Durham',
  PostCode: 'BT111BT',
  Country: 'England',
  EmailAddress: 'test@test.com',
  PhoneNumber: '07911111111',
  DateOfBirth: '1980-02-01',
  Relationship: 'partner',
  JourneyAssistance: 'y75',
  RequireBenefitUpload: false
}
visitorData.Reference = reference

describe('services/data/insert-task-send-first-time-claim-notification', function () {
  before(function (done) {
    knex('ExtSchema.Eligibility').insert({
      Reference: reference,
      DateCreated: moment().toDate(),
      Status: 'TEST'
    })
    .then(function () {
      return knex('ExtSchema.Visitor').insert(visitorData)
        .then(function () {
          done()
        })
    })
  })

  it('should insert a new task to send the first time claim notification', function (done) {
    insertTaskSendFirstTimeClaimNotification(reference, claimId)
      .then(function () {
        return knex.first().from('ExtSchema.Task').where({Reference: reference, ClaimId: claimId})
          .then(function (task) {
            expect(task.Task).to.equal(tasksEnum.FIRST_TIME_CLAIM_NOTIFICATION)
            expect(task.Reference).to.equal(reference)
            expect(task.ClaimId).to.equal(claimId)
            expect(task.AdditionalData).to.equal(visitorData.EmailAddress)
            expect(task.DateCreated).to.be.within(moment().add(-2, 'minutes').toDate(), moment().add(2, 'minutes').toDate())
            expect(task.Status).to.equal(taskStatusEnum.PENDING)

            done()
          })
      })
      .catch(function (error) {
        throw error
      })
  })

  after(function (done) {
    knex('ExtSchema.Visitor').where('Reference', reference).del().then(function () {
      return knex('ExtSchema.Eligibility').where('Reference', reference).del().then(function () {
        return knex('ExtSchema.Task').where({Reference: reference, ClaimId: claimId}).del()
      })
    }).then(function () {
      done()
    })
  })
})