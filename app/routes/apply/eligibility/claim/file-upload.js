const UrlPathValidator = require('../../../../services/validators/url-path-validator')
const referenceIdHelper = require('../../../helpers/reference-id-helper')
const DocumentTypeEnum = require('../../../../constants/document-type-enum')
const DirectoryCheck = require('../../../../services/directory-check')
const Upload = require('../../../../services/upload')
const ValidationError = require('../../../../services/errors/validation-error')
const UploadError = require('../../../../services/errors/upload-error')
const ERROR_MESSAGES = require('../../../../services/validators/validation-error-messages')
const FileUpload = require('../../../../services/domain/file-upload')
const ClaimDocumentInsert = require('../../../../services/data/insert-file-upload-details-for-claim')
const csrfProtection = require('csurf')({ cookie: true })
const generateCSRFToken = require('../../../../services/generate-csrf-token')
const decrypt = require('../../../../services/helpers/decrypt')
const clam = require('../../../../services/clam-av')
const logger = require('../../../../services/log')
const config = require('../../../../../config')
var path = require('path')
var Promise = require('bluebird').Promise
var fs = Promise.promisifyAll(require('fs'))
var csrfToken

module.exports = function (router) {
  router.get('/apply/:claimType/eligibility/:referenceId/claim/:claimId/summary/file-upload', function (req, res) {
    get(req, res)
  })

  router.get('/your-claims/:dob/:reference/:claimId/file-upload', function (req, res) {
    get(req, res)
  })

  router.post('/apply/:claimType/eligibility/:referenceId/claim/:claimId/summary/file-upload',
    function (req, res, next) {
      post(req, res, next)
    },
    function (req, res, next) {
      checkForMalware(req, res, next, `/apply/${req.params.claimType}/eligibility/${req.params.referenceId}/claim/${req.params.claimId}/summary`)
    })

  router.post('/your-claims/:dob/:reference/:claimId/file-upload', function (req, res, next) {
    post(req, res, next, `/your-claims/${req.params.dob}/${req.params.reference}/${req.params.claimId}`)
  })
}

function get (req, res) {
  csrfToken = generateCSRFToken(req)
  UrlPathValidator(req.params)

  if (DocumentTypeEnum.hasOwnProperty(req.query.document)) {
    var decryptedRef = getDecryptedReference(req.params)
    DirectoryCheck(decryptedRef, req.params.claimId, req.query.claimExpenseId, req.query.document)
    return res.render('apply/eligibility/claim/file-upload', {
      document: req.query.document,
      fileUploadGuidingText: DocumentTypeEnum,
      URL: req.url,
      hideAlternative: req.query.hideAlt
    })
  } else {
    throw new Error('Not a valid document type')
  }
}

function post (req, res, next, redirectURL) {
  logger.info('Entering POST')
  UrlPathValidator(req.params)

  var reference
  var id
  if (req.params.referenceId) {
    var referenceAndEligibility = referenceIdHelper.extractReferenceId(req.params.referenceId)
    reference = referenceAndEligibility.reference
    id = referenceAndEligibility.id
  } else {
    reference = decrypt(req.params.reference)
    id = req.query.eligibilityId
    req.params.referenceId = referenceIdHelper.getReferenceId(reference, id)
  }

  Upload(req, res, function (error) {
    try {
      logger.info('File entering Upload callback try block')
      logger.info(req.file)

      // If there was no file attached, we still need to check the CSRF token
      if (!req.file) {
        logger.info('CSRF check')
        csrfProtection(req, res, function (error) {
          if (error) {
            logger.info('throwing error')
            logger.error(error)
            throw error
          }
        })
      }

      if (error) {
        logger.info('Entering throw Validation Error block')
        logger.error(error)
        throw new ValidationError({upload: [ERROR_MESSAGES.getUploadTooLarge]})
      } else {
        if (!DocumentTypeEnum.hasOwnProperty(req.query.document)) {
          logger.info('Entering not valid document block')
          logger.error(error)
          throw new Error('Not a valid document type')
        }
      }
      req.fileUpload = new FileUpload(req.params.claimId, req.query.document, req.query.claimExpenseId, req.file, req.error, req.body.alternative)
      next()
    } catch (error) {
      handleError(req, res, next, error)
    }
  })
}

function checkForMalware (req, res, next, redirectURL) {
  logger.info('Entering malware check')
  logger.info('Invoking Malware scan of file')
  if (req.file) {
    var reference = referenceIdHelper.extractReferenceId(req.params.referenceId).reference
    var decryptedReferenceId = decrypt(req.params.referenceId)
    clam.scan(req.file.path).then((infected) => {
      try {
        if (infected) throw new ValidationError({upload: [ERROR_MESSAGES.getMalwareDetected]})

        var targetDir
        if (req.query.claimExpenseId) {
          targetDir = `${config.FILE_UPLOAD_LOCATION}/${decryptedReferenceId}/${req.params.claimId}/${req.query.claimExpenseId}/${req.query.document}`
        } else {
          targetDir = `${config.FILE_UPLOAD_LOCATION}/${decryptedReferenceId}/${req.params.claimId}/${req.query.document}`
        }

        var targetFilePath = path.join(targetDir, req.file.filename)
        fs.renameAsync(req.file.path, targetFilePath)
        req.fileUpload.file.path = targetFilePath
      } catch (error) {
        handleError(req, res, next, error)
      }
      ClaimDocumentInsert(reference, req.query.eligibilityId, req.params.claimId, req.fileUpload).then(function () {
        logger.info(redirectURL)
        res.redirect(redirectURL)
      }).catch(function (error) {
        next(error)
      })
    })
  }
}

function handleError (req, res, next, error) {
  if (error instanceof ValidationError || error instanceof UploadError) {
    return res.status(400).render('apply/eligibility/claim/file-upload', {
      errors: error.validationErrors,
      document: req.query.document,
      fileUploadGuidingText: DocumentTypeEnum,
      URL: req.URL,
      csrfToken: csrfToken,
      hideAlternative: req.query.hideAlt
    })
  } else {
    logger.info('NOT A VALIDATION ERROR')
    next(error)
  }
}

function getDecryptedReference (requestParams) {
  if (requestParams.referenceId) {
    return decrypt(requestParams.referenceId)
  } else if (requestParams.reference) {
    return decrypt(requestParams.reference)
  } else {
    return null
  }
}
