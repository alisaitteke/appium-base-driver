"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _2 = require("../..");

var _sinon = _interopRequireDefault(require("sinon"));

const should = _chai.default.should();

_chai.default.use(_chaiAsPromised.default);

function baseDriverUnitTests(DriverClass, defaultCaps = {}) {
  const w3cCaps = {
    alwaysMatch: Object.assign({}, defaultCaps, {
      platformName: 'Fake',
      deviceName: 'Commodore 64'
    }),
    firstMatch: [{}]
  };
  describe('BaseDriver', function () {
    let d;
    beforeEach(function () {
      d = new DriverClass();
    });
    afterEach(async function () {
      await d.deleteSession();
    });
    it('should return an empty status object', async function () {
      let status = await d.getStatus();
      status.should.eql({});
    });
    it('should return a sessionId from createSession', async function () {
      let [sessId] = await d.createSession(defaultCaps);
      should.exist(sessId);
      sessId.should.be.a('string');
      sessId.length.should.be.above(5);
    });
    it('should not be able to start two sessions without closing the first', async function () {
      await d.createSession(defaultCaps);
      await d.createSession(defaultCaps).should.eventually.be.rejectedWith('session');
    });
    it('should be able to delete a session', async function () {
      let sessionId1 = await d.createSession(defaultCaps);
      await d.deleteSession();
      should.equal(d.sessionId, null);
      let sessionId2 = await d.createSession(defaultCaps);
      sessionId1.should.not.eql(sessionId2);
    });
    it('should get the current session', async function () {
      let [, caps] = await d.createSession(defaultCaps);
      caps.should.equal((await d.getSession()));
    });
    it('should return sessions if no session exists', async function () {
      let sessions = await d.getSessions();
      sessions.length.should.equal(0);
    });
    it('should return sessions', async function () {
      let caps = _lodash.default.clone(defaultCaps);

      caps.a = 'cap';
      await d.createSession(caps);
      let sessions = await d.getSessions();
      sessions.length.should.equal(1);
      sessions[0].should.eql({
        id: d.sessionId,
        capabilities: caps
      });
    });
    it('should fulfill an unexpected driver quit promise', async function () {
      d.getStatus = async function () {
        await _bluebird.default.delay(1000);
        return 'good status';
      }.bind(d);

      let cmdPromise = d.executeCommand('getStatus');
      await _bluebird.default.delay(10);
      d.startUnexpectedShutdown(new Error('We crashed'));
      await cmdPromise.should.be.rejectedWith(/We crashed/);
      await d.onUnexpectedShutdown.should.be.rejectedWith(/We crashed/);
    });
    it('should not allow commands in middle of unexpected shutdown', async function () {
      d.oldDeleteSession = d.deleteSession;

      d.deleteSession = async function () {
        await _bluebird.default.delay(100);
        await this.oldDeleteSession();
      }.bind(d);

      let caps = _lodash.default.clone(defaultCaps);

      await d.createSession(caps);
      d.startUnexpectedShutdown(new Error('We crashed'));
      await d.onUnexpectedShutdown.should.be.rejectedWith(/We crashed/);
      await d.executeCommand('getSession').should.be.rejectedWith(/shut down/);
    });
    it('should allow new commands after done shutting down', async function () {
      d.oldDeleteSession = d.deleteSession;

      d.deleteSession = async function () {
        await _bluebird.default.delay(100);
        await this.oldDeleteSession();
      }.bind(d);

      let caps = _lodash.default.clone(defaultCaps);

      await d.createSession(caps);
      d.startUnexpectedShutdown(new Error('We crashed'));
      await d.onUnexpectedShutdown.should.be.rejectedWith(/We crashed/);
      await d.executeCommand('getSession').should.be.rejectedWith(/shut down/);
      await _bluebird.default.delay(100);
      await d.executeCommand('createSession', caps);
      await d.deleteSession();
    });
    it('should distinguish between W3C and JSONWP session', async function () {
      await d.executeCommand('createSession', Object.assign({}, defaultCaps, {
        platformName: 'Fake',
        deviceName: 'Commodore 64'
      }));
      d.protocol.should.equal('MJSONWP');
      await d.executeCommand('deleteSession');
      await d.executeCommand('createSession', null, null, {
        alwaysMatch: Object.assign({}, defaultCaps, {
          platformName: 'Fake',
          deviceName: 'Commodore 64'
        }),
        firstMatch: [{}]
      });
      d.protocol.should.equal('W3C');
    });
    describe('protocol detection', function () {
      it('should use MJSONWP if only JSONWP caps are provided', async function () {
        await d.createSession(defaultCaps);
        d.protocol.should.equal('MJSONWP');
      });
      it('should use W3C if only W3C caps are provided', async function () {
        await d.createSession(null, null, {
          alwaysMatch: defaultCaps,
          firstMatch: [{}]
        });
        d.protocol.should.equal('W3C');
      });
    });
    it('should have a method to get driver for a session', async function () {
      let [sessId] = await d.createSession(defaultCaps);
      d.driverForSession(sessId).should.eql(d);
    });
    describe('command queue', function () {
      let d = new DriverClass();
      let waitMs = 10;

      d.getStatus = async function () {
        await _bluebird.default.delay(waitMs);
        return Date.now();
      }.bind(d);

      d.getSessions = async function () {
        await _bluebird.default.delay(waitMs);
        throw new Error('multipass');
      }.bind(d);

      afterEach(function () {
        d.clearNewCommandTimeout();
      });
      it('should queue commands and.executeCommand/respond in the order received', async function () {
        let numCmds = 10;
        let cmds = [];

        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }

        let results = await _bluebird.default.all(cmds);

        for (let i = 1; i < numCmds; i++) {
          if (results[i] <= results[i - 1]) {
            throw new Error('Got result out of order');
          }
        }
      });
      it('should handle errors correctly when queuing', async function () {
        let numCmds = 10;
        let cmds = [];

        for (let i = 0; i < numCmds; i++) {
          if (i === 5) {
            cmds.push(d.executeCommand('getSessions'));
          } else {
            cmds.push(d.executeCommand('getStatus'));
          }
        }

        let results = await _bluebird.default.settle(cmds);

        for (let i = 1; i < 5; i++) {
          if (results[i].value() <= results[i - 1].value()) {
            throw new Error('Got result out of order');
          }
        }

        results[5].reason().message.should.contain('multipass');

        for (let i = 7; i < numCmds; i++) {
          if (results[i].value() <= results[i - 1].value()) {
            throw new Error('Got result out of order');
          }
        }
      });
      it('should not care if queue empties for a bit', async function () {
        let numCmds = 10;
        let cmds = [];

        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }

        let results = await _bluebird.default.all(cmds);
        cmds = [];

        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }

        results = await _bluebird.default.all(cmds);

        for (let i = 1; i < numCmds; i++) {
          if (results[i] <= results[i - 1]) {
            throw new Error('Got result out of order');
          }
        }
      });
    });
    describe('timeouts', function () {
      before(async function () {
        await d.createSession(defaultCaps);
      });
      describe('command', function () {
        it('should exist by default', function () {
          d.newCommandTimeoutMs.should.equal(60000);
        });
        it('should be settable through `timeouts`', async function () {
          await d.timeouts('command', 20);
          d.newCommandTimeoutMs.should.equal(20);
        });
      });
      describe('implicit', function () {
        it('should not exist by default', function () {
          d.implicitWaitMs.should.equal(0);
        });
        it('should be settable through `timeouts`', async function () {
          await d.timeouts('implicit', 20);
          d.implicitWaitMs.should.equal(20);
        });
      });
    });
    describe('timeouts (W3C)', function () {
      beforeEach(async function () {
        await d.createSession(null, null, w3cCaps);
      });
      afterEach(async function () {
        await d.deleteSession();
      });
      it('should get timeouts that we set', async function () {
        await d.timeouts(undefined, undefined, undefined, undefined, 1000);
        await d.getTimeouts().should.eventually.have.property('implicit', 1000);
        await d.timeouts('command', 2000);
        await d.getTimeouts().should.eventually.deep.equal({
          implicit: 1000,
          command: 2000
        });
        await d.timeouts(undefined, undefined, undefined, undefined, 3000);
        await d.getTimeouts().should.eventually.deep.equal({
          implicit: 3000,
          command: 2000
        });
      });
    });
    describe('reset compatibility', function () {
      it('should not allow both fullReset and noReset to be true', async function () {
        let newCaps = Object.assign({}, defaultCaps, {
          fullReset: true,
          noReset: true
        });
        await d.createSession(newCaps).should.eventually.be.rejectedWith(/noReset.+fullReset/);
      });
    });
    describe('proxying', function () {
      let sessId;
      beforeEach(async function () {
        [sessId] = await d.createSession(defaultCaps);
      });
      describe('#proxyActive', function () {
        it('should exist', function () {
          d.proxyActive.should.be.an.instanceof(Function);
        });
        it('should return false', function () {
          d.proxyActive(sessId).should.be.false;
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.proxyActive('aaa');
          }).should.throw;
        });
      });
      describe('#getProxyAvoidList', function () {
        it('should exist', function () {
          d.getProxyAvoidList.should.be.an.instanceof(Function);
        });
        it('should return an array', function () {
          d.getProxyAvoidList(sessId).should.be.an.instanceof(Array);
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.getProxyAvoidList('aaa');
          }).should.throw;
        });
      });
      describe('#canProxy', function () {
        it('should have a #canProxy method', function () {
          d.canProxy.should.be.an.instanceof(Function);
        });
        it('should return false from #canProxy', function () {
          d.canProxy(sessId).should.be.false;
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.canProxy();
          }).should.throw;
        });
      });
      describe('#proxyRouteIsAvoided', function () {
        it('should validate form of avoidance list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /\/foo/], ['GET']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.returns([['POST', /\/foo/], ['GET', /^foo/, 'bar']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should reject bad http methods', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /^foo/], ['BAZETE', /^bar/]]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should reject non-regex routes', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /^foo/], ['GET', '/bar']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should return true for routes in the avoid list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'POST', '/foo/bar').should.be.true;
          avoidStub.restore();
        });
        it('should strip away any wd/hub prefix', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'POST', '/wd/hub/foo/bar').should.be.true;
          avoidStub.restore();
        });
        it('should return false for routes not in the avoid list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');

          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'GET', '/foo/bar').should.be.false;
          d.proxyRouteIsAvoided(null, 'POST', '/boo').should.be.false;
          avoidStub.restore();
        });
      });
    });
    describe('event timing framework', function () {
      let beforeStartTime;
      beforeEach(async function () {
        beforeStartTime = Date.now();
        d.shouldValidateCaps = false;
        await d.executeCommand('createSession', defaultCaps);
      });
      describe('#eventHistory', function () {
        it('should have an eventHistory property', function () {
          should.exist(d.eventHistory);
          should.exist(d.eventHistory.commands);
        });
        it('should have a session start timing after session start', function () {
          let {
            newSessionRequested,
            newSessionStarted
          } = d.eventHistory;
          newSessionRequested.should.have.length(1);
          newSessionStarted.should.have.length(1);
          newSessionRequested[0].should.be.a('number');
          newSessionStarted[0].should.be.a('number');
          (newSessionRequested[0] >= beforeStartTime).should.be.true;
          (newSessionStarted[0] >= newSessionRequested[0]).should.be.true;
        });
        it('should include a commands list', async function () {
          await d.executeCommand('getStatus', []);
          d.eventHistory.commands.length.should.equal(2);
          d.eventHistory.commands[1].cmd.should.equal('getStatus');
          d.eventHistory.commands[1].startTime.should.be.a('number');
          d.eventHistory.commands[1].endTime.should.be.a('number');
        });
      });
      describe('#logEvent', function () {
        it('should allow logging arbitrary events', function () {
          d.logEvent('foo');
          d.eventHistory.foo[0].should.be.a('number');
          (d.eventHistory.foo[0] >= beforeStartTime).should.be.true;
        });
        it('should not allow reserved or oddly formed event names', function () {
          (() => {
            d.logEvent('commands');
          }).should.throw();
          (() => {
            d.logEvent(1);
          }).should.throw();
          (() => {
            d.logEvent({});
          }).should.throw();
        });
      });
      it('should allow logging the same event multiple times', function () {
        d.logEvent('bar');
        d.logEvent('bar');
        d.eventHistory.bar.should.have.length(2);
        d.eventHistory.bar[1].should.be.a('number');
        (d.eventHistory.bar[1] >= d.eventHistory.bar[0]).should.be.true;
      });
      describe('getSession decoration', function () {
        it('should decorate getSession response if opt-in cap is provided', async function () {
          let res = await d.getSession();
          should.not.exist(res.events);
          d.caps.eventTimings = true;
          res = await d.getSession();
          should.exist(res.events);
          should.exist(res.events.newSessionRequested);
          res.events.newSessionRequested[0].should.be.a('number');
        });
      });
    });
    describe('.reset', function () {
      it('should reset as W3C if the original session was W3C', async function () {
        const caps = {
          alwaysMatch: Object.assign({}, {
            app: 'Fake',
            deviceName: 'Fake',
            automationName: 'Fake',
            platformName: 'Fake'
          }, defaultCaps),
          firstMatch: [{}]
        };
        await d.createSession(undefined, undefined, caps);
        d.protocol.should.equal('W3C');
        await d.reset();
        d.protocol.should.equal('W3C');
      });
      it('should reset as MJSONWP if the original session was MJSONWP', async function () {
        const caps = Object.assign({}, {
          app: 'Fake',
          deviceName: 'Fake',
          automationName: 'Fake',
          platformName: 'Fake'
        }, defaultCaps);
        await d.createSession(caps);
        d.protocol.should.equal('MJSONWP');
        await d.reset();
        d.protocol.should.equal('MJSONWP');
      });
    });
  });
  describe('DeviceSettings', function () {
    it('should not hold on to reference of defaults in constructor', function () {
      let obj = {
        foo: 'bar'
      };
      let d1 = new _2.DeviceSettings(obj);
      let d2 = new _2.DeviceSettings(obj);
      d1._settings.foo = 'baz';

      d1._settings.should.not.eql(d2._settings);
    });
  });
  describe('.isFeatureEnabled', function () {
    const d = new DriverClass();
    afterEach(function () {
      d.denyInsecure = null;
      d.allowInsecure = null;
      d.relaxedSecurityEnabled = null;
    });
    it('should say a feature is enabled when it is explicitly allowed', function () {
      d.allowInsecure = ['foo', 'bar'];
      d.isFeatureEnabled('foo').should.be.true;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.false;
    });
    it('should say a feature is not enabled if it is not enabled', function () {
      d.allowInsecure = [];
      d.isFeatureEnabled('foo').should.be.false;
    });
    it('should prefer denyInsecure to allowInsecure', function () {
      d.allowInsecure = ['foo', 'bar'];
      d.denyInsecure = ['foo'];
      d.isFeatureEnabled('foo').should.be.false;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.false;
    });
    it('should allow global setting for insecurity', function () {
      d.relaxedSecurityEnabled = true;
      d.isFeatureEnabled('foo').should.be.true;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.true;
    });
    it('global setting should be overrideable', function () {
      d.relaxedSecurityEnabled = true;
      d.denyInsecure = ['foo', 'bar'];
      d.isFeatureEnabled('foo').should.be.false;
      d.isFeatureEnabled('bar').should.be.false;
      d.isFeatureEnabled('baz').should.be.true;
    });
  });
}

