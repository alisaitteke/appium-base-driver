"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseCaps = parseCaps;
exports.processCapabilities = processCapabilities;
exports.validateCaps = validateCaps;
exports.mergeCaps = mergeCaps;
exports.findNonPrefixedCaps = findNonPrefixedCaps;
exports.isStandardCap = isStandardCap;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _desiredCaps = require("./desired-caps");

var _appiumSupport = require("appium-support");

var _logger = _interopRequireDefault(require("./logger"));

var _errors = require("../protocol/errors");

function mergeCaps(primary = {}, secondary = {}) {
  let result = Object.assign({}, primary);

  for (let [name, value] of _lodash.default.toPairs(secondary)) {
    if (!_lodash.default.isUndefined(primary[name])) {
      throw new _errors.errors.InvalidArgumentError(`property '${name}' should not exist on both primary (${JSON.stringify(primary)}) and secondary (${JSON.stringify(secondary)}) object`);
    }

    result[name] = value;
  }

  return result;
}

function validateCaps(caps, constraints = {}, opts = {}) {
  let {
    skipPresenceConstraint
  } = opts;

  if (!_lodash.default.isPlainObject(caps)) {
    throw new _errors.errors.InvalidArgumentError(`must be a JSON object`);
  }

  constraints = _lodash.default.cloneDeep(constraints);

  if (skipPresenceConstraint) {
    for (let key of _lodash.default.keys(constraints)) {
      delete constraints[key].presence;
    }
  }

  let validationErrors = _desiredCaps.validator.validate(_lodash.default.pickBy(caps, _appiumSupport.util.hasValue), constraints, {
    fullMessages: false
  });

  if (validationErrors) {
    let message = [];

    for (let [attribute, reasons] of _lodash.default.toPairs(validationErrors)) {
      for (let reason of reasons) {
        message.push(`'${attribute}' ${reason}`);
      }
    }

    throw new _errors.errors.InvalidArgumentError(message.join('; '));
  }

  return caps;
}

const STANDARD_CAPS = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];

function isStandardCap(cap) {
  return !!_lodash.default.find(STANDARD_CAPS, standardCap => standardCap.toLowerCase() === `${cap}`.toLowerCase());
}

function stripAppiumPrefixes(caps) {
  const prefix = 'appium:';

  const prefixedCaps = _lodash.default.filter(_lodash.default.keys(caps), cap => `${cap}`.startsWith(prefix));

  const badPrefixedCaps = [];

  for (let prefixedCap of prefixedCaps) {
    const strippedCapName = prefixedCap.substr(prefix.length);

    if (isStandardCap(strippedCapName)) {
      badPrefixedCaps.push(strippedCapName);
    }

    caps[strippedCapName] = caps[prefixedCap];
    delete caps[prefixedCap];
  }

  if (badPrefixedCaps.length > 0) {
    throw new _errors.errors.InvalidArgumentError(`The capabilities ${JSON.stringify(badPrefixedCaps)} are standard capabilities and should not have the "appium:" prefix`);
  }
}

function findNonPrefixedCaps({
  alwaysMatch = {},
  firstMatch = []
}) {
  return _lodash.default.chain([alwaysMatch, ...firstMatch]).reduce((unprefixedCaps, caps) => [...unprefixedCaps, ...(0, _lodash.default)(caps).keys().filter(cap => !cap.includes(':') && !isStandardCap(cap))], []).uniq().value();
}

