const validator = require('./common-validator')
const ERROR_MESSAGES = require('./validation-error-messages')

class FieldValidator {

  /**
   * Build a validator for validating fields.
   * @param data A single element to validate.
   * @param fieldName The name of of the HTML element to link the error message to.
   * @param errors An instance of the ErrorHandler class.
   */
  constructor (data, fieldName, errors) {
    this.data = data
    this.fieldName = fieldName
    this.errors = errors
  }

  isRequired (questionType) {
    if (validator.isNullOrUndefined(this.data)) {
      if (questionType === 'radio') {
        this.errors.add(this.fieldName, ERROR_MESSAGES.getRadioQuestionIsRequired)
      } else if (questionType === 'journeyAssistance') {
        this.errors.add(this.fieldName, ERROR_MESSAGES.getJourneyAssistanceIsRequired)
      } else {
        this.errors.add(this.fieldName, ERROR_MESSAGES.getIsRequired)
      }
    } else if (this.data === 'select') {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getDropboxIsRequired)
    }
    return this
  }

  isAlpha () {
    if (!validator.isAlpha(this.data)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsAlpha)
    }
    return this
  }

  isNumeric () {
    if (!validator.isNumeric(this.data)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsNumeric)
    }
    return this
  }

  isRange (min, max) {
    if (!validator.isRange(this.data, min, max)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsRangeMessage, { min: min, max: max })
    }
    return this
  }

  isNationalInsuranceNumber () {
    if (!validator.isNationalInsuranceNumber(this.data)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsNationalInsuranceNumber)
    }
    return this
  }

  isPostcode () {
    if (!validator.isPostcode(this.data)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsPostcode)
    }
    return this
  }

  isLength (length) {
    if (!validator.isLength(this.data, length)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsLengthMessage, { length: length })
    }
    return this
  }

  isEmail () {
    if (!validator.isEmail(this.data)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsEmailMessage)
    }
    return this
  }

  isLessThanLength (length) {
    if (!validator.isLessThanLength(this.data, length)) {
      this.errors.add(this.fieldName, ERROR_MESSAGES.getIsLessThanLengthMessage, { length: length })
    }
  }
}

module.exports = function (data, fieldName, errors) {
  return new FieldValidator(data, fieldName, errors)
}