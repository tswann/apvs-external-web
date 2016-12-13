const UrlPathValidator = require('../services/validators/url-path-validator')

module.exports = function (router) {
  router.get('/application-updated/:reference', function (req, res) {
    UrlPathValidator(req.params)
    return res.render('application-updated', {
      reference: req.params.reference
    })
  })
}