function parseCaps(caps, constraints = {}, shouldValidateCaps = true) {
  if (!_lodash.default.isPlainObject(caps)) {
    throw new _errors.errors.InvalidArgumentError('The capabilities argument was not valid for the following reason(s): "capabilities" must be a JSON object.');
  }

  let {
    alwaysMatch: requiredCaps = {},
    firstMatch: allFirstMatchCaps = [{}]
  } = caps;

  if (!_lodash.default.isArray(allFirstMatchCaps)) {
    throw new _errors.errors.InvalidArgumentError('The capabilities.firstMatch argument was not valid for the following reason(s): "capabilities.firstMatch" must be a JSON array or undefined');
  }

  if (allFirstMatchCaps.length === 0) {
    allFirstMatchCaps.push({});
  }

  let nonPrefixedCaps = findNonPrefixedCaps(caps);

  if (!_lodash.default.isEmpty(nonPrefixedCaps)) {
    _logger.default.warn(`The capabilities ${JSON.stringify(nonPrefixedCaps)} are not standard capabilities and should have an extension prefix`);
  }

  stripAppiumPrefixes(requiredCaps);

  for (let firstMatchCaps of allFirstMatchCaps) {
    stripAppiumPrefixes(firstMatchCaps);
  }

  if (shouldValidateCaps) {
    requiredCaps = validateCaps(requiredCaps, constraints, {
      skipPresenceConstraint: true
    });
  }

  let filteredConstraints = { ...constraints
  };

  let requiredCapsKeys = _lodash.default.keys(requiredCaps);

  for (let key of _lodash.default.keys(filteredConstraints)) {
    if (requiredCapsKeys.includes(key)) {
      delete filteredConstraints[key];
    }
  }

  let validationErrors = [];
  let validatedFirstMatchCaps = allFirstMatchCaps.map(firstMatchCaps => {
    try {
      return shouldValidateCaps ? validateCaps(firstMatchCaps, filteredConstraints) : firstMatchCaps;
    } catch (e) {
      validationErrors.push(e.message);
      return null;
    }
  }).filter(caps => !_lodash.default.isNull(caps));
  let matchedCaps = null;

  for (let firstMatchCaps of validatedFirstMatchCaps) {
    try {
      matchedCaps = mergeCaps(requiredCaps, firstMatchCaps);

      if (matchedCaps) {
        break;
      }
    } catch (err) {
      _logger.default.warn(err.message);
    }
  }

  return {
    requiredCaps,
    allFirstMatchCaps,
    validatedFirstMatchCaps,
    matchedCaps,
    validationErrors
  };
}

