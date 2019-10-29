"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _2 = require("../..");

var _fakeDriver = require("./fake-driver");

var _lodash = _interopRequireDefault(require("lodash"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _sinon = _interopRequireDefault(require("sinon"));

var _httpStatusCodes = _interopRequireDefault(require("http-status-codes"));

var _helpers = require("./helpers");

var _protocol = require("../../lib/protocol/protocol");

let should = _chai.default.should();

_chai.default.use(_chaiAsPromised.default);

const serverPort = 8181;
const baseUrl = `http://localhost:${serverPort}/wd/hub`;
describe('Protocol', function () {
  describe('direct to driver', function () {
    let d = new _fakeDriver.FakeDriver();
    it('should return response values directly from the driver', async function () {
      (await d.setUrl('http://google.com')).should.contain('google');
    });
  });
  describe('via express router', function () {
    let mjsonwpServer;
    let driver;
    before(async function () {
      driver = new _fakeDriver.FakeDriver();
      driver.sessionId = 'foo';
      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    after(async function () {
      await mjsonwpServer.close();
    });
    it('should proxy to driver and return valid jsonwp response', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        }
      });
      res.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should assume requests without a Content-Type are json requests', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        body: JSON.stringify({
          url: 'http://google.com'
        })
      });
      JSON.parse(res).should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should respond to x-www-form-urlencoded as well as json requests', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        form: {
          url: 'http://google.com'
        }
      });
      JSON.parse(res).should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should include url request parameters for methods to use - sessionid', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/back`,
        method: 'POST',
        json: {},
        simple: false,
        resolveWithFullResponse: true
      });
      res.body.should.eql({
        status: 0,
        value: 'foo',
        sessionId: 'foo'
      });
    });
    it('should include url request parameters for methods to use - elementid', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/click`,
        method: 'POST',
        json: {}
      });
      res.status.should.equal(0);
      res.value.should.eql(['bar', 'foo']);
    });
    it('should include url req params in the order: custom, element, session', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/attribute/baz`,
        method: 'GET',
        json: {}
      });
      res.status.should.equal(0);
      res.value.should.eql(['baz', 'bar', 'foo']);
    });
    it('should respond with 400 Bad Request if parameters missing', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        json: {},
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(400);
      res.body.should.contain('url');
    });
    it('should reject requests with a badly formatted body and not crash', async function () {
      await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        json: 'oh hello'
      }).should.eventually.be.rejected;
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        }
      });
      res.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should get 404 for bad routes', async function () {
      await (0, _requestPromise.default)({
        url: `${baseUrl}/blargimarg`,
        method: 'GET'
      }).should.eventually.be.rejectedWith('404');
    });
    it('4xx responses should have content-type of text/plain', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/blargimargarita`,
        method: 'GET',
        resolveWithFullResponse: true,
        simple: false
      });
      res.headers['content-type'].should.include('text/plain');
    });
    it('should throw not yet implemented for unfilledout commands', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/location`,
        method: 'GET',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(501);
      res.body.should.eql({
        status: 405,
        value: {
          message: 'Method has not yet been implemented'
        },
        sessionId: 'foo'
      });
    });
    it('should throw not implemented for ignored commands', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/buttonup`,
        method: 'POST',
        json: {},
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(501);
      res.body.should.eql({
        status: 405,
        value: {
          message: 'Method is not implemented'
        },
        sessionId: 'foo'
      });
    });
    it('should get 400 for bad parameters', async function () {
      await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        json: {}
      }).should.eventually.be.rejectedWith('400');
    });
    it('should ignore special extra payload params in the right contexts', async function () {
      await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/value`,
        method: 'POST',
        json: {
          id: 'baz',
          sessionId: 'lol',
          value: ['a']
        }
      });
      await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/value`,
        method: 'POST',
        json: {
          id: 'baz'
        }
      }).should.eventually.be.rejectedWith('400');
      await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/frame`,
        method: 'POST',
        json: {
          id: 'baz'
        }
      });
    });
    it('should return the correct error even if driver does not throw', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/appium/receive_async_response`,
        method: 'POST',
        json: {
          response: 'baz'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Mishandled Driver Error'
        },
        sessionId: 'foo'
      });
    });
    describe('w3c sendkeys migration', function () {
      it('should accept value for sendkeys', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          json: {
            value: 'text to type'
          }
        });
        res.status.should.equal(0);
        res.value.should.eql(['text to type', 'bar']);
      });
      it('should accept text for sendkeys', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          json: {
            text: 'text to type'
          }
        });
        res.status.should.equal(0);
        res.value.should.eql(['text to type', 'bar']);
      });
      it('should accept value and text for sendkeys, and use value', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          json: {
            value: 'text to type',
            text: 'text to ignore'
          }
        });
        res.status.should.equal(0);
        res.value.should.eql(['text to type', 'bar']);
      });
    });
    describe('multiple sets of arguments', function () {
      describe('optional', function () {
        it('should allow moveto with element', async function () {
          let res = await (0, _requestPromise.default)({
            url: `${baseUrl}/session/foo/moveto`,
            method: 'POST',
            json: {
              element: '3'
            }
          });
          res.status.should.equal(0);
          res.value.should.eql(['3', null, null]);
        });
        it('should allow moveto with xoffset/yoffset', async function () {
          let res = await (0, _requestPromise.default)({
            url: `${baseUrl}/session/foo/moveto`,
            method: 'POST',
            json: {
              xoffset: 42,
              yoffset: 17
            }
          });
          res.status.should.equal(0);
          res.value.should.eql([null, 42, 17]);
        });
      });
      describe('required', function () {
        it('should allow removeApp with appId', async function () {
          let res = await (0, _requestPromise.default)({
            url: `${baseUrl}/session/foo/appium/device/remove_app`,
            method: 'POST',
            json: {
              appId: 42
            }
          });
          res.status.should.equal(0);
          res.value.should.eql(42);
        });
        it('should allow removeApp with bundleId', async function () {
          let res = await (0, _requestPromise.default)({
            url: `${baseUrl}/session/foo/appium/device/remove_app`,
            method: 'POST',
            json: {
              bundleId: 42
            }
          });
          res.status.should.equal(0);
          res.value.should.eql(42);
        });
      });
    });
    describe('default param wrap', function () {
      it('should wrap', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/foo/touch/perform`,
          method: 'POST',
          json: [{
            'action': 'tap',
            'options': {
              'element': '3'
            }
          }]
        });
        res.value.should.deep.equal([[{
          'action': 'tap',
          'options': {
            'element': '3'
          }
        }], 'foo']);
      });
      it('should not wrap twice', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/foo/touch/perform`,
          method: 'POST',
          json: {
            actions: [{
              'action': 'tap',
              'options': {
                'element': '3'
              }
            }]
          }
        });
        res.value.should.deep.equal([[{
          'action': 'tap',
          'options': {
            'element': '3'
          }
        }], 'foo']);
      });
    });
    describe('create sessions via HTTP endpoint', function () {
      let desiredCapabilities = {
        a: 'b'
      };
      let requiredCapabilities = {
        c: 'd'
      };
      let capabilities = {
        e: 'f'
      };
      let sessionId;
      beforeEach(function () {
        sessionId = null;
      });
      afterEach(async function () {
        if (sessionId) {
          await _requestPromise.default.delete(`${baseUrl}/session/${sessionId}`);
        }
      });
      it('should allow create session with desired caps (MJSONWP)', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          json: {
            desiredCapabilities
          }
        });
        sessionId = res.sessionId;
        res.status.should.equal(0);
        res.value.should.eql(desiredCapabilities);
      });
      it('should allow create session with desired and required caps', async function () {
        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          json: {
            desiredCapabilities,
            requiredCapabilities
          }
        });
        sessionId = res.sessionId;
        res.status.should.equal(0);
        res.value.should.eql(_lodash.default.extend({}, desiredCapabilities, requiredCapabilities));
      });
      it('should fail to create session without capabilities or desiredCapabilities', async function () {
        await (0, _requestPromise.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          json: {}
        }).should.eventually.be.rejectedWith('400');
      });
      it('should allow create session with capabilities (W3C)', async function () {
        const res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          json: {
            capabilities
          }
        });
        sessionId = res.sessionId;
        should.not.exist(res.status);
        should.not.exist(res.sessionId);
        res.value.capabilities.should.eql(capabilities);
        res.value.sessionId.should.exist;
      });
      it('should fall back to MJSONWP if driver does not support W3C yet', async function () {
        const createSessionStub = _sinon.default.stub(driver, 'createSession').callsFake(function (capabilities) {
          driver.sessionId = null;
          return _2.BaseDriver.prototype.createSession.call(driver, capabilities);
        });

        let caps = { ...desiredCapabilities,
          platformName: 'Fake',
          deviceName: 'Fake'
        };
        const res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          json: {
            desiredCapabilities: caps,
            capabilities: {
              alwaysMatch: caps,
              firstMatch: [{}]
            }
          }
        });
        sessionId = res.sessionId;
        should.exist(res.status);
        should.exist(res.sessionId);
        res.value.should.eql(caps);
        createSessionStub.restore();
      });
      describe('w3c endpoints', function () {
        let w3cCaps = {
          alwaysMatch: {
            platformName: 'Fake',
            deviceName: 'Commodore 64'
          },
          firstMatch: [{}]
        };
        let sessionUrl;
        beforeEach(async function () {
          let {
            value
          } = await _requestPromise.default.post(`${baseUrl}/session`, {
            json: {
              capabilities: w3cCaps
            }
          });
          sessionId = value.sessionId;
          sessionUrl = `${baseUrl}/session/${sessionId}`;
        });
        it(`should throw 400 Bad Parameters exception if the parameters are bad`, async function () {
          const {
            statusCode,
            error
          } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
            json: {
              bad: 'params'
            }
          }).should.eventually.be.rejected;
          statusCode.should.equal(400);
          const {
            error: w3cError,
            message,
            stacktrace
          } = error.value;
          message.should.match(/Parameters were incorrect/);
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.InvalidArgumentError.error());
        });
        it(`should throw 405 exception if the command hasn't been implemented yet`, async function () {
          const {
            statusCode,
            error
          } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
            json: {
              actions: []
            }
          }).should.eventually.be.rejected;
          statusCode.should.equal(405);
          const {
            error: w3cError,
            message,
            stacktrace
          } = error.value;
          message.should.match(/Method has not yet been implemented/);
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.NotYetImplementedError.error());
          message.should.match(/Method has not yet been implemented/);
        });
        it(`should throw 500 Unknown Error if the command throws an unexpected exception`, async function () {
          driver.performActions = () => {
            throw new Error(`Didn't work`);
          };

          const {
            statusCode,
            error
          } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
            json: {
              actions: []
            }
          }).should.eventually.be.rejected;
          statusCode.should.equal(500);
          const {
            error: w3cError,
            message,
            stacktrace
          } = error.value;
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.UnknownError.error());
          message.should.match(/Didn't work/);
          delete driver.performActions;
        });
        it(`should translate element format from MJSONWP to W3C`, async function () {
          const retValue = [{
            something: {
              [_protocol.MJSONWP_ELEMENT_KEY]: 'fooo',
              other: 'bar'
            }
          }, {
            [_protocol.MJSONWP_ELEMENT_KEY]: 'bar'
          }, 'ignore'];
          const expectedValue = [{
            something: {
              [_protocol.MJSONWP_ELEMENT_KEY]: 'fooo',
              [_protocol.W3C_ELEMENT_KEY]: 'fooo',
              other: 'bar'
            }
          }, {
            [_protocol.MJSONWP_ELEMENT_KEY]: 'bar',
            [_protocol.W3C_ELEMENT_KEY]: 'bar'
          }, 'ignore'];
          const findElementsBackup = driver.findElements;

          driver.findElements = () => retValue;

          const {
            value
          } = await _requestPromise.default.post(`${sessionUrl}/elements`, {
            json: {
              using: 'whatever',
              value: 'whatever'
            }
          });
          value.should.deep.equal(expectedValue);
          driver.findElements = findElementsBackup;
        });
        it(`should fail with a 408 error if it throws a TimeoutError exception`, async function () {
          let setUrlStub = _sinon.default.stub(driver, 'setUrl').callsFake(function () {
            throw new _2.errors.TimeoutError();
          });

          let {
            statusCode,
            error
          } = await (0, _requestPromise.default)({
            url: `${sessionUrl}/url`,
            method: 'POST',
            json: {
              url: 'https://example.com/'
            }
          }).should.eventually.be.rejected;
          statusCode.should.equal(408);
          const {
            error: w3cError,
            message,
            stacktrace
          } = error.value;
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.TimeoutError.error());
          message.should.match(/An operation did not complete before its timeout expired/);
          setUrlStub.restore();
        });
        it(`should pass with 200 HTTP status code if the command returns a value`, async function () {
          driver.performActions = actions => 'It works ' + actions.join('');

          const {
            status,
            value,
            sessionId
          } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
            json: {
              actions: ['a', 'b', 'c']
            }
          });
          should.not.exist(sessionId);
          should.not.exist(status);
          value.should.equal('It works abc');
          delete driver.performActions;
        });
        describe('jwproxy', function () {
          const port = 56562;
          let server, jwproxy, app;
          beforeEach(function () {
            const res = (0, _helpers.createProxyServer)(sessionId, port);
            server = res.server;
            app = res.app;
            jwproxy = new _2.JWProxy({
              host: 'localhost',
              port
            });
            jwproxy.sessionId = sessionId;

            driver.performActions = async actions => await jwproxy.command('/perform-actions', 'POST', actions);
          });
          afterEach(async function () {
            delete driver.performActions;
            await server.close();
          });
          it('should work if a proxied request returns a response with status 200', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.json({
                sessionId: req.params.sessionId,
                value: req.body,
                status: 0
              });
            });
            const {
              status,
              value,
              sessionId
            } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            });
            value.should.eql([1, 2, 3]);
            should.not.exist(status);
            should.not.exist(sessionId);
          });
          it('should return error if a proxied request returns a MJSONWP error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(500).json({
                sessionId,
                status: 6,
                value: 'A problem occurred'
              });
            });
            const {
              statusCode,
              message
            } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            }).should.eventually.be.rejected;
            statusCode.should.equal(_httpStatusCodes.default.NOT_FOUND);
            message.should.match(/A problem occurred/);
          });
          it('should return W3C error if a proxied request returns a W3C error response', async function () {
            const error = new Error(`Some error occurred`);
            error.w3cStatus = 414;

            const executeCommandStub = _sinon.default.stub(driver, 'executeCommand').returns({
              protocol: 'W3C',
              error
            });

            const res = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            }).should.eventually.be.rejected;
            const {
              statusCode,
              error: returnedError
            } = res;
            statusCode.should.equal(414);
            const {
              error: w3cError,
              message: errMessage,
              stacktrace
            } = returnedError.value;
            w3cError.should.equal('unknown error');
            stacktrace.should.match(/Some error occurred/);
            errMessage.should.equal('Some error occurred');
            executeCommandStub.restore();
          });
          it('should return error if a proxied request returns a MJSONWP error response but HTTP status code is 200', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(200).json({
                sessionId: 'Fake Session Id',
                status: 7,
                value: 'A problem occurred'
              });
            });
            const {
              statusCode,
              message,
              error
            } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            }).should.eventually.be.rejected;
            statusCode.should.equal(_httpStatusCodes.default.NOT_FOUND);
            message.should.match(/A problem occurred/);
            const {
              error: w3cError,
              message: errMessage,
              stacktrace
            } = error.value;
            w3cError.should.equal('no such element');
            errMessage.should.match(/A problem occurred/);
            stacktrace.should.exist;
          });
          it('should return error if a proxied request returns a W3C error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(404).json({
                value: {
                  error: 'no such element',
                  message: 'does not make a difference',
                  stacktrace: 'arbitrary stacktrace'
                }
              });
            });
            const {
              statusCode,
              message,
              error
            } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            }).should.eventually.be.rejected;
            statusCode.should.equal(_httpStatusCodes.default.NOT_FOUND);
            message.should.match(/does not make a difference/);
            const {
              error: w3cError,
              stacktrace
            } = error.value;
            w3cError.should.equal('no such element');
            stacktrace.should.match(/arbitrary stacktrace/);
          });
          it('should return an error if a proxied request returns a W3C error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.set('Connection', 'close');
              res.status(444).json({
                value: {
                  error: 'bogus error code',
                  message: 'does not make a difference',
                  stacktrace: 'arbitrary stacktrace'
                }
              });
            });
            const {
              statusCode,
              message,
              error
            } = await _requestPromise.default.post(`${sessionUrl}/actions`, {
              json: {
                actions: [1, 2, 3]
              }
            }).should.eventually.be.rejected;
            statusCode.should.equal(_httpStatusCodes.default.INTERNAL_SERVER_ERROR);
            message.should.match(/does not make a difference/);
            const {
              error: w3cError,
              stacktrace
            } = error.value;
            w3cError.should.equal('unknown error');
            stacktrace.should.match(/arbitrary stacktrace/);
          });
        });
      });
    });
    it('should handle commands with no response values', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/forward`,
        method: 'POST',
        json: true
      });
      res.should.eql({
        status: 0,
        value: null,
        sessionId: 'foo'
      });
    });
    it('should allow empty string response values', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/element/bar/text`,
        method: 'GET',
        json: true
      });
      res.should.eql({
        status: 0,
        value: '',
        sessionId: 'foo'
      });
    });
    it('should send 500 response and an Unknown object for rejected commands', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo/refresh`,
        method: 'POST',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Too Fresh!'
        },
        sessionId: 'foo'
      });
    });
    it('should not throw UnknownError when known', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/foo`,
        method: 'GET',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(404);
      res.body.should.eql({
        status: 6,
        value: {
          message: 'A session is either terminated or not started'
        },
        sessionId: 'foo'
      });
    });
  });
  describe('session Ids', function () {
    let driver = new _fakeDriver.FakeDriver();
    let mjsonwpServer;
    before(async function () {
      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    after(async function () {
      await mjsonwpServer.close();
    });
    afterEach(function () {
      driver.sessionId = null;
    });
    it('should return null SessionId for commands without sessionIds', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/status`,
        method: 'GET',
        json: true
      });
      should.equal(res.sessionId, null);
    });
    it('responds with the same session ID in the request', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = sessionId;
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        }
      });
      should.exist(res.sessionId);
      res.sessionId.should.eql(sessionId);
    });
    it('yells if no session exists', async function () {
      let sessionId = 'Vader Sessions';
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(404);
      res.body.status.should.equal(6);
      res.body.value.message.should.contain('session');
    });
    it('yells if invalid session is sent', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = 'recession';
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(404);
      res.body.status.should.equal(6);
      res.body.value.message.should.contain('session');
    });
    it('should have session IDs in error responses', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = sessionId;
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/refresh`,
        method: 'POST',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Too Fresh!'
        },
        sessionId
      });
    });
    it('should return a new session ID on create', async function () {
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session`,
        method: 'POST',
        json: {
          desiredCapabilities: {
            greeting: 'hello'
          },
          requiredCapabilities: {
            valediction: 'bye'
          }
        }
      });
      should.exist(res.sessionId);
      res.sessionId.indexOf('fakeSession_').should.equal(0);
      res.value.should.eql({
        greeting: 'hello',
        valediction: 'bye'
      });
    });
  });
  describe('via drivers jsonwp proxy', function () {
    let driver;
    let sessionId = 'foo';
    let mjsonwpServer;
    beforeEach(async function () {
      driver = new _fakeDriver.FakeDriver();
      driver.sessionId = sessionId;

      driver.proxyActive = () => {
        return true;
      };

      driver.canProxy = () => {
        return true;
      };

      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    afterEach(async function () {
      await mjsonwpServer.close();
    });
    it('should give a nice error if proxying is set but no proxy function exists', async function () {
      driver.canProxy = () => {
        return false;
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Trying to proxy to a JSONWP ' + 'server but driver is unable to proxy'
        },
        sessionId
      });
    });
    it('should pass on any errors in proxying', async function () {
      driver.proxyReqRes = async function () {
        throw new Error('foo');
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Could not proxy. Proxy ' + 'error: foo'
        },
        sessionId
      });
    });
    it('should able to throw ProxyRequestError in proxying', async function () {
      driver.proxyReqRes = async function () {
        let jsonwp = {
          status: 35,
          value: 'No such context found.',
          sessionId: 'foo'
        };
        throw new _2.errors.ProxyRequestError(`Could not proxy command to remote server. `, jsonwp);
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(500);
      res.body.should.eql({
        status: 35,
        value: {
          message: 'No such context found.'
        },
        sessionId: 'foo'
      });
    });
    it('should let the proxy handle req/res', async function () {
      driver.proxyReqRes = async function (req, res) {
        res.status(200).json({
          custom: 'data'
        });
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(200);
      res.body.should.eql({
        custom: 'data'
      });
    });
    it('should avoid jsonwp proxying when path matches avoidance list', async function () {
      driver.getProxyAvoidList = () => {
        return [['POST', new RegExp('^/session/[^/]+/url$')]];
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        json: {
          url: 'http://google.com'
        },
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(200);
      res.body.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId
      });
    });
    it('should fail if avoid proxy list is malformed in some way', async function () {
      async function badProxyAvoidanceList(list) {
        driver.getProxyAvoidList = () => {
          return list;
        };

        let res = await (0, _requestPromise.default)({
          url: `${baseUrl}/session/${sessionId}/url`,
          method: 'POST',
          json: {
            url: 'http://google.com'
          },
          resolveWithFullResponse: true,
          simple: false
        });
        res.statusCode.should.equal(500);
        res.body.status.should.equal(13);
        res.body.value.message.should.contain('roxy');
      }

      const lists = ['foo', [['foo']], [['BAR', /lol/]], [['GET', 'foo']]];

      for (let list of lists) {
        await badProxyAvoidanceList(list);
      }
    });
    it('should avoid proxying non-session commands even if not in the list', async function () {
      driver.getProxyAvoidList = () => {
        return [['POST', new RegExp('')]];
      };

      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/status`,
        method: 'GET',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(200);
      res.body.should.eql({
        status: 0,
        value: "I'm fine",
        sessionId: null
      });
    });
    it('should avoid proxying deleteSession commands', async function () {
      driver.getProxyAvoidList = () => {
        return [['POST', new RegExp('')]];
      };

      driver.sessionId.should.equal(sessionId);
      let res = await (0, _requestPromise.default)({
        url: `${baseUrl}/session/${sessionId}`,
        method: 'DELETE',
        json: true,
        resolveWithFullResponse: true,
        simple: false
      });
      res.statusCode.should.equal(200);
      should.not.exist(driver.sessionId);
      driver.jwpProxyActive.should.be.false;
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcHJvdG9jb2wvcHJvdG9jb2wtZTJlLXNwZWNzLmpzIl0sIm5hbWVzIjpbInNob3VsZCIsImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsInNlcnZlclBvcnQiLCJiYXNlVXJsIiwiZGVzY3JpYmUiLCJkIiwiRmFrZURyaXZlciIsIml0Iiwic2V0VXJsIiwiY29udGFpbiIsIm1qc29ud3BTZXJ2ZXIiLCJkcml2ZXIiLCJiZWZvcmUiLCJzZXNzaW9uSWQiLCJyb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24iLCJwb3J0IiwiYWZ0ZXIiLCJjbG9zZSIsInJlcyIsInVybCIsIm1ldGhvZCIsImpzb24iLCJlcWwiLCJzdGF0dXMiLCJ2YWx1ZSIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5IiwicGFyc2UiLCJmb3JtIiwic2ltcGxlIiwicmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2UiLCJlcXVhbCIsInN0YXR1c0NvZGUiLCJldmVudHVhbGx5IiwiYmUiLCJyZWplY3RlZCIsInJlamVjdGVkV2l0aCIsImhlYWRlcnMiLCJpbmNsdWRlIiwibWVzc2FnZSIsImlkIiwicmVzcG9uc2UiLCJ0ZXh0IiwiZWxlbWVudCIsInhvZmZzZXQiLCJ5b2Zmc2V0IiwiYXBwSWQiLCJidW5kbGVJZCIsImRlZXAiLCJhY3Rpb25zIiwiZGVzaXJlZENhcGFiaWxpdGllcyIsImEiLCJyZXF1aXJlZENhcGFiaWxpdGllcyIsImMiLCJjYXBhYmlsaXRpZXMiLCJlIiwiYmVmb3JlRWFjaCIsImFmdGVyRWFjaCIsInJlcXVlc3QiLCJkZWxldGUiLCJfIiwiZXh0ZW5kIiwibm90IiwiZXhpc3QiLCJjcmVhdGVTZXNzaW9uU3R1YiIsInNpbm9uIiwic3R1YiIsImNhbGxzRmFrZSIsIkJhc2VEcml2ZXIiLCJwcm90b3R5cGUiLCJjcmVhdGVTZXNzaW9uIiwiY2FsbCIsImNhcHMiLCJwbGF0Zm9ybU5hbWUiLCJkZXZpY2VOYW1lIiwiYWx3YXlzTWF0Y2giLCJmaXJzdE1hdGNoIiwicmVzdG9yZSIsInczY0NhcHMiLCJzZXNzaW9uVXJsIiwicG9zdCIsImVycm9yIiwiYmFkIiwidzNjRXJyb3IiLCJzdGFja3RyYWNlIiwibWF0Y2giLCJzdHJpbmciLCJlcnJvcnMiLCJJbnZhbGlkQXJndW1lbnRFcnJvciIsIk5vdFlldEltcGxlbWVudGVkRXJyb3IiLCJwZXJmb3JtQWN0aW9ucyIsIkVycm9yIiwiVW5rbm93bkVycm9yIiwicmV0VmFsdWUiLCJzb21ldGhpbmciLCJNSlNPTldQX0VMRU1FTlRfS0VZIiwib3RoZXIiLCJleHBlY3RlZFZhbHVlIiwiVzNDX0VMRU1FTlRfS0VZIiwiZmluZEVsZW1lbnRzQmFja3VwIiwiZmluZEVsZW1lbnRzIiwidXNpbmciLCJzZXRVcmxTdHViIiwiVGltZW91dEVycm9yIiwiam9pbiIsInNlcnZlciIsImp3cHJveHkiLCJhcHAiLCJKV1Byb3h5IiwiaG9zdCIsImNvbW1hbmQiLCJyZXEiLCJwYXJhbXMiLCJIVFRQU3RhdHVzQ29kZXMiLCJOT1RfRk9VTkQiLCJ3M2NTdGF0dXMiLCJleGVjdXRlQ29tbWFuZFN0dWIiLCJyZXR1cm5zIiwicHJvdG9jb2wiLCJyZXR1cm5lZEVycm9yIiwiZXJyTWVzc2FnZSIsInNldCIsIklOVEVSTkFMX1NFUlZFUl9FUlJPUiIsImdyZWV0aW5nIiwidmFsZWRpY3Rpb24iLCJpbmRleE9mIiwicHJveHlBY3RpdmUiLCJjYW5Qcm94eSIsInByb3h5UmVxUmVzIiwianNvbndwIiwiUHJveHlSZXF1ZXN0RXJyb3IiLCJjdXN0b20iLCJnZXRQcm94eUF2b2lkTGlzdCIsIlJlZ0V4cCIsImJhZFByb3h5QXZvaWRhbmNlTGlzdCIsImxpc3QiLCJsaXN0cyIsImp3cFByb3h5QWN0aXZlIiwiZmFsc2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBLElBQUlBLE1BQU0sR0FBR0MsY0FBS0QsTUFBTCxFQUFiOztBQUNBQyxjQUFLQyxHQUFM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QUtELEtBakJDLENBQUY7QUFtQkFOLElBQUFBLEVBQUUsQ0FBQyw4Q0FBRCxFQUFpRCxrQkFBa0I7QUFDbkVJLE1BQUFBLE1BQU0sQ0FBQzBILGlCQUFQLEdBQTJCLE1BQU07QUFBRSxlQUFPLENBQUMsQ0FBQyxNQUFELEVBQVMsSUFBSUMsTUFBSixDQUFXLEVBQVgsQ0FBVCxDQUFELENBQVA7QUFBb0MsT0FBdkU7O0FBRUEzSCxNQUFBQSxNQUFNLENBQUNFLFNBQVAsQ0FBaUJmLE1BQWpCLENBQXdCa0MsS0FBeEIsQ0FBOEJuQixTQUE5QjtBQUNBLFVBQUlLLEdBQUcsR0FBRyxNQUFNLDZCQUFRO0FBQ3RCQyxRQUFBQSxHQUFHLEVBQUcsR0FBRWhCLE9BQVEsWUFBV1UsU0FBVSxFQURmO0FBRXRCTyxRQUFBQSxNQUFNLEVBQUUsUUFGYztBQUd0QkMsUUFBQUEsSUFBSSxFQUFFLElBSGdCO0FBSXRCVSxRQUFBQSx1QkFBdUIsRUFBRSxJQUpIO0FBS3RCRCxRQUFBQSxNQUFNLEVBQUU7QUFMYyxPQUFSLENBQWhCO0FBUUFaLE1BQUFBLEdBQUcsQ0FBQ2UsVUFBSixDQUFlbkMsTUFBZixDQUFzQmtDLEtBQXRCLENBQTRCLEdBQTVCO0FBQ0FsQyxNQUFBQSxNQUFNLENBQUNpRSxHQUFQLENBQVdDLEtBQVgsQ0FBaUJyRCxNQUFNLENBQUNFLFNBQXhCO0FBQ0FGLE1BQUFBLE1BQU0sQ0FBQytILGNBQVAsQ0FBc0I1SSxNQUF0QixDQUE2QnFDLEVBQTdCLENBQWdDd0csS0FBaEM7QUFDRCxLQWZDLENBQUY7QUFnQkQsR0F6TE8sQ0FBUjtBQTBMRCxDQTVqQ08sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgeyBzZXJ2ZXIsIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiwgZXJyb3JzLCBKV1Byb3h5LCBCYXNlRHJpdmVyIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IHsgRmFrZURyaXZlciB9IGZyb20gJy4vZmFrZS1kcml2ZXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCByZXF1ZXN0IGZyb20gJ3JlcXVlc3QtcHJvbWlzZSc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgSFRUUFN0YXR1c0NvZGVzIGZyb20gJ2h0dHAtc3RhdHVzLWNvZGVzJztcbmltcG9ydCB7IGNyZWF0ZVByb3h5U2VydmVyIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IE1KU09OV1BfRUxFTUVOVF9LRVksIFczQ19FTEVNRU5UX0tFWSB9IGZyb20gJy4uLy4uL2xpYi9wcm90b2NvbC9wcm90b2NvbCc7XG5cblxubGV0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmNvbnN0IHNlcnZlclBvcnQgPSA4MTgxO1xuY29uc3QgYmFzZVVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7c2VydmVyUG9ydH0vd2QvaHViYDtcblxuZGVzY3JpYmUoJ1Byb3RvY29sJywgZnVuY3Rpb24gKCkge1xuXG4gIC8vVE9ETzogbW9yZSB0ZXN0cyE6XG4gIC8vIFVua25vd24gY29tbWFuZHMgc2hvdWxkIHJldHVybiA0MDRcblxuICBkZXNjcmliZSgnZGlyZWN0IHRvIGRyaXZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZCA9IG5ldyBGYWtlRHJpdmVyKCk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcmVzcG9uc2UgdmFsdWVzIGRpcmVjdGx5IGZyb20gdGhlIGRyaXZlcicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIChhd2FpdCBkLnNldFVybCgnaHR0cDovL2dvb2dsZS5jb20nKSkuc2hvdWxkLmNvbnRhaW4oJ2dvb2dsZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmlhIGV4cHJlc3Mgcm91dGVyJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBtanNvbndwU2VydmVyO1xuICAgIGxldCBkcml2ZXI7XG5cbiAgICBiZWZvcmUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyID0gbmV3IEZha2VEcml2ZXIoKTtcbiAgICAgIGRyaXZlci5zZXNzaW9uSWQgPSAnZm9vJztcbiAgICAgIG1qc29ud3BTZXJ2ZXIgPSBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgICByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb246IHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbihkcml2ZXIpLFxuICAgICAgICBwb3J0OiBzZXJ2ZXJQb3J0LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcihhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBtanNvbndwU2VydmVyLmNsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3h5IHRvIGRyaXZlciBhbmQgcmV0dXJuIHZhbGlkIGpzb253cCByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ31cbiAgICAgIH0pO1xuICAgICAgcmVzLnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgIHZhbHVlOiAnTmF2aWdhdGVkIHRvOiBodHRwOi8vZ29vZ2xlLmNvbScsXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhc3N1bWUgcmVxdWVzdHMgd2l0aG91dCBhIENvbnRlbnQtVHlwZSBhcmUganNvbiByZXF1ZXN0cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30pLFxuICAgICAgfSk7XG4gICAgICBKU09OLnBhcnNlKHJlcykuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6ICdOYXZpZ2F0ZWQgdG86IGh0dHA6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlc3BvbmQgdG8geC13d3ctZm9ybS11cmxlbmNvZGVkIGFzIHdlbGwgYXMganNvbiByZXF1ZXN0cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZm9ybToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ31cbiAgICAgIH0pO1xuICAgICAgSlNPTi5wYXJzZShyZXMpLnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgIHZhbHVlOiAnTmF2aWdhdGVkIHRvOiBodHRwOi8vZ29vZ2xlLmNvbScsXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHVybCByZXF1ZXN0IHBhcmFtZXRlcnMgZm9yIG1ldGhvZHMgdG8gdXNlIC0gc2Vzc2lvbmlkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2JhY2tgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge30sXG4gICAgICAgIHNpbXBsZTogZmFsc2UsXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIHJlcy5ib2R5LnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgIHZhbHVlOiAnZm9vJyxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgdXJsIHJlcXVlc3QgcGFyYW1ldGVycyBmb3IgbWV0aG9kcyB0byB1c2UgLSBlbGVtZW50aWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvY2xpY2tgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge31cbiAgICAgIH0pO1xuICAgICAgcmVzLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICByZXMudmFsdWUuc2hvdWxkLmVxbChbJ2JhcicsICdmb28nXSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgdXJsIHJlcSBwYXJhbXMgaW4gdGhlIG9yZGVyOiBjdXN0b20sIGVsZW1lbnQsIHNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvYXR0cmlidXRlL2JhemAsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGpzb246IHt9XG4gICAgICB9KTtcbiAgICAgIHJlcy5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoWydiYXonLCAnYmFyJywgJ2ZvbyddKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVzcG9uZCB3aXRoIDQwMCBCYWQgUmVxdWVzdCBpZiBwYXJhbWV0ZXJzIG1pc3NpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICByZXMuc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoNDAwKTtcbiAgICAgIHJlcy5ib2R5LnNob3VsZC5jb250YWluKCd1cmwnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVqZWN0IHJlcXVlc3RzIHdpdGggYSBiYWRseSBmb3JtYXR0ZWQgYm9keSBhbmQgbm90IGNyYXNoJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246ICdvaCBoZWxsbydcbiAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuXG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9XG4gICAgICB9KTtcbiAgICAgIHJlcy5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogJ05hdmlnYXRlZCB0bzogaHR0cDovL2dvb2dsZS5jb20nLFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZXQgNDA0IGZvciBiYWQgcm91dGVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vYmxhcmdpbWFyZ2AsXG4gICAgICAgIG1ldGhvZDogJ0dFVCdcbiAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgnNDA0Jyk7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPIHBhc3MgdGhpcyB0ZXN0XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9ub2RlLW1vYmlsZS1qc29uLXdpcmUtcHJvdG9jb2wvaXNzdWVzLzNcbiAgICBpdCgnNHh4IHJlc3BvbnNlcyBzaG91bGQgaGF2ZSBjb250ZW50LXR5cGUgb2YgdGV4dC9wbGFpbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9ibGFyZ2ltYXJnYXJpdGFgLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZSAvLyA0MDQgZXJyb3JzIGZ1bGZpbGwgdGhlIHByb21pc2UsIHJhdGhlciB0aGFuIHJlamVjdGluZ1xuICAgICAgfSk7XG5cbiAgICAgIHJlcy5oZWFkZXJzWydjb250ZW50LXR5cGUnXS5zaG91bGQuaW5jbHVkZSgndGV4dC9wbGFpbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBub3QgeWV0IGltcGxlbWVudGVkIGZvciB1bmZpbGxlZG91dCBjb21tYW5kcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9lbGVtZW50L2Jhci9sb2NhdGlvbmAsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgcmVzLnN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDUwMSk7XG4gICAgICByZXMuYm9keS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiA0MDUsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ01ldGhvZCBoYXMgbm90IHlldCBiZWVuIGltcGxlbWVudGVkJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgbm90IGltcGxlbWVudGVkIGZvciBpZ25vcmVkIGNvbW1hbmRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2J1dHRvbnVwYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg1MDEpO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogNDA1LFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgIG1lc3NhZ2U6ICdNZXRob2QgaXMgbm90IGltcGxlbWVudGVkJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2V0IDQwMCBmb3IgYmFkIHBhcmFtZXRlcnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge31cbiAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgnNDAwJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGlnbm9yZSBzcGVjaWFsIGV4dHJhIHBheWxvYWQgcGFyYW1zIGluIHRoZSByaWdodCBjb250ZXh0cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2VsZW1lbnQvYmFyL3ZhbHVlYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHtpZDogJ2JheicsIHNlc3Npb25JZDogJ2xvbCcsIHZhbHVlOiBbJ2EnXX1cbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9lbGVtZW50L2Jhci92YWx1ZWAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBqc29uOiB7aWQ6ICdiYXonfVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKCc0MDAnKTtcblxuICAgICAgLy8gbWFrZSBzdXJlIGFkZGluZyB0aGUgb3B0aW9uYWwgJ2lkJyBkb2Vzbid0IGNsb2JiZXIgYSByb3V0ZSB3aGVyZSB3ZVxuICAgICAgLy8gaGF2ZSBhbiBhY3R1YWwgcmVxdWlyZWQgJ2lkJ1xuICAgICAgYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZnJhbWVgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge2lkOiAnYmF6J31cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIGNvcnJlY3QgZXJyb3IgZXZlbiBpZiBkcml2ZXIgZG9lcyBub3QgdGhyb3cnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vYXBwaXVtL3JlY2VpdmVfYXN5bmNfcmVzcG9uc2VgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge3Jlc3BvbnNlOiAnYmF6J30sXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMTMsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyAnICtcbiAgICAgICAgICAgICAgICAgICAndGhlIGNvbW1hbmQuIE9yaWdpbmFsIGVycm9yOiBNaXNoYW5kbGVkIERyaXZlciBFcnJvcidcbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgndzNjIHNlbmRrZXlzIG1pZ3JhdGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgYWNjZXB0IHZhbHVlIGZvciBzZW5ka2V5cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdmFsdWVgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGpzb246IHt2YWx1ZTogJ3RleHQgdG8gdHlwZSd9XG4gICAgICAgIH0pO1xuICAgICAgICByZXMuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoWyd0ZXh0IHRvIHR5cGUnLCAnYmFyJ10pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGFjY2VwdCB0ZXh0IGZvciBzZW5ka2V5cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdmFsdWVgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGpzb246IHt0ZXh0OiAndGV4dCB0byB0eXBlJ31cbiAgICAgICAgfSk7XG4gICAgICAgIHJlcy5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICByZXMudmFsdWUuc2hvdWxkLmVxbChbJ3RleHQgdG8gdHlwZScsICdiYXInXSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWNjZXB0IHZhbHVlIGFuZCB0ZXh0IGZvciBzZW5ka2V5cywgYW5kIHVzZSB2YWx1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdmFsdWVgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGpzb246IHt2YWx1ZTogJ3RleHQgdG8gdHlwZScsIHRleHQ6ICd0ZXh0IHRvIGlnbm9yZSd9XG4gICAgICAgIH0pO1xuICAgICAgICByZXMuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoWyd0ZXh0IHRvIHR5cGUnLCAnYmFyJ10pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnbXVsdGlwbGUgc2V0cyBvZiBhcmd1bWVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkZXNjcmliZSgnb3B0aW9uYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgbW92ZXRvIHdpdGggZWxlbWVudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL21vdmV0b2AsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGpzb246IHtlbGVtZW50OiAnMyd9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoWyczJywgbnVsbCwgbnVsbF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBtb3ZldG8gd2l0aCB4b2Zmc2V0L3lvZmZzZXQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9tb3ZldG9gLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBqc29uOiB7eG9mZnNldDogNDIsIHlvZmZzZXQ6IDE3fVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlcy5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICAgIHJlcy52YWx1ZS5zaG91bGQuZXFsKFtudWxsLCA0MiwgMTddKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdyZXF1aXJlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyByZW1vdmVBcHAgd2l0aCBhcHBJZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2FwcGl1bS9kZXZpY2UvcmVtb3ZlX2FwcGAsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGpzb246IHthcHBJZDogNDJ9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoNDIpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyByZW1vdmVBcHAgd2l0aCBidW5kbGVJZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2FwcGl1bS9kZXZpY2UvcmVtb3ZlX2FwcGAsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGpzb246IHtidW5kbGVJZDogNDJ9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoNDIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2RlZmF1bHQgcGFyYW0gd3JhcCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgd3JhcCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdG91Y2gvcGVyZm9ybWAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAganNvbjogW3snYWN0aW9uJzogJ3RhcCcsICdvcHRpb25zJzogeydlbGVtZW50JzogJzMnfX1dXG4gICAgICAgIH0pO1xuICAgICAgICByZXMudmFsdWUuc2hvdWxkLmRlZXAuZXF1YWwoW1t7J2FjdGlvbic6ICd0YXAnLCAnb3B0aW9ucyc6IHsnZWxlbWVudCc6ICczJ319XSwgJ2ZvbyddKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCB3cmFwIHR3aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby90b3VjaC9wZXJmb3JtYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBqc29uOiB7YWN0aW9uczogW3snYWN0aW9uJzogJ3RhcCcsICdvcHRpb25zJzogeydlbGVtZW50JzogJzMnfX1dfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5kZWVwLmVxdWFsKFtbeydhY3Rpb24nOiAndGFwJywgJ29wdGlvbnMnOiB7J2VsZW1lbnQnOiAnMyd9fV0sICdmb28nXSk7XG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2NyZWF0ZSBzZXNzaW9ucyB2aWEgSFRUUCBlbmRwb2ludCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBkZXNpcmVkQ2FwYWJpbGl0aWVzID0ge2E6ICdiJ307XG4gICAgICBsZXQgcmVxdWlyZWRDYXBhYmlsaXRpZXMgPSB7YzogJ2QnfTtcbiAgICAgIGxldCBjYXBhYmlsaXRpZXMgPSB7ZTogJ2YnfTtcblxuICAgICAgbGV0IHNlc3Npb25JZDtcblxuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlc3Npb25JZCA9IG51bGw7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZXNzaW9uSWQpIHtcbiAgICAgICAgICBhd2FpdCByZXF1ZXN0LmRlbGV0ZShgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBjcmVhdGUgc2Vzc2lvbiB3aXRoIGRlc2lyZWQgY2FwcyAoTUpTT05XUCknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb25gLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGpzb246IHtkZXNpcmVkQ2FwYWJpbGl0aWVzfVxuICAgICAgICB9KTtcbiAgICAgICAgc2Vzc2lvbklkID0gcmVzLnNlc3Npb25JZDtcblxuICAgICAgICByZXMuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoZGVzaXJlZENhcGFiaWxpdGllcyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWxsb3cgY3JlYXRlIHNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCByZXF1aXJlZCBjYXBzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICBkZXNpcmVkQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgICAgcmVxdWlyZWRDYXBhYmlsaXRpZXNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXNzaW9uSWQgPSByZXMuc2Vzc2lvbklkO1xuXG4gICAgICAgIHJlcy5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICByZXMudmFsdWUuc2hvdWxkLmVxbChfLmV4dGVuZCh7fSwgZGVzaXJlZENhcGFiaWxpdGllcywgcmVxdWlyZWRDYXBhYmlsaXRpZXMpKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHRvIGNyZWF0ZSBzZXNzaW9uIHdpdGhvdXQgY2FwYWJpbGl0aWVzIG9yIGRlc2lyZWRDYXBhYmlsaXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAganNvbjoge30sXG4gICAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgnNDAwJyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWxsb3cgY3JlYXRlIHNlc3Npb24gd2l0aCBjYXBhYmlsaXRpZXMgKFczQyknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGxldCB7c3RhdHVzLCB2YWx1ZSwgc2Vzc2lvbklkfSA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb25gLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgIGNhcGFiaWxpdGllcyxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXNzaW9uSWQgPSByZXMuc2Vzc2lvbklkO1xuXG4gICAgICAgIHNob3VsZC5ub3QuZXhpc3QocmVzLnN0YXR1cyk7XG4gICAgICAgIHNob3VsZC5ub3QuZXhpc3QocmVzLnNlc3Npb25JZCk7XG4gICAgICAgIHJlcy52YWx1ZS5jYXBhYmlsaXRpZXMuc2hvdWxkLmVxbChjYXBhYmlsaXRpZXMpO1xuICAgICAgICByZXMudmFsdWUuc2Vzc2lvbklkLnNob3VsZC5leGlzdDtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWxsIGJhY2sgdG8gTUpTT05XUCBpZiBkcml2ZXIgZG9lcyBub3Qgc3VwcG9ydCBXM0MgeWV0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBjcmVhdGVTZXNzaW9uU3R1YiA9IHNpbm9uLnN0dWIoZHJpdmVyLCAnY3JlYXRlU2Vzc2lvbicpLmNhbGxzRmFrZShmdW5jdGlvbiAoY2FwYWJpbGl0aWVzKSB7XG4gICAgICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIEJhc2VEcml2ZXIucHJvdG90eXBlLmNyZWF0ZVNlc3Npb24uY2FsbChkcml2ZXIsIGNhcGFiaWxpdGllcyk7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgY2FwcyA9IHtcbiAgICAgICAgICAuLi5kZXNpcmVkQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICAgIGRldmljZU5hbWU6ICdGYWtlJyxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gbGV0IHtzdGF0dXMsIHZhbHVlLCBzZXNzaW9uSWR9ID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAganNvbjoge1xuICAgICAgICAgICAgZGVzaXJlZENhcGFiaWxpdGllczogY2FwcyxcbiAgICAgICAgICAgIGNhcGFiaWxpdGllczoge1xuICAgICAgICAgICAgICBhbHdheXNNYXRjaDogY2FwcyxcbiAgICAgICAgICAgICAgZmlyc3RNYXRjaDogW3t9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc2Vzc2lvbklkID0gcmVzLnNlc3Npb25JZDtcblxuICAgICAgICBzaG91bGQuZXhpc3QocmVzLnN0YXR1cyk7XG4gICAgICAgIHNob3VsZC5leGlzdChyZXMuc2Vzc2lvbklkKTtcbiAgICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoY2Fwcyk7XG4gICAgICAgIGNyZWF0ZVNlc3Npb25TdHViLnJlc3RvcmUoKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgndzNjIGVuZHBvaW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHczY0NhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHtcbiAgICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICAgICAgZGV2aWNlTmFtZTogJ0NvbW1vZG9yZSA2NCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICB9O1xuICAgICAgICBsZXQgc2Vzc2lvblVybDtcblxuICAgICAgICBiZWZvcmVFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBTdGFydCBhIFczQyBzZXNzaW9uXG4gICAgICAgICAgbGV0IHt2YWx1ZX0gPSBhd2FpdCByZXF1ZXN0LnBvc3QoYCR7YmFzZVVybH0vc2Vzc2lvbmAsIHtcbiAgICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiB3M2NDYXBzLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNlc3Npb25JZCA9IHZhbHVlLnNlc3Npb25JZDtcbiAgICAgICAgICBzZXNzaW9uVXJsID0gYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH1gO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChgc2hvdWxkIHRocm93IDQwMCBCYWQgUGFyYW1ldGVycyBleGNlcHRpb24gaWYgdGhlIHBhcmFtZXRlcnMgYXJlIGJhZGAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCB7c3RhdHVzQ29kZSwgZXJyb3J9ID0gYXdhaXQgcmVxdWVzdC5wb3N0KGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLCB7XG4gICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgIGJhZDogJ3BhcmFtcycsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgICAgICAgc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoNDAwKTtcblxuICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gZXJyb3IudmFsdWU7XG4gICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL1BhcmFtZXRlcnMgd2VyZSBpbmNvcnJlY3QvKTtcbiAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvcHJvdG9jb2wuanMvKTtcbiAgICAgICAgICB3M2NFcnJvci5zaG91bGQuYmUuYS5zdHJpbmc7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKGVycm9ycy5JbnZhbGlkQXJndW1lbnRFcnJvci5lcnJvcigpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCB0aHJvdyA0MDUgZXhjZXB0aW9uIGlmIHRoZSBjb21tYW5kIGhhc24ndCBiZWVuIGltcGxlbWVudGVkIHlldGAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCB7c3RhdHVzQ29kZSwgZXJyb3J9ID0gYXdhaXQgcmVxdWVzdC5wb3N0KGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLCB7XG4gICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgIGFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgICAgIHN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDQwNSk7XG5cbiAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBtZXNzYWdlLCBzdGFja3RyYWNlfSA9IGVycm9yLnZhbHVlO1xuICAgICAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9NZXRob2QgaGFzIG5vdCB5ZXQgYmVlbiBpbXBsZW1lbnRlZC8pO1xuICAgICAgICAgIHN0YWNrdHJhY2Uuc2hvdWxkLm1hdGNoKC9wcm90b2NvbC5qcy8pO1xuICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5iZS5hLnN0cmluZztcbiAgICAgICAgICB3M2NFcnJvci5zaG91bGQuZXF1YWwoZXJyb3JzLk5vdFlldEltcGxlbWVudGVkRXJyb3IuZXJyb3IoKSk7XG4gICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL01ldGhvZCBoYXMgbm90IHlldCBiZWVuIGltcGxlbWVudGVkLyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KGBzaG91bGQgdGhyb3cgNTAwIFVua25vd24gRXJyb3IgaWYgdGhlIGNvbW1hbmQgdGhyb3dzIGFuIHVuZXhwZWN0ZWQgZXhjZXB0aW9uYCwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRyaXZlci5wZXJmb3JtQWN0aW9ucyA9ICgpID0+IHsgdGhyb3cgbmV3IEVycm9yKGBEaWRuJ3Qgd29ya2ApOyB9O1xuICAgICAgICAgIGNvbnN0IHtzdGF0dXNDb2RlLCBlcnJvcn0gPSBhd2FpdCByZXF1ZXN0LnBvc3QoYCR7c2Vzc2lvblVybH0vYWN0aW9uc2AsIHtcbiAgICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgICAgICAgc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoNTAwKTtcblxuICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gZXJyb3IudmFsdWU7XG4gICAgICAgICAgc3RhY2t0cmFjZS5zaG91bGQubWF0Y2goL3Byb3RvY29sLmpzLyk7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmJlLmEuc3RyaW5nO1xuICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbChlcnJvcnMuVW5rbm93bkVycm9yLmVycm9yKCkpO1xuICAgICAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9EaWRuJ3Qgd29yay8pO1xuXG4gICAgICAgICAgZGVsZXRlIGRyaXZlci5wZXJmb3JtQWN0aW9ucztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCB0cmFuc2xhdGUgZWxlbWVudCBmb3JtYXQgZnJvbSBNSlNPTldQIHRvIFczQ2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWx1ZSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc29tZXRoaW5nOiB7XG4gICAgICAgICAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiAnZm9vbycsXG4gICAgICAgICAgICAgICAgb3RoZXI6ICdiYXInXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiAnYmFyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdpZ25vcmUnLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBleHBlY3RlZFZhbHVlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzb21ldGhpbmc6IHtcbiAgICAgICAgICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06ICdmb29vJyxcbiAgICAgICAgICAgICAgICBbVzNDX0VMRU1FTlRfS0VZXTogJ2Zvb28nLFxuICAgICAgICAgICAgICAgIG90aGVyOiAnYmFyJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIFtNSlNPTldQX0VMRU1FTlRfS0VZXTogJ2JhcicsXG4gICAgICAgICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiAnYmFyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdpZ25vcmUnLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBmaW5kRWxlbWVudHNCYWNrdXAgPSBkcml2ZXIuZmluZEVsZW1lbnRzO1xuICAgICAgICAgIGRyaXZlci5maW5kRWxlbWVudHMgPSAoKSA9PiByZXRWYWx1ZTtcbiAgICAgICAgICBjb25zdCB7dmFsdWV9ID0gYXdhaXQgcmVxdWVzdC5wb3N0KGAke3Nlc3Npb25Vcmx9L2VsZW1lbnRzYCwge1xuICAgICAgICAgICAganNvbjoge1xuICAgICAgICAgICAgICB1c2luZzogJ3doYXRldmVyJyxcbiAgICAgICAgICAgICAgdmFsdWU6ICd3aGF0ZXZlcicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhbHVlLnNob3VsZC5kZWVwLmVxdWFsKGV4cGVjdGVkVmFsdWUpO1xuICAgICAgICAgIGRyaXZlci5maW5kRWxlbWVudHMgPSBmaW5kRWxlbWVudHNCYWNrdXA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KGBzaG91bGQgZmFpbCB3aXRoIGEgNDA4IGVycm9yIGlmIGl0IHRocm93cyBhIFRpbWVvdXRFcnJvciBleGNlcHRpb25gLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IHNldFVybFN0dWIgPSBzaW5vbi5zdHViKGRyaXZlciwgJ3NldFVybCcpLmNhbGxzRmFrZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzLlRpbWVvdXRFcnJvcjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsZXQge3N0YXR1c0NvZGUsIGVycm9yfSA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICAgICAgdXJsOiBgJHtzZXNzaW9uVXJsfS91cmxgLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vZXhhbXBsZS5jb20vJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgICAgICBzdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg0MDgpO1xuXG4gICAgICAgICAgY29uc3Qge2Vycm9yOiB3M2NFcnJvciwgbWVzc2FnZSwgc3RhY2t0cmFjZX0gPSBlcnJvci52YWx1ZTtcbiAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvcHJvdG9jb2wuanMvKTtcbiAgICAgICAgICB3M2NFcnJvci5zaG91bGQuYmUuYS5zdHJpbmc7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKGVycm9ycy5UaW1lb3V0RXJyb3IuZXJyb3IoKSk7XG4gICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL0FuIG9wZXJhdGlvbiBkaWQgbm90IGNvbXBsZXRlIGJlZm9yZSBpdHMgdGltZW91dCBleHBpcmVkLyk7XG5cbiAgICAgICAgICBzZXRVcmxTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCBwYXNzIHdpdGggMjAwIEhUVFAgc3RhdHVzIGNvZGUgaWYgdGhlIGNvbW1hbmQgcmV0dXJucyBhIHZhbHVlYCwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRyaXZlci5wZXJmb3JtQWN0aW9ucyA9IChhY3Rpb25zKSA9PiAnSXQgd29ya3MgJyArIGFjdGlvbnMuam9pbignJyk7XG4gICAgICAgICAgY29uc3Qge3N0YXR1cywgdmFsdWUsIHNlc3Npb25JZH0gPSBhd2FpdCByZXF1ZXN0LnBvc3QoYCR7c2Vzc2lvblVybH0vYWN0aW9uc2AsIHtcbiAgICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgICAgYWN0aW9uczogWydhJywgJ2InLCAnYyddLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNob3VsZC5ub3QuZXhpc3Qoc2Vzc2lvbklkKTtcbiAgICAgICAgICBzaG91bGQubm90LmV4aXN0KHN0YXR1cyk7XG4gICAgICAgICAgdmFsdWUuc2hvdWxkLmVxdWFsKCdJdCB3b3JrcyBhYmMnKTtcbiAgICAgICAgICBkZWxldGUgZHJpdmVyLnBlcmZvcm1BY3Rpb25zO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZSgnandwcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCBwb3J0ID0gNTY1NjI7XG4gICAgICAgICAgbGV0IHNlcnZlciwgandwcm94eSwgYXBwO1xuXG4gICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBjcmVhdGVQcm94eVNlcnZlcihzZXNzaW9uSWQsIHBvcnQpO1xuICAgICAgICAgICAgc2VydmVyID0gcmVzLnNlcnZlcjtcbiAgICAgICAgICAgIGFwcCA9IHJlcy5hcHA7XG4gICAgICAgICAgICBqd3Byb3h5ID0gbmV3IEpXUHJveHkoe2hvc3Q6ICdsb2NhbGhvc3QnLCBwb3J0fSk7XG4gICAgICAgICAgICBqd3Byb3h5LnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIGRyaXZlci5wZXJmb3JtQWN0aW9ucyA9IGFzeW5jIChhY3Rpb25zKSA9PiBhd2FpdCBqd3Byb3h5LmNvbW1hbmQoJy9wZXJmb3JtLWFjdGlvbnMnLCAnUE9TVCcsIGFjdGlvbnMpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkcml2ZXIucGVyZm9ybUFjdGlvbnM7XG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuY2xvc2UoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGl0KCdzaG91bGQgd29yayBpZiBhIHByb3hpZWQgcmVxdWVzdCByZXR1cm5zIGEgcmVzcG9uc2Ugd2l0aCBzdGF0dXMgMjAwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXBwLnBvc3QoJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3BlcmZvcm0tYWN0aW9ucycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICByZXMuanNvbih7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbklkOiByZXEucGFyYW1zLnNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxLmJvZHksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB7c3RhdHVzLCB2YWx1ZSwgc2Vzc2lvbklkfSA9IGF3YWl0IHJlcXVlc3QucG9zdChgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCwge1xuICAgICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uczogWzEsIDIsIDNdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YWx1ZS5zaG91bGQuZXFsKFsxLCAyLCAzXSk7XG4gICAgICAgICAgICBzaG91bGQubm90LmV4aXN0KHN0YXR1cyk7XG4gICAgICAgICAgICBzaG91bGQubm90LmV4aXN0KHNlc3Npb25JZCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBlcnJvciBpZiBhIHByb3hpZWQgcmVxdWVzdCByZXR1cm5zIGEgTUpTT05XUCBlcnJvciByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFwcC5wb3N0KCcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9wZXJmb3JtLWFjdGlvbnMnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICAgICAgICAgIHNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IDYsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdBIHByb2JsZW0gb2NjdXJyZWQnLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qge3N0YXR1c0NvZGUsIG1lc3NhZ2V9ID0gYXdhaXQgcmVxdWVzdC5wb3N0KGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLCB7XG4gICAgICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgICAgICAgc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoSFRUUFN0YXR1c0NvZGVzLk5PVF9GT1VORCk7XG4gICAgICAgICAgICBtZXNzYWdlLnNob3VsZC5tYXRjaCgvQSBwcm9ibGVtIG9jY3VycmVkLyk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBXM0MgZXJyb3IgaWYgYSBwcm94aWVkIHJlcXVlc3QgcmV0dXJucyBhIFczQyBlcnJvciByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBTb21lIGVycm9yIG9jY3VycmVkYCk7XG4gICAgICAgICAgICBlcnJvci53M2NTdGF0dXMgPSA0MTQ7XG4gICAgICAgICAgICBjb25zdCBleGVjdXRlQ29tbWFuZFN0dWIgPSBzaW5vbi5zdHViKGRyaXZlciwgJ2V4ZWN1dGVDb21tYW5kJykucmV0dXJucyh7XG4gICAgICAgICAgICAgIHByb3RvY29sOiAnVzNDJyxcbiAgICAgICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3QucG9zdChgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCwge1xuICAgICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uczogWzEsIDIsIDNdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXNDb2RlLCBlcnJvcjogcmV0dXJuZWRFcnJvcn0gPSByZXM7XG4gICAgICAgICAgICBzdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg0MTQpO1xuICAgICAgICAgICAgY29uc3Qge2Vycm9yOiB3M2NFcnJvciwgbWVzc2FnZTogZXJyTWVzc2FnZSwgc3RhY2t0cmFjZX0gPSByZXR1cm5lZEVycm9yLnZhbHVlO1xuICAgICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKCd1bmtub3duIGVycm9yJyk7XG4gICAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvU29tZSBlcnJvciBvY2N1cnJlZC8pO1xuICAgICAgICAgICAgZXJyTWVzc2FnZS5zaG91bGQuZXF1YWwoJ1NvbWUgZXJyb3Igb2NjdXJyZWQnKTtcbiAgICAgICAgICAgIGV4ZWN1dGVDb21tYW5kU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBlcnJvciBpZiBhIHByb3hpZWQgcmVxdWVzdCByZXR1cm5zIGEgTUpTT05XUCBlcnJvciByZXNwb25zZSBidXQgSFRUUCBzdGF0dXMgY29kZSBpcyAyMDAnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhcHAucG9zdCgnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvcGVyZm9ybS1hY3Rpb25zJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQ6ICdGYWtlIFNlc3Npb24gSWQnLFxuICAgICAgICAgICAgICAgIHN0YXR1czogNyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ0EgcHJvYmxlbSBvY2N1cnJlZCcsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCB7c3RhdHVzQ29kZSwgbWVzc2FnZSwgZXJyb3J9ID0gYXdhaXQgcmVxdWVzdC5wb3N0KGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLCB7XG4gICAgICAgICAgICAgIGpzb246IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgICAgICAgc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoSFRUUFN0YXR1c0NvZGVzLk5PVF9GT1VORCk7XG4gICAgICAgICAgICBtZXNzYWdlLnNob3VsZC5tYXRjaCgvQSBwcm9ibGVtIG9jY3VycmVkLyk7XG4gICAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBtZXNzYWdlOiBlcnJNZXNzYWdlLCBzdGFja3RyYWNlfSA9IGVycm9yLnZhbHVlO1xuICAgICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKCdubyBzdWNoIGVsZW1lbnQnKTtcbiAgICAgICAgICAgIGVyck1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9BIHByb2JsZW0gb2NjdXJyZWQvKTtcbiAgICAgICAgICAgIHN0YWNrdHJhY2Uuc2hvdWxkLmV4aXN0O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3IgaWYgYSBwcm94aWVkIHJlcXVlc3QgcmV0dXJucyBhIFczQyBlcnJvciByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFwcC5wb3N0KCcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9wZXJmb3JtLWFjdGlvbnMnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogJ25vIHN1Y2ggZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZG9lcyBub3QgbWFrZSBhIGRpZmZlcmVuY2UnLFxuICAgICAgICAgICAgICAgICAgc3RhY2t0cmFjZTogJ2FyYml0cmFyeSBzdGFja3RyYWNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qge3N0YXR1c0NvZGUsIG1lc3NhZ2UsIGVycm9yfSA9IGF3YWl0IHJlcXVlc3QucG9zdChgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCwge1xuICAgICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uczogWzEsIDIsIDNdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgICAgICAgIHN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKEhUVFBTdGF0dXNDb2Rlcy5OT1RfRk9VTkQpO1xuICAgICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL2RvZXMgbm90IG1ha2UgYSBkaWZmZXJlbmNlLyk7XG4gICAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBzdGFja3RyYWNlfSA9IGVycm9yLnZhbHVlO1xuICAgICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKCdubyBzdWNoIGVsZW1lbnQnKTtcbiAgICAgICAgICAgIHN0YWNrdHJhY2Uuc2hvdWxkLm1hdGNoKC9hcmJpdHJhcnkgc3RhY2t0cmFjZS8pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gZXJyb3IgaWYgYSBwcm94aWVkIHJlcXVlc3QgcmV0dXJucyBhIFczQyBlcnJvciByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFwcC5wb3N0KCcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9wZXJmb3JtLWFjdGlvbnMnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgcmVzLnNldCgnQ29ubmVjdGlvbicsICdjbG9zZScpO1xuICAgICAgICAgICAgICByZXMuc3RhdHVzKDQ0NCkuanNvbih7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiAnYm9ndXMgZXJyb3IgY29kZScsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZG9lcyBub3QgbWFrZSBhIGRpZmZlcmVuY2UnLFxuICAgICAgICAgICAgICAgICAgc3RhY2t0cmFjZTogJ2FyYml0cmFyeSBzdGFja3RyYWNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qge3N0YXR1c0NvZGUsIG1lc3NhZ2UsIGVycm9yfSA9IGF3YWl0IHJlcXVlc3QucG9zdChgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCwge1xuICAgICAgICAgICAgICBqc29uOiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uczogWzEsIDIsIDNdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgICAgICAgIHN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKEhUVFBTdGF0dXNDb2Rlcy5JTlRFUk5BTF9TRVJWRVJfRVJST1IpO1xuICAgICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL2RvZXMgbm90IG1ha2UgYSBkaWZmZXJlbmNlLyk7XG4gICAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBzdGFja3RyYWNlfSA9IGVycm9yLnZhbHVlO1xuICAgICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKCd1bmtub3duIGVycm9yJyk7XG4gICAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvYXJiaXRyYXJ5IHN0YWNrdHJhY2UvKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29tbWFuZHMgd2l0aCBubyByZXNwb25zZSB2YWx1ZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZm9yd2FyZGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICByZXMuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBlbXB0eSBzdHJpbmcgcmVzcG9uc2UgdmFsdWVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2VsZW1lbnQvYmFyL3RleHRgLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICByZXMuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2VuZCA1MDAgcmVzcG9uc2UgYW5kIGFuIFVua25vd24gb2JqZWN0IGZvciByZWplY3RlZCBjb21tYW5kcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9yZWZyZXNoYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgcmVzLnN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDUwMCk7XG4gICAgICByZXMuYm9keS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAxMyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICd0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IFRvbyBGcmVzaCEnXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgdGhyb3cgVW5rbm93bkVycm9yIHdoZW4ga25vd24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb29gLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg0MDQpO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogNixcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQSBzZXNzaW9uIGlzIGVpdGhlciB0ZXJtaW5hdGVkIG9yIG5vdCBzdGFydGVkJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3Nlc3Npb24gSWRzJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkcml2ZXIgPSBuZXcgRmFrZURyaXZlcigpO1xuICAgIGxldCBtanNvbndwU2VydmVyO1xuXG4gICAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1qc29ud3BTZXJ2ZXIgPSBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgICByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb246IHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbihkcml2ZXIpLFxuICAgICAgICBwb3J0OiBzZXJ2ZXJQb3J0LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcihhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBtanNvbndwU2VydmVyLmNsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBhZnRlckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IG51bGw7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIFNlc3Npb25JZCBmb3IgY29tbWFuZHMgd2l0aG91dCBzZXNzaW9uSWRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3N0YXR1c2AsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICB9KTtcblxuICAgICAgc2hvdWxkLmVxdWFsKHJlcy5zZXNzaW9uSWQsIG51bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Jlc3BvbmRzIHdpdGggdGhlIHNhbWUgc2Vzc2lvbiBJRCBpbiB0aGUgcmVxdWVzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzZXNzaW9uSWQgPSAnVmFkZXIgU2Vzc2lvbnMnO1xuICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcblxuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBqc29uOiB7dXJsOiAnaHR0cDovL2dvb2dsZS5jb20nfVxuICAgICAgfSk7XG5cbiAgICAgIHNob3VsZC5leGlzdChyZXMuc2Vzc2lvbklkKTtcbiAgICAgIHJlcy5zZXNzaW9uSWQuc2hvdWxkLmVxbChzZXNzaW9uSWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3llbGxzIGlmIG5vIHNlc3Npb24gZXhpc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNlc3Npb25JZCA9ICdWYWRlciBTZXNzaW9ucyc7XG5cbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfS91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgcmVzLnN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDQwNCk7XG4gICAgICByZXMuYm9keS5zdGF0dXMuc2hvdWxkLmVxdWFsKDYpO1xuICAgICAgcmVzLmJvZHkudmFsdWUubWVzc2FnZS5zaG91bGQuY29udGFpbignc2Vzc2lvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3llbGxzIGlmIGludmFsaWQgc2Vzc2lvbiBpcyBzZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNlc3Npb25JZCA9ICdWYWRlciBTZXNzaW9ucyc7XG4gICAgICBkcml2ZXIuc2Vzc2lvbklkID0gJ3JlY2Vzc2lvbic7XG5cbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfS91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgcmVzLnN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDQwNCk7XG4gICAgICByZXMuYm9keS5zdGF0dXMuc2hvdWxkLmVxdWFsKDYpO1xuICAgICAgcmVzLmJvZHkudmFsdWUubWVzc2FnZS5zaG91bGQuY29udGFpbignc2Vzc2lvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYXZlIHNlc3Npb24gSURzIGluIGVycm9yIHJlc3BvbnNlcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzZXNzaW9uSWQgPSAnVmFkZXIgU2Vzc2lvbnMnO1xuICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcblxuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3JlZnJlc2hgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IHRydWUsXG4gICAgICAgIHNpbXBsZTogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICByZXMuc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoNTAwKTtcbiAgICAgIHJlcy5ib2R5LnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDEzLFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgIG1lc3NhZ2U6ICdBbiB1bmtub3duIHNlcnZlci1zaWRlIGVycm9yIG9jY3VycmVkIHdoaWxlIHByb2Nlc3NpbmcgJyArXG4gICAgICAgICAgICAgICAgICAgJ3RoZSBjb21tYW5kLiBPcmlnaW5hbCBlcnJvcjogVG9vIEZyZXNoISdcbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbklkXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGEgbmV3IHNlc3Npb24gSUQgb24gY3JlYXRlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuXG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbmAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBqc29uOiB7ZGVzaXJlZENhcGFiaWxpdGllczoge2dyZWV0aW5nOiAnaGVsbG8nfSwgcmVxdWlyZWRDYXBhYmlsaXRpZXM6IHt2YWxlZGljdGlvbjogJ2J5ZSd9fVxuICAgICAgfSk7XG5cbiAgICAgIHNob3VsZC5leGlzdChyZXMuc2Vzc2lvbklkKTtcbiAgICAgIHJlcy5zZXNzaW9uSWQuaW5kZXhPZignZmFrZVNlc3Npb25fJykuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgcmVzLnZhbHVlLnNob3VsZC5lcWwoe2dyZWV0aW5nOiAnaGVsbG8nLCB2YWxlZGljdGlvbjogJ2J5ZSd9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZpYSBkcml2ZXJzIGpzb253cCBwcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZHJpdmVyO1xuICAgIGxldCBzZXNzaW9uSWQgPSAnZm9vJztcbiAgICBsZXQgbWpzb253cFNlcnZlcjtcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyID0gbmV3IEZha2VEcml2ZXIoKTtcbiAgICAgIGRyaXZlci5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgICBkcml2ZXIucHJveHlBY3RpdmUgPSAoKSA9PiB7IHJldHVybiB0cnVlOyB9O1xuICAgICAgZHJpdmVyLmNhblByb3h5ID0gKCkgPT4geyByZXR1cm4gdHJ1ZTsgfTtcblxuICAgICAgbWpzb253cFNlcnZlciA9IGF3YWl0IHNlcnZlcih7XG4gICAgICAgIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbjogcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uKGRyaXZlciksXG4gICAgICAgIHBvcnQ6IHNlcnZlclBvcnQsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBtanNvbndwU2VydmVyLmNsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdpdmUgYSBuaWNlIGVycm9yIGlmIHByb3h5aW5nIGlzIHNldCBidXQgbm8gcHJveHkgZnVuY3Rpb24gZXhpc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLmNhblByb3h5ID0gKCkgPT4geyByZXR1cm4gZmFsc2U7IH07XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH0vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMTMsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyAnICtcbiAgICAgICAgICAgICAgICAgICAndGhlIGNvbW1hbmQuIE9yaWdpbmFsIGVycm9yOiBUcnlpbmcgdG8gcHJveHkgdG8gYSBKU09OV1AgJyArXG4gICAgICAgICAgICAgICAgICAgJ3NlcnZlciBidXQgZHJpdmVyIGlzIHVuYWJsZSB0byBwcm94eSdcbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbklkXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGFzcyBvbiBhbnkgZXJyb3JzIGluIHByb3h5aW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnByb3h5UmVxUmVzID0gYXN5bmMgZnVuY3Rpb24gKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmb28nKTtcbiAgICAgIH07XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH0vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMTMsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyAnICtcbiAgICAgICAgICAgICAgICAgICAndGhlIGNvbW1hbmQuIE9yaWdpbmFsIGVycm9yOiBDb3VsZCBub3QgcHJveHkuIFByb3h5ICcgK1xuICAgICAgICAgICAgICAgICAgICdlcnJvcjogZm9vJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhYmxlIHRvIHRocm93IFByb3h5UmVxdWVzdEVycm9yIGluIHByb3h5aW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnByb3h5UmVxUmVzID0gYXN5bmMgZnVuY3Rpb24gKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgICAgICAgbGV0IGpzb253cCA9IHtzdGF0dXM6IDM1LCB2YWx1ZTogJ05vIHN1Y2ggY29udGV4dCBmb3VuZC4nLCBzZXNzaW9uSWQ6ICdmb28nfTtcbiAgICAgICAgdGhyb3cgbmV3IGVycm9ycy5Qcm94eVJlcXVlc3RFcnJvcihgQ291bGQgbm90IHByb3h5IGNvbW1hbmQgdG8gcmVtb3RlIHNlcnZlci4gYCwganNvbndwKTtcbiAgICAgIH07XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH0vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMzUsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ05vIHN1Y2ggY29udGV4dCBmb3VuZC4nXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsZXQgdGhlIHByb3h5IGhhbmRsZSByZXEvcmVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnByb3h5UmVxUmVzID0gYXN5bmMgZnVuY3Rpb24gKHJlcSwgcmVzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVxdWlyZS1hd2FpdFxuICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7Y3VzdG9tOiAnZGF0YSd9KTtcbiAgICAgIH07XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH0vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGpzb246IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9LFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCgyMDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7Y3VzdG9tOiAnZGF0YSd9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXZvaWQganNvbndwIHByb3h5aW5nIHdoZW4gcGF0aCBtYXRjaGVzIGF2b2lkYW5jZSBsaXN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLmdldFByb3h5QXZvaWRMaXN0ID0gKCkgPT4geyByZXR1cm4gW1snUE9TVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy91cmwkJyldXTsgfTtcbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfS91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAganNvbjoge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiB0cnVlLFxuICAgICAgICBzaW1wbGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgcmVzLnN0YXR1c0NvZGUuc2hvdWxkLmVxdWFsKDIwMCk7XG4gICAgICByZXMuYm9keS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogJ05hdmlnYXRlZCB0bzogaHR0cDovL2dvb2dsZS5jb20nLFxuICAgICAgICBzZXNzaW9uSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmYWlsIGlmIGF2b2lkIHByb3h5IGxpc3QgaXMgbWFsZm9ybWVkIGluIHNvbWUgd2F5JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXN5bmMgZnVuY3Rpb24gYmFkUHJveHlBdm9pZGFuY2VMaXN0IChsaXN0KSB7XG4gICAgICAgIGRyaXZlci5nZXRQcm94eUF2b2lkTGlzdCA9ICgpID0+IHsgcmV0dXJuIGxpc3Q7IH07XG4gICAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAganNvbjoge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IHRydWUsXG4gICAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICByZXMuc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoNTAwKTtcbiAgICAgICAgcmVzLmJvZHkuc3RhdHVzLnNob3VsZC5lcXVhbCgxMyk7XG4gICAgICAgIHJlcy5ib2R5LnZhbHVlLm1lc3NhZ2Uuc2hvdWxkLmNvbnRhaW4oJ3JveHknKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpc3RzID0gW1xuICAgICAgICAnZm9vJyxcbiAgICAgICAgW1snZm9vJ11dLFxuICAgICAgICBbWydCQVInLCAvbG9sL11dLFxuICAgICAgICBbWydHRVQnLCAnZm9vJ11dXG4gICAgICBdO1xuICAgICAgZm9yIChsZXQgbGlzdCBvZiBsaXN0cykge1xuICAgICAgICBhd2FpdCBiYWRQcm94eUF2b2lkYW5jZUxpc3QobGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGF2b2lkIHByb3h5aW5nIG5vbi1zZXNzaW9uIGNvbW1hbmRzIGV2ZW4gaWYgbm90IGluIHRoZSBsaXN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLmdldFByb3h5QXZvaWRMaXN0ID0gKCkgPT4geyByZXR1cm4gW1snUE9TVCcsIG5ldyBSZWdFeHAoJycpXV07IH07XG5cbiAgICAgIGxldCByZXMgPSBhd2FpdCByZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zdGF0dXNgLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZSxcbiAgICAgICAgc2ltcGxlOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5zdGF0dXNDb2RlLnNob3VsZC5lcXVhbCgyMDApO1xuICAgICAgcmVzLmJvZHkuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6IFwiSSdtIGZpbmVcIixcbiAgICAgICAgc2Vzc2lvbklkOiBudWxsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXZvaWQgcHJveHlpbmcgZGVsZXRlU2Vzc2lvbiBjb21tYW5kcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRyaXZlci5nZXRQcm94eUF2b2lkTGlzdCA9ICgpID0+IHsgcmV0dXJuIFtbJ1BPU1QnLCBuZXcgUmVnRXhwKCcnKV1dOyB9O1xuXG4gICAgICBkcml2ZXIuc2Vzc2lvbklkLnNob3VsZC5lcXVhbChzZXNzaW9uSWQpO1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9YCxcbiAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IHRydWUsXG4gICAgICAgIHNpbXBsZTogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICByZXMuc3RhdHVzQ29kZS5zaG91bGQuZXF1YWwoMjAwKTtcbiAgICAgIHNob3VsZC5ub3QuZXhpc3QoZHJpdmVyLnNlc3Npb25JZCk7XG4gICAgICBkcml2ZXIuandwUHJveHlBY3RpdmUuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L3Byb3RvY29sL3Byb3RvY29sLWUyZS1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
