"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _2 = require("../..");

var _errors = require("../../lib/protocol/errors");

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _lodash = _interopRequireDefault(require("lodash"));

var _httpStatusCodes = _interopRequireDefault(require("http-status-codes"));

_chai.default.use(_chaiAsPromised.default);

_chai.default.should();

let errorsList = [{
  errorName: 'NoSuchDriverError',
  errorMsg: 'A session is either terminated or not started',
  error: 'invalid session id',
  errorCode: 6
}, {
  errorName: 'ElementClickInterceptedError',
  errorMsg: 'The Element Click command could not be completed because the element receiving the events is obscuring the element that was requested clicked',
  error: 'element click intercepted'
}, {
  errorName: 'ElementNotInteractableError',
  errorMsg: 'A command could not be completed because the element is not pointer- or keyboard interactable',
  error: 'element not interactable'
}, {
  errorName: 'InsecureCertificateError',
  errorMsg: 'Navigation caused the user agent to hit a certificate warning, which is usually the result of an expired or invalid TLS certificate',
  error: 'insecure certificate'
}, {
  errorName: 'InvalidArgumentError',
  errorMsg: 'The arguments passed to the command are either invalid or malformed',
  error: 'invalid argument'
}, {
  errorName: 'NoSuchElementError',
  errorMsg: 'An element could not be located on the page using the ' + 'given search parameters.',
  error: 'no such element',
  errorCode: 7
}, {
  errorName: 'NoSuchFrameError',
  errorMsg: 'A request to switch to a frame could not be satisfied ' + 'because the frame could not be found.',
  error: 'no such frame',
  errorCode: 8
}, {
  errorName: 'UnknownCommandError',
  errorMsg: 'The requested resource could not be found, or a request ' + 'was received using an HTTP method that is not supported by ' + 'the mapped resource.',
  error: 'unknown command',
  errorCode: 9
}, {
  errorName: 'StaleElementReferenceError',
  errorMsg: 'An element command failed because the referenced element is ' + 'no longer attached to the DOM.',
  error: 'stale element reference',
  errorCode: 10
}, {
  errorName: 'ElementNotVisibleError',
  errorMsg: 'An element command could not be completed because the ' + 'element is not visible on the page.',
  errorCode: 11
}, {
  errorName: 'InvalidElementStateError',
  errorMsg: 'An element command could not be completed because the element ' + 'is in an invalid state (e.g. attempting to click a disabled ' + 'element).',
  error: 'invalid element state',
  errorCode: 12
}, {
  errorName: 'UnknownError',
  errorMsg: 'An unknown server-side error occurred while processing the ' + 'command.',
  error: 'unknown error',
  errorCode: 13
}, {
  errorName: 'ElementIsNotSelectableError',
  errorMsg: 'An attempt was made to select an element that cannot ' + 'be selected.',
  error: 'element not selectable',
  errorCode: 15
}, {
  errorName: 'JavaScriptError',
  errorMsg: 'An error occurred while executing user supplied JavaScript.',
  error: 'javascript error',
  errorCode: 17
}, {
  errorName: 'XPathLookupError',
  errorMsg: 'An error occurred while searching for an element by XPath.',
  errorCode: 19
}, {
  errorName: 'TimeoutError',
  errorMsg: 'An operation did not complete before its timeout expired.',
  error: 'timeout',
  errorCode: 21
}, {
  errorName: 'NoSuchWindowError',
  errorMsg: 'A request to switch to a different window could not be ' + 'satisfied because the window could not be found.',
  error: 'no such window',
  errorCode: 23
}, {
  errorName: 'InvalidCookieDomainError',
  errorMsg: 'An illegal attempt was made to set a cookie under a different ' + 'domain than the current page.',
  error: 'invalid cookie domain',
  errorCode: 24
}, {
  errorName: 'InvalidCoordinatesError',
  errorMsg: 'The coordinates provided to an interactions operation are invalid.',
  error: 'invalid coordinates'
}, {
  errorName: 'UnableToSetCookieError',
  errorMsg: `A request to set a cookie's value could not be satisfied.`,
  error: 'unable to set cookie',
  errorCode: 25
}, {
  errorName: 'UnexpectedAlertOpenError',
  errorMsg: 'A modal dialog was open, blocking this operation',
  error: 'unexpected alert open',
  errorCode: 26
}, {
  errorName: 'NoAlertOpenError',
  errorMsg: 'An attempt was made to operate on a modal dialog when one was ' + 'not open.',
  errorCode: 27
}, {
  errorName: 'ScriptTimeoutError',
  errorMsg: 'A script did not complete before its timeout expired.',
  error: 'script timeout',
  errorCode: 28
}, {
  errorName: 'InvalidElementCoordinatesError',
  errorMsg: 'The coordinates provided to an interactions operation are ' + 'invalid.',
  errorCode: 29
}, {
  errorName: 'IMENotAvailableError',
  errorMsg: 'IME was not available.',
  errorCode: 30
}, {
  errorName: 'IMEEngineActivationFailedError',
  errorMsg: 'An IME engine could not be started.',
  errorCode: 31
}, {
  errorName: 'InvalidSelectorError',
  errorMsg: 'Argument was an invalid selector (e.g. XPath/CSS).',
  error: 'invalid selector',
  errorCode: 32
}, {
  errorName: 'SessionNotCreatedError',
  errorMsg: 'A new session could not be created.',
  error: 'session not created',
  errorCode: 33
}, {
  errorName: 'MoveTargetOutOfBoundsError',
  errorMsg: 'Target provided for a move action is out of bounds.',
  error: 'move target out of bounds',
  errorCode: 34
}, {
  errorName: 'NoSuchAlertError',
  errorMsg: 'An attempt was made to operate on a modal dialog when one was not open.',
  error: 'no such alert'
}, {
  errorName: 'NoSuchCookieError',
  errorMsg: 'No cookie matching the given path name was found amongst the associated cookies of the current browsing context’s active document',
  error: 'no such cookie'
}, {
  errorName: 'NotYetImplementedError',
  errorMsg: 'Method has not yet been implemented',
  error: 'unknown method',
  errorCode: 405
}, {
  errorName: 'UnknownCommandError',
  errorMsg: 'The requested resource could not be found, or a request was received using an HTTP method that is not supported by the mapped resource.',
  error: 'unknown command'
}, {
  errorName: 'UnknownMethodError',
  errorMsg: 'The requested command matched a known URL but did not match an method for that URL',
  error: 'unknown method'
}, {
  errorName: 'UnsupportedOperationError',
  errorMsg: 'A server-side error occurred. Command cannot be supported.',
  error: 'unsupported operation'
}];
describe('errors', function () {
  for (let error of errorsList) {
    it(error.errorName + ' should have a JSONWP code or W3C code and message', function () {
      if (error.errorCode) {
        new _2.errors[error.errorName]().should.have.property('jsonwpCode', error.errorCode);
      } else {
        new _2.errors[error.errorName]().should.have.property('error', error.error);
      }

      new _2.errors[error.errorName]().should.have.property('message', error.errorMsg);
    });
  }

  it('BadParametersError should not have code and should have messg', function () {
    new _2.errors.BadParametersError().should.not.have.property('jsonwpCode');
    new _2.errors.BadParametersError().should.have.property('message');
  });
  it('ProxyRequestError should have message and jsonwp', function () {
    new _2.errors.ProxyRequestError().should.have.property('jsonwp');
    new _2.errors.ProxyRequestError().should.have.property('message');
  });
});
describe('errorFromMJSONWPStatusCode', function () {
  for (let error of errorsList) {
    if (error.errorName !== 'NotYetImplementedError') {
      it(error.errorCode + ' should return correct error', function () {
        if (error.errorCode) {
          (0, _2.errorFromMJSONWPStatusCode)(error.errorCode).should.have.property('jsonwpCode', error.errorCode);
          (0, _2.errorFromMJSONWPStatusCode)(error.errorCode).should.have.property('message', error.errorMsg);

          if (!_lodash.default.includes([13, 33], error.errorCode)) {
            (0, _2.errorFromMJSONWPStatusCode)(error.errorCode, 'abcd').should.have.property('jsonwpCode', error.errorCode);
            (0, _2.errorFromMJSONWPStatusCode)(error.errorCode, 'abcd').should.have.property('message', 'abcd');
          }
        } else {
          (0, _2.isErrorType)((0, _2.errorFromMJSONWPStatusCode)(error.errorCode), _2.errors.UnknownError).should.be.true;
        }
      });
    }
  }

  it('should throw unknown error for unknown code', function () {
    (0, _2.errorFromMJSONWPStatusCode)(99).should.have.property('jsonwpCode', 13);
    (0, _2.errorFromMJSONWPStatusCode)(99).should.have.property('message', 'An unknown server-side error occurred ' + 'while processing the command.');
  });
});
describe('errorFromW3CJsonCode', function () {
  for (let error of errorsList) {
    if (error.errorName !== 'NotYetImplementedError') {
      it(error.errorName + ' should return correct error', function () {
        const {
          error: w3cError
        } = error;

        if (w3cError) {
          (0, _2.errorFromW3CJsonCode)(w3cError).error.should.equal(error.error);
          (0, _2.errorFromW3CJsonCode)(w3cError).should.have.property('message', error.errorMsg);
        } else {
          (0, _2.isErrorType)((0, _2.errorFromW3CJsonCode)(w3cError), _2.errors.UnknownError).should.be.true;
        }
      });
    }
  }

  it('should parse unknown errors', function () {
    (0, _2.isErrorType)((0, _2.errorFromW3CJsonCode)('not a real error code'), _2.errors.UnknownError).should.be.true;
    (0, _2.errorFromW3CJsonCode)('not a real error code').message.should.match(/An unknown server-side error occurred/);
    (0, _2.errorFromW3CJsonCode)('not a real error code').error.should.equal('unknown error');
  });
});
describe('w3c Status Codes', function () {
  it('should match the correct error codes', function () {
    let non400Errors = [['NoSuchDriverError', 404], ['NoSuchFrameError', 404], ['NoAlertOpenError', 404], ['NoSuchWindowError', 404], ['StaleElementReferenceError', 404], ['JavaScriptError', 500], ['MoveTargetOutOfBoundsError', 500], ['NoSuchCookieError', 404], ['NoSuchElementError', 404], ['ScriptTimeoutError', 408], ['SessionNotCreatedError', 500], ['TimeoutError', 408], ['UnableToSetCookieError', 500], ['UnableToCaptureScreen', 500], ['UnexpectedAlertOpenError', 500], ['UnknownCommandError', 404], ['UnknownError', 500], ['UnknownMethodError', 405], ['UnsupportedOperationError', 500]];

    for (let [errorName, expectedErrorCode] of non400Errors) {
      _2.errors[errorName].should.exist;
      new _2.errors[errorName]().should.have.property('w3cStatus', expectedErrorCode);
    }

    new _2.errors.ElementClickInterceptedError().should.have.property('w3cStatus', 400);
  });
});
describe('.getResponseForW3CError', function () {
  it('should return an error, message and stacktrace for just a generic exception', function () {
    try {
      throw new Error('Some random error');
    } catch (e) {
      const [httpStatus, httpResponseBody] = (0, _errors.getResponseForW3CError)(e);
      httpStatus.should.equal(500);
      const {
        error,
        message,
        stacktrace
      } = httpResponseBody.value;
      message.should.match(/Some random error/);
      error.should.equal('unknown error');
      stacktrace.should.match(/at getResponseForW3CError/);
      stacktrace.should.match(/Some random error/);
      stacktrace.should.match(/errors-specs.js/);
    }
  });
  it('should return an error, message and stacktrace for a NoSuchElementError', function () {
    const noSuchElementError = new _2.errors.NoSuchElementError('specific error message');
    const [httpStatus, httpResponseBody] = (0, _errors.getResponseForW3CError)(noSuchElementError);
    httpStatus.should.equal(404);
    const {
      error,
      message,
      stacktrace
    } = httpResponseBody.value;
    error.should.equal('no such element');
    message.should.match(/specific error message/);
    stacktrace.should.match(/errors-specs.js/);
  });
  it('should handle BadParametersError', function () {
    const badParamsError = new _2.errors.BadParametersError('__FOO__', '__BAR__', '__HELLO_WORLD__');
    const [httpStatus, httpResponseBody] = (0, _errors.getResponseForW3CError)(badParamsError);
    httpStatus.should.equal(400);
    const {
      error,
      message,
      stacktrace
    } = httpResponseBody.value;
    error.should.equal('invalid argument');
    message.should.match(/__BAR__/);
    message.should.match(/__HELLO_WORLD__/);
    stacktrace.should.match(/errors-specs.js/);
  });
  it('should translate JSONWP errors', function () {
    const [httpStatus, httpResponseBody] = (0, _errors.getResponseForW3CError)({
      status: 7,
      value: 'My custom message',
      sessionId: 'Fake Session Id'
    });
    httpStatus.should.equal(404);
    const {
      error,
      message,
      stacktrace
    } = httpResponseBody.value;
    message.should.equal('My custom message');
    error.should.equal('no such element');
    stacktrace.should.exist;
  });
});
describe('.getActualError', function () {
  describe('MJSONWP', function () {
    it('should map a status code 7 no such element error as a NoSuchElementError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', {
        value: 'does not matter',
        status: 7
      }).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.NoSuchElementError).should.be.true;
    });
    it('should map a status code 10, StaleElementReferenceError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', {
        value: 'Does not matter',
        status: 10
      }).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.StaleElementReferenceError).should.be.true;
    });
    it('should map an unknown error to UnknownError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', {
        value: 'Does not matter',
        status: -100
      }).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.UnknownError).should.be.true;
    });
    it('should parse a JSON string', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', JSON.stringify({
        value: 'Does not matter',
        status: -100
      })).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.UnknownError).should.be.true;
    });
  });
  describe('W3C', function () {
    it('should map a 404 no such element error as a NoSuchElementError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', {
        value: {
          error: _2.errors.NoSuchElementError.error()
        }
      }, _httpStatusCodes.default.NOT_FOUND).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.NoSuchElementError).should.be.true;
    });
    it('should map a 400 StaleElementReferenceError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', {
        value: {
          error: _2.errors.StaleElementReferenceError.error()
        }
      }, _httpStatusCodes.default.BAD_REQUEST).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.StaleElementReferenceError).should.be.true;
    });
    it('should map an unknown error to UnknownError', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', null, {
        value: {
          error: 'Not a valid w3c JSON code'
        }
      }, 456).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.UnknownError).should.be.true;
    });
    it('should parse a JSON string', function () {
      const actualError = new _2.errors.ProxyRequestError('Error message does not matter', JSON.stringify({
        value: {
          error: _2.errors.StaleElementReferenceError.error()
        }
      }), _httpStatusCodes.default.BAD_REQUEST).getActualError();
      (0, _2.isErrorType)(actualError, _2.errors.StaleElementReferenceError).should.be.true;
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcHJvdG9jb2wvZXJyb3JzLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsInNob3VsZCIsImVycm9yc0xpc3QiLCJlcnJvck5hbWUiLCJlcnJvck1zZyIsImVycm9yIiwiZXJyb3JDb2RlIiwiZGVzY3JpYmUiLCJpdCIsImVycm9ycyIsImhhdmUiLCJwcm9wZXJ0eSIsIkJhZFBhcmFtZXRlcnNFcnJvciIsIm5vdCIsIlByb3h5UmVxdWVzdEVycm9yIiwiXyIsImluY2x1ZGVzIiwiVW5rbm93bkVycm9yIiwiYmUiLCJ0cnVlIiwidzNjRXJyb3IiLCJlcXVhbCIsIm1lc3NhZ2UiLCJtYXRjaCIsIm5vbjQwMEVycm9ycyIsImV4cGVjdGVkRXJyb3JDb2RlIiwiZXhpc3QiLCJFbGVtZW50Q2xpY2tJbnRlcmNlcHRlZEVycm9yIiwiRXJyb3IiLCJlIiwiaHR0cFN0YXR1cyIsImh0dHBSZXNwb25zZUJvZHkiLCJzdGFja3RyYWNlIiwidmFsdWUiLCJub1N1Y2hFbGVtZW50RXJyb3IiLCJOb1N1Y2hFbGVtZW50RXJyb3IiLCJiYWRQYXJhbXNFcnJvciIsInN0YXR1cyIsInNlc3Npb25JZCIsImFjdHVhbEVycm9yIiwiZ2V0QWN0dWFsRXJyb3IiLCJTdGFsZUVsZW1lbnRSZWZlcmVuY2VFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJIVFRQU3RhdHVzQ29kZXMiLCJOT1RfRk9VTkQiLCJCQURfUkVRVUVTVCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUFBLGNBQUtDLEdBQUwsQ0FBU0MsdUJBQVQ7O0FBQ0FGLGNBQUtHLE1BQUw7O0FBSUEsSUFBSUMsVUFBVSxHQUFHLENBQ2Y7QUFDRUMsRUFBQUEsU0FBUyxFQUFFLG1CQURiO0FBRUVDLEVBQUFBLFFBQVEsRUFBRSwrQ0FGWjtBQUdFQyxFQUFBQSxLQUFLLEVBQUUsb0JBSFQ7QUFJRUMsRUFBQUEsU0FB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TUEsMEJBQVlELFdBQVosRUFBeUI5QixVQUFPZ0MsMEJBQWhDLEVBQTREeEMsTUFBNUQsQ0FBbUVpQixFQUFuRSxDQUFzRUMsSUFBdEU7QUFDRCxLQVJDLENBQUY7QUFTRCxHQXBDTyxDQUFSO0FBcUNELENBckVPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlcnJvcnMsIGVycm9yRnJvbU1KU09OV1BTdGF0dXNDb2RlLCBlcnJvckZyb21XM0NKc29uQ29kZSwgaXNFcnJvclR5cGUgfSBmcm9tICcuLi8uLic7XG5pbXBvcnQgeyBnZXRSZXNwb25zZUZvclczQ0Vycm9yIH0gZnJvbSAnLi4vLi4vbGliL3Byb3RvY29sL2Vycm9ycyc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgSFRUUFN0YXR1c0NvZGVzIGZyb20gJ2h0dHAtc3RhdHVzLWNvZGVzJztcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY2hhaS5zaG91bGQoKTtcblxuLy8gRXJyb3IgY29kZXMgYW5kIG1lc3NhZ2VzIGhhdmUgYmVlbiBhZGRlZCBhY2NvcmRpbmcgdG8gSnNvbldpcmVQcm90b2NvbCBzZWVcbi8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avc2VsZW5pdW0vd2lraS9Kc29uV2lyZVByb3RvY29sI1Jlc3BvbnNlX1N0YXR1c19Db2Rlc1xubGV0IGVycm9yc0xpc3QgPSBbXG4gIHtcbiAgICBlcnJvck5hbWU6ICdOb1N1Y2hEcml2ZXJFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBIHNlc3Npb24gaXMgZWl0aGVyIHRlcm1pbmF0ZWQgb3Igbm90IHN0YXJ0ZWQnLFxuICAgIGVycm9yOiAnaW52YWxpZCBzZXNzaW9uIGlkJyxcbiAgICBlcnJvckNvZGU6IDZcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ0VsZW1lbnRDbGlja0ludGVyY2VwdGVkRXJyb3InLFxuICAgIGVycm9yTXNnOiAnVGhlIEVsZW1lbnQgQ2xpY2sgY29tbWFuZCBjb3VsZCBub3QgYmUgY29tcGxldGVkIGJlY2F1c2UgdGhlIGVsZW1lbnQgcmVjZWl2aW5nIHRoZSBldmVudHMgaXMgb2JzY3VyaW5nIHRoZSBlbGVtZW50IHRoYXQgd2FzIHJlcXVlc3RlZCBjbGlja2VkJyxcbiAgICBlcnJvcjogJ2VsZW1lbnQgY2xpY2sgaW50ZXJjZXB0ZWQnLFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnRWxlbWVudE5vdEludGVyYWN0YWJsZUVycm9yJyxcbiAgICBlcnJvck1zZzogJ0EgY29tbWFuZCBjb3VsZCBub3QgYmUgY29tcGxldGVkIGJlY2F1c2UgdGhlIGVsZW1lbnQgaXMgbm90IHBvaW50ZXItIG9yIGtleWJvYXJkIGludGVyYWN0YWJsZScsXG4gICAgZXJyb3I6ICdlbGVtZW50IG5vdCBpbnRlcmFjdGFibGUnLFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnSW5zZWN1cmVDZXJ0aWZpY2F0ZUVycm9yJyxcbiAgICBlcnJvck1zZzogJ05hdmlnYXRpb24gY2F1c2VkIHRoZSB1c2VyIGFnZW50IHRvIGhpdCBhIGNlcnRpZmljYXRlIHdhcm5pbmcsIHdoaWNoIGlzIHVzdWFsbHkgdGhlIHJlc3VsdCBvZiBhbiBleHBpcmVkIG9yIGludmFsaWQgVExTIGNlcnRpZmljYXRlJyxcbiAgICBlcnJvcjogJ2luc2VjdXJlIGNlcnRpZmljYXRlJyxcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ0ludmFsaWRBcmd1bWVudEVycm9yJyxcbiAgICBlcnJvck1zZzogJ1RoZSBhcmd1bWVudHMgcGFzc2VkIHRvIHRoZSBjb21tYW5kIGFyZSBlaXRoZXIgaW52YWxpZCBvciBtYWxmb3JtZWQnLFxuICAgIGVycm9yOiAnaW52YWxpZCBhcmd1bWVudCcsXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdOb1N1Y2hFbGVtZW50RXJyb3InLFxuICAgIGVycm9yTXNnOiAnQW4gZWxlbWVudCBjb3VsZCBub3QgYmUgbG9jYXRlZCBvbiB0aGUgcGFnZSB1c2luZyB0aGUgJyArXG4gICAgICAgICdnaXZlbiBzZWFyY2ggcGFyYW1ldGVycy4nLFxuICAgIGVycm9yOiAnbm8gc3VjaCBlbGVtZW50JyxcbiAgICBlcnJvckNvZGU6IDdcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ05vU3VjaEZyYW1lRXJyb3InLFxuICAgIGVycm9yTXNnOiAnQSByZXF1ZXN0IHRvIHN3aXRjaCB0byBhIGZyYW1lIGNvdWxkIG5vdCBiZSBzYXRpc2ZpZWQgJyArXG4gICAgICAgICdiZWNhdXNlIHRoZSBmcmFtZSBjb3VsZCBub3QgYmUgZm91bmQuJyxcbiAgICBlcnJvcjogJ25vIHN1Y2ggZnJhbWUnLFxuICAgIGVycm9yQ29kZTogOFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnVW5rbm93bkNvbW1hbmRFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdUaGUgcmVxdWVzdGVkIHJlc291cmNlIGNvdWxkIG5vdCBiZSBmb3VuZCwgb3IgYSByZXF1ZXN0ICcgK1xuICAgICAgICAnd2FzIHJlY2VpdmVkIHVzaW5nIGFuIEhUVFAgbWV0aG9kIHRoYXQgaXMgbm90IHN1cHBvcnRlZCBieSAnICtcbiAgICAgICAgJ3RoZSBtYXBwZWQgcmVzb3VyY2UuJyxcbiAgICBlcnJvcjogJ3Vua25vd24gY29tbWFuZCcsXG4gICAgZXJyb3JDb2RlOiA5XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdTdGFsZUVsZW1lbnRSZWZlcmVuY2VFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBbiBlbGVtZW50IGNvbW1hbmQgZmFpbGVkIGJlY2F1c2UgdGhlIHJlZmVyZW5jZWQgZWxlbWVudCBpcyAnICtcbiAgICAgICAgJ25vIGxvbmdlciBhdHRhY2hlZCB0byB0aGUgRE9NLicsXG4gICAgZXJyb3I6ICdzdGFsZSBlbGVtZW50IHJlZmVyZW5jZScsXG4gICAgZXJyb3JDb2RlOiAxMFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnRWxlbWVudE5vdFZpc2libGVFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBbiBlbGVtZW50IGNvbW1hbmQgY291bGQgbm90IGJlIGNvbXBsZXRlZCBiZWNhdXNlIHRoZSAnICtcbiAgICAgICAgJ2VsZW1lbnQgaXMgbm90IHZpc2libGUgb24gdGhlIHBhZ2UuJyxcbiAgICBlcnJvckNvZGU6IDExXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdJbnZhbGlkRWxlbWVudFN0YXRlRXJyb3InLFxuICAgIGVycm9yTXNnOiAnQW4gZWxlbWVudCBjb21tYW5kIGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQgYmVjYXVzZSB0aGUgZWxlbWVudCAnICtcbiAgICAgICAgJ2lzIGluIGFuIGludmFsaWQgc3RhdGUgKGUuZy4gYXR0ZW1wdGluZyB0byBjbGljayBhIGRpc2FibGVkICcgK1xuICAgICAgICAnZWxlbWVudCkuJyxcbiAgICBlcnJvcjogJ2ludmFsaWQgZWxlbWVudCBzdGF0ZScsXG4gICAgZXJyb3JDb2RlOiAxMlxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnVW5rbm93bkVycm9yJyxcbiAgICBlcnJvck1zZzogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyB0aGUgJyArXG4gICAgICAgICdjb21tYW5kLicsXG4gICAgZXJyb3I6ICd1bmtub3duIGVycm9yJyxcbiAgICBlcnJvckNvZGU6IDEzXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdFbGVtZW50SXNOb3RTZWxlY3RhYmxlRXJyb3InLFxuICAgIGVycm9yTXNnOiAnQW4gYXR0ZW1wdCB3YXMgbWFkZSB0byBzZWxlY3QgYW4gZWxlbWVudCB0aGF0IGNhbm5vdCAnICtcbiAgICAgICAgJ2JlIHNlbGVjdGVkLicsXG4gICAgZXJyb3I6ICdlbGVtZW50IG5vdCBzZWxlY3RhYmxlJyxcbiAgICBlcnJvckNvZGU6IDE1XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdKYXZhU2NyaXB0RXJyb3InLFxuICAgIGVycm9yTXNnOiAnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgZXhlY3V0aW5nIHVzZXIgc3VwcGxpZWQgSmF2YVNjcmlwdC4nLFxuICAgIGVycm9yOiAnamF2YXNjcmlwdCBlcnJvcicsXG4gICAgZXJyb3JDb2RlOiAxN1xuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnWFBhdGhMb29rdXBFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBzZWFyY2hpbmcgZm9yIGFuIGVsZW1lbnQgYnkgWFBhdGguJyxcbiAgICBlcnJvckNvZGU6IDE5XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdUaW1lb3V0RXJyb3InLFxuICAgIGVycm9yTXNnOiAnQW4gb3BlcmF0aW9uIGRpZCBub3QgY29tcGxldGUgYmVmb3JlIGl0cyB0aW1lb3V0IGV4cGlyZWQuJyxcbiAgICBlcnJvcjogJ3RpbWVvdXQnLFxuICAgIGVycm9yQ29kZTogMjFcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ05vU3VjaFdpbmRvd0Vycm9yJyxcbiAgICBlcnJvck1zZzogJ0EgcmVxdWVzdCB0byBzd2l0Y2ggdG8gYSBkaWZmZXJlbnQgd2luZG93IGNvdWxkIG5vdCBiZSAnICtcbiAgICAgICAgJ3NhdGlzZmllZCBiZWNhdXNlIHRoZSB3aW5kb3cgY291bGQgbm90IGJlIGZvdW5kLicsXG4gICAgZXJyb3I6ICdubyBzdWNoIHdpbmRvdycsXG4gICAgZXJyb3JDb2RlOiAyM1xuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnSW52YWxpZENvb2tpZURvbWFpbkVycm9yJyxcbiAgICBlcnJvck1zZzogJ0FuIGlsbGVnYWwgYXR0ZW1wdCB3YXMgbWFkZSB0byBzZXQgYSBjb29raWUgdW5kZXIgYSBkaWZmZXJlbnQgJyArXG4gICAgICAgICdkb21haW4gdGhhbiB0aGUgY3VycmVudCBwYWdlLicsXG4gICAgZXJyb3I6ICdpbnZhbGlkIGNvb2tpZSBkb21haW4nLFxuICAgIGVycm9yQ29kZTogMjRcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ0ludmFsaWRDb29yZGluYXRlc0Vycm9yJyxcbiAgICBlcnJvck1zZzogJ1RoZSBjb29yZGluYXRlcyBwcm92aWRlZCB0byBhbiBpbnRlcmFjdGlvbnMgb3BlcmF0aW9uIGFyZSBpbnZhbGlkLicsXG4gICAgZXJyb3I6ICdpbnZhbGlkIGNvb3JkaW5hdGVzJyxcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ1VuYWJsZVRvU2V0Q29va2llRXJyb3InLFxuICAgIGVycm9yTXNnOiBgQSByZXF1ZXN0IHRvIHNldCBhIGNvb2tpZSdzIHZhbHVlIGNvdWxkIG5vdCBiZSBzYXRpc2ZpZWQuYCxcbiAgICBlcnJvcjogJ3VuYWJsZSB0byBzZXQgY29va2llJyxcbiAgICBlcnJvckNvZGU6IDI1XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdVbmV4cGVjdGVkQWxlcnRPcGVuRXJyb3InLFxuICAgIGVycm9yTXNnOiAnQSBtb2RhbCBkaWFsb2cgd2FzIG9wZW4sIGJsb2NraW5nIHRoaXMgb3BlcmF0aW9uJyxcbiAgICBlcnJvcjogJ3VuZXhwZWN0ZWQgYWxlcnQgb3BlbicsXG4gICAgZXJyb3JDb2RlOiAyNlxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnTm9BbGVydE9wZW5FcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBbiBhdHRlbXB0IHdhcyBtYWRlIHRvIG9wZXJhdGUgb24gYSBtb2RhbCBkaWFsb2cgd2hlbiBvbmUgd2FzICcgK1xuICAgICAgICAnbm90IG9wZW4uJyxcbiAgICBlcnJvckNvZGU6IDI3XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdTY3JpcHRUaW1lb3V0RXJyb3InLFxuICAgIGVycm9yTXNnOiAnQSBzY3JpcHQgZGlkIG5vdCBjb21wbGV0ZSBiZWZvcmUgaXRzIHRpbWVvdXQgZXhwaXJlZC4nLFxuICAgIGVycm9yOiAnc2NyaXB0IHRpbWVvdXQnLFxuICAgIGVycm9yQ29kZTogMjhcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ0ludmFsaWRFbGVtZW50Q29vcmRpbmF0ZXNFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdUaGUgY29vcmRpbmF0ZXMgcHJvdmlkZWQgdG8gYW4gaW50ZXJhY3Rpb25zIG9wZXJhdGlvbiBhcmUgJyArXG4gICAgICAgICdpbnZhbGlkLicsXG4gICAgZXJyb3JDb2RlOiAyOVxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnSU1FTm90QXZhaWxhYmxlRXJyb3InLFxuICAgIGVycm9yTXNnOiAnSU1FIHdhcyBub3QgYXZhaWxhYmxlLicsXG4gICAgZXJyb3JDb2RlOiAzMFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnSU1FRW5naW5lQWN0aXZhdGlvbkZhaWxlZEVycm9yJyxcbiAgICBlcnJvck1zZzogJ0FuIElNRSBlbmdpbmUgY291bGQgbm90IGJlIHN0YXJ0ZWQuJyxcbiAgICBlcnJvckNvZGU6IDMxXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdJbnZhbGlkU2VsZWN0b3JFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdBcmd1bWVudCB3YXMgYW4gaW52YWxpZCBzZWxlY3RvciAoZS5nLiBYUGF0aC9DU1MpLicsXG4gICAgZXJyb3I6ICdpbnZhbGlkIHNlbGVjdG9yJyxcbiAgICBlcnJvckNvZGU6IDMyXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdTZXNzaW9uTm90Q3JlYXRlZEVycm9yJyxcbiAgICBlcnJvck1zZzogJ0EgbmV3IHNlc3Npb24gY291bGQgbm90IGJlIGNyZWF0ZWQuJyxcbiAgICBlcnJvcjogJ3Nlc3Npb24gbm90IGNyZWF0ZWQnLFxuICAgIGVycm9yQ29kZTogMzNcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ01vdmVUYXJnZXRPdXRPZkJvdW5kc0Vycm9yJyxcbiAgICBlcnJvck1zZzogJ1RhcmdldCBwcm92aWRlZCBmb3IgYSBtb3ZlIGFjdGlvbiBpcyBvdXQgb2YgYm91bmRzLicsXG4gICAgZXJyb3I6ICdtb3ZlIHRhcmdldCBvdXQgb2YgYm91bmRzJyxcbiAgICBlcnJvckNvZGU6IDM0XG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdOb1N1Y2hBbGVydEVycm9yJyxcbiAgICBlcnJvck1zZzogJ0FuIGF0dGVtcHQgd2FzIG1hZGUgdG8gb3BlcmF0ZSBvbiBhIG1vZGFsIGRpYWxvZyB3aGVuIG9uZSB3YXMgbm90IG9wZW4uJyxcbiAgICBlcnJvcjogJ25vIHN1Y2ggYWxlcnQnLFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnTm9TdWNoQ29va2llRXJyb3InLFxuICAgIGVycm9yTXNnOiAnTm8gY29va2llIG1hdGNoaW5nIHRoZSBnaXZlbiBwYXRoIG5hbWUgd2FzIGZvdW5kIGFtb25nc3QgdGhlIGFzc29jaWF0ZWQgY29va2llcyBvZiB0aGUgY3VycmVudCBicm93c2luZyBjb250ZXh04oCZcyBhY3RpdmUgZG9jdW1lbnQnLFxuICAgIGVycm9yOiAnbm8gc3VjaCBjb29raWUnLFxuICB9LFxuICB7XG4gICAgZXJyb3JOYW1lOiAnTm90WWV0SW1wbGVtZW50ZWRFcnJvcicsXG4gICAgZXJyb3JNc2c6ICdNZXRob2QgaGFzIG5vdCB5ZXQgYmVlbiBpbXBsZW1lbnRlZCcsXG4gICAgZXJyb3I6ICd1bmtub3duIG1ldGhvZCcsXG4gICAgZXJyb3JDb2RlOiA0MDVcbiAgfSxcbiAge1xuICAgIGVycm9yTmFtZTogJ1Vua25vd25Db21tYW5kRXJyb3InLFxuICAgIGVycm9yTXNnOiAnVGhlIHJlcXVlc3RlZCByZXNvdXJjZSBjb3VsZCBub3QgYmUgZm91bmQsIG9yIGEgcmVxdWVzdCB3YXMgcmVjZWl2ZWQgdXNpbmcgYW4gSFRUUCBtZXRob2QgdGhhdCBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBtYXBwZWQgcmVzb3VyY2UuJyxcbiAgICBlcnJvcjogJ3Vua25vd24gY29tbWFuZCcsXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdVbmtub3duTWV0aG9kRXJyb3InLFxuICAgIGVycm9yTXNnOiAnVGhlIHJlcXVlc3RlZCBjb21tYW5kIG1hdGNoZWQgYSBrbm93biBVUkwgYnV0IGRpZCBub3QgbWF0Y2ggYW4gbWV0aG9kIGZvciB0aGF0IFVSTCcsXG4gICAgZXJyb3I6ICd1bmtub3duIG1ldGhvZCcsXG4gIH0sXG4gIHtcbiAgICBlcnJvck5hbWU6ICdVbnN1cHBvcnRlZE9wZXJhdGlvbkVycm9yJyxcbiAgICBlcnJvck1zZzogJ0Egc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQuIENvbW1hbmQgY2Fubm90IGJlIHN1cHBvcnRlZC4nLFxuICAgIGVycm9yOiAndW5zdXBwb3J0ZWQgb3BlcmF0aW9uJyxcbiAgfSxcbl07XG5cbmRlc2NyaWJlKCdlcnJvcnMnLCBmdW5jdGlvbiAoKSB7XG4gIGZvciAobGV0IGVycm9yIG9mIGVycm9yc0xpc3QpIHtcbiAgICBpdChlcnJvci5lcnJvck5hbWUgKyAnIHNob3VsZCBoYXZlIGEgSlNPTldQIGNvZGUgb3IgVzNDIGNvZGUgYW5kIG1lc3NhZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoZXJyb3IuZXJyb3JDb2RlKSB7XG4gICAgICAgIG5ldyBlcnJvcnNbZXJyb3IuZXJyb3JOYW1lXSgpXG4gICAgICAgICAgLnNob3VsZC5oYXZlLnByb3BlcnR5KCdqc29ud3BDb2RlJywgZXJyb3IuZXJyb3JDb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBlcnJvcnNbZXJyb3IuZXJyb3JOYW1lXSgpXG4gICAgICAgICAgLnNob3VsZC5oYXZlLnByb3BlcnR5KCdlcnJvcicsIGVycm9yLmVycm9yKTtcbiAgICAgIH1cbiAgICAgIG5ldyBlcnJvcnNbZXJyb3IuZXJyb3JOYW1lXSgpXG4gICAgICAgIC5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnbWVzc2FnZScsIGVycm9yLmVycm9yTXNnKTtcbiAgICB9KTtcbiAgfVxuICBpdCgnQmFkUGFyYW1ldGVyc0Vycm9yIHNob3VsZCBub3QgaGF2ZSBjb2RlIGFuZCBzaG91bGQgaGF2ZSBtZXNzZycsIGZ1bmN0aW9uICgpIHtcbiAgICBuZXcgZXJyb3JzLkJhZFBhcmFtZXRlcnNFcnJvcigpXG4gICAgICAuc2hvdWxkLm5vdC5oYXZlLnByb3BlcnR5KCdqc29ud3BDb2RlJyk7XG4gICAgbmV3IGVycm9ycy5CYWRQYXJhbWV0ZXJzRXJyb3IoKVxuICAgICAgLnNob3VsZC5oYXZlLnByb3BlcnR5KCdtZXNzYWdlJyk7XG4gIH0pO1xuICBpdCgnUHJveHlSZXF1ZXN0RXJyb3Igc2hvdWxkIGhhdmUgbWVzc2FnZSBhbmQganNvbndwJywgZnVuY3Rpb24gKCkge1xuICAgIG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoKVxuICAgICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ2pzb253cCcpO1xuICAgIG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoKVxuICAgICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgfSk7XG59KTtcbmRlc2NyaWJlKCdlcnJvckZyb21NSlNPTldQU3RhdHVzQ29kZScsIGZ1bmN0aW9uICgpIHtcbiAgZm9yIChsZXQgZXJyb3Igb2YgZXJyb3JzTGlzdCkge1xuICAgIGlmIChlcnJvci5lcnJvck5hbWUgIT09ICdOb3RZZXRJbXBsZW1lbnRlZEVycm9yJykge1xuICAgICAgaXQoZXJyb3IuZXJyb3JDb2RlICsgJyBzaG91bGQgcmV0dXJuIGNvcnJlY3QgZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlcnJvci5lcnJvckNvZGUpIHtcbiAgICAgICAgICBlcnJvckZyb21NSlNPTldQU3RhdHVzQ29kZShlcnJvci5lcnJvckNvZGUpXG4gICAgICAgICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ2pzb253cENvZGUnLCBlcnJvci5lcnJvckNvZGUpO1xuICAgICAgICAgIGVycm9yRnJvbU1KU09OV1BTdGF0dXNDb2RlKGVycm9yLmVycm9yQ29kZSlcbiAgICAgICAgICAgIC5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnbWVzc2FnZScsIGVycm9yLmVycm9yTXNnKTtcbiAgICAgICAgICBpZiAoIV8uaW5jbHVkZXMoWzEzLCAzM10sIGVycm9yLmVycm9yQ29kZSkpIHtcbiAgICAgICAgICAgIGVycm9yRnJvbU1KU09OV1BTdGF0dXNDb2RlKGVycm9yLmVycm9yQ29kZSwgJ2FiY2QnKVxuICAgICAgICAgICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ2pzb253cENvZGUnLCBlcnJvci5lcnJvckNvZGUpO1xuICAgICAgICAgICAgZXJyb3JGcm9tTUpTT05XUFN0YXR1c0NvZGUoZXJyb3IuZXJyb3JDb2RlLCAnYWJjZCcpXG4gICAgICAgICAgICAgIC5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnbWVzc2FnZScsICdhYmNkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzRXJyb3JUeXBlKGVycm9yRnJvbU1KU09OV1BTdGF0dXNDb2RlKGVycm9yLmVycm9yQ29kZSksIGVycm9ycy5Vbmtub3duRXJyb3IpLnNob3VsZC5iZS50cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgaXQoJ3Nob3VsZCB0aHJvdyB1bmtub3duIGVycm9yIGZvciB1bmtub3duIGNvZGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgZXJyb3JGcm9tTUpTT05XUFN0YXR1c0NvZGUoOTkpXG4gICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ2pzb253cENvZGUnLCAxMyk7XG4gICAgZXJyb3JGcm9tTUpTT05XUFN0YXR1c0NvZGUoOTkpXG4gICAgICAuc2hvdWxkLmhhdmUucHJvcGVydHkoJ21lc3NhZ2UnLCAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3aGlsZSBwcm9jZXNzaW5nIHRoZSBjb21tYW5kLicpO1xuICB9KTtcbn0pO1xuZGVzY3JpYmUoJ2Vycm9yRnJvbVczQ0pzb25Db2RlJywgZnVuY3Rpb24gKCkge1xuICBmb3IgKGxldCBlcnJvciBvZiBlcnJvcnNMaXN0KSB7XG4gICAgaWYgKGVycm9yLmVycm9yTmFtZSAhPT0gJ05vdFlldEltcGxlbWVudGVkRXJyb3InKSB7XG4gICAgICBpdChlcnJvci5lcnJvck5hbWUgKyAnIHNob3VsZCByZXR1cm4gY29ycmVjdCBlcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qge2Vycm9yOiB3M2NFcnJvcn0gPSBlcnJvcjtcbiAgICAgICAgaWYgKHczY0Vycm9yKSB7XG4gICAgICAgICAgZXJyb3JGcm9tVzNDSnNvbkNvZGUodzNjRXJyb3IpLmVycm9yLnNob3VsZC5lcXVhbChlcnJvci5lcnJvcik7XG4gICAgICAgICAgZXJyb3JGcm9tVzNDSnNvbkNvZGUodzNjRXJyb3IpLnNob3VsZC5oYXZlLnByb3BlcnR5KCdtZXNzYWdlJywgZXJyb3IuZXJyb3JNc2cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzRXJyb3JUeXBlKGVycm9yRnJvbVczQ0pzb25Db2RlKHczY0Vycm9yKSwgZXJyb3JzLlVua25vd25FcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpdCgnc2hvdWxkIHBhcnNlIHVua25vd24gZXJyb3JzJywgZnVuY3Rpb24gKCkge1xuICAgIGlzRXJyb3JUeXBlKGVycm9yRnJvbVczQ0pzb25Db2RlKCdub3QgYSByZWFsIGVycm9yIGNvZGUnKSwgZXJyb3JzLlVua25vd25FcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgZXJyb3JGcm9tVzNDSnNvbkNvZGUoJ25vdCBhIHJlYWwgZXJyb3IgY29kZScpLm1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9BbiB1bmtub3duIHNlcnZlci1zaWRlIGVycm9yIG9jY3VycmVkLyk7XG4gICAgZXJyb3JGcm9tVzNDSnNvbkNvZGUoJ25vdCBhIHJlYWwgZXJyb3IgY29kZScpLmVycm9yLnNob3VsZC5lcXVhbCgndW5rbm93biBlcnJvcicpO1xuICB9KTtcbn0pO1xuZGVzY3JpYmUoJ3czYyBTdGF0dXMgQ29kZXMnLCBmdW5jdGlvbiAoKSB7XG4gIGl0KCdzaG91bGQgbWF0Y2ggdGhlIGNvcnJlY3QgZXJyb3IgY29kZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IG5vbjQwMEVycm9ycyA9IFtcbiAgICAgIFsnTm9TdWNoRHJpdmVyRXJyb3InLCA0MDRdLFxuICAgICAgWydOb1N1Y2hGcmFtZUVycm9yJywgNDA0XSxcbiAgICAgIFsnTm9BbGVydE9wZW5FcnJvcicsIDQwNF0sXG4gICAgICBbJ05vU3VjaFdpbmRvd0Vycm9yJywgNDA0XSxcbiAgICAgIFsnU3RhbGVFbGVtZW50UmVmZXJlbmNlRXJyb3InLCA0MDRdLFxuICAgICAgWydKYXZhU2NyaXB0RXJyb3InLCA1MDBdLFxuICAgICAgWydNb3ZlVGFyZ2V0T3V0T2ZCb3VuZHNFcnJvcicsIDUwMF0sXG4gICAgICBbJ05vU3VjaENvb2tpZUVycm9yJywgNDA0XSxcbiAgICAgIFsnTm9TdWNoRWxlbWVudEVycm9yJywgNDA0XSxcbiAgICAgIFsnU2NyaXB0VGltZW91dEVycm9yJywgNDA4XSxcbiAgICAgIFsnU2Vzc2lvbk5vdENyZWF0ZWRFcnJvcicsIDUwMF0sXG4gICAgICBbJ1RpbWVvdXRFcnJvcicsIDQwOF0sXG4gICAgICBbJ1VuYWJsZVRvU2V0Q29va2llRXJyb3InLCA1MDBdLFxuICAgICAgWydVbmFibGVUb0NhcHR1cmVTY3JlZW4nLCA1MDBdLFxuICAgICAgWydVbmV4cGVjdGVkQWxlcnRPcGVuRXJyb3InLCA1MDBdLFxuICAgICAgWydVbmtub3duQ29tbWFuZEVycm9yJywgNDA0XSxcbiAgICAgIFsnVW5rbm93bkVycm9yJywgNTAwXSxcbiAgICAgIFsnVW5rbm93bk1ldGhvZEVycm9yJywgNDA1XSxcbiAgICAgIFsnVW5zdXBwb3J0ZWRPcGVyYXRpb25FcnJvcicsIDUwMF0sXG4gICAgXTtcblxuICAgIC8vIFRlc3QgdGhlIGVycm9ycyB0aGF0IHdlIGRvbid0IGV4cGVjdCB0byByZXR1cm4gNDAwIGNvZGVcbiAgICBmb3IgKGxldCBbZXJyb3JOYW1lLCBleHBlY3RlZEVycm9yQ29kZV0gb2Ygbm9uNDAwRXJyb3JzKSB7XG4gICAgICBlcnJvcnNbZXJyb3JOYW1lXS5zaG91bGQuZXhpc3Q7XG4gICAgICAobmV3IGVycm9yc1tlcnJvck5hbWVdKCkpLnNob3VsZC5oYXZlLnByb3BlcnR5KCd3M2NTdGF0dXMnLCBleHBlY3RlZEVycm9yQ29kZSk7XG4gICAgfVxuXG4gICAgLy8gVGVzdCBhbiBlcnJvciB0aGF0IHdlIGV4cGVjdCB0byByZXR1cm4gNDAwIGNvZGVcbiAgICAobmV3IGVycm9ycy5FbGVtZW50Q2xpY2tJbnRlcmNlcHRlZEVycm9yKCkpLnNob3VsZC5oYXZlLnByb3BlcnR5KCd3M2NTdGF0dXMnLCA0MDApO1xuICB9KTtcbn0pO1xuZGVzY3JpYmUoJy5nZXRSZXNwb25zZUZvclczQ0Vycm9yJywgZnVuY3Rpb24gKCkge1xuICBpdCgnc2hvdWxkIHJldHVybiBhbiBlcnJvciwgbWVzc2FnZSBhbmQgc3RhY2t0cmFjZSBmb3IganVzdCBhIGdlbmVyaWMgZXhjZXB0aW9uJywgZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbWUgcmFuZG9tIGVycm9yJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgW2h0dHBTdGF0dXMsIGh0dHBSZXNwb25zZUJvZHldID0gZ2V0UmVzcG9uc2VGb3JXM0NFcnJvcihlKTtcbiAgICAgIGh0dHBTdGF0dXMuc2hvdWxkLmVxdWFsKDUwMCk7XG4gICAgICBjb25zdCB7ZXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gaHR0cFJlc3BvbnNlQm9keS52YWx1ZTtcbiAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9Tb21lIHJhbmRvbSBlcnJvci8pO1xuICAgICAgZXJyb3Iuc2hvdWxkLmVxdWFsKCd1bmtub3duIGVycm9yJyk7XG4gICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvYXQgZ2V0UmVzcG9uc2VGb3JXM0NFcnJvci8pO1xuICAgICAgc3RhY2t0cmFjZS5zaG91bGQubWF0Y2goL1NvbWUgcmFuZG9tIGVycm9yLyk7XG4gICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvZXJyb3JzLXNwZWNzLmpzLyk7XG4gICAgfVxuICB9KTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gZXJyb3IsIG1lc3NhZ2UgYW5kIHN0YWNrdHJhY2UgZm9yIGEgTm9TdWNoRWxlbWVudEVycm9yJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IG5vU3VjaEVsZW1lbnRFcnJvciA9IG5ldyBlcnJvcnMuTm9TdWNoRWxlbWVudEVycm9yKCdzcGVjaWZpYyBlcnJvciBtZXNzYWdlJyk7XG4gICAgY29uc3QgW2h0dHBTdGF0dXMsIGh0dHBSZXNwb25zZUJvZHldID0gZ2V0UmVzcG9uc2VGb3JXM0NFcnJvcihub1N1Y2hFbGVtZW50RXJyb3IpO1xuICAgIGh0dHBTdGF0dXMuc2hvdWxkLmVxdWFsKDQwNCk7XG4gICAgY29uc3Qge2Vycm9yLCBtZXNzYWdlLCBzdGFja3RyYWNlfSA9IGh0dHBSZXNwb25zZUJvZHkudmFsdWU7XG4gICAgZXJyb3Iuc2hvdWxkLmVxdWFsKCdubyBzdWNoIGVsZW1lbnQnKTtcbiAgICBtZXNzYWdlLnNob3VsZC5tYXRjaCgvc3BlY2lmaWMgZXJyb3IgbWVzc2FnZS8pO1xuICAgIHN0YWNrdHJhY2Uuc2hvdWxkLm1hdGNoKC9lcnJvcnMtc3BlY3MuanMvKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgaGFuZGxlIEJhZFBhcmFtZXRlcnNFcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBiYWRQYXJhbXNFcnJvciA9IG5ldyBlcnJvcnMuQmFkUGFyYW1ldGVyc0Vycm9yKCdfX0ZPT19fJywgJ19fQkFSX18nLCAnX19IRUxMT19XT1JMRF9fJyk7XG4gICAgY29uc3QgW2h0dHBTdGF0dXMsIGh0dHBSZXNwb25zZUJvZHldID0gZ2V0UmVzcG9uc2VGb3JXM0NFcnJvcihiYWRQYXJhbXNFcnJvcik7XG4gICAgaHR0cFN0YXR1cy5zaG91bGQuZXF1YWwoNDAwKTtcbiAgICBjb25zdCB7ZXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gaHR0cFJlc3BvbnNlQm9keS52YWx1ZTtcbiAgICBlcnJvci5zaG91bGQuZXF1YWwoJ2ludmFsaWQgYXJndW1lbnQnKTtcbiAgICBtZXNzYWdlLnNob3VsZC5tYXRjaCgvX19CQVJfXy8pO1xuICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9fX0hFTExPX1dPUkxEX18vKTtcbiAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvZXJyb3JzLXNwZWNzLmpzLyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHRyYW5zbGF0ZSBKU09OV1AgZXJyb3JzJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IFtodHRwU3RhdHVzLCBodHRwUmVzcG9uc2VCb2R5XSA9IGdldFJlc3BvbnNlRm9yVzNDRXJyb3Ioe1xuICAgICAgc3RhdHVzOiA3LFxuICAgICAgdmFsdWU6ICdNeSBjdXN0b20gbWVzc2FnZScsXG4gICAgICBzZXNzaW9uSWQ6ICdGYWtlIFNlc3Npb24gSWQnLFxuICAgIH0pO1xuICAgIGh0dHBTdGF0dXMuc2hvdWxkLmVxdWFsKDQwNCk7XG4gICAgY29uc3Qge2Vycm9yLCBtZXNzYWdlLCBzdGFja3RyYWNlfSA9IGh0dHBSZXNwb25zZUJvZHkudmFsdWU7XG4gICAgbWVzc2FnZS5zaG91bGQuZXF1YWwoJ015IGN1c3RvbSBtZXNzYWdlJyk7XG4gICAgZXJyb3Iuc2hvdWxkLmVxdWFsKCdubyBzdWNoIGVsZW1lbnQnKTtcbiAgICBzdGFja3RyYWNlLnNob3VsZC5leGlzdDtcbiAgfSk7XG59KTtcbmRlc2NyaWJlKCcuZ2V0QWN0dWFsRXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdNSlNPTldQJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgbWFwIGEgc3RhdHVzIGNvZGUgNyBubyBzdWNoIGVsZW1lbnQgZXJyb3IgYXMgYSBOb1N1Y2hFbGVtZW50RXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhY3R1YWxFcnJvciA9IG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoJ0Vycm9yIG1lc3NhZ2UgZG9lcyBub3QgbWF0dGVyJywge1xuICAgICAgICB2YWx1ZTogJ2RvZXMgbm90IG1hdHRlcicsXG4gICAgICAgIHN0YXR1czogNyxcbiAgICAgIH0pLmdldEFjdHVhbEVycm9yKCk7XG4gICAgICBpc0Vycm9yVHlwZShhY3R1YWxFcnJvciwgZXJyb3JzLk5vU3VjaEVsZW1lbnRFcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBtYXAgYSBzdGF0dXMgY29kZSAxMCwgU3RhbGVFbGVtZW50UmVmZXJlbmNlRXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhY3R1YWxFcnJvciA9IG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoJ0Vycm9yIG1lc3NhZ2UgZG9lcyBub3QgbWF0dGVyJywge1xuICAgICAgICB2YWx1ZTogJ0RvZXMgbm90IG1hdHRlcicsXG4gICAgICAgIHN0YXR1czogMTAsXG4gICAgICB9KS5nZXRBY3R1YWxFcnJvcigpO1xuICAgICAgaXNFcnJvclR5cGUoYWN0dWFsRXJyb3IsIGVycm9ycy5TdGFsZUVsZW1lbnRSZWZlcmVuY2VFcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBtYXAgYW4gdW5rbm93biBlcnJvciB0byBVbmtub3duRXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhY3R1YWxFcnJvciA9IG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoJ0Vycm9yIG1lc3NhZ2UgZG9lcyBub3QgbWF0dGVyJywge1xuICAgICAgICB2YWx1ZTogJ0RvZXMgbm90IG1hdHRlcicsXG4gICAgICAgIHN0YXR1czogLTEwMFxuICAgICAgfSkuZ2V0QWN0dWFsRXJyb3IoKTtcbiAgICAgIGlzRXJyb3JUeXBlKGFjdHVhbEVycm9yLCBlcnJvcnMuVW5rbm93bkVycm9yKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHBhcnNlIGEgSlNPTiBzdHJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhY3R1YWxFcnJvciA9IG5ldyBlcnJvcnMuUHJveHlSZXF1ZXN0RXJyb3IoJ0Vycm9yIG1lc3NhZ2UgZG9lcyBub3QgbWF0dGVyJywgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICB2YWx1ZTogJ0RvZXMgbm90IG1hdHRlcicsXG4gICAgICAgIHN0YXR1czogLTEwMFxuICAgICAgfSkpLmdldEFjdHVhbEVycm9yKCk7XG4gICAgICBpc0Vycm9yVHlwZShhY3R1YWxFcnJvciwgZXJyb3JzLlVua25vd25FcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdXM0MnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBtYXAgYSA0MDQgbm8gc3VjaCBlbGVtZW50IGVycm9yIGFzIGEgTm9TdWNoRWxlbWVudEVycm9yJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWN0dWFsRXJyb3IgPSBuZXcgZXJyb3JzLlByb3h5UmVxdWVzdEVycm9yKCdFcnJvciBtZXNzYWdlIGRvZXMgbm90IG1hdHRlcicsIHtcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBlcnJvcjogZXJyb3JzLk5vU3VjaEVsZW1lbnRFcnJvci5lcnJvcigpLFxuICAgICAgICB9LFxuICAgICAgfSwgSFRUUFN0YXR1c0NvZGVzLk5PVF9GT1VORCkuZ2V0QWN0dWFsRXJyb3IoKTtcbiAgICAgIGlzRXJyb3JUeXBlKGFjdHVhbEVycm9yLCBlcnJvcnMuTm9TdWNoRWxlbWVudEVycm9yKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG1hcCBhIDQwMCBTdGFsZUVsZW1lbnRSZWZlcmVuY2VFcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGFjdHVhbEVycm9yID0gbmV3IGVycm9ycy5Qcm94eVJlcXVlc3RFcnJvcignRXJyb3IgbWVzc2FnZSBkb2VzIG5vdCBtYXR0ZXInLCB7XG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgZXJyb3I6IGVycm9ycy5TdGFsZUVsZW1lbnRSZWZlcmVuY2VFcnJvci5lcnJvcigpLFxuXG4gICAgICAgIH0sXG4gICAgICB9LCBIVFRQU3RhdHVzQ29kZXMuQkFEX1JFUVVFU1QpLmdldEFjdHVhbEVycm9yKCk7XG4gICAgICBpc0Vycm9yVHlwZShhY3R1YWxFcnJvciwgZXJyb3JzLlN0YWxlRWxlbWVudFJlZmVyZW5jZUVycm9yKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG1hcCBhbiB1bmtub3duIGVycm9yIHRvIFVua25vd25FcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGFjdHVhbEVycm9yID0gbmV3IGVycm9ycy5Qcm94eVJlcXVlc3RFcnJvcignRXJyb3IgbWVzc2FnZSBkb2VzIG5vdCBtYXR0ZXInLCBudWxsLCB7XG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgZXJyb3I6ICdOb3QgYSB2YWxpZCB3M2MgSlNPTiBjb2RlJ1xuXG4gICAgICAgIH0sXG4gICAgICB9LCA0NTYpLmdldEFjdHVhbEVycm9yKCk7XG4gICAgICBpc0Vycm9yVHlwZShhY3R1YWxFcnJvciwgZXJyb3JzLlVua25vd25FcnJvcikuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBwYXJzZSBhIEpTT04gc3RyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWN0dWFsRXJyb3IgPSBuZXcgZXJyb3JzLlByb3h5UmVxdWVzdEVycm9yKCdFcnJvciBtZXNzYWdlIGRvZXMgbm90IG1hdHRlcicsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBlcnJvcjogZXJyb3JzLlN0YWxlRWxlbWVudFJlZmVyZW5jZUVycm9yLmVycm9yKCksXG5cbiAgICAgICAgfSxcbiAgICAgIH0pLCBIVFRQU3RhdHVzQ29kZXMuQkFEX1JFUVVFU1QpLmdldEFjdHVhbEVycm9yKCk7XG4gICAgICBpc0Vycm9yVHlwZShhY3R1YWxFcnJvciwgZXJyb3JzLlN0YWxlRWxlbWVudFJlZmVyZW5jZUVycm9yKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9wcm90b2NvbC9lcnJvcnMtc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