function processCapabilities(caps, constraints = {}, shouldValidateCaps = true) {
  const {
    matchedCaps,
    validationErrors
  } = parseCaps(caps, constraints, shouldValidateCaps);

  if (!_appiumSupport.util.hasValue(matchedCaps)) {
    if (_lodash.default.isArray(caps.firstMatch) && caps.firstMatch.length > 1) {
      throw new _errors.errors.InvalidArgumentError(`Could not find matching capabilities from ${JSON.stringify(caps)}:\n ${validationErrors.join('\n')}`);
    } else {
      throw new _errors.errors.InvalidArgumentError(validationErrors[0]);
    }
  }

  return matchedCaps;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9iYXNlZHJpdmVyL2NhcGFiaWxpdGllcy5qcyJdLCJuYW1lcyI6WyJtZXJnZUNhcHMiLCJwcmltYXJ5Iiwic2Vjb25kYXJ5IiwicmVzdWx0IiwiT2JqZWN0IiwiYXNzaWduIiwibmFtZSIsInZhbHVlIiwiXyIsInRvUGFpcnMiLCJpc1VuZGVmaW5lZCIsImVycm9ycyIsIkludmFsaWRBcmd1bWVudEVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInZhbGlkYXRlQ2FwcyIsImNhcHMiLCJjb25zdHJhaW50cyIsIm9wdHMiLCJza2lwUHJlc2VuY2VDb25zdHJhaW50IiwiaXNQbGFpbk9iamVjdCIsImNsb25lRGVlcCIsImtleSIsImtleXMiLCJwcmVzZW5jZSIsInZhbGlkYXRpb25FcnJvcnMiLCJ2YWxpZGF0b3IiLCJ2YWxpZGF0ZSIsInBpY2tCeSIsInV0aWwiLCJoYXNWYWx1ZSIsImZ1bGxNZXNzYWdlcyIsIm1lc3NhZ2UiLCJhdHRyaWJ1dGUiLCJyZWFzb25zIiwicmVhc29uIiwicHVzaCIsImpvaW4iLCJTVEFOREFSRF9DQVBTIiwiaXNTdGFuZGFyZENhcCIsImNhcCIsImZpbmQiLCJzdGFuZGFyZENhcCIsInRvTG93ZXJDYXNlIiwic3RyaXBBcHBpdW1QcmVmaXhlcyIsInByZWZpeCIsInByZWZpeGVkQ2FwcyIsImZpbHRlciIsInN0YXJ0c1dpdGgiLCJiYWRQcmVmaXhlZENhcHMiLCJwcmVmaXhlZENhcCIsInN0cmlwcGVkQ2FwTmFtZSIsInN1YnN0ciIsImxlbmd0aCIsImZpbmROb25QcmVmaXhlZENhcHMiLCJhbHdheXNNYXRjaCIsImZpcnN0TWF0Y2giLCJjaGFpbiIsInJlZHVjZSIsInVucHJlZml4ZWRDYXBzIiwiaW5jbHVkZXMiLCJ1bmlxIiwicGFyc2VDYXBzIiwic2hvdWxkVmFsaWRhdGVDYXBzIiwicmVxdWlyZWRDYXBzIiwiYWxsRmlyc3RNYXRjaENhcHMiLCJpc0FycmF5Iiwibm9uUHJlZml4ZWRDYXBzIiwiaXNFbXB0eSIsImxvZyIsIndhcm4iLCJmaXJzdE1hdGNoQ2FwcyIsImZpbHRlcmVkQ29uc3RyYWludHMiLCJyZXF1aXJlZENhcHNLZXlzIiwidmFsaWRhdGVkRmlyc3RNYXRjaENhcHMiLCJtYXAiLCJlIiwiaXNOdWxsIiwibWF0Y2hlZENhcHMiLCJlcnIiLCJwcm9jZXNzQ2FwYWJpbGl0aWVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUEsU0FBU0EsU0FBVCxDQUFvQkMsT0FBTyxHQUFHLEVBQTlCLEVBQWtDQyxTQUFTLEdBQUcsRUFBOUMsRUFBa0Q7QUFDaEQsTUFBSUMsTUFBTSxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSixPQUFsQixDQUFiOztBQUVBLE9BQUssSUFBSSxDQUFDSyxJQUFELEVBQU9DLEtBQVAsQ0FBVCxJQUEwQkMsZ0JBQUVDLE9BQUYsQ0FBVVAsU0FBVixDQUExQixFQUFnRDtBQUU5QyxRQUFJLENBQUNNLGdCQUFFRSxXQUFGLENBQWNULE9BQU8sQ0FBQ0ssSUFBRCxDQUFyQixDQUFMLEVBQW1DO0FBQ2pDLFlBQU0sSUFBSUssZUFBT0Msb0JBQVgsQ0FBaUMsYUFBWU4sSUFBSyx1Q0FBc0NPLElBQUksQ0FBQ0MsU0FBTCxDQUFlYixPQUFmLENBQXdCLG9CQUFtQlksSUFBSSxDQUFDQyxTQUFMLENBQWVaLFNBQWYsQ0FBMEIsVUFBN0osQ0FBTjtBQUNEOztBQUNEQyxJQUFBQSxNQUFNLENBQUNHLElBQUQsQ0FBTixHQUFlQyxLQUFmO0FBQ0Q7O0FBRUQsU0FBT0osTUFBUDtBQUNEOztBQUdELFNBQVNZLFlBQVQsQ0FBdUJDLElBQXZCLEVBQTZCQyxXQUFXLEdBQUcsRUFBM0MsRUFBK0NDLElBQUksR0FBRyxFQUF0RCxFQUEwRDtBQUV4RCxNQUFJO0FBQUNDLElBQUFBO0FBQUQsTUFBMkJELElBQS9COztBQUVBLE1BQUksQ0FBQ1YsZ0JBQUVZLGFBQUYsQ0FBZ0JKLElBQWhCLENBQUwsRUFBNEI7QUFDMUIs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QUFYLENBQWlDLDZDQUE0Q0MsSUFBSSxDQUFDQyxTQUFMLENBQWVFLElBQWYsQ0FBcUIsT0FBTVMsZ0JBQWdCLENBQUNZLElBQWpCLENBQXNCLElBQXRCLENBQTRCLEVBQXBJLENBQU47QUFDRCxLQUhELE1BR087QUFFTCxZQUFNLElBQUkxQixlQUFPQyxvQkFBWCxDQUFnQ2EsZ0JBQWdCLENBQUMsQ0FBRCxDQUFoRCxDQUFOO0FBQ0Q7QUFDRjs7QUFFRCxTQUFPcUQsV0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHZhbGlkYXRvciB9IGZyb20gJy4vZGVzaXJlZC1jYXBzJztcbmltcG9ydCB7IHV0aWwgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJy4uL3Byb3RvY29sL2Vycm9ycyc7XG5cbi8vIFRha2VzIHByaW1hcnkgY2FwcyBvYmplY3QgYW5kIG1lcmdlcyBpdCBpbnRvIGEgc2Vjb25kYXJ5IGNhcHMgb2JqZWN0LlxuLy8gKHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvd2ViZHJpdmVyLyNkZm4tbWVyZ2luZy1jYXBhYmlsaXRpZXMpXG5mdW5jdGlvbiBtZXJnZUNhcHMgKHByaW1hcnkgPSB7fSwgc2Vjb25kYXJ5ID0ge30pIHtcbiAgbGV0IHJlc3VsdCA9IE9iamVjdC5hc3NpZ24oe30sIHByaW1hcnkpO1xuXG4gIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgXy50b1BhaXJzKHNlY29uZGFyeSkpIHtcbiAgICAvLyBPdmVyd3JpdGluZyBpcyBub3QgYWxsb3dlZC4gUHJpbWFyeSBhbmQgc2Vjb25kYXJ5IG11c3QgaGF2ZSBkaWZmZXJlbnQgcHJvcGVydGllcyAodzNjIHJ1bGUgNC40KVxuICAgIGlmICghXy5pc1VuZGVmaW5lZChwcmltYXJ5W25hbWVdKSkge1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5JbnZhbGlkQXJndW1lbnRFcnJvcihgcHJvcGVydHkgJyR7bmFtZX0nIHNob3VsZCBub3QgZXhpc3Qgb24gYm90aCBwcmltYXJ5ICgke0pTT04uc3RyaW5naWZ5KHByaW1hcnkpfSkgYW5kIHNlY29uZGFyeSAoJHtKU09OLnN0cmluZ2lmeShzZWNvbmRhcnkpfSkgb2JqZWN0YCk7XG4gICAgfVxuICAgIHJlc3VsdFtuYW1lXSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gVmFsaWRhdGVzIGNhcHMgYWdhaW5zdCBhIHNldCBvZiBjb25zdHJhaW50c1xuZnVuY3Rpb24gdmFsaWRhdGVDYXBzIChjYXBzLCBjb25zdHJhaW50cyA9IHt9LCBvcHRzID0ge30pIHtcblxuICBsZXQge3NraXBQcmVzZW5jZUNvbnN0cmFpbnR9ID0gb3B0cztcblxuICBpZiAoIV8uaXNQbGFpbk9iamVjdChjYXBzKSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZEFyZ3VtZW50RXJyb3IoYG11c3QgYmUgYSBKU09OIG9iamVjdGApO1xuICB9XG5cbiAgY29uc3RyYWludHMgPSBfLmNsb25lRGVlcChjb25zdHJhaW50cyk7IC8vIERlZmVuc2l2ZSBjb3B5XG5cbiAgaWYgKHNraXBQcmVzZW5jZUNvbnN0cmFpbnQpIHtcbiAgICAvLyBSZW1vdmUgdGhlICdwcmVzZW5jZScgY29uc3RyYWludCBpZiB3ZSdyZSBub3QgY2hlY2tpbmcgZm9yIGl0XG4gICAgZm9yIChsZXQga2V5IG9mIF8ua2V5cyhjb25zdHJhaW50cykpIHtcbiAgICAgIGRlbGV0ZSBjb25zdHJhaW50c1trZXldLnByZXNlbmNlO1xuICAgIH1cbiAgfVxuXG4gIGxldCB2YWxpZGF0aW9uRXJyb3JzID0gdmFsaWRhdG9yLnZhbGlkYXRlKF8ucGlja0J5KGNhcHMsIHV0aWwuaGFzVmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmdWxsTWVzc2FnZXM6IGZhbHNlfSk7XG5cbiAgaWYgKHZhbGlkYXRpb25FcnJvcnMpIHtcbiAgICBsZXQgbWVzc2FnZSA9IFtdO1xuICAgIGZvciAobGV0IFthdHRyaWJ1dGUsIHJlYXNvbnNdIG9mIF8udG9QYWlycyh2YWxpZGF0aW9uRXJyb3JzKSkge1xuICAgICAgZm9yIChsZXQgcmVhc29uIG9mIHJlYXNvbnMpIHtcbiAgICAgICAgbWVzc2FnZS5wdXNoKGAnJHthdHRyaWJ1dGV9JyAke3JlYXNvbn1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IGVycm9ycy5JbnZhbGlkQXJndW1lbnRFcnJvcihtZXNzYWdlLmpvaW4oJzsgJykpO1xuICB9XG5cbiAgLy8gUmV0dXJuIGNhcHNcbiAgcmV0dXJuIGNhcHM7XG59XG5cbi8vIFN0YW5kYXJkLCBub24tcHJlZml4ZWQgY2FwYWJpbGl0aWVzIChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3dlYmRyaXZlci8jZGZuLXRhYmxlLW9mLXN0YW5kYXJkLWNhcGFiaWxpdGllcylcbmNvbnN0IFNUQU5EQVJEX0NBUFMgPSBbXG4gICdicm93c2VyTmFtZScsXG4gICdicm93c2VyVmVyc2lvbicsXG4gICdwbGF0Zm9ybU5hbWUnLFxuICAnYWNjZXB0SW5zZWN1cmVDZXJ0cycsXG4gICdwYWdlTG9hZFN0cmF0ZWd5JyxcbiAgJ3Byb3h5JyxcbiAgJ3NldFdpbmRvd1JlY3QnLFxuICAndGltZW91dHMnLFxuICAndW5oYW5kbGVkUHJvbXB0QmVoYXZpb3InXG5dO1xuXG5mdW5jdGlvbiBpc1N0YW5kYXJkQ2FwIChjYXApIHtcbiAgcmV0dXJuICEhXy5maW5kKFNUQU5EQVJEX0NBUFMsIChzdGFuZGFyZENhcCkgPT4gc3RhbmRhcmRDYXAudG9Mb3dlckNhc2UoKSA9PT0gYCR7Y2FwfWAudG9Mb3dlckNhc2UoKSk7XG59XG5cbi8vIElmIHRoZSAnYXBwaXVtOicgcHJlZml4IHdhcyBwcm92aWRlZCBhbmQgaXQncyBhIHZhbGlkIGNhcGFiaWxpdHksIHN0cmlwIG91dCB0aGUgcHJlZml4IChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3dlYmRyaXZlci8jZGZuLWV4dGVuc2lvbi1jYXBhYmlsaXRpZXMpXG4vLyAoTk9URTogTWV0aG9kIGlzIGRlc3RydWN0aXZlIGFuZCBtdXRhdGVzIGNvbnRlbnRzIG9mIGNhcHMpXG5mdW5jdGlvbiBzdHJpcEFwcGl1bVByZWZpeGVzIChjYXBzKSB7XG4gIGNvbnN0IHByZWZpeCA9ICdhcHBpdW06JztcbiAgY29uc3QgcHJlZml4ZWRDYXBzID0gXy5maWx0ZXIoXy5rZXlzKGNhcHMpLCBjYXAgPT4gYCR7Y2FwfWAuc3RhcnRzV2l0aChwcmVmaXgpKTtcbiAgY29uc3QgYmFkUHJlZml4ZWRDYXBzID0gW107XG5cbiAgLy8gU3RyaXAgb3V0IHRoZSAnYXBwaXVtOicgcHJlZml4XG4gIGZvciAobGV0IHByZWZpeGVkQ2FwIG9mIHByZWZpeGVkQ2Fwcykge1xuICAgIGNvbnN0IHN0cmlwcGVkQ2FwTmFtZSA9IHByZWZpeGVkQ2FwLnN1YnN0cihwcmVmaXgubGVuZ3RoKTtcblxuICAgIC8vIElmIGl0J3Mgc3RhbmRhcmQgY2FwYWJpbGl0eSB0aGF0IHdhcyBwcmVmaXhlZCwgYWRkIGl0IHRvIGFuIGFycmF5IG9mIGluY29ycmVjdGx5IHByZWZpeGVkIGNhcGFiaWxpdGllc1xuICAgIGlmIChpc1N0YW5kYXJkQ2FwKHN0cmlwcGVkQ2FwTmFtZSkpIHtcbiAgICAgIGJhZFByZWZpeGVkQ2Fwcy5wdXNoKHN0cmlwcGVkQ2FwTmFtZSk7XG4gICAgfVxuXG4gICAgLy8gU3RyaXAgb3V0IHRoZSBwcmVmaXhcbiAgICBjYXBzW3N0cmlwcGVkQ2FwTmFtZV0gPSBjYXBzW3ByZWZpeGVkQ2FwXTtcbiAgICBkZWxldGUgY2Fwc1twcmVmaXhlZENhcF07XG4gIH1cblxuICAvLyBJZiB3ZSBmb3VuZCBzdGFuZGFyZCBjYXBzIHRoYXQgd2VyZSBpbmNvcnJlY3RseSBwcmVmaXhlZCwgdGhyb3cgYW4gZXhjZXB0aW9uIChlLmcuOiBkb24ndCBhY2NlcHQgJ2FwcGl1bTpwbGF0Zm9ybU5hbWUnLCBvbmx5IGFjY2VwdCBqdXN0ICdwbGF0Zm9ybU5hbWUnKVxuICBpZiAoYmFkUHJlZml4ZWRDYXBzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgZXJyb3JzLkludmFsaWRBcmd1bWVudEVycm9yKGBUaGUgY2FwYWJpbGl0aWVzICR7SlNPTi5zdHJpbmdpZnkoYmFkUHJlZml4ZWRDYXBzKX0gYXJlIHN0YW5kYXJkIGNhcGFiaWxpdGllcyBhbmQgc2hvdWxkIG5vdCBoYXZlIHRoZSBcImFwcGl1bTpcIiBwcmVmaXhgKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCBhbiBhcnJheSBvZiBhbGwgdGhlIHVucHJlZml4ZWQgY2FwcyB0aGF0IGFyZSBiZWluZyB1c2VkIGluICdhbHdheXNNYXRjaCcgYW5kIGFsbCBvZiB0aGUgJ2ZpcnN0TWF0Y2gnIG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IGNhcHMgQSBjYXBhYmlsaXRpZXMgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGZpbmROb25QcmVmaXhlZENhcHMgKHthbHdheXNNYXRjaCA9IHt9LCBmaXJzdE1hdGNoID0gW119KSB7XG4gIHJldHVybiBfLmNoYWluKFthbHdheXNNYXRjaCwgLi4uZmlyc3RNYXRjaF0pXG4gICAgLnJlZHVjZSgodW5wcmVmaXhlZENhcHMsIGNhcHMpID0+IFtcbiAgICAgIC4uLnVucHJlZml4ZWRDYXBzLFxuICAgICAgLi4uXyhjYXBzKS5rZXlzKCkuZmlsdGVyKChjYXApID0+ICFjYXAuaW5jbHVkZXMoJzonKSAmJiAhaXNTdGFuZGFyZENhcChjYXApKSxcbiAgICBdLCBbXSlcbiAgICAudW5pcSgpXG4gICAgLnZhbHVlKCk7XG59XG5cbi8vIFBhcnNlIGNhcGFiaWxpdGllcyAoYmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL3dlYmRyaXZlci8jcHJvY2Vzc2luZy1jYXBhYmlsaXRpZXMpXG5mdW5jdGlvbiBwYXJzZUNhcHMgKGNhcHMsIGNvbnN0cmFpbnRzID0ge30sIHNob3VsZFZhbGlkYXRlQ2FwcyA9IHRydWUpIHtcbiAgLy8gSWYgY2FwYWJpbGl0aWVzIHJlcXVlc3QgaXMgbm90IGFuIG9iamVjdCwgcmV0dXJuIGVycm9yICgjMS4xKVxuICBpZiAoIV8uaXNQbGFpbk9iamVjdChjYXBzKSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZEFyZ3VtZW50RXJyb3IoJ1RoZSBjYXBhYmlsaXRpZXMgYXJndW1lbnQgd2FzIG5vdCB2YWxpZCBmb3IgdGhlIGZvbGxvd2luZyByZWFzb24ocyk6IFwiY2FwYWJpbGl0aWVzXCIgbXVzdCBiZSBhIEpTT04gb2JqZWN0LicpO1xuICB9XG5cbiAgLy8gTGV0ICdyZXF1aXJlZENhcHMnIGJlIHByb3BlcnR5IG5hbWVkICdhbHdheXNNYXRjaCcgZnJvbSBjYXBhYmlsaXRpZXMgcmVxdWVzdCAoIzIpIGFuZCAnYWxsRmlyc3RNYXRjaENhcHMnIGJlIHByb3BlcnR5IG5hbWVkICdmaXJzdE1hdGNoIGZyb20gY2FwYWJpbGl0aWVzIHJlcXVlc3QgKCMzKVxuICBsZXQge1xuICAgIGFsd2F5c01hdGNoOiByZXF1aXJlZENhcHMgPSB7fSwgLy8gSWYgJ3JlcXVpcmVkQ2FwcycgaXMgdW5kZWZpbmVkLCBzZXQgaXQgdG8gYW4gZW1wdHkgSlNPTiBvYmplY3QgKCMyLjEpXG4gICAgZmlyc3RNYXRjaDogYWxsRmlyc3RNYXRjaENhcHMgPSBbe31dLCAvLyBJZiAnZmlyc3RNYXRjaCcgaXMgdW5kZWZpbmVkIHNldCBpdCB0byBhIHNpbmdsZXRvbiBsaXN0IHdpdGggb25lIGVtcHR5IG9iamVjdCAoIzMuMSlcbiAgfSA9IGNhcHM7XG5cbiAgLy8gUmVqZWN0ICdmaXJzdE1hdGNoJyBhcmd1bWVudCBpZiBpdCdzIG5vdCBhbiBhcnJheSAoIzMuMilcbiAgaWYgKCFfLmlzQXJyYXkoYWxsRmlyc3RNYXRjaENhcHMpKSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5JbnZhbGlkQXJndW1lbnRFcnJvcignVGhlIGNhcGFiaWxpdGllcy5maXJzdE1hdGNoIGFyZ3VtZW50IHdhcyBub3QgdmFsaWQgZm9yIHRoZSBmb2xsb3dpbmcgcmVhc29uKHMpOiBcImNhcGFiaWxpdGllcy5maXJzdE1hdGNoXCIgbXVzdCBiZSBhIEpTT04gYXJyYXkgb3IgdW5kZWZpbmVkJyk7XG4gIH1cblxuICAvLyBJZiBhbiBlbXB0eSBhcnJheSBhcyBwcm92aWRlZCwgd2UnbGwgYmUgZm9yZ2l2aW5nIGFuZCBtYWtlIGl0IGFuIGFycmF5IG9mIG9uZSBlbXB0eSBvYmplY3RcbiAgaWYgKGFsbEZpcnN0TWF0Y2hDYXBzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFsbEZpcnN0TWF0Y2hDYXBzLnB1c2goe30pO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIG5vbi1wcmVmaXhlZCwgbm9uLXN0YW5kYXJkIGNhcGFiaWxpdGllcyBhbmQgbG9nIHdhcm5pbmdzIGlmIHRoZXkgYXJlIGZvdW5kXG4gIGxldCBub25QcmVmaXhlZENhcHMgPSBmaW5kTm9uUHJlZml4ZWRDYXBzKGNhcHMpO1xuICBpZiAoIV8uaXNFbXB0eShub25QcmVmaXhlZENhcHMpKSB7XG4gICAgbG9nLndhcm4oYFRoZSBjYXBhYmlsaXRpZXMgJHtKU09OLnN0cmluZ2lmeShub25QcmVmaXhlZENhcHMpfSBhcmUgbm90IHN0YW5kYXJkIGNhcGFiaWxpdGllcyBhbmQgc2hvdWxkIGhhdmUgYW4gZXh0ZW5zaW9uIHByZWZpeGApO1xuICB9XG5cbiAgLy8gU3RyaXAgb3V0IHRoZSAnYXBwaXVtOicgcHJlZml4IGZyb20gYWxsXG4gIHN0cmlwQXBwaXVtUHJlZml4ZXMocmVxdWlyZWRDYXBzKTtcbiAgZm9yIChsZXQgZmlyc3RNYXRjaENhcHMgb2YgYWxsRmlyc3RNYXRjaENhcHMpIHtcbiAgICBzdHJpcEFwcGl1bVByZWZpeGVzKGZpcnN0TWF0Y2hDYXBzKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHRoZSByZXF1aXJlZENhcHMuIEJ1dCBkb24ndCB2YWxpZGF0ZSAncHJlc2VuY2UnIGJlY2F1c2UgaWYgdGhhdCBjb25zdHJhaW50IGZhaWxzIG9uICdhbHdheXNNYXRjaCcgaXQgY291bGQgc3RpbGwgcGFzcyBvbiBvbmUgb2YgdGhlICdmaXJzdE1hdGNoJyBrZXlzXG4gIGlmIChzaG91bGRWYWxpZGF0ZUNhcHMpIHtcbiAgICByZXF1aXJlZENhcHMgPSB2YWxpZGF0ZUNhcHMocmVxdWlyZWRDYXBzLCBjb25zdHJhaW50cywge3NraXBQcmVzZW5jZUNvbnN0cmFpbnQ6IHRydWV9KTtcbiAgfVxuXG5cbiAgLy8gUmVtb3ZlIHRoZSAncHJlc2VuY2UnIGNvbnN0cmFpbnQgZm9yIGFueSBrZXlzIHRoYXQgYXJlIGFscmVhZHkgcHJlc2VudCBpbiAncmVxdWlyZWRDYXBzJ1xuICAvLyBzaW5jZSB3ZSBrbm93IHRoYXQgdGhpcyBjb25zdHJhaW50IGhhcyBhbHJlYWR5IHBhc3NlZFxuICBsZXQgZmlsdGVyZWRDb25zdHJhaW50cyA9IHsuLi5jb25zdHJhaW50c307XG4gIGxldCByZXF1aXJlZENhcHNLZXlzID0gXy5rZXlzKHJlcXVpcmVkQ2Fwcyk7XG4gIGZvciAobGV0IGtleSBvZiBfLmtleXMoZmlsdGVyZWRDb25zdHJhaW50cykpIHtcbiAgICBpZiAocmVxdWlyZWRDYXBzS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICBkZWxldGUgZmlsdGVyZWRDb25zdHJhaW50c1trZXldO1xuICAgIH1cbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGFsbCBvZiB0aGUgZmlyc3QgbWF0Y2ggY2FwYWJpbGl0aWVzIGFuZCByZXR1cm4gYW4gYXJyYXkgd2l0aCBvbmx5IHRoZSB2YWxpZCBjYXBzIChzZWUgc3BlYyAjNSlcbiAgbGV0IHZhbGlkYXRpb25FcnJvcnMgPSBbXTtcbiAgbGV0IHZhbGlkYXRlZEZpcnN0TWF0Y2hDYXBzID0gYWxsRmlyc3RNYXRjaENhcHMubWFwKChmaXJzdE1hdGNoQ2FwcykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBmaXJzdE1hdGNoIGNhcHNcbiAgICAgIHJldHVybiBzaG91bGRWYWxpZGF0ZUNhcHMgPyB2YWxpZGF0ZUNhcHMoZmlyc3RNYXRjaENhcHMsIGZpbHRlcmVkQ29uc3RyYWludHMpIDogZmlyc3RNYXRjaENhcHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKGUubWVzc2FnZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pLmZpbHRlcigoY2FwcykgPT4gIV8uaXNOdWxsKGNhcHMpKTtcblxuICAvLyBUcnkgdG8gbWVyZ2UgcmVxdWlyZWRDYXBzIHdpdGggZmlyc3QgbWF0Y2ggY2FwYWJpbGl0aWVzLCBicmVhayBvbmNlIGl0IGZpbmRzIGl0cyBmaXJzdCBtYXRjaCAoc2VlIHNwZWMgIzYpXG4gIGxldCBtYXRjaGVkQ2FwcyA9IG51bGw7XG4gIGZvciAobGV0IGZpcnN0TWF0Y2hDYXBzIG9mIHZhbGlkYXRlZEZpcnN0TWF0Y2hDYXBzKSB7XG4gICAgdHJ5IHtcbiAgICAgIG1hdGNoZWRDYXBzID0gbWVyZ2VDYXBzKHJlcXVpcmVkQ2FwcywgZmlyc3RNYXRjaENhcHMpO1xuICAgICAgaWYgKG1hdGNoZWRDYXBzKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nLndhcm4oZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgdmFyaWFibGVzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gIHJldHVybiB7cmVxdWlyZWRDYXBzLCBhbGxGaXJzdE1hdGNoQ2FwcywgdmFsaWRhdGVkRmlyc3RNYXRjaENhcHMsIG1hdGNoZWRDYXBzLCB2YWxpZGF0aW9uRXJyb3JzfTtcbn1cblxuLy8gQ2FsbHMgcGFyc2VDYXBzIGFuZCBqdXN0IHJldHVybnMgdGhlIG1hdGNoZWRDYXBzIHZhcmlhYmxlXG5mdW5jdGlvbiBwcm9jZXNzQ2FwYWJpbGl0aWVzIChjYXBzLCBjb25zdHJhaW50cyA9IHt9LCBzaG91bGRWYWxpZGF0ZUNhcHMgPSB0cnVlKSB7XG4gIGNvbnN0IHttYXRjaGVkQ2FwcywgdmFsaWRhdGlvbkVycm9yc30gPSBwYXJzZUNhcHMoY2FwcywgY29uc3RyYWludHMsIHNob3VsZFZhbGlkYXRlQ2Fwcyk7XG5cbiAgLy8gSWYgd2UgZm91bmQgYW4gZXJyb3IgdGhyb3cgYW4gZXhjZXB0aW9uXG4gIGlmICghdXRpbC5oYXNWYWx1ZShtYXRjaGVkQ2FwcykpIHtcbiAgICBpZiAoXy5pc0FycmF5KGNhcHMuZmlyc3RNYXRjaCkgJiYgY2Fwcy5maXJzdE1hdGNoLmxlbmd0aCA+IDEpIHtcbiAgICAgIC8vIElmIHRoZXJlIHdhcyBtb3JlIHRoYW4gb25lICdmaXJzdE1hdGNoJyBjYXAsIGluZGljYXRlIHRoYXQgd2UgY291bGRuJ3QgZmluZCBhIG1hdGNoaW5nIGNhcGFiaWxpdGllcyBzZXQgYW5kIHNob3cgYWxsIHRoZSBlcnJvcnNcbiAgICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZEFyZ3VtZW50RXJyb3IoYENvdWxkIG5vdCBmaW5kIG1hdGNoaW5nIGNhcGFiaWxpdGllcyBmcm9tICR7SlNPTi5zdHJpbmdpZnkoY2Fwcyl9OlxcbiAke3ZhbGlkYXRpb25FcnJvcnMuam9pbignXFxuJyl9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSwganVzdCBzaG93IHRoZSBzaW5ndWxhciBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBuZXcgZXJyb3JzLkludmFsaWRBcmd1bWVudEVycm9yKHZhbGlkYXRpb25FcnJvcnNbMF0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRjaGVkQ2Fwcztcbn1cblxuXG5leHBvcnQge1xuICBwYXJzZUNhcHMsIHByb2Nlc3NDYXBhYmlsaXRpZXMsIHZhbGlkYXRlQ2FwcywgbWVyZ2VDYXBzLFxuICBmaW5kTm9uUHJlZml4ZWRDYXBzLCBpc1N0YW5kYXJkQ2FwXG59O1xuIl0sImZpbGUiOiJsaWIvYmFzZWRyaXZlci9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
