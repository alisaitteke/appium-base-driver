"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureApp = configureApp;
exports.isPackageOrBundle = isPackageOrBundle;
exports.getCoordDefault = getCoordDefault;
exports.getSwipeTouchDuration = getSwipeTouchDuration;
exports.duplicateKeys = duplicateKeys;
exports.parseCapsArray = parseCapsArray;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _url = _interopRequireDefault(require("url"));

var _logger = _interopRequireDefault(require("./logger"));

var _fs2 = _interopRequireDefault(require("fs"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _appiumSupport = require("appium-support");

var _request = _interopRequireDefault(require("request"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _lruCache = _interopRequireDefault(require("lru-cache"));

var _asyncLock = _interopRequireDefault(require("async-lock"));

var _sanitizeFilename = _interopRequireDefault(require("sanitize-filename"));

const ZIP_EXTS = ['.zip', '.ipa'];
const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'];
const APPLICATIONS_CACHE = new _lruCache.default({
  max: 100
});
const APPLICATIONS_CACHE_GUARD = new _asyncLock.default();
const SANITIZE_REPLACEMENT = '-';
const DEFAULT_BASENAME = 'appium-app';

async function retrieveHeaders(link) {
  try {
    const response = await (0, _requestPromise.default)({
      url: link,
      method: 'HEAD',
      resolveWithFullResponse: true,
      timeout: 5000
    });
    return response.headers;
  } catch (e) {
    _logger.default.debug(`Cannot send HEAD request to '${link}'. Original error: ${e.message}`);
  }

  return {};
}

function getCachedApplicationPath(link, currentModified) {
  if (!APPLICATIONS_CACHE.has(link) || !currentModified) {
    return null;
  }

  const {
    lastModified,
    fullPath
  } = APPLICATIONS_CACHE.get(link);

  if (lastModified && currentModified.getTime() <= lastModified.getTime()) {
    return fullPath;
  }

  _logger.default.debug(`'Last-Modified' timestamp of '${link}' has been updated. ` + `An updated copy of the application is going to be downloaded.`);

  return null;
}

function verifyAppExtension(app, supportedAppExtensions) {
  if (supportedAppExtensions.includes(_path.default.extname(app))) {
    return app;
  }

  throw new Error(`New app path '${app}' did not have extension(s) '${supportedAppExtensions}'`);
}

async function configureApp(app, supportedAppExtensions) {
  if (!_lodash.default.isString(app)) {
    return;
  }

  if (!_lodash.default.isArray(supportedAppExtensions)) {
    supportedAppExtensions = [supportedAppExtensions];
  }

  let newApp = app;
  let shouldUnzipApp = false;
  let archiveHash = null;
  let currentModified = null;

  const {
    protocol,
    pathname
  } = _url.default.parse(newApp);

  const isUrl = ['http:', 'https:'].includes(protocol);
  return await APPLICATIONS_CACHE_GUARD.acquire(app, async () => {
    if (isUrl) {
      _logger.default.info(`Using downloadable app '${newApp}'`);

      const headers = await retrieveHeaders(newApp);

      if (headers['last-modified']) {
        _logger.default.debug(`App Last-Modified: ${headers['last-modified']}`);

        currentModified = new Date(headers['last-modified']);
      }

      const cachedPath = getCachedApplicationPath(app, currentModified);

      if (cachedPath) {
        if (await _appiumSupport.fs.exists(cachedPath)) {
          _logger.default.info(`Reusing previously downloaded application at '${cachedPath}'`);

          return verifyAppExtension(cachedPath, supportedAppExtensions);
        }

        _logger.default.info(`The application at '${cachedPath}' does not exist anymore. Deleting it from the cache`);

        APPLICATIONS_CACHE.del(app);
      }

      let fileName = null;
      const basename = (0, _sanitizeFilename.default)(_path.default.basename(decodeURIComponent(pathname)), {
        replacement: SANITIZE_REPLACEMENT
      });

      const extname = _path.default.extname(basename);

      if (ZIP_EXTS.includes(extname)) {
        fileName = basename;
        shouldUnzipApp = true;
      }

      if (headers['content-type']) {
        _logger.default.debug(`Content-Type: ${headers['content-type']}`);

        if (ZIP_MIME_TYPES.some(mimeType => new RegExp(`\\b${_lodash.default.escapeRegExp(mimeType)}\\b`).test(headers['content-type']))) {
          if (!fileName) {
            fileName = `${DEFAULT_BASENAME}.zip`;
          }

          shouldUnzipApp = true;
        }
      }

      if (headers['content-disposition'] && /^attachment/i.test(headers['content-disposition'])) {
        _logger.default.debug(`Content-Disposition: ${headers['content-disposition']}`);

        const match = /filename="([^"]+)/i.exec(headers['content-disposition']);

        if (match) {
          fileName = (0, _sanitizeFilename.default)(match[1], {
            replacement: SANITIZE_REPLACEMENT
          });
          shouldUnzipApp = shouldUnzipApp || ZIP_EXTS.includes(_path.default.extname(fileName));
        }
      }

      if (!fileName) {
        const resultingName = basename ? basename.substring(0, basename.length - extname.length) : DEFAULT_BASENAME;
        let resultingExt = extname;

        if (!supportedAppExtensions.includes(resultingExt)) {
          _logger.default.info(`The current file extension '${resultingExt}' is not supported. ` + `Defaulting to '${_lodash.default.first(supportedAppExtensions)}'`);

          resultingExt = _lodash.default.first(supportedAppExtensions);
        }

        fileName = `${resultingName}${resultingExt}`;
      }

      const targetPath = await _appiumSupport.tempDir.path({
        prefix: fileName,
        suffix: ''
      });
      newApp = await downloadApp(newApp, targetPath);
    } else if (await _appiumSupport.fs.exists(newApp)) {
      _logger.default.info(`Using local app '${newApp}'`);

      shouldUnzipApp = ZIP_EXTS.includes(_path.default.extname(newApp));
    } else {
      let errorMessage = `The application at '${newApp}' does not exist or is not accessible`;

      if (_lodash.default.isString(protocol) && protocol.length > 2) {
        errorMessage = `The protocol '${protocol}' used in '${newApp}' is not supported. ` + `Only http: and https: protocols are supported`;
      }

      throw new Error(errorMessage);
    }

    if (shouldUnzipApp) {
      const archivePath = newApp;
      archiveHash = await _appiumSupport.fs.hash(archivePath);

      if (APPLICATIONS_CACHE.has(app) && archiveHash === APPLICATIONS_CACHE.get(app).hash) {
        const {
          fullPath
        } = APPLICATIONS_CACHE.get(app);

        if (await _appiumSupport.fs.exists(fullPath)) {
          if (archivePath !== app) {
            await _appiumSupport.fs.rimraf(archivePath);
          }

          _logger.default.info(`Will reuse previously cached application at '${fullPath}'`);

          return verifyAppExtension(fullPath, supportedAppExtensions);
        }

        _logger.default.info(`The application at '${fullPath}' does not exist anymore. Deleting it from the cache`);

        APPLICATIONS_CACHE.del(app);
      }

      const tmpRoot = await _appiumSupport.tempDir.openDir();

      try {
        newApp = await unzipApp(archivePath, tmpRoot, supportedAppExtensions);
      } finally {
        if (newApp !== archivePath && archivePath !== app) {
          await _appiumSupport.fs.rimraf(archivePath);
        }
      }

      _logger.default.info(`Unzipped local app to '${newApp}'`);
    } else if (!_path.default.isAbsolute(newApp)) {
      newApp = _path.default.resolve(process.cwd(), newApp);

      _logger.default.warn(`The current application path '${app}' is not absolute ` + `and has been rewritten to '${newApp}'. Consider using absolute paths rather than relative`);

      app = newApp;
    }

    verifyAppExtension(newApp, supportedAppExtensions);

    if (app !== newApp && (archiveHash || currentModified)) {
      APPLICATIONS_CACHE.set(app, {
        hash: archiveHash,
        lastModified: currentModified,
        fullPath: newApp
      });
    }

    return newApp;
  });
}

async function downloadApp(app, targetPath) {
  const {
    href
  } = _url.default.parse(app);

  const started = process.hrtime();

  try {
    await new _bluebird.default((resolve, reject) => {
      (0, _request.default)(href).on('error', reject).on('response', res => {
        if (res.statusCode >= 400) {
          return reject(new Error(`${res.statusCode} - ${res.statusMessage}`));
        }
      }).pipe(_fs2.default.createWriteStream(targetPath)).on('close', resolve);
    });
  } catch (err) {
    throw new Error(`Problem downloading app from url ${href}: ${err.message}`);
  }

  const [seconds, ns] = process.hrtime(started);
  const secondsElapsed = seconds + ns / 1e09;
  const {
    size
  } = await _appiumSupport.fs.stat(targetPath);

  _logger.default.debug(`'${href}' (${_appiumSupport.util.toReadableSizeString(size)}) ` + `has been downloaded to '${targetPath}' in ${secondsElapsed.toFixed(3)}s`);

  if (secondsElapsed >= 2) {
    const bytesPerSec = Math.floor(size / secondsElapsed);

    _logger.default.debug(`Approximate download speed: ${_appiumSupport.util.toReadableSizeString(bytesPerSec)}/s`);
  }

  return targetPath;
}

async function walkDir(dir) {
  const result = [];

  for (const name of await _appiumSupport.fs.readdir(dir)) {
    const currentPath = _path.default.join(dir, name);

    result.push(currentPath);

    if ((await _appiumSupport.fs.stat(currentPath)).isDirectory()) {
      result.push(...(await walkDir(currentPath)));
    }
  }

  return result;
}

async function unzipApp(zipPath, dstRoot, supportedAppExtensions) {
  await _appiumSupport.zip.assertValidZip(zipPath);

  if (!_lodash.default.isArray(supportedAppExtensions)) {
    supportedAppExtensions = [supportedAppExtensions];
  }

  const tmpRoot = await _appiumSupport.tempDir.openDir();

  try {
    _logger.default.debug(`Unzipping '${zipPath}'`);

    await _appiumSupport.zip.extractAllTo(zipPath, tmpRoot);
    const allExtractedItems = await walkDir(tmpRoot);

    _logger.default.debug(`Extracted ${allExtractedItems.length} item(s) from '${zipPath}'`);

    const isSupportedAppItem = relativePath => supportedAppExtensions.includes(_path.default.extname(relativePath)) || _lodash.default.some(supportedAppExtensions, x => relativePath.includes(`${x}${_path.default.sep}`));

    const itemsToKeep = allExtractedItems.map(itemPath => _path.default.relative(tmpRoot, itemPath)).filter(relativePath => isSupportedAppItem(relativePath)).map(relativePath => _path.default.resolve(tmpRoot, relativePath));

    const itemsToRemove = _lodash.default.difference(allExtractedItems, itemsToKeep).filter(itemToRemovePath => !_lodash.default.some(itemsToKeep, itemToKeepPath => itemToKeepPath.startsWith(itemToRemovePath)));

    await _bluebird.default.all(itemsToRemove, async itemPath => {
      if (await _appiumSupport.fs.exists(itemPath)) {
        await _appiumSupport.fs.rimraf(itemPath);
      }
    });
    const allBundleItems = (await walkDir(tmpRoot)).map(itemPath => _path.default.relative(tmpRoot, itemPath)).filter(relativePath => isSupportedAppItem(relativePath)).sort((a, b) => a.split(_path.default.sep).length - b.split(_path.default.sep).length);

    if (_lodash.default.isEmpty(allBundleItems)) {
      throw new Error(`App zip unzipped OK, but we could not find ${supportedAppExtensions} bundle(s) ` + `in it. Make sure your archive contains ${supportedAppExtensions} package(s) ` + `and nothing else`);
    }

    const matchedBundle = _lodash.default.first(allBundleItems);

    _logger.default.debug(`Matched ${allBundleItems.length} item(s) in the extracted archive. ` + `Assuming '${matchedBundle}' is the correct bundle`);

    await _appiumSupport.fs.mv(_path.default.resolve(tmpRoot, matchedBundle), _path.default.resolve(dstRoot, matchedBundle), {
      mkdirp: true
    });
    return _path.default.resolve(dstRoot, matchedBundle);
  } finally {
    await _appiumSupport.fs.rimraf(tmpRoot);
  }
}

function isPackageOrBundle(app) {
  return /^([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)+$/.test(app);
}

function getCoordDefault(val) {
  return _appiumSupport.util.hasValue(val) ? val : 0.5;
}

function getSwipeTouchDuration(waitGesture) {
  let duration = 0.8;

  if (typeof waitGesture.options.ms !== 'undefined' && waitGesture.options.ms) {
    duration = waitGesture.options.ms / 1000;

    if (duration === 0) {
      duration = 0.1;
    }
  }

  return duration;
}

function duplicateKeys(input, firstKey, secondKey) {
  if (_lodash.default.isArray(input)) {
    return input.map(item => duplicateKeys(item, firstKey, secondKey));
  }

  if (_lodash.default.isPlainObject(input)) {
    const resultObj = {};

    for (let [key, value] of _lodash.default.toPairs(input)) {
      const recursivelyCalledValue = duplicateKeys(value, firstKey, secondKey);

      if (key === firstKey) {
        resultObj[secondKey] = recursivelyCalledValue;
      } else if (key === secondKey) {
        resultObj[firstKey] = recursivelyCalledValue;
      }

      resultObj[key] = recursivelyCalledValue;
    }

    return resultObj;
  }

  return input;
}

function parseCapsArray(cap) {
  let parsedCaps;

  try {
    parsedCaps = JSON.parse(cap);

    if (_lodash.default.isArray(parsedCaps)) {
      return parsedCaps;
    }
  } catch (ign) {
    _logger.default.warn(`Failed to parse capability as JSON array`);
  }

  if (_lodash.default.isString(cap)) {
    return [cap];
  }

  throw new Error(`must provide a string or JSON Array; received ${cap}`);
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9iYXNlZHJpdmVyL2hlbHBlcnMuanMiXSwibmFtZXMiOlsiWklQX0VYVFMiLCJaSVBfTUlNRV9UWVBFUyIsIkFQUExJQ0FUSU9OU19DQUNIRSIsIkxSVSIsIm1heCIsIkFQUExJQ0FUSU9OU19DQUNIRV9HVUFSRCIsIkFzeW5jTG9jayIsIlNBTklUSVpFX1JFUExBQ0VNRU5UIiwiREVGQVVMVF9CQVNFTkFNRSIsInJldHJpZXZlSGVhZGVycyIsImxpbmsiLCJyZXNwb25zZSIsInVybCIsIm1ldGhvZCIsInJlc29sdmVXaXRoRnVsbFJlc3BvbnNlIiwidGltZW91dCIsImhlYWRlcnMiLCJlIiwibG9nZ2VyIiwiZGVidWciLCJtZXNzYWdlIiwiZ2V0Q2FjaGVkQXBwbGljYXRpb25QYXRoIiwiY3VycmVudE1vZGlmaWVkIiwiaGFzIiwibGFzdE1vZGlmaWVkIiwiZnVsbFBhdGgiLCJnZXQiLCJnZXRUaW1lIiwidmVyaWZ5QXBwRXh0ZW5zaW9uIiwiYXBwIiwic3VwcG9ydGVkQXBwRXh0ZW5zaW9ucyIsImluY2x1ZGVzIiwicGF0aCIsImV4dG5hbWUiLCJFcnJvciIsImNvbmZpZ3VyZUFwcCIsIl8iLCJpc1N0cmluZyIsImlzQXJyYXkiLCJuZXdBcHAiLCJzaG91bGRVbnppcEFwcCIsImFyY2hpdmVIYXNoIiwicHJvdG9jb2wiLCJwYXRobmFtZSIsInBhcnNlIiwiaXNVcmwiLCJhY3F1aXJlIiwiaW5mbyIsIkRhdGUiLCJjYWNoZWRQYXRoIiwiZnMiLCJleGlzdHMiLCJkZWwiLCJmaWxlTmFtZSIsImJhc2VuYW1lIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicmVwbGFjZW1lbnQiLCJzb21lIiwibWltZVR5cGUiLCJSZWdFeHAiLCJlc2NhcGVSZWdFeHAiLCJ0ZXN0IiwibWF0Y2giLCJleGVjIiwicmVzdWx0aW5nTmFtZSIsInN1YnN0cmluZyIsImxlbmd0aCIsInJlc3VsdGluZ0V4dCIsImZpcnN0IiwidGFyZ2V0UGF0aCIsInRlbXBEaXIiLCJwcmVmaXgiLCJzdWZmaXgiLCJkb3dubG9hZEFwcCIsImVycm9yTWVzc2FnZSIsImFyY2hpdmVQYXRoIiwiaGFzaCIsInJpbXJhZiIsInRtcFJvb3QiLCJvcGVuRGlyIiwidW56aXBBcHAiLCJpc0Fic29sdXRlIiwicmVzb2x2ZSIsInByb2Nlc3MiLCJjd2QiLCJ3YXJuIiwic2V0IiwiaHJlZiIsInN0YXJ0ZWQiLCJocnRpbWUiLCJCIiwicmVqZWN0Iiwib24iLCJyZXMiLCJzdGF0dXNDb2RlIiwic3RhdHVzTWVzc2FnZSIsInBpcGUiLCJfZnMiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImVyciIsInNlY29uZHMiLCJucyIsInNlY29uZHNFbGFwc2VkIiwic2l6ZSIsInN0YXQiLCJ1dGlsIiwidG9SZWFkYWJsZVNpemVTdHJpbmciLCJ0b0ZpeGVkIiwiYnl0ZXNQZXJTZWMiLCJNYXRoIiwiZmxvb3IiLCJ3YWxrRGlyIiwiZGlyIiwicmVzdWx0IiwibmFtZSIsInJlYWRkaXIiLCJjdXJyZW50UGF0aCIsImpvaW4iLCJwdXNoIiwiaXNEaXJlY3RvcnkiLCJ6aXBQYXRoIiwiZHN0Um9vdCIsInppcCIsImFzc2VydFZhbGlkWmlwIiwiZXh0cmFjdEFsbFRvIiwiYWxsRXh0cmFjdGVkSXRlbXMiLCJpc1N1cHBvcnRlZEFwcEl0ZW0iLCJyZWxhdGl2ZVBhdGgiLCJ4Iiwic2VwIiwiaXRlbXNUb0tlZXAiLCJtYXAiLCJpdGVtUGF0aCIsInJlbGF0aXZlIiwiZmlsdGVyIiwiaXRlbXNUb1JlbW92ZSIsImRpZmZlcmVuY2UiLCJpdGVtVG9SZW1vdmVQYXRoIiwiaXRlbVRvS2VlcFBhdGgiLCJzdGFydHNXaXRoIiwiYWxsIiwiYWxsQnVuZGxlSXRlbXMiLCJzb3J0IiwiYSIsImIiLCJzcGxpdCIsImlzRW1wdHkiLCJtYXRjaGVkQnVuZGxlIiwibXYiLCJta2RpcnAiLCJpc1BhY2thZ2VPckJ1bmRsZSIsImdldENvb3JkRGVmYXVsdCIsInZhbCIsImhhc1ZhbHVlIiwiZ2V0U3dpcGVUb3VjaER1cmF0aW9uIiwid2FpdEdlc3R1cmUiLCJkdXJhdGlvbiIsIm9wdGlvbnMiLCJtcyIsImR1cGxpY2F0ZUtleXMiLCJpbnB1dCIsImZpcnN0S2V5Iiwic2Vjb25kS2V5IiwiaXRlbSIsImlzUGxhaW5PYmplY3QiLCJyZXN1bHRPYmoiLCJrZXkiLCJ2YWx1ZSIsInRvUGFpcnMiLCJyZWN1cnNpdmVseUNhbGxlZFZhbHVlIiwicGFyc2VDYXBzQXJyYXkiLCJjYXAiLCJwYXJzZWRDYXBzIiwiSlNPTiIsImlnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLFFBQVEsR0FBRyxDQUFDLE1BQUQsRUFBUyxNQUFULENBQWpCO0FBQ0EsTUFBTUMsY0FBYyxHQUFHLENBQ3JCLGlCQURxQixFQUVyQiw4QkFGcUIsRUFHckIsaUJBSHFCLENBQXZCO0FBS0EsTUFBTUMsa0JBQWtCLEdBQUcsSUFBSUMsaUJBQUosQ0FBUTtBQUNqQ0MsRUFBQUEsR0FBRyxFQUFFO0FBRDRCLENBQVIsQ0FBM0I7QUFHQSxNQUFNQyx3QkFBd0IsR0FBRyxJQUFJQyxrQkFBSixFQUFqQztBQUNBLE1BQU1DLG9CQUFvQixHQUFHLEdBQTdCO0FBQ0EsTUFBTUMsZ0JBQWdCLEdBQUcsWUFBekI7O0FBRUEsZUFBZUMsZUFBZixDQUFnQ0MsSUFBaEMsRUFBc0M7QUFDcEMsTUFBSTtBQUNGLFVBQU1DLFFBQVEsR0FBRyxNQUFNLDZCQUFhO0FBQ2xDQyxNQUFBQSxHQUFHLEVBQUVGLElBRDZCO0FBRWxDRyxNQUFBQSxNQUFNLEVBQUUsTUFGMEI7QUFHbENDLE1BQUFBLHVCQUF1QixFQUFFLElBSFM7QUFJbENDLE1BQUFBLE9BQU8sRUFBRTtBQUp5QixLQUFiLENBQXZCO0FBTUEsV0FBT0osUUFBUSxDQUFDSyxPQUFoQjtBQUNELEdBUkQsQ0FRRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkMsb0JBQU9DLEtBQVAsQ0FBYyxnQ0FBK0JULElB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Q0EsTUFBSTtBQUNGQSxJQUFBQSxVQUFVLEdBQUdDLElBQUksQ0FBQ2pJLEtBQUwsQ0FBVytILEdBQVgsQ0FBYjs7QUFDQSxRQUFJdkksZ0JBQUVFLE9BQUYsQ0FBVXNJLFVBQVYsQ0FBSixFQUEyQjtBQUN6QixhQUFPQSxVQUFQO0FBQ0Q7QUFDRixHQUxELENBS0UsT0FBT0UsR0FBUCxFQUFZO0FBQ1o1SixvQkFBT21FLElBQVAsQ0FBYSwwQ0FBYjtBQUNEOztBQUNELE1BQUlqRCxnQkFBRUMsUUFBRixDQUFXc0ksR0FBWCxDQUFKLEVBQXFCO0FBQ25CLFdBQU8sQ0FBQ0EsR0FBRCxDQUFQO0FBQ0Q7O0FBQ0QsUUFBTSxJQUFJekksS0FBSixDQUFXLGlEQUFnRHlJLEdBQUksRUFBL0QsQ0FBTjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgX2ZzIGZyb20gJ2ZzJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IHRlbXBEaXIsIGZzLCB1dGlsLCB6aXAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCBhc3luY1JlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlJztcbmltcG9ydCBMUlUgZnJvbSAnbHJ1LWNhY2hlJztcbmltcG9ydCBBc3luY0xvY2sgZnJvbSAnYXN5bmMtbG9jayc7XG5pbXBvcnQgc2FuaXRpemUgZnJvbSAnc2FuaXRpemUtZmlsZW5hbWUnO1xuXG5jb25zdCBaSVBfRVhUUyA9IFsnLnppcCcsICcuaXBhJ107XG5jb25zdCBaSVBfTUlNRV9UWVBFUyA9IFtcbiAgJ2FwcGxpY2F0aW9uL3ppcCcsXG4gICdhcHBsaWNhdGlvbi94LXppcC1jb21wcmVzc2VkJyxcbiAgJ211bHRpcGFydC94LXppcCcsXG5dO1xuY29uc3QgQVBQTElDQVRJT05TX0NBQ0hFID0gbmV3IExSVSh7XG4gIG1heDogMTAwLFxufSk7XG5jb25zdCBBUFBMSUNBVElPTlNfQ0FDSEVfR1VBUkQgPSBuZXcgQXN5bmNMb2NrKCk7XG5jb25zdCBTQU5JVElaRV9SRVBMQUNFTUVOVCA9ICctJztcbmNvbnN0IERFRkFVTFRfQkFTRU5BTUUgPSAnYXBwaXVtLWFwcCc7XG5cbmFzeW5jIGZ1bmN0aW9uIHJldHJpZXZlSGVhZGVycyAobGluaykge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXN5bmNSZXF1ZXN0KHtcbiAgICAgIHVybDogbGluayxcbiAgICAgIG1ldGhvZDogJ0hFQUQnLFxuICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IHRydWUsXG4gICAgICB0aW1lb3V0OiA1MDAwLFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZS5oZWFkZXJzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLmRlYnVnKGBDYW5ub3Qgc2VuZCBIRUFEIHJlcXVlc3QgdG8gJyR7bGlua30nLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIHt9O1xufVxuXG5mdW5jdGlvbiBnZXRDYWNoZWRBcHBsaWNhdGlvblBhdGggKGxpbmssIGN1cnJlbnRNb2RpZmllZCkge1xuICBpZiAoIUFQUExJQ0FUSU9OU19DQUNIRS5oYXMobGluaykgfHwgIWN1cnJlbnRNb2RpZmllZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qge2xhc3RNb2RpZmllZCwgZnVsbFBhdGh9ID0gQVBQTElDQVRJT05TX0NBQ0hFLmdldChsaW5rKTtcbiAgaWYgKGxhc3RNb2RpZmllZCAmJiBjdXJyZW50TW9kaWZpZWQuZ2V0VGltZSgpIDw9IGxhc3RNb2RpZmllZC5nZXRUaW1lKCkpIHtcbiAgICByZXR1cm4gZnVsbFBhdGg7XG4gIH1cbiAgbG9nZ2VyLmRlYnVnKGAnTGFzdC1Nb2RpZmllZCcgdGltZXN0YW1wIG9mICcke2xpbmt9JyBoYXMgYmVlbiB1cGRhdGVkLiBgICtcbiAgICBgQW4gdXBkYXRlZCBjb3B5IG9mIHRoZSBhcHBsaWNhdGlvbiBpcyBnb2luZyB0byBiZSBkb3dubG9hZGVkLmApO1xuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gdmVyaWZ5QXBwRXh0ZW5zaW9uIChhcHAsIHN1cHBvcnRlZEFwcEV4dGVuc2lvbnMpIHtcbiAgaWYgKHN1cHBvcnRlZEFwcEV4dGVuc2lvbnMuaW5jbHVkZXMocGF0aC5leHRuYW1lKGFwcCkpKSB7XG4gICAgcmV0dXJuIGFwcDtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYE5ldyBhcHAgcGF0aCAnJHthcHB9JyBkaWQgbm90IGhhdmUgZXh0ZW5zaW9uKHMpICcke3N1cHBvcnRlZEFwcEV4dGVuc2lvbnN9J2ApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb25maWd1cmVBcHAgKGFwcCwgc3VwcG9ydGVkQXBwRXh0ZW5zaW9ucykge1xuICBpZiAoIV8uaXNTdHJpbmcoYXBwKSkge1xuICAgIC8vIGltbWVkaWF0ZWx5IHNob3J0Y2lyY3VpdCBpZiBub3QgZ2l2ZW4gYW4gYXBwXG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghXy5pc0FycmF5KHN1cHBvcnRlZEFwcEV4dGVuc2lvbnMpKSB7XG4gICAgc3VwcG9ydGVkQXBwRXh0ZW5zaW9ucyA9IFtzdXBwb3J0ZWRBcHBFeHRlbnNpb25zXTtcbiAgfVxuXG4gIGxldCBuZXdBcHAgPSBhcHA7XG4gIGxldCBzaG91bGRVbnppcEFwcCA9IGZhbHNlO1xuICBsZXQgYXJjaGl2ZUhhc2ggPSBudWxsO1xuICBsZXQgY3VycmVudE1vZGlmaWVkID0gbnVsbDtcbiAgY29uc3Qge3Byb3RvY29sLCBwYXRobmFtZX0gPSB1cmwucGFyc2UobmV3QXBwKTtcbiAgY29uc3QgaXNVcmwgPSBbJ2h0dHA6JywgJ2h0dHBzOiddLmluY2x1ZGVzKHByb3RvY29sKTtcblxuICByZXR1cm4gYXdhaXQgQVBQTElDQVRJT05TX0NBQ0hFX0dVQVJELmFjcXVpcmUoYXBwLCBhc3luYyAoKSA9PiB7XG4gICAgaWYgKGlzVXJsKSB7XG4gICAgICAvLyBVc2UgdGhlIGFwcCBmcm9tIHJlbW90ZSBVUkxcbiAgICAgIGxvZ2dlci5pbmZvKGBVc2luZyBkb3dubG9hZGFibGUgYXBwICcke25ld0FwcH0nYCk7XG4gICAgICBjb25zdCBoZWFkZXJzID0gYXdhaXQgcmV0cmlldmVIZWFkZXJzKG5ld0FwcCk7XG4gICAgICBpZiAoaGVhZGVyc1snbGFzdC1tb2RpZmllZCddKSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgQXBwIExhc3QtTW9kaWZpZWQ6ICR7aGVhZGVyc1snbGFzdC1tb2RpZmllZCddfWApO1xuICAgICAgICBjdXJyZW50TW9kaWZpZWQgPSBuZXcgRGF0ZShoZWFkZXJzWydsYXN0LW1vZGlmaWVkJ10pO1xuICAgICAgfVxuICAgICAgY29uc3QgY2FjaGVkUGF0aCA9IGdldENhY2hlZEFwcGxpY2F0aW9uUGF0aChhcHAsIGN1cnJlbnRNb2RpZmllZCk7XG4gICAgICBpZiAoY2FjaGVkUGF0aCkge1xuICAgICAgICBpZiAoYXdhaXQgZnMuZXhpc3RzKGNhY2hlZFBhdGgpKSB7XG4gICAgICAgICAgbG9nZ2VyLmluZm8oYFJldXNpbmcgcHJldmlvdXNseSBkb3dubG9hZGVkIGFwcGxpY2F0aW9uIGF0ICcke2NhY2hlZFBhdGh9J2ApO1xuICAgICAgICAgIHJldHVybiB2ZXJpZnlBcHBFeHRlbnNpb24oY2FjaGVkUGF0aCwgc3VwcG9ydGVkQXBwRXh0ZW5zaW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmluZm8oYFRoZSBhcHBsaWNhdGlvbiBhdCAnJHtjYWNoZWRQYXRofScgZG9lcyBub3QgZXhpc3QgYW55bW9yZS4gRGVsZXRpbmcgaXQgZnJvbSB0aGUgY2FjaGVgKTtcbiAgICAgICAgQVBQTElDQVRJT05TX0NBQ0hFLmRlbChhcHApO1xuICAgICAgfVxuXG4gICAgICBsZXQgZmlsZU5hbWUgPSBudWxsO1xuICAgICAgY29uc3QgYmFzZW5hbWUgPSBzYW5pdGl6ZShwYXRoLmJhc2VuYW1lKGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkpLCB7XG4gICAgICAgIHJlcGxhY2VtZW50OiBTQU5JVElaRV9SRVBMQUNFTUVOVFxuICAgICAgfSk7XG4gICAgICBjb25zdCBleHRuYW1lID0gcGF0aC5leHRuYW1lKGJhc2VuYW1lKTtcbiAgICAgIC8vIHRvIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvIHVuemlwIHRoZSBhcHAsIHdlIGhhdmUgYSBudW1iZXIgb2YgcGxhY2VzXG4gICAgICAvLyB0byBsb29rOiBjb250ZW50IHR5cGUsIGNvbnRlbnQgZGlzcG9zaXRpb24sIG9yIHRoZSBmaWxlIGV4dGVuc2lvblxuICAgICAgaWYgKFpJUF9FWFRTLmluY2x1ZGVzKGV4dG5hbWUpKSB7XG4gICAgICAgIGZpbGVOYW1lID0gYmFzZW5hbWU7XG4gICAgICAgIHNob3VsZFVuemlwQXBwID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChoZWFkZXJzWydjb250ZW50LXR5cGUnXSkge1xuICAgICAgICBsb2dnZXIuZGVidWcoYENvbnRlbnQtVHlwZTogJHtoZWFkZXJzWydjb250ZW50LXR5cGUnXX1gKTtcbiAgICAgICAgLy8gdGhlIGZpbGV0eXBlIG1heSBub3QgYmUgb2J2aW91cyBmb3IgY2VydGFpbiB1cmxzLCBzbyBjaGVjayB0aGUgbWltZSB0eXBlIHRvb1xuICAgICAgICBpZiAoWklQX01JTUVfVFlQRVMuc29tZShtaW1lVHlwZSA9PiBuZXcgUmVnRXhwKGBcXFxcYiR7Xy5lc2NhcGVSZWdFeHAobWltZVR5cGUpfVxcXFxiYCkudGVzdChoZWFkZXJzWydjb250ZW50LXR5cGUnXSkpKSB7XG4gICAgICAgICAgaWYgKCFmaWxlTmFtZSkge1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBgJHtERUZBVUxUX0JBU0VOQU1FfS56aXBgO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzaG91bGRVbnppcEFwcCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoZWFkZXJzWydjb250ZW50LWRpc3Bvc2l0aW9uJ10gJiYgL15hdHRhY2htZW50L2kudGVzdChoZWFkZXJzWydjb250ZW50LWRpc3Bvc2l0aW9uJ10pKSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgQ29udGVudC1EaXNwb3NpdGlvbjogJHtoZWFkZXJzWydjb250ZW50LWRpc3Bvc2l0aW9uJ119YCk7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gL2ZpbGVuYW1lPVwiKFteXCJdKykvaS5leGVjKGhlYWRlcnNbJ2NvbnRlbnQtZGlzcG9zaXRpb24nXSk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGZpbGVOYW1lID0gc2FuaXRpemUobWF0Y2hbMV0sIHtcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiBTQU5JVElaRV9SRVBMQUNFTUVOVFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNob3VsZFVuemlwQXBwID0gc2hvdWxkVW56aXBBcHAgfHwgWklQX0VYVFMuaW5jbHVkZXMocGF0aC5leHRuYW1lKGZpbGVOYW1lKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZmlsZU5hbWUpIHtcbiAgICAgICAgLy8gYXNzaWduIHRoZSBkZWZhdWx0IGZpbGUgbmFtZSBhbmQgdGhlIGV4dGVuc2lvbiBpZiBub25lIGhhcyBiZWVuIGRldGVjdGVkXG4gICAgICAgIGNvbnN0IHJlc3VsdGluZ05hbWUgPSBiYXNlbmFtZVxuICAgICAgICAgID8gYmFzZW5hbWUuc3Vic3RyaW5nKDAsIGJhc2VuYW1lLmxlbmd0aCAtIGV4dG5hbWUubGVuZ3RoKVxuICAgICAgICAgIDogREVGQVVMVF9CQVNFTkFNRTtcbiAgICAgICAgbGV0IHJlc3VsdGluZ0V4dCA9IGV4dG5hbWU7XG4gICAgICAgIGlmICghc3VwcG9ydGVkQXBwRXh0ZW5zaW9ucy5pbmNsdWRlcyhyZXN1bHRpbmdFeHQpKSB7XG4gICAgICAgICAgbG9nZ2VyLmluZm8oYFRoZSBjdXJyZW50IGZpbGUgZXh0ZW5zaW9uICcke3Jlc3VsdGluZ0V4dH0nIGlzIG5vdCBzdXBwb3J0ZWQuIGAgK1xuICAgICAgICAgICAgYERlZmF1bHRpbmcgdG8gJyR7Xy5maXJzdChzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKX0nYCk7XG4gICAgICAgICAgcmVzdWx0aW5nRXh0ID0gXy5maXJzdChzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBmaWxlTmFtZSA9IGAke3Jlc3VsdGluZ05hbWV9JHtyZXN1bHRpbmdFeHR9YDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBhd2FpdCB0ZW1wRGlyLnBhdGgoe1xuICAgICAgICBwcmVmaXg6IGZpbGVOYW1lLFxuICAgICAgICBzdWZmaXg6ICcnLFxuICAgICAgfSk7XG4gICAgICBuZXdBcHAgPSBhd2FpdCBkb3dubG9hZEFwcChuZXdBcHAsIHRhcmdldFBhdGgpO1xuICAgIH0gZWxzZSBpZiAoYXdhaXQgZnMuZXhpc3RzKG5ld0FwcCkpIHtcbiAgICAgIC8vIFVzZSB0aGUgbG9jYWwgYXBwXG4gICAgICBsb2dnZXIuaW5mbyhgVXNpbmcgbG9jYWwgYXBwICcke25ld0FwcH0nYCk7XG4gICAgICBzaG91bGRVbnppcEFwcCA9IFpJUF9FWFRTLmluY2x1ZGVzKHBhdGguZXh0bmFtZShuZXdBcHApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IGBUaGUgYXBwbGljYXRpb24gYXQgJyR7bmV3QXBwfScgZG9lcyBub3QgZXhpc3Qgb3IgaXMgbm90IGFjY2Vzc2libGVgO1xuICAgICAgLy8gcHJvdG9jb2wgdmFsdWUgZm9yICdDOlxcXFx0ZW1wJyBpcyAnYzonLCBzbyB3ZSBjaGVjayB0aGUgbGVuZ3RoIGFzIHdlbGxcbiAgICAgIGlmIChfLmlzU3RyaW5nKHByb3RvY29sKSAmJiBwcm90b2NvbC5sZW5ndGggPiAyKSB7XG4gICAgICAgIGVycm9yTWVzc2FnZSA9IGBUaGUgcHJvdG9jb2wgJyR7cHJvdG9jb2x9JyB1c2VkIGluICcke25ld0FwcH0nIGlzIG5vdCBzdXBwb3J0ZWQuIGAgK1xuICAgICAgICAgIGBPbmx5IGh0dHA6IGFuZCBodHRwczogcHJvdG9jb2xzIGFyZSBzdXBwb3J0ZWRgO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFVuemlwQXBwKSB7XG4gICAgICBjb25zdCBhcmNoaXZlUGF0aCA9IG5ld0FwcDtcbiAgICAgIGFyY2hpdmVIYXNoID0gYXdhaXQgZnMuaGFzaChhcmNoaXZlUGF0aCk7XG4gICAgICBpZiAoQVBQTElDQVRJT05TX0NBQ0hFLmhhcyhhcHApICYmIGFyY2hpdmVIYXNoID09PSBBUFBMSUNBVElPTlNfQ0FDSEUuZ2V0KGFwcCkuaGFzaCkge1xuICAgICAgICBjb25zdCB7ZnVsbFBhdGh9ID0gQVBQTElDQVRJT05TX0NBQ0hFLmdldChhcHApO1xuICAgICAgICBpZiAoYXdhaXQgZnMuZXhpc3RzKGZ1bGxQYXRoKSkge1xuICAgICAgICAgIGlmIChhcmNoaXZlUGF0aCAhPT0gYXBwKSB7XG4gICAgICAgICAgICBhd2FpdCBmcy5yaW1yYWYoYXJjaGl2ZVBhdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2dnZXIuaW5mbyhgV2lsbCByZXVzZSBwcmV2aW91c2x5IGNhY2hlZCBhcHBsaWNhdGlvbiBhdCAnJHtmdWxsUGF0aH0nYCk7XG4gICAgICAgICAgcmV0dXJuIHZlcmlmeUFwcEV4dGVuc2lvbihmdWxsUGF0aCwgc3VwcG9ydGVkQXBwRXh0ZW5zaW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmluZm8oYFRoZSBhcHBsaWNhdGlvbiBhdCAnJHtmdWxsUGF0aH0nIGRvZXMgbm90IGV4aXN0IGFueW1vcmUuIERlbGV0aW5nIGl0IGZyb20gdGhlIGNhY2hlYCk7XG4gICAgICAgIEFQUExJQ0FUSU9OU19DQUNIRS5kZWwoYXBwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRtcFJvb3QgPSBhd2FpdCB0ZW1wRGlyLm9wZW5EaXIoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ld0FwcCA9IGF3YWl0IHVuemlwQXBwKGFyY2hpdmVQYXRoLCB0bXBSb290LCBzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChuZXdBcHAgIT09IGFyY2hpdmVQYXRoICYmIGFyY2hpdmVQYXRoICE9PSBhcHApIHtcbiAgICAgICAgICBhd2FpdCBmcy5yaW1yYWYoYXJjaGl2ZVBhdGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsb2dnZXIuaW5mbyhgVW56aXBwZWQgbG9jYWwgYXBwIHRvICcke25ld0FwcH0nYCk7XG4gICAgfSBlbHNlIGlmICghcGF0aC5pc0Fic29sdXRlKG5ld0FwcCkpIHtcbiAgICAgIG5ld0FwcCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBuZXdBcHApO1xuICAgICAgbG9nZ2VyLndhcm4oYFRoZSBjdXJyZW50IGFwcGxpY2F0aW9uIHBhdGggJyR7YXBwfScgaXMgbm90IGFic29sdXRlIGAgK1xuICAgICAgICBgYW5kIGhhcyBiZWVuIHJld3JpdHRlbiB0byAnJHtuZXdBcHB9Jy4gQ29uc2lkZXIgdXNpbmcgYWJzb2x1dGUgcGF0aHMgcmF0aGVyIHRoYW4gcmVsYXRpdmVgKTtcbiAgICAgIGFwcCA9IG5ld0FwcDtcbiAgICB9XG5cbiAgICB2ZXJpZnlBcHBFeHRlbnNpb24obmV3QXBwLCBzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKTtcblxuICAgIGlmIChhcHAgIT09IG5ld0FwcCAmJiAoYXJjaGl2ZUhhc2ggfHwgY3VycmVudE1vZGlmaWVkKSkge1xuICAgICAgQVBQTElDQVRJT05TX0NBQ0hFLnNldChhcHAsIHtcbiAgICAgICAgaGFzaDogYXJjaGl2ZUhhc2gsXG4gICAgICAgIGxhc3RNb2RpZmllZDogY3VycmVudE1vZGlmaWVkLFxuICAgICAgICBmdWxsUGF0aDogbmV3QXBwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXdBcHA7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkb3dubG9hZEFwcCAoYXBwLCB0YXJnZXRQYXRoKSB7XG4gIGNvbnN0IHtocmVmfSA9IHVybC5wYXJzZShhcHApO1xuICBjb25zdCBzdGFydGVkID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgdHJ5IHtcbiAgICAvLyBkb24ndCB1c2UgcmVxdWVzdC1wcm9taXNlIGhlcmUsIHdlIG5lZWQgc3RyZWFtc1xuICAgIGF3YWl0IG5ldyBCKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlcXVlc3QoaHJlZilcbiAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdCkgLy8gaGFuZGxlIHJlYWwgZXJyb3JzLCBsaWtlIGNvbm5lY3Rpb24gZXJyb3JzXG4gICAgICAgIC5vbigncmVzcG9uc2UnLCAocmVzKSA9PiB7XG4gICAgICAgICAgLy8gaGFuZGxlIHJlc3BvbnNlcyB0aGF0IGZhaWwsIGxpa2UgNDA0c1xuICAgICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA+PSA0MDApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKGAke3Jlcy5zdGF0dXNDb2RlfSAtICR7cmVzLnN0YXR1c01lc3NhZ2V9YCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnBpcGUoX2ZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRhcmdldFBhdGgpKVxuICAgICAgICAub24oJ2Nsb3NlJywgcmVzb2x2ZSk7XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgUHJvYmxlbSBkb3dubG9hZGluZyBhcHAgZnJvbSB1cmwgJHtocmVmfTogJHtlcnIubWVzc2FnZX1gKTtcbiAgfVxuICBjb25zdCBbc2Vjb25kcywgbnNdID0gcHJvY2Vzcy5ocnRpbWUoc3RhcnRlZCk7XG4gIGNvbnN0IHNlY29uZHNFbGFwc2VkID0gc2Vjb25kcyArIG5zIC8gMWUwOTtcbiAgY29uc3Qge3NpemV9ID0gYXdhaXQgZnMuc3RhdCh0YXJnZXRQYXRoKTtcbiAgbG9nZ2VyLmRlYnVnKGAnJHtocmVmfScgKCR7dXRpbC50b1JlYWRhYmxlU2l6ZVN0cmluZyhzaXplKX0pIGAgK1xuICAgIGBoYXMgYmVlbiBkb3dubG9hZGVkIHRvICcke3RhcmdldFBhdGh9JyBpbiAke3NlY29uZHNFbGFwc2VkLnRvRml4ZWQoMyl9c2ApO1xuICBpZiAoc2Vjb25kc0VsYXBzZWQgPj0gMikge1xuICAgIGNvbnN0IGJ5dGVzUGVyU2VjID0gTWF0aC5mbG9vcihzaXplIC8gc2Vjb25kc0VsYXBzZWQpO1xuICAgIGxvZ2dlci5kZWJ1ZyhgQXBwcm94aW1hdGUgZG93bmxvYWQgc3BlZWQ6ICR7dXRpbC50b1JlYWRhYmxlU2l6ZVN0cmluZyhieXRlc1BlclNlYyl9L3NgKTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0UGF0aDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd2Fsa0RpciAoZGlyKSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgYXdhaXQgZnMucmVhZGRpcihkaXIpKSB7XG4gICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoLmpvaW4oZGlyLCBuYW1lKTtcbiAgICByZXN1bHQucHVzaChjdXJyZW50UGF0aCk7XG4gICAgaWYgKChhd2FpdCBmcy5zdGF0KGN1cnJlbnRQYXRoKSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgcmVzdWx0LnB1c2goLi4uKGF3YWl0IHdhbGtEaXIoY3VycmVudFBhdGgpKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVuemlwQXBwICh6aXBQYXRoLCBkc3RSb290LCBzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKSB7XG4gIGF3YWl0IHppcC5hc3NlcnRWYWxpZFppcCh6aXBQYXRoKTtcblxuICBpZiAoIV8uaXNBcnJheShzdXBwb3J0ZWRBcHBFeHRlbnNpb25zKSkge1xuICAgIHN1cHBvcnRlZEFwcEV4dGVuc2lvbnMgPSBbc3VwcG9ydGVkQXBwRXh0ZW5zaW9uc107XG4gIH1cblxuICBjb25zdCB0bXBSb290ID0gYXdhaXQgdGVtcERpci5vcGVuRGlyKCk7XG4gIHRyeSB7XG4gICAgbG9nZ2VyLmRlYnVnKGBVbnppcHBpbmcgJyR7emlwUGF0aH0nYCk7XG4gICAgYXdhaXQgemlwLmV4dHJhY3RBbGxUbyh6aXBQYXRoLCB0bXBSb290KTtcbiAgICBjb25zdCBhbGxFeHRyYWN0ZWRJdGVtcyA9IGF3YWl0IHdhbGtEaXIodG1wUm9vdCk7XG4gICAgbG9nZ2VyLmRlYnVnKGBFeHRyYWN0ZWQgJHthbGxFeHRyYWN0ZWRJdGVtcy5sZW5ndGh9IGl0ZW0ocykgZnJvbSAnJHt6aXBQYXRofSdgKTtcbiAgICBjb25zdCBpc1N1cHBvcnRlZEFwcEl0ZW0gPSAocmVsYXRpdmVQYXRoKSA9PiBzdXBwb3J0ZWRBcHBFeHRlbnNpb25zLmluY2x1ZGVzKHBhdGguZXh0bmFtZShyZWxhdGl2ZVBhdGgpKVxuICAgICAgfHwgXy5zb21lKHN1cHBvcnRlZEFwcEV4dGVuc2lvbnMsICh4KSA9PiByZWxhdGl2ZVBhdGguaW5jbHVkZXMoYCR7eH0ke3BhdGguc2VwfWApKTtcbiAgICBjb25zdCBpdGVtc1RvS2VlcCA9IGFsbEV4dHJhY3RlZEl0ZW1zXG4gICAgICAubWFwKChpdGVtUGF0aCkgPT4gcGF0aC5yZWxhdGl2ZSh0bXBSb290LCBpdGVtUGF0aCkpXG4gICAgICAuZmlsdGVyKChyZWxhdGl2ZVBhdGgpID0+IGlzU3VwcG9ydGVkQXBwSXRlbShyZWxhdGl2ZVBhdGgpKVxuICAgICAgLm1hcCgocmVsYXRpdmVQYXRoKSA9PiBwYXRoLnJlc29sdmUodG1wUm9vdCwgcmVsYXRpdmVQYXRoKSk7XG4gICAgY29uc3QgaXRlbXNUb1JlbW92ZSA9IF8uZGlmZmVyZW5jZShhbGxFeHRyYWN0ZWRJdGVtcywgaXRlbXNUb0tlZXApXG4gICAgICAvLyBBdm9pZCBwYXJlbnQgZm9sZGVycyB0byBiZSByZWN1cnNpdmVseSByZW1vdmVkXG4gICAgICAuZmlsdGVyKChpdGVtVG9SZW1vdmVQYXRoKSA9PiAhXy5zb21lKGl0ZW1zVG9LZWVwLCAoaXRlbVRvS2VlcFBhdGgpID0+IGl0ZW1Ub0tlZXBQYXRoLnN0YXJ0c1dpdGgoaXRlbVRvUmVtb3ZlUGF0aCkpKTtcbiAgICBhd2FpdCBCLmFsbChpdGVtc1RvUmVtb3ZlLCBhc3luYyAoaXRlbVBhdGgpID0+IHtcbiAgICAgIGlmIChhd2FpdCBmcy5leGlzdHMoaXRlbVBhdGgpKSB7XG4gICAgICAgIGF3YWl0IGZzLnJpbXJhZihpdGVtUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgYWxsQnVuZGxlSXRlbXMgPSAoYXdhaXQgd2Fsa0Rpcih0bXBSb290KSlcbiAgICAgIC5tYXAoKGl0ZW1QYXRoKSA9PiBwYXRoLnJlbGF0aXZlKHRtcFJvb3QsIGl0ZW1QYXRoKSlcbiAgICAgIC5maWx0ZXIoKHJlbGF0aXZlUGF0aCkgPT4gaXNTdXBwb3J0ZWRBcHBJdGVtKHJlbGF0aXZlUGF0aCkpXG4gICAgICAvLyBHZXQgdGhlIHRvcCBsZXZlbCBtYXRjaFxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEuc3BsaXQocGF0aC5zZXApLmxlbmd0aCAtIGIuc3BsaXQocGF0aC5zZXApLmxlbmd0aCk7XG4gICAgaWYgKF8uaXNFbXB0eShhbGxCdW5kbGVJdGVtcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXBwIHppcCB1bnppcHBlZCBPSywgYnV0IHdlIGNvdWxkIG5vdCBmaW5kICR7c3VwcG9ydGVkQXBwRXh0ZW5zaW9uc30gYnVuZGxlKHMpIGAgK1xuICAgICAgICBgaW4gaXQuIE1ha2Ugc3VyZSB5b3VyIGFyY2hpdmUgY29udGFpbnMgJHtzdXBwb3J0ZWRBcHBFeHRlbnNpb25zfSBwYWNrYWdlKHMpIGAgK1xuICAgICAgICBgYW5kIG5vdGhpbmcgZWxzZWApO1xuICAgIH1cbiAgICBjb25zdCBtYXRjaGVkQnVuZGxlID0gXy5maXJzdChhbGxCdW5kbGVJdGVtcyk7XG4gICAgbG9nZ2VyLmRlYnVnKGBNYXRjaGVkICR7YWxsQnVuZGxlSXRlbXMubGVuZ3RofSBpdGVtKHMpIGluIHRoZSBleHRyYWN0ZWQgYXJjaGl2ZS4gYCArXG4gICAgICBgQXNzdW1pbmcgJyR7bWF0Y2hlZEJ1bmRsZX0nIGlzIHRoZSBjb3JyZWN0IGJ1bmRsZWApO1xuICAgIGF3YWl0IGZzLm12KHBhdGgucmVzb2x2ZSh0bXBSb290LCBtYXRjaGVkQnVuZGxlKSwgcGF0aC5yZXNvbHZlKGRzdFJvb3QsIG1hdGNoZWRCdW5kbGUpLCB7XG4gICAgICBta2RpcnA6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gcGF0aC5yZXNvbHZlKGRzdFJvb3QsIG1hdGNoZWRCdW5kbGUpO1xuICB9IGZpbmFsbHkge1xuICAgIGF3YWl0IGZzLnJpbXJhZih0bXBSb290KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1BhY2thZ2VPckJ1bmRsZSAoYXBwKSB7XG4gIHJldHVybiAoL14oW2EtekEtWjAtOVxcLV9dK1xcLlthLXpBLVowLTlcXC1fXSspKyQvKS50ZXN0KGFwcCk7XG59XG5cbmZ1bmN0aW9uIGdldENvb3JkRGVmYXVsdCAodmFsKSB7XG4gIC8vIGdvaW5nIHRoZSBsb25nIHdheSBhbmQgY2hlY2tpbmcgZm9yIHVuZGVmaW5lZCBhbmQgbnVsbCBzaW5jZVxuICAvLyB3ZSBjYW4ndCBiZSBhc3N1cmVkIGBlbElkYCBpcyBhIHN0cmluZyBhbmQgbm90IGFuIGludC4gU2FtZVxuICAvLyB0aGluZyB3aXRoIGRlc3RFbGVtZW50IGJlbG93LlxuICByZXR1cm4gdXRpbC5oYXNWYWx1ZSh2YWwpID8gdmFsIDogMC41O1xufVxuXG5mdW5jdGlvbiBnZXRTd2lwZVRvdWNoRHVyYXRpb24gKHdhaXRHZXN0dXJlKSB7XG4gIC8vIHRoZSB0b3VjaCBhY3Rpb24gYXBpIHVzZXMgbXMsIHdlIHdhbnQgc2Vjb25kc1xuICAvLyAwLjggaXMgdGhlIGRlZmF1bHQgdGltZSBmb3IgdGhlIG9wZXJhdGlvblxuICBsZXQgZHVyYXRpb24gPSAwLjg7XG4gIGlmICh0eXBlb2Ygd2FpdEdlc3R1cmUub3B0aW9ucy5tcyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2FpdEdlc3R1cmUub3B0aW9ucy5tcykge1xuICAgIGR1cmF0aW9uID0gd2FpdEdlc3R1cmUub3B0aW9ucy5tcyAvIDEwMDA7XG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICAvLyBzZXQgdG8gYSB2ZXJ5IGxvdyBudW1iZXIsIHNpbmNlIHRoZXkgd2FudGVkIGl0IGZhc3RcbiAgICAgIC8vIGJ1dCBiZWxvdyAwLjEgYmVjb21lcyAwIHN0ZXBzLCB3aGljaCBjYXVzZXMgZXJyb3JzXG4gICAgICBkdXJhdGlvbiA9IDAuMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGR1cmF0aW9uO1xufVxuXG4vKipcbiAqIEZpbmRzIGFsbCBpbnN0YW5jZXMgJ2ZpcnN0S2V5JyBhbmQgY3JlYXRlIGEgZHVwbGljYXRlIHdpdGggdGhlIGtleSAnc2Vjb25kS2V5JyxcbiAqIERvIHRoZSBzYW1lIHRoaW5nIGluIHJldmVyc2UuIElmIHdlIGZpbmQgJ3NlY29uZEtleScsIGNyZWF0ZSBhIGR1cGxpY2F0ZSB3aXRoIHRoZSBrZXkgJ2ZpcnN0S2V5Jy5cbiAqXG4gKiBUaGlzIHdpbGwgY2F1c2Uga2V5cyB0byBiZSBvdmVyd3JpdHRlbiBpZiB0aGUgb2JqZWN0IGNvbnRhaW5zICdmaXJzdEtleScgYW5kICdzZWNvbmRLZXknLlxuXG4gKiBAcGFyYW0geyp9IGlucHV0IEFueSB0eXBlIG9mIGlucHV0XG4gKiBAcGFyYW0ge1N0cmluZ30gZmlyc3RLZXkgVGhlIGZpcnN0IGtleSB0byBkdXBsaWNhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWNvbmRLZXkgVGhlIHNlY29uZCBrZXkgdG8gZHVwbGljYXRlXG4gKi9cbmZ1bmN0aW9uIGR1cGxpY2F0ZUtleXMgKGlucHV0LCBmaXJzdEtleSwgc2Vjb25kS2V5KSB7XG4gIC8vIElmIGFycmF5IHByb3ZpZGVkLCByZWN1cnNpdmVseSBjYWxsIG9uIGFsbCBlbGVtZW50c1xuICBpZiAoXy5pc0FycmF5KGlucHV0KSkge1xuICAgIHJldHVybiBpbnB1dC5tYXAoKGl0ZW0pID0+IGR1cGxpY2F0ZUtleXMoaXRlbSwgZmlyc3RLZXksIHNlY29uZEtleSkpO1xuICB9XG5cbiAgLy8gSWYgb2JqZWN0LCBjcmVhdGUgZHVwbGljYXRlcyBmb3Iga2V5cyBhbmQgdGhlbiByZWN1cnNpdmVseSBjYWxsIG9uIHZhbHVlc1xuICBpZiAoXy5pc1BsYWluT2JqZWN0KGlucHV0KSkge1xuICAgIGNvbnN0IHJlc3VsdE9iaiA9IHt9O1xuICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBfLnRvUGFpcnMoaW5wdXQpKSB7XG4gICAgICBjb25zdCByZWN1cnNpdmVseUNhbGxlZFZhbHVlID0gZHVwbGljYXRlS2V5cyh2YWx1ZSwgZmlyc3RLZXksIHNlY29uZEtleSk7XG4gICAgICBpZiAoa2V5ID09PSBmaXJzdEtleSkge1xuICAgICAgICByZXN1bHRPYmpbc2Vjb25kS2V5XSA9IHJlY3Vyc2l2ZWx5Q2FsbGVkVmFsdWU7XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gc2Vjb25kS2V5KSB7XG4gICAgICAgIHJlc3VsdE9ialtmaXJzdEtleV0gPSByZWN1cnNpdmVseUNhbGxlZFZhbHVlO1xuICAgICAgfVxuICAgICAgcmVzdWx0T2JqW2tleV0gPSByZWN1cnNpdmVseUNhbGxlZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0T2JqO1xuICB9XG5cbiAgLy8gQmFzZSBjYXNlLiBSZXR1cm4gcHJpbWl0aXZlcyB3aXRob3V0IGRvaW5nIGFueXRoaW5nLlxuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogVGFrZXMgYSBkZXNpcmVkIGNhcGFiaWxpdHkgYW5kIHRyaWVzIHRvIEpTT04ucGFyc2UgaXQgYXMgYW4gYXJyYXksXG4gKiBhbmQgZWl0aGVyIHJldHVybnMgdGhlIHBhcnNlZCBhcnJheSBvciBhIHNpbmdsZXRvbiBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xBcnJheTxTdHJpbmc+fSBjYXAgQSBkZXNpcmVkIGNhcGFiaWxpdHlcbiAqL1xuZnVuY3Rpb24gcGFyc2VDYXBzQXJyYXkgKGNhcCkge1xuICBsZXQgcGFyc2VkQ2FwcztcbiAgdHJ5IHtcbiAgICBwYXJzZWRDYXBzID0gSlNPTi5wYXJzZShjYXApO1xuICAgIGlmIChfLmlzQXJyYXkocGFyc2VkQ2FwcykpIHtcbiAgICAgIHJldHVybiBwYXJzZWRDYXBzO1xuICAgIH1cbiAgfSBjYXRjaCAoaWduKSB7XG4gICAgbG9nZ2VyLndhcm4oYEZhaWxlZCB0byBwYXJzZSBjYXBhYmlsaXR5IGFzIEpTT04gYXJyYXlgKTtcbiAgfVxuICBpZiAoXy5pc1N0cmluZyhjYXApKSB7XG4gICAgcmV0dXJuIFtjYXBdO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgbXVzdCBwcm92aWRlIGEgc3RyaW5nIG9yIEpTT04gQXJyYXk7IHJlY2VpdmVkICR7Y2FwfWApO1xufVxuXG5leHBvcnQge1xuICBjb25maWd1cmVBcHAsIGlzUGFja2FnZU9yQnVuZGxlLCBnZXRDb29yZERlZmF1bHQsIGdldFN3aXBlVG91Y2hEdXJhdGlvbiwgZHVwbGljYXRlS2V5cywgcGFyc2VDYXBzQXJyYXlcbn07XG4iXSwiZmlsZSI6ImxpYi9iYXNlZHJpdmVyL2hlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
