'use strict'

const asString = require('./string')

module.exports = function asArray (raiseError, value, delimeter) {
  delimeter = delimeter || ','

  if (!value.includes(delimeter)) {
    raiseError(`should include values separated with the delimeter "${delimeter}"`)
  }

  return asString(raiseError, value).split(delimeter)
}