var _default = baseDriverUnitTests;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvYmFzZWRyaXZlci9kcml2ZXItdGVzdHMuanMiXSwibmFtZXMiOlsic2hvdWxkIiwiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwiYmFzZURyaXZlclVuaXRUZXN0cyIsIkRyaXZlckNsYXNzIiwiZGVmYXVsdENhcHMiLCJ3M2NDYXBzIiwiYWx3YXlzTWF0Y2giLCJPYmplY3QiLCJhc3NpZ24iLCJwbGF0Zm9ybU5hbWUiLCJkZXZpY2VOYW1lIiwiZmlyc3RNYXRjaCIsImRlc2NyaWJlIiwiZCIsImJlZm9yZUVhY2giLCJhZnRlckVhY2giLCJkZWxldGVTZXNzaW9uIiwiaXQiLCJzdGF0dXMiLCJnZXRTdGF0dXMiLCJlcWwiLCJzZXNzSWQiLCJjcmVhdGVTZXNzaW9uIiwiZXhpc3QiLCJiZSIsImEiLCJsZW5ndGgiLCJhYm92ZSIsImV2ZW50dWFsbHkiLCJyZWplY3RlZFdpdGgiLCJzZXNzaW9uSWQxIiwiZXF1YWwiLCJzZXNzaW9uSWQiLCJzZXNzaW9uSWQyIiwibm90IiwiY2FwcyIsImdldFNlc3Npb24iLCJzZXNzaW9ucyIsImdldFNlc3Npb25zIiwiXyIsImNsb25lIiwiaWQiLCJjYXBhYmlsaXRpZXMiLCJCIiwiZGVsYXkiLCJiaW5kIiwiY21kUHJvbWlzZSIsImV4ZWN1dGVDb21tYW5kIiwic3RhcnRVbmV4cGVjdGVkU2h1dGRvd24iLCJFcnJvciIsIm9uVW5leHBlY3RlZFNodXRkb3duIiwib2xkRGVsZXRlU2Vzc2lvbiIsInByb3RvY29sIiwiZHJpdmVyRm9yU2Vzc2lvbiIsIndhaXRNcyIsIkRhdGUiLCJub3ciLCJjbGVhck5ld0NvbW1hbmRUaW1lb3V0IiwibnVtQ21kcyIsImNtZHMiLCJpIiwicHVzaCIsInJlc3VsdHMiLCJhbGwiLCJzZXR0bGUiLCJ2YWx1ZSIsInJlYXNvbiIsIm1lc3NhZ2UiLCJjb250YWluIiwiYmVmb3JlIiwibmV3Q29tbWFuZFRpbWVvdXRNcyIsInRpbWVvdXRzIiwiaW1wbGljaXRXYWl0TXMiLCJ1bmRlZmluZWQiLCJnZXRUaW1lb3V0cyIsImhhdmUiLCJwcm9wZXJ0eSIsImRlZXAiLCJpbXBsaWNpdCIsImNvbW1hbmQiLCJuZXdDYXBzIiwiZnVsbFJlc2V0Iiwibm9SZXNldCIsInByb3h5QWN0aXZlIiwiYW4iLCJpbnN0YW5jZW9mIiwiRnVuY3Rpb24iLCJmYWxzZSIsInRocm93IiwiZ2V0UHJveHlBdm9pZExpc3QiLCJBcnJheSIsImNhblByb3h5IiwiYXZvaWRTdHViIiwic2lub24iLCJzdHViIiwicmV0dXJucyIsInByb3h5Um91dGVJc0F2b2lkZWQiLCJyZXN0b3JlIiwidHJ1ZSIsImJlZm9yZVN0YXJ0VGltZSIsInNob3VsZFZhbGlkYXRlQ2FwcyIsImV2ZW50SGlzdG9yeSIsImNvbW1hbmRzIiwibmV3U2Vzc2lvblJlcXVlc3RlZCIsIm5ld1Nlc3Npb25TdGFydGVkIiwiY21kIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsImxvZ0V2ZW50IiwiZm9vIiwiYmFyIiwicmVzIiwiZXZlbnRzIiwiZXZlbnRUaW1pbmdzIiwiYXBwIiwiYXV0b21hdGlvbk5hbWUiLCJyZXNldCIsIm9iaiIsImQxIiwiRGV2aWNlU2V0dGluZ3MiLCJkMiIsIl9zZXR0aW5ncyIsImRlbnlJbnNlY3VyZSIsImFsbG93SW5zZWN1cmUiLCJyZWxheGVkU2VjdXJpdHlFbmFibGVkIiwiaXNGZWF0dXJlRW5hYmxlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQSxNQUFNQSxNQUFNLEdBQUdDLGNBQUtELE1BQUwsRUFBZjs7QUFDQUMsY0FBS0MsR0FBTCxDQUFTQyx1QkFBVDs7QUFJQSxTQUFTQyxtQkFBVCxDQUE4QkMsV0FBOUIsRUFBMkNDLFdBQVcsR0FBRyxFQUF6RCxFQUE2RDtBQUMzRCxRQUFNQyxPQUFPLEdBQUc7QUFDZEMsSUFBQUEsV0FBVyxFQUFFQyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSixXQUFsQixFQUErQjtBQUMxQ0ssTUFB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LDRDQUFELEVBQStDLFlBQVk7QUFDM0RKLE1BQUFBLENBQUMsQ0FBQytHLHNCQUFGLEdBQTJCLElBQTNCO0FBQ0EvRyxNQUFBQSxDQUFDLENBQUNnSCxnQkFBRixDQUFtQixLQUFuQixFQUEwQi9ILE1BQTFCLENBQWlDMEIsRUFBakMsQ0FBb0MwRSxJQUFwQztBQUNBckYsTUFBQUEsQ0FBQyxDQUFDZ0gsZ0JBQUYsQ0FBbUIsS0FBbkIsRUFBMEIvSCxNQUExQixDQUFpQzBCLEVBQWpDLENBQW9DMEUsSUFBcEM7QUFDQXJGLE1BQUFBLENBQUMsQ0FBQ2dILGdCQUFGLENBQW1CLEtBQW5CLEVBQTBCL0gsTUFBMUIsQ0FBaUMwQixFQUFqQyxDQUFvQzBFLElBQXBDO0FBQ0QsS0FMQyxDQUFGO0FBT0FqRixJQUFBQSxFQUFFLENBQUMsdUNBQUQsRUFBMEMsWUFBWTtBQUN0REosTUFBQUEsQ0FBQyxDQUFDK0csc0JBQUYsR0FBMkIsSUFBM0I7QUFDQS9HLE1BQUFBLENBQUMsQ0FBQzZHLFlBQUYsR0FBaUIsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUFqQjtBQUNBN0csTUFBQUEsQ0FBQyxDQUFDZ0gsZ0JBQUYsQ0FBbUIsS0FBbkIsRUFBMEIvSCxNQUExQixDQUFpQzBCLEVBQWpDLENBQW9DK0QsS0FBcEM7QUFDQTFFLE1BQUFBLENBQUMsQ0FBQ2dILGdCQUFGLENBQW1CLEtBQW5CLEVBQTBCL0gsTUFBMUIsQ0FBaUMwQixFQUFqQyxDQUFvQytELEtBQXBDO0FBQ0ExRSxNQUFBQSxDQUFDLENBQUNnSCxnQkFBRixDQUFtQixLQUFuQixFQUEwQi9ILE1BQTFCLENBQWlDMEIsRUFBakMsQ0FBb0MwRSxJQUFwQztBQUNELEtBTkMsQ0FBRjtBQU9ELEdBM0NPLENBQVI7QUE0Q0Q7O2VBRWNoRyxtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IERldmljZVNldHRpbmdzIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IHNpbm9uIGZyb20gJ3Npbm9uJztcblxuXG5jb25zdCBzaG91bGQgPSBjaGFpLnNob3VsZCgpO1xuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuXG4vLyB3cmFwIHRoZXNlIHRlc3RzIGluIGEgZnVuY3Rpb24gc28gd2UgY2FuIGV4cG9ydCB0aGUgdGVzdHMgYW5kIHJlLXVzZSB0aGVtXG4vLyBmb3IgYWN0dWFsIGRyaXZlciBpbXBsZW1lbnRhdGlvbnNcbmZ1bmN0aW9uIGJhc2VEcml2ZXJVbml0VGVzdHMgKERyaXZlckNsYXNzLCBkZWZhdWx0Q2FwcyA9IHt9KSB7XG4gIGNvbnN0IHczY0NhcHMgPSB7XG4gICAgYWx3YXlzTWF0Y2g6IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRDYXBzLCB7XG4gICAgICBwbGF0Zm9ybU5hbWU6ICdGYWtlJyxcbiAgICAgIGRldmljZU5hbWU6ICdDb21tb2RvcmUgNjQnLFxuICAgIH0pLFxuICAgIGZpcnN0TWF0Y2g6IFt7fV0sXG4gIH07XG5cbiAgZGVzY3JpYmUoJ0Jhc2VEcml2ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGQ7XG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBkID0gbmV3IERyaXZlckNsYXNzKCk7XG4gICAgfSk7XG4gICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGQuZGVsZXRlU2Vzc2lvbigpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gZW1wdHkgc3RhdHVzIG9iamVjdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzdGF0dXMgPSBhd2FpdCBkLmdldFN0YXR1cygpO1xuICAgICAgc3RhdHVzLnNob3VsZC5lcWwoe30pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gYSBzZXNzaW9uSWQgZnJvbSBjcmVhdGVTZXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IFtzZXNzSWRdID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIHNob3VsZC5leGlzdChzZXNzSWQpO1xuICAgICAgc2Vzc0lkLnNob3VsZC5iZS5hKCdzdHJpbmcnKTtcbiAgICAgIHNlc3NJZC5sZW5ndGguc2hvdWxkLmJlLmFib3ZlKDUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgYmUgYWJsZSB0byBzdGFydCB0d28gc2Vzc2lvbnMgd2l0aG91dCBjbG9zaW5nIHRoZSBmaXJzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oZGVmYXVsdENhcHMpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgnc2Vzc2lvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGRlbGV0ZSBhIHNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc2Vzc2lvbklkMSA9IGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICBhd2FpdCBkLmRlbGV0ZVNlc3Npb24oKTtcbiAgICAgIHNob3VsZC5lcXVhbChkLnNlc3Npb25JZCwgbnVsbCk7XG4gICAgICBsZXQgc2Vzc2lvbklkMiA9IGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICBzZXNzaW9uSWQxLnNob3VsZC5ub3QuZXFsKHNlc3Npb25JZDIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZXQgdGhlIGN1cnJlbnQgc2Vzc2lvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBbLCBjYXBzXSA9IGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICBjYXBzLnNob3VsZC5lcXVhbChhd2FpdCBkLmdldFNlc3Npb24oKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBzZXNzaW9ucyBpZiBubyBzZXNzaW9uIGV4aXN0cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzZXNzaW9ucyA9IGF3YWl0IGQuZ2V0U2Vzc2lvbnMoKTtcbiAgICAgIHNlc3Npb25zLmxlbmd0aC5zaG91bGQuZXF1YWwoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBzZXNzaW9ucycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBjYXBzID0gXy5jbG9uZShkZWZhdWx0Q2Fwcyk7XG4gICAgICBjYXBzLmEgPSAnY2FwJztcbiAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihjYXBzKTtcbiAgICAgIGxldCBzZXNzaW9ucyA9IGF3YWl0IGQuZ2V0U2Vzc2lvbnMoKTtcblxuICAgICAgc2Vzc2lvbnMubGVuZ3RoLnNob3VsZC5lcXVhbCgxKTtcbiAgICAgIHNlc3Npb25zWzBdLnNob3VsZC5lcWwoe1xuICAgICAgICBpZDogZC5zZXNzaW9uSWQsXG4gICAgICAgIGNhcGFiaWxpdGllczogY2Fwc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZ1bGZpbGwgYW4gdW5leHBlY3RlZCBkcml2ZXIgcXVpdCBwcm9taXNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gbWFrZSBhIGNvbW1hbmQgdGhhdCB3aWxsIHdhaXQgYSBiaXQgc28gd2UgY2FuIGNyYXNoIHdoaWxlIGl0J3MgcnVubmluZ1xuICAgICAgZC5nZXRTdGF0dXMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoMTAwMCk7XG4gICAgICAgIHJldHVybiAnZ29vZCBzdGF0dXMnO1xuICAgICAgfS5iaW5kKGQpO1xuICAgICAgbGV0IGNtZFByb21pc2UgPSBkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnKTtcbiAgICAgIGF3YWl0IEIuZGVsYXkoMTApO1xuICAgICAgZC5zdGFydFVuZXhwZWN0ZWRTaHV0ZG93bihuZXcgRXJyb3IoJ1dlIGNyYXNoZWQnKSk7XG4gICAgICBhd2FpdCBjbWRQcm9taXNlLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL1dlIGNyYXNoZWQvKTtcbiAgICAgIGF3YWl0IGQub25VbmV4cGVjdGVkU2h1dGRvd24uc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvV2UgY3Jhc2hlZC8pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgY29tbWFuZHMgaW4gbWlkZGxlIG9mIHVuZXhwZWN0ZWQgc2h1dGRvd24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBtYWtlIGEgY29tbWFuZCB0aGF0IHdpbGwgd2FpdCBhIGJpdCBzbyB3ZSBjYW4gY3Jhc2ggd2hpbGUgaXQncyBydW5uaW5nXG4gICAgICBkLm9sZERlbGV0ZVNlc3Npb24gPSBkLmRlbGV0ZVNlc3Npb247XG4gICAgICBkLmRlbGV0ZVNlc3Npb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoMTAwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5vbGREZWxldGVTZXNzaW9uKCk7XG4gICAgICB9LmJpbmQoZCk7XG4gICAgICBsZXQgY2FwcyA9IF8uY2xvbmUoZGVmYXVsdENhcHMpO1xuICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGNhcHMpO1xuICAgICAgZC5zdGFydFVuZXhwZWN0ZWRTaHV0ZG93bihuZXcgRXJyb3IoJ1dlIGNyYXNoZWQnKSk7XG4gICAgICBhd2FpdCBkLm9uVW5leHBlY3RlZFNodXRkb3duLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL1dlIGNyYXNoZWQvKTtcbiAgICAgIGF3YWl0IGQuZXhlY3V0ZUNvbW1hbmQoJ2dldFNlc3Npb24nKS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9zaHV0IGRvd24vKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgbmV3IGNvbW1hbmRzIGFmdGVyIGRvbmUgc2h1dHRpbmcgZG93bicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIG1ha2UgYSBjb21tYW5kIHRoYXQgd2lsbCB3YWl0IGEgYml0IHNvIHdlIGNhbiBjcmFzaCB3aGlsZSBpdCdzIHJ1bm5pbmdcbiAgICAgIGQub2xkRGVsZXRlU2Vzc2lvbiA9IGQuZGVsZXRlU2Vzc2lvbjtcbiAgICAgIGQuZGVsZXRlU2Vzc2lvbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgQi5kZWxheSgxMDApO1xuICAgICAgICBhd2FpdCB0aGlzLm9sZERlbGV0ZVNlc3Npb24oKTtcbiAgICAgIH0uYmluZChkKTtcbiAgICAgIGxldCBjYXBzID0gXy5jbG9uZShkZWZhdWx0Q2Fwcyk7XG4gICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oY2Fwcyk7XG4gICAgICBkLnN0YXJ0VW5leHBlY3RlZFNodXRkb3duKG5ldyBFcnJvcignV2UgY3Jhc2hlZCcpKTtcbiAgICAgIGF3YWl0IGQub25VbmV4cGVjdGVkU2h1dGRvd24uc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvV2UgY3Jhc2hlZC8pO1xuICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnZ2V0U2Vzc2lvbicpLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL3NodXQgZG93bi8pO1xuICAgICAgYXdhaXQgQi5kZWxheSgxMDApO1xuICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnY3JlYXRlU2Vzc2lvbicsIGNhcHMpO1xuICAgICAgYXdhaXQgZC5kZWxldGVTZXNzaW9uKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGRpc3Rpbmd1aXNoIGJldHdlZW4gVzNDIGFuZCBKU09OV1Agc2Vzc2lvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFRlc3QgSlNPTldQXG4gICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdjcmVhdGVTZXNzaW9uJywgT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdENhcHMsIHtcbiAgICAgICAgcGxhdGZvcm1OYW1lOiAnRmFrZScsXG4gICAgICAgIGRldmljZU5hbWU6ICdDb21tb2RvcmUgNjQnLFxuICAgICAgfSkpO1xuXG4gICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnTUpTT05XUCcpO1xuICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnZGVsZXRlU2Vzc2lvbicpO1xuXG4gICAgICAvLyBUZXN0IFczQyAobGVhdmUgZmlyc3QgMiBhcmdzIG51bGwgYmVjYXVzZSB0aG9zZSBhcmUgdGhlIEpTT05XUCBhcmdzKVxuICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnY3JlYXRlU2Vzc2lvbicsIG51bGwsIG51bGwsIHtcbiAgICAgICAgYWx3YXlzTWF0Y2g6IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRDYXBzLCB7XG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnRmFrZScsXG4gICAgICAgICAgZGV2aWNlTmFtZTogJ0NvbW1vZG9yZSA2NCcsXG4gICAgICAgIH0pLFxuICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgfSk7XG5cbiAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdXM0MnKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdwcm90b2NvbCBkZXRlY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIHVzZSBNSlNPTldQIGlmIG9ubHkgSlNPTldQIGNhcHMgYXJlIHByb3ZpZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oZGVmYXVsdENhcHMpO1xuICAgICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnTUpTT05XUCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdXNlIFczQyBpZiBvbmx5IFczQyBjYXBzIGFyZSBwcm92aWRlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKG51bGwsIG51bGwsIHthbHdheXNNYXRjaDogZGVmYXVsdENhcHMsIGZpcnN0TWF0Y2g6IFt7fV19KTtcbiAgICAgICAgZC5wcm90b2NvbC5zaG91bGQuZXF1YWwoJ1czQycpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhdmUgYSBtZXRob2QgdG8gZ2V0IGRyaXZlciBmb3IgYSBzZXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IFtzZXNzSWRdID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIGQuZHJpdmVyRm9yU2Vzc2lvbihzZXNzSWQpLnNob3VsZC5lcWwoZCk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnY29tbWFuZCBxdWV1ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBkID0gbmV3IERyaXZlckNsYXNzKCk7XG5cbiAgICAgIGxldCB3YWl0TXMgPSAxMDtcbiAgICAgIGQuZ2V0U3RhdHVzID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBCLmRlbGF5KHdhaXRNcyk7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpO1xuICAgICAgfS5iaW5kKGQpO1xuXG4gICAgICBkLmdldFNlc3Npb25zID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBCLmRlbGF5KHdhaXRNcyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVsdGlwYXNzJyk7XG4gICAgICB9LmJpbmQoZCk7XG5cbiAgICAgIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQuY2xlYXJOZXdDb21tYW5kVGltZW91dCgpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcXVldWUgY29tbWFuZHMgYW5kLmV4ZWN1dGVDb21tYW5kL3Jlc3BvbmQgaW4gdGhlIG9yZGVyIHJlY2VpdmVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgbnVtQ21kcyA9IDEwO1xuICAgICAgICBsZXQgY21kcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGNtZHMucHVzaChkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdHMgPSBhd2FpdCBCLmFsbChjbWRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1DbWRzOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzdWx0c1tpXSA8PSByZXN1bHRzW2kgLSAxXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHb3QgcmVzdWx0IG91dCBvZiBvcmRlcicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgaGFuZGxlIGVycm9ycyBjb3JyZWN0bHkgd2hlbiBxdWV1aW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgbnVtQ21kcyA9IDEwO1xuICAgICAgICBsZXQgY21kcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGlmIChpID09PSA1KSB7XG4gICAgICAgICAgICBjbWRzLnB1c2goZC5leGVjdXRlQ29tbWFuZCgnZ2V0U2Vzc2lvbnMnKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNtZHMucHVzaChkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXN1bHRzID0gYXdhaXQgQi5zZXR0bGUoY21kcyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdHNbaV0udmFsdWUoKSA8PSByZXN1bHRzW2kgLSAxXS52YWx1ZSgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCByZXN1bHQgb3V0IG9mIG9yZGVyJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlc3VsdHNbNV0ucmVhc29uKCkubWVzc2FnZS5zaG91bGQuY29udGFpbignbXVsdGlwYXNzJyk7XG4gICAgICAgIGZvciAobGV0IGkgPSA3OyBpIDwgbnVtQ21kczsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdHNbaV0udmFsdWUoKSA8PSByZXN1bHRzW2kgLSAxXS52YWx1ZSgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCByZXN1bHQgb3V0IG9mIG9yZGVyJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3QgY2FyZSBpZiBxdWV1ZSBlbXB0aWVzIGZvciBhIGJpdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG51bUNtZHMgPSAxMDtcbiAgICAgICAgbGV0IGNtZHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DbWRzOyBpKyspIHtcbiAgICAgICAgICBjbWRzLnB1c2goZC5leGVjdXRlQ29tbWFuZCgnZ2V0U3RhdHVzJykpO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXN1bHRzID0gYXdhaXQgQi5hbGwoY21kcyk7XG4gICAgICAgIGNtZHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DbWRzOyBpKyspIHtcbiAgICAgICAgICBjbWRzLnB1c2goZC5leGVjdXRlQ29tbWFuZCgnZ2V0U3RhdHVzJykpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdHMgPSBhd2FpdCBCLmFsbChjbWRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1DbWRzOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzdWx0c1tpXSA8PSByZXN1bHRzW2kgLSAxXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHb3QgcmVzdWx0IG91dCBvZiBvcmRlcicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgndGltZW91dHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBiZWZvcmUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oZGVmYXVsdENhcHMpO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgnY29tbWFuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBleGlzdCBieSBkZWZhdWx0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuZXF1YWwoNjAwMDApO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBiZSBzZXR0YWJsZSB0aHJvdWdoIGB0aW1lb3V0c2AnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgZC50aW1lb3V0cygnY29tbWFuZCcsIDIwKTtcbiAgICAgICAgICBkLm5ld0NvbW1hbmRUaW1lb3V0TXMuc2hvdWxkLmVxdWFsKDIwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdpbXBsaWNpdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgZXhpc3QgYnkgZGVmYXVsdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYmUgc2V0dGFibGUgdGhyb3VnaCBgdGltZW91dHNgJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGF3YWl0IGQudGltZW91dHMoJ2ltcGxpY2l0JywgMjApO1xuICAgICAgICAgIGQuaW1wbGljaXRXYWl0TXMuc2hvdWxkLmVxdWFsKDIwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd0aW1lb3V0cyAoVzNDKScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGJlZm9yZUVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24obnVsbCwgbnVsbCwgdzNjQ2Fwcyk7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGQuZGVsZXRlU2Vzc2lvbigpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGdldCB0aW1lb3V0cyB0aGF0IHdlIHNldCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZC50aW1lb3V0cyh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIDEwMDApO1xuICAgICAgICBhd2FpdCBkLmdldFRpbWVvdXRzKCkuc2hvdWxkLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnaW1wbGljaXQnLCAxMDAwKTtcbiAgICAgICAgYXdhaXQgZC50aW1lb3V0cygnY29tbWFuZCcsIDIwMDApO1xuICAgICAgICBhd2FpdCBkLmdldFRpbWVvdXRzKCkuc2hvdWxkLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgaW1wbGljaXQ6IDEwMDAsXG4gICAgICAgICAgY29tbWFuZDogMjAwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGQudGltZW91dHModW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAzMDAwKTtcbiAgICAgICAgYXdhaXQgZC5nZXRUaW1lb3V0cygpLnNob3VsZC5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgIGltcGxpY2l0OiAzMDAwLFxuICAgICAgICAgIGNvbW1hbmQ6IDIwMDAsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgncmVzZXQgY29tcGF0aWJpbGl0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgbm90IGFsbG93IGJvdGggZnVsbFJlc2V0IGFuZCBub1Jlc2V0IHRvIGJlIHRydWUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBuZXdDYXBzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdENhcHMsIHtcbiAgICAgICAgICBmdWxsUmVzZXQ6IHRydWUsXG4gICAgICAgICAgbm9SZXNldDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKG5ld0NhcHMpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aChcbiAgICAgICAgICAgIC9ub1Jlc2V0LitmdWxsUmVzZXQvKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3Byb3h5aW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNlc3NJZDtcbiAgICAgIGJlZm9yZUVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBbc2Vzc0lkXSA9IGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCcjcHJveHlBY3RpdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgZXhpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5wcm94eUFjdGl2ZS5zaG91bGQuYmUuYW4uaW5zdGFuY2VvZihGdW5jdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkLnByb3h5QWN0aXZlKHNlc3NJZCkuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciB3aGVuIHNlc3Npb25JZCBpcyB3cm9uZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4geyBkLnByb3h5QWN0aXZlKCdhYWEnKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnI2dldFByb3h5QXZvaWRMaXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGV4aXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQuZ2V0UHJveHlBdm9pZExpc3Quc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gYXJyYXknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5nZXRQcm94eUF2b2lkTGlzdChzZXNzSWQpLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEFycmF5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiBzZXNzaW9uSWQgaXMgd3JvbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHsgZC5nZXRQcm94eUF2b2lkTGlzdCgnYWFhJyk7IH0pLnNob3VsZC50aHJvdztcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZGVzY3JpYmUoJyNjYW5Qcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBoYXZlIGEgI2NhblByb3h5IG1ldGhvZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkLmNhblByb3h5LnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGZyb20gI2NhblByb3h5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQuY2FuUHJveHkoc2Vzc0lkKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIHdoZW4gc2Vzc2lvbklkIGlzIHdyb25nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7IGQuY2FuUHJveHkoKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnI3Byb3h5Um91dGVJc0F2b2lkZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgZm9ybSBvZiBhdm9pZGFuY2UgbGlzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCBhdm9pZFN0dWIgPSBzaW5vbi5zdHViKGQsICdnZXRQcm94eUF2b2lkTGlzdCcpO1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXR1cm5zKFtbJ1BPU1QnLCAvXFwvZm9vL10sIFsnR0VUJ11dKTtcbiAgICAgICAgICAoKCkgPT4geyBkLnByb3h5Um91dGVJc0F2b2lkZWQoKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXR1cm5zKFtbJ1BPU1QnLCAvXFwvZm9vL10sIFsnR0VUJywgL15mb28vLCAnYmFyJ11dKTtcbiAgICAgICAgICAoKCkgPT4geyBkLnByb3h5Um91dGVJc0F2b2lkZWQoKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHJlamVjdCBiYWQgaHR0cCBtZXRob2RzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGF2b2lkU3R1YiA9IHNpbm9uLnN0dWIoZCwgJ2dldFByb3h5QXZvaWRMaXN0Jyk7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9eZm9vL10sIFsnQkFaRVRFJywgL15iYXIvXV0pO1xuICAgICAgICAgICgoKSA9PiB7IGQucHJveHlSb3V0ZUlzQXZvaWRlZCgpOyB9KS5zaG91bGQudGhyb3c7XG4gICAgICAgICAgYXZvaWRTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgcmVqZWN0IG5vbi1yZWdleCByb3V0ZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgYXZvaWRTdHViID0gc2lub24uc3R1YihkLCAnZ2V0UHJveHlBdm9pZExpc3QnKTtcbiAgICAgICAgICBhdm9pZFN0dWIucmV0dXJucyhbWydQT1NUJywgL15mb28vXSwgWydHRVQnLCAnL2JhciddXSk7XG4gICAgICAgICAgKCgpID0+IHsgZC5wcm94eVJvdXRlSXNBdm9pZGVkKCk7IH0pLnNob3VsZC50aHJvdztcbiAgICAgICAgICBhdm9pZFN0dWIucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSBmb3Igcm91dGVzIGluIHRoZSBhdm9pZCBsaXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGF2b2lkU3R1YiA9IHNpbm9uLnN0dWIoZCwgJ2dldFByb3h5QXZvaWRMaXN0Jyk7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9eXFwvZm9vL11dKTtcbiAgICAgICAgICBkLnByb3h5Um91dGVJc0F2b2lkZWQobnVsbCwgJ1BPU1QnLCAnL2Zvby9iYXInKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgICAgICBhdm9pZFN0dWIucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBzdHJpcCBhd2F5IGFueSB3ZC9odWIgcHJlZml4JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGF2b2lkU3R1YiA9IHNpbm9uLnN0dWIoZCwgJ2dldFByb3h5QXZvaWRMaXN0Jyk7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9eXFwvZm9vL11dKTtcbiAgICAgICAgICBkLnByb3h5Um91dGVJc0F2b2lkZWQobnVsbCwgJ1BPU1QnLCAnL3dkL2h1Yi9mb28vYmFyJykuc2hvdWxkLmJlLnRydWU7XG4gICAgICAgICAgYXZvaWRTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGZvciByb3V0ZXMgbm90IGluIHRoZSBhdm9pZCBsaXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGF2b2lkU3R1YiA9IHNpbm9uLnN0dWIoZCwgJ2dldFByb3h5QXZvaWRMaXN0Jyk7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9eXFwvZm9vL11dKTtcbiAgICAgICAgICBkLnByb3h5Um91dGVJc0F2b2lkZWQobnVsbCwgJ0dFVCcsICcvZm9vL2JhcicpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgICAgICBkLnByb3h5Um91dGVJc0F2b2lkZWQobnVsbCwgJ1BPU1QnLCAnL2JvbycpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgICAgICBhdm9pZFN0dWIucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2V2ZW50IHRpbWluZyBmcmFtZXdvcmsnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgYmVmb3JlU3RhcnRUaW1lO1xuICAgICAgYmVmb3JlRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJlZm9yZVN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGQuc2hvdWxkVmFsaWRhdGVDYXBzID0gZmFsc2U7XG4gICAgICAgIGF3YWl0IGQuZXhlY3V0ZUNvbW1hbmQoJ2NyZWF0ZVNlc3Npb24nLCBkZWZhdWx0Q2Fwcyk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCcjZXZlbnRIaXN0b3J5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGhhdmUgYW4gZXZlbnRIaXN0b3J5IHByb3BlcnR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNob3VsZC5leGlzdChkLmV2ZW50SGlzdG9yeSk7XG4gICAgICAgICAgc2hvdWxkLmV4aXN0KGQuZXZlbnRIaXN0b3J5LmNvbW1hbmRzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBoYXZlIGEgc2Vzc2lvbiBzdGFydCB0aW1pbmcgYWZ0ZXIgc2Vzc2lvbiBzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQge25ld1Nlc3Npb25SZXF1ZXN0ZWQsIG5ld1Nlc3Npb25TdGFydGVkfSA9IGQuZXZlbnRIaXN0b3J5O1xuICAgICAgICAgIG5ld1Nlc3Npb25SZXF1ZXN0ZWQuc2hvdWxkLmhhdmUubGVuZ3RoKDEpO1xuICAgICAgICAgIG5ld1Nlc3Npb25TdGFydGVkLnNob3VsZC5oYXZlLmxlbmd0aCgxKTtcbiAgICAgICAgICBuZXdTZXNzaW9uUmVxdWVzdGVkWzBdLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgICBuZXdTZXNzaW9uU3RhcnRlZFswXS5zaG91bGQuYmUuYSgnbnVtYmVyJyk7XG4gICAgICAgICAgKG5ld1Nlc3Npb25SZXF1ZXN0ZWRbMF0gPj0gYmVmb3JlU3RhcnRUaW1lKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgICAgICAobmV3U2Vzc2lvblN0YXJ0ZWRbMF0gPj0gbmV3U2Vzc2lvblJlcXVlc3RlZFswXSkuc2hvdWxkLmJlLnRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgaW5jbHVkZSBhIGNvbW1hbmRzIGxpc3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnZ2V0U3RhdHVzJywgW10pO1xuICAgICAgICAgIGQuZXZlbnRIaXN0b3J5LmNvbW1hbmRzLmxlbmd0aC5zaG91bGQuZXF1YWwoMik7XG4gICAgICAgICAgZC5ldmVudEhpc3RvcnkuY29tbWFuZHNbMV0uY21kLnNob3VsZC5lcXVhbCgnZ2V0U3RhdHVzJyk7XG4gICAgICAgICAgZC5ldmVudEhpc3RvcnkuY29tbWFuZHNbMV0uc3RhcnRUaW1lLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgICBkLmV2ZW50SGlzdG9yeS5jb21tYW5kc1sxXS5lbmRUaW1lLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCcjbG9nRXZlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgbG9nZ2luZyBhcmJpdHJhcnkgZXZlbnRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQubG9nRXZlbnQoJ2ZvbycpO1xuICAgICAgICAgIGQuZXZlbnRIaXN0b3J5LmZvb1swXS5zaG91bGQuYmUuYSgnbnVtYmVyJyk7XG4gICAgICAgICAgKGQuZXZlbnRIaXN0b3J5LmZvb1swXSA+PSBiZWZvcmVTdGFydFRpbWUpLnNob3VsZC5iZS50cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgcmVzZXJ2ZWQgb3Igb2RkbHkgZm9ybWVkIGV2ZW50IG5hbWVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBkLmxvZ0V2ZW50KCdjb21tYW5kcycpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBkLmxvZ0V2ZW50KDEpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBkLmxvZ0V2ZW50KHt9KTtcbiAgICAgICAgICB9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWxsb3cgbG9nZ2luZyB0aGUgc2FtZSBldmVudCBtdWx0aXBsZSB0aW1lcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5sb2dFdmVudCgnYmFyJyk7XG4gICAgICAgIGQubG9nRXZlbnQoJ2JhcicpO1xuICAgICAgICBkLmV2ZW50SGlzdG9yeS5iYXIuc2hvdWxkLmhhdmUubGVuZ3RoKDIpO1xuICAgICAgICBkLmV2ZW50SGlzdG9yeS5iYXJbMV0uc2hvdWxkLmJlLmEoJ251bWJlcicpO1xuICAgICAgICAoZC5ldmVudEhpc3RvcnkuYmFyWzFdID49IGQuZXZlbnRIaXN0b3J5LmJhclswXSkuc2hvdWxkLmJlLnRydWU7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdnZXRTZXNzaW9uIGRlY29yYXRpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgZGVjb3JhdGUgZ2V0U2Vzc2lvbiByZXNwb25zZSBpZiBvcHQtaW4gY2FwIGlzIHByb3ZpZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBkLmdldFNlc3Npb24oKTtcbiAgICAgICAgICBzaG91bGQubm90LmV4aXN0KHJlcy5ldmVudHMpO1xuXG4gICAgICAgICAgZC5jYXBzLmV2ZW50VGltaW5ncyA9IHRydWU7XG4gICAgICAgICAgcmVzID0gYXdhaXQgZC5nZXRTZXNzaW9uKCk7XG4gICAgICAgICAgc2hvdWxkLmV4aXN0KHJlcy5ldmVudHMpO1xuICAgICAgICAgIHNob3VsZC5leGlzdChyZXMuZXZlbnRzLm5ld1Nlc3Npb25SZXF1ZXN0ZWQpO1xuICAgICAgICAgIHJlcy5ldmVudHMubmV3U2Vzc2lvblJlcXVlc3RlZFswXS5zaG91bGQuYmUuYSgnbnVtYmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJy5yZXNldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgcmVzZXQgYXMgVzNDIGlmIHRoZSBvcmlnaW5hbCBzZXNzaW9uIHdhcyBXM0MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGNhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgICAgICAgIGFwcDogJ0Zha2UnLFxuICAgICAgICAgICAgZGV2aWNlTmFtZTogJ0Zha2UnLFxuICAgICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdGYWtlJyxcbiAgICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICAgIH0sIGRlZmF1bHRDYXBzKSxcbiAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24odW5kZWZpbmVkLCB1bmRlZmluZWQsIGNhcHMpO1xuICAgICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnVzNDJyk7XG4gICAgICAgIGF3YWl0IGQucmVzZXQoKTtcbiAgICAgICAgZC5wcm90b2NvbC5zaG91bGQuZXF1YWwoJ1czQycpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJlc2V0IGFzIE1KU09OV1AgaWYgdGhlIG9yaWdpbmFsIHNlc3Npb24gd2FzIE1KU09OV1AnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGNhcHMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICAgICAgYXBwOiAnRmFrZScsXG4gICAgICAgICAgZGV2aWNlTmFtZTogJ0Zha2UnLFxuICAgICAgICAgIGF1dG9tYXRpb25OYW1lOiAnRmFrZScsXG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnRmFrZScsXG4gICAgICAgIH0sIGRlZmF1bHRDYXBzKTtcbiAgICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGNhcHMpO1xuICAgICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnTUpTT05XUCcpO1xuICAgICAgICBhd2FpdCBkLnJlc2V0KCk7XG4gICAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdNSlNPTldQJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0RldmljZVNldHRpbmdzJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgbm90IGhvbGQgb24gdG8gcmVmZXJlbmNlIG9mIGRlZmF1bHRzIGluIGNvbnN0cnVjdG9yJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG9iaiA9IHtmb286ICdiYXInfTtcbiAgICAgIGxldCBkMSA9IG5ldyBEZXZpY2VTZXR0aW5ncyhvYmopO1xuICAgICAgbGV0IGQyID0gbmV3IERldmljZVNldHRpbmdzKG9iaik7XG4gICAgICBkMS5fc2V0dGluZ3MuZm9vID0gJ2Jheic7XG4gICAgICBkMS5fc2V0dGluZ3Muc2hvdWxkLm5vdC5lcWwoZDIuX3NldHRpbmdzKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJy5pc0ZlYXR1cmVFbmFibGVkJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGQgPSBuZXcgRHJpdmVyQ2xhc3MoKTtcblxuICAgIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBkLmRlbnlJbnNlY3VyZSA9IG51bGw7XG4gICAgICBkLmFsbG93SW5zZWN1cmUgPSBudWxsO1xuICAgICAgZC5yZWxheGVkU2VjdXJpdHlFbmFibGVkID0gbnVsbDtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2F5IGEgZmVhdHVyZSBpcyBlbmFibGVkIHdoZW4gaXQgaXMgZXhwbGljaXRseSBhbGxvd2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgZC5hbGxvd0luc2VjdXJlID0gWydmb28nLCAnYmFyJ107XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2ZvbycpLnNob3VsZC5iZS50cnVlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdiYXInKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmF6Jykuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzYXkgYSBmZWF0dXJlIGlzIG5vdCBlbmFibGVkIGlmIGl0IGlzIG5vdCBlbmFibGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgZC5hbGxvd0luc2VjdXJlID0gW107XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2ZvbycpLnNob3VsZC5iZS5mYWxzZTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJlZmVyIGRlbnlJbnNlY3VyZSB0byBhbGxvd0luc2VjdXJlJywgZnVuY3Rpb24gKCkge1xuICAgICAgZC5hbGxvd0luc2VjdXJlID0gWydmb28nLCAnYmFyJ107XG4gICAgICBkLmRlbnlJbnNlY3VyZSA9IFsnZm9vJ107XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2ZvbycpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmFyJykuc2hvdWxkLmJlLnRydWU7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2JheicpLnNob3VsZC5iZS5mYWxzZTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZ2xvYmFsIHNldHRpbmcgZm9yIGluc2VjdXJpdHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLnJlbGF4ZWRTZWN1cml0eUVuYWJsZWQgPSB0cnVlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdmb28nKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmFyJykuc2hvdWxkLmJlLnRydWU7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2JheicpLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuXG4gICAgaXQoJ2dsb2JhbCBzZXR0aW5nIHNob3VsZCBiZSBvdmVycmlkZWFibGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLnJlbGF4ZWRTZWN1cml0eUVuYWJsZWQgPSB0cnVlO1xuICAgICAgZC5kZW55SW5zZWN1cmUgPSBbJ2ZvbycsICdiYXInXTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnZm9vJykuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdiYXInKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2JheicpLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZURyaXZlclVuaXRUZXN0cztcbiJdLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2RyaXZlci10ZXN0cy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
