"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.allowCrossDomain = allowCrossDomain;
exports.fixPythonContentType = fixPythonContentType;
exports.defaultToJSONContentType = defaultToJSONContentType;
exports.catchAllHandler = catchAllHandler;
exports.catch404Handler = catch404Handler;
exports.catch4XXHandler = catch4XXHandler;
exports.allowCrossDomainAsyncExecute = allowCrossDomainAsyncExecute;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _protocol = require("../protocol");

function allowCrossDomain(req, res, next) {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, X-Requested-With, Content-Type, Accept, User-Agent');

    if ('OPTIONS' === req.method) {
      return res.sendStatus(200);
    }
  } catch (err) {
    _logger.default.error(`Unexpected error: ${err.stack}`);
  }

  next();
}

function allowCrossDomainAsyncExecute(basePath) {
  return (req, res, next) => {
    const receiveAsyncResponseRegExp = new RegExp(`${_lodash.default.escapeRegExp(basePath)}/session/[a-f0-9-]+/(appium/)?receive_async_response`);

    if (!receiveAsyncResponseRegExp.test(req.url)) {
      return next();
    }

    allowCrossDomain(req, res, next);
  };
}

function fixPythonContentType(basePath) {
  return (req, res, next) => {
    if (new RegExp(`^${_lodash.default.escapeRegExp(basePath)}`).test(req.path) && /^Python/.test(req.headers['user-agent'])) {
      if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        req.headers['content-type'] = 'application/json; charset=utf-8';
      }
    }

    next();
  };
}

function defaultToJSONContentType(req, res, next) {
  if (!req.headers['content-type']) {
    req.headers['content-type'] = 'application/json; charset=utf-8';
  }

  next();
}

function catchAllHandler(err, req, res, next) {
  _logger.default.error(`Uncaught error: ${err.message}`);

  _logger.default.error('Sending generic error response');

  try {
    res.status(500).send({
      status: _protocol.errors.UnknownError.code(),
      value: `ERROR running Appium command: ${err.message}`
    });

    _logger.default.error(err);
  } catch (ign) {
    next(ign);
  }
}

function catch4XXHandler(err, req, res, next) {
  if (err.status >= 400 && err.status < 500) {
    _logger.default.debug(`Setting content type to 'text/plain' for HTTP status '${err.status}'`);

    res.set('content-type', 'text/plain');
    res.status(err.status).send(`Unable to process request: ${err.message}`);
  } else {
    next(err);
  }
}

