'use strict'

const asIntPositive = require('./int-positive')

module.exports = function asPortNumber (raiseError, value) {
  var ret = asIntPositive(raiseError, value)

  if (ret > 65535) {
    raiseError('cannot assign a port number greater than 65535')
  }

  return ret
}
