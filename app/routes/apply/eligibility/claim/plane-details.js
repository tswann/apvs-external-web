const UrlPathValidator = require('../../../../services/validators/url-path-validator')
const referenceIdHelper = require('../../../helpers/reference-id-helper')
const ValidationError = require('../../../../services/errors/validation-error')
const expenseUrlRouter = require('../../../../services/routing/expenses-url-router')
const PlaneExpense = require('../../../../services/domain/expenses/plane-expense')
const insertExpense = require('../../../../services/data/insert-expense')
const getExpenseOwnerData = require('../../../../services/data/get-expense-owner-data')

module.exports = function (router) {
  router.get('/apply/:claimType/eligibility/:referenceId/claim/:claimId/plane', function (req, res) {
    UrlPathValidator(req.params)

    var referenceAndEligibilityId = referenceIdHelper.extractReferenceId(req.params.referenceId)
    return getExpenseOwnerData(req.params.claimId, referenceAndEligibilityId.id, referenceAndEligibilityId.reference)
      .then(function (expenseOwnerData) {
        return res.render('apply/eligibility/claim/plane-details', {
          claimType: req.params.claimType,
          referenceId: req.params.referenceId,
          claimId: req.params.claimId,
          expenseOwners: expenseOwnerData,
          params: expenseUrlRouter.parseParams(req.query)
        })
      })
  })

  router.post('/apply/:claimType/eligibility/:referenceId/claim/:claimId/plane', function (req, res, next) {
    UrlPathValidator(req.params)
    var referenceAndEligibilityId = referenceIdHelper.extractReferenceId(req.params.referenceId)

    try {
      var expense = new PlaneExpense(
        req.body.cost,
        req.body.from,
        req.body.to,
        req.body['return-journey'],
        req.body['ticket-owner']
      )

      insertExpense(referenceAndEligibilityId.reference, referenceAndEligibilityId.id, req.params.claimId, expense)
        .then(function () {
          return res.redirect(expenseUrlRouter.getRedirectUrl(req))
        })
        .catch(function (error) {
          next(error)
        })
    } catch (error) {
      if (error instanceof ValidationError) {
        return getExpenseOwnerData(req.params.claimId, referenceAndEligibilityId.id, referenceAndEligibilityId.reference)
          .then(function (expenseOwnerData) {
            return res.status(400).render('apply/eligibility/claim/plane-details', {
              errors: error.validationErrors,
              claimType: req.params.claimType,
              referenceId: req.params.referenceId,
              claimId: req.params.claimId,
              expenseOwners: expenseOwnerData,
              params: expenseUrlRouter.parseParams(req.query),
              expense: req.body
            })
          })
      } else {
        throw error
      }
    }
  })
}
