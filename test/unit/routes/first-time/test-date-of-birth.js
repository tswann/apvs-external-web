var supertest = require('supertest')
var proxyquire = require('proxyquire')
var express = require('express')
var mockViewEngine = require('../mock-view-engine')
var bodyParser = require('body-parser')
var moment = require('moment')
const dateFormatter = require('../../../../app/services/date-formatter')

var validationErrors

var route = proxyquire(
  '../../../../app/routes/first-time/date-of-birth', {
    '../../services/validators/eligibility/date-of-birth-validator': function () { return validationErrors }
  })

describe('routes/first-time/date-of-birth', function () {
  var request
  var dobDay = '01'
  var dobMonth = '05'
  var dobYear = '1955'
  var dob = dateFormatter.buildFormatted(dobDay, dobMonth, dobYear)

  beforeEach(function () {
    var app = express()
    app.use(bodyParser.json())
    mockViewEngine(app, '../../../app/views')
    route(app)
    request = supertest(app)
    validationErrors = false
  })

  describe('GET /first-time', function () {
    it('should respond with a 200', function (done) {
      request
        .get('/first-time')
        .expect(200)
        .end(done)
    })
  })

  describe('POST /first-time', function () {
    describe('for over-sixteen date', function () {
      it('should respond with a 302 and redirect /first-time/:dob', function (done) {
        request
          .post('/first-time')
          .send({
            'dob-day': dobDay,
            'dob-month': dobMonth,
            'dob-year': dobYear
          })
          .expect(302)
          .expect('location', `/first-time/${dob}`)
          .end(done)
      })
    })
    describe('sixteen or under date', function () {
      it('should respond with a 302 and redirect to /eligibility-fail', function (done) {
        request
          .post('/first-time')
          .send({
            'dob-day': '1',
            'dob-month': '1',
            'dob-year': moment().year() - 16
          })
          .expect(302)
          .expect('location', '/eligibility-fail')
          .end(done)
      })
    })
  })
})