function catch404Handler(req, res) {
  _logger.default.debug('No route found. Setting content type to \'text/plain\'');

  res.set('content-type', 'text/plain');
  res.status(404).send(`The URL '${req.originalUrl}' did not map to a valid resource`);
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9leHByZXNzL21pZGRsZXdhcmUuanMiXSwibmFtZXMiOlsiYWxsb3dDcm9zc0RvbWFpbiIsInJlcSIsInJlcyIsIm5leHQiLCJoZWFkZXIiLCJtZXRob2QiLCJzZW5kU3RhdHVzIiwiZXJyIiwibG9nIiwiZXJyb3IiLCJzdGFjayIsImFsbG93Q3Jvc3NEb21haW5Bc3luY0V4ZWN1dGUiLCJiYXNlUGF0aCIsInJlY2VpdmVBc3luY1Jlc3BvbnNlUmVnRXhwIiwiUmVnRXhwIiwiXyIsImVzY2FwZVJlZ0V4cCIsInRlc3QiLCJ1cmwiLCJmaXhQeXRob25Db250ZW50VHlwZSIsInBhdGgiLCJoZWFkZXJzIiwiZGVmYXVsdFRvSlNPTkNvbnRlbnRUeXBlIiwiY2F0Y2hBbGxIYW5kbGVyIiwibWVzc2FnZSIsInN0YXR1cyIsInNlbmQiLCJlcnJvcnMiLCJVbmtub3duRXJyb3IiLCJjb2RlIiwidmFsdWUiLCJpZ24iLCJjYXRjaDRYWEhhbmRsZXIiLCJkZWJ1ZyIsInNldCIsImNhdGNoNDA0SGFuZGxlciIsIm9yaWdpbmFsVXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUdBLFNBQVNBLGdCQUFULENBQTJCQyxHQUEzQixFQUFnQ0MsR0FBaEMsRUFBcUNDLElBQXJDLEVBQTJDO0FBQ3pDLE1BQUk7QUFDRkQsSUFBQUEsR0FBRyxDQUFDRSxNQUFKLENBQVcsNkJBQVgsRUFBMEMsR0FBMUM7QUFDQUYsSUFBQUEsR0FBRyxDQUFDRSxNQUFKLENBQVcsOEJBQVgsRUFBMkMsaUNBQTNDO0FBQ0FGLElBQUFBLEdBQUcsQ0FBQ0UsTUFBSixDQUFXLDhCQUFYLEVBQTJDLG1GQUEzQzs7QUFHQSxRQUFJLGNBQWNILEdBQUcsQ0FBQ0ksTUFBdEIsRUFBOEI7QUFDNUIsYUFBT0gsR0FBRyxDQUFDSSxVQUFKLENBQWUsR0FBZixDQUFQO0FBQ0Q7QUFDRixHQVRELENBU0UsT0FBT0MsR0FBUCxFQUFZO0FBQ1pDLG9CQUFJQyxL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QUFHLENBQUNrQixNQUFmLEVBQXVCQyxJQUF2QixDQUE2Qiw4QkFBNkJuQixHQUFHLENBQUNpQixPQUFRLEVBQXRFO0FBQ0QsR0FORCxNQU1PO0FBQ0xyQixJQUFBQSxJQUFJLENBQUNJLEdBQUQsQ0FBSjtBQUNEO0FBQ0Y7O0FBRUQsU0FBUzRCLGVBQVQsQ0FBMEJsQyxHQUExQixFQUErQkMsR0FBL0IsRUFBb0M7QUFHbENNLGtCQUFJeUIsS0FBSixDQUFVLHdEQUFWOztBQUNBL0IsRUFBQUEsR0FBRyxDQUFDZ0MsR0FBSixDQUFRLGNBQVIsRUFBd0IsWUFBeEI7QUFDQWhDLEVBQUFBLEdBQUcsQ0FBQ3VCLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxJQUFoQixDQUFzQixZQUFXekIsR0FBRyxDQUFDbUMsV0FBWSxtQ0FBakQ7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJy4uL3Byb3RvY29sJztcblxuXG5mdW5jdGlvbiBhbGxvd0Nyb3NzRG9tYWluIChyZXEsIHJlcywgbmV4dCkge1xuICB0cnkge1xuICAgIHJlcy5oZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcycsICdHRVQsIFBPU1QsIFBVVCwgT1BUSU9OUywgREVMRVRFJyk7XG4gICAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDYWNoZS1Db250cm9sLCBQcmFnbWEsIE9yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIFVzZXItQWdlbnQnKTtcblxuICAgIC8vIG5lZWQgdG8gcmVzcG9uZCAyMDAgdG8gT1BUSU9OU1xuICAgIGlmICgnT1BUSU9OUycgPT09IHJlcS5tZXRob2QpIHtcbiAgICAgIHJldHVybiByZXMuc2VuZFN0YXR1cygyMDApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLmVycm9yKGBVbmV4cGVjdGVkIGVycm9yOiAke2Vyci5zdGFja31gKTtcbiAgfVxuICBuZXh0KCk7XG59XG5cbmZ1bmN0aW9uIGFsbG93Q3Jvc3NEb21haW5Bc3luY0V4ZWN1dGUgKGJhc2VQYXRoKSB7XG4gIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAvLyB0aGVyZSBhcmUgdHdvIHBhdGhzIGZvciBhc3luYyByZXNwb25zZXMsIHNvIGNvdmVyIGJvdGhcbiAgICAvLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yL3R4WWlFei8xXG4gICAgY29uc3QgcmVjZWl2ZUFzeW5jUmVzcG9uc2VSZWdFeHAgPSBuZXcgUmVnRXhwKGAke18uZXNjYXBlUmVnRXhwKGJhc2VQYXRoKX0vc2Vzc2lvbi9bYS1mMC05LV0rLyhhcHBpdW0vKT9yZWNlaXZlX2FzeW5jX3Jlc3BvbnNlYCk7XG4gICAgaWYgKCFyZWNlaXZlQXN5bmNSZXNwb25zZVJlZ0V4cC50ZXN0KHJlcS51cmwpKSB7XG4gICAgICByZXR1cm4gbmV4dCgpO1xuICAgIH1cbiAgICBhbGxvd0Nyb3NzRG9tYWluKHJlcSwgcmVzLCBuZXh0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZml4UHl0aG9uQ29udGVudFR5cGUgKGJhc2VQYXRoKSB7XG4gIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAvLyBoYWNrIGJlY2F1c2UgcHl0aG9uIGNsaWVudCBsaWJyYXJ5IGdpdmVzIHVzIHdyb25nIGNvbnRlbnQtdHlwZVxuICAgIGlmIChuZXcgUmVnRXhwKGBeJHtfLmVzY2FwZVJlZ0V4cChiYXNlUGF0aCl9YCkudGVzdChyZXEucGF0aCkgJiYgL15QeXRob24vLnRlc3QocmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXSkpIHtcbiAgICAgIGlmIChyZXEuaGVhZGVyc1snY29udGVudC10eXBlJ10gPT09ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKSB7XG4gICAgICAgIHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JztcbiAgICAgIH1cbiAgICB9XG4gICAgbmV4dCgpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0VG9KU09OQ29udGVudFR5cGUgKHJlcSwgcmVzLCBuZXh0KSB7XG4gIGlmICghcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKSB7XG4gICAgcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnO1xuICB9XG4gIG5leHQoKTtcbn1cblxuZnVuY3Rpb24gY2F0Y2hBbGxIYW5kbGVyIChlcnIsIHJlcSwgcmVzLCBuZXh0KSB7XG4gIGxvZy5lcnJvcihgVW5jYXVnaHQgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIGxvZy5lcnJvcignU2VuZGluZyBnZW5lcmljIGVycm9yIHJlc3BvbnNlJyk7XG4gIHRyeSB7XG4gICAgcmVzLnN0YXR1cyg1MDApLnNlbmQoe1xuICAgICAgc3RhdHVzOiBlcnJvcnMuVW5rbm93bkVycm9yLmNvZGUoKSxcbiAgICAgIHZhbHVlOiBgRVJST1IgcnVubmluZyBBcHBpdW0gY29tbWFuZDogJHtlcnIubWVzc2FnZX1gXG4gICAgfSk7XG4gICAgbG9nLmVycm9yKGVycik7XG4gIH0gY2F0Y2ggKGlnbikge1xuICAgIG5leHQoaWduKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYXRjaDRYWEhhbmRsZXIgKGVyciwgcmVxLCByZXMsIG5leHQpIHtcbiAgaWYgKGVyci5zdGF0dXMgPj0gNDAwICYmIGVyci5zdGF0dXMgPCA1MDApIHtcbiAgICAvLyBzZXQgdGhlIGNvbnRlbnQgdHlwZSB0byBgdGV4dC9wbGFpbmBcbiAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3NlbGVuaXVtL3dpa2kvSnNvbldpcmVQcm90b2NvbCNSZXNwb25zZXNcbiAgICBsb2cuZGVidWcoYFNldHRpbmcgY29udGVudCB0eXBlIHRvICd0ZXh0L3BsYWluJyBmb3IgSFRUUCBzdGF0dXMgJyR7ZXJyLnN0YXR1c30nYCk7XG4gICAgcmVzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW4nKTtcbiAgICByZXMuc3RhdHVzKGVyci5zdGF0dXMpLnNlbmQoYFVuYWJsZSB0byBwcm9jZXNzIHJlcXVlc3Q6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH0gZWxzZSB7XG4gICAgbmV4dChlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhdGNoNDA0SGFuZGxlciAocmVxLCByZXMpIHtcbiAgLy8gc2V0IHRoZSBjb250ZW50IHR5cGUgdG8gYHRleHQvcGxhaW5gXG4gIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avc2VsZW5pdW0vd2lraS9Kc29uV2lyZVByb3RvY29sI1Jlc3BvbnNlc1xuICBsb2cuZGVidWcoJ05vIHJvdXRlIGZvdW5kLiBTZXR0aW5nIGNvbnRlbnQgdHlwZSB0byBcXCd0ZXh0L3BsYWluXFwnJyk7XG4gIHJlcy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluJyk7XG4gIHJlcy5zdGF0dXMoNDA0KS5zZW5kKGBUaGUgVVJMICcke3JlcS5vcmlnaW5hbFVybH0nIGRpZCBub3QgbWFwIHRvIGEgdmFsaWQgcmVzb3VyY2VgKTtcbn1cblxuZXhwb3J0IHtcbiAgYWxsb3dDcm9zc0RvbWFpbiwgZml4UHl0aG9uQ29udGVudFR5cGUsIGRlZmF1bHRUb0pTT05Db250ZW50VHlwZSxcbiAgY2F0Y2hBbGxIYW5kbGVyLCBjYXRjaDQwNEhhbmRsZXIsIGNhdGNoNFhYSGFuZGxlcixcbiAgYWxsb3dDcm9zc0RvbWFpbkFzeW5jRXhlY3V0ZSxcbn07XG4iXSwiZmlsZSI6ImxpYi9leHByZXNzL21pZGRsZXdhcmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==