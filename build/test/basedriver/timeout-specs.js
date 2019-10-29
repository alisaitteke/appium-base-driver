"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _ = _interopRequireDefault(require("../.."));

var _sinon = _interopRequireDefault(require("sinon"));

_chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('timeout', function () {
  let driver = new _.default();
  let implicitWaitSpy, newCommandTimeoutSpy;
  before(function () {
    implicitWaitSpy = _sinon.default.spy(driver, 'setImplicitWait');
    newCommandTimeoutSpy = _sinon.default.spy(driver, 'setNewCommandTimeout');
  });
  beforeEach(function () {
    driver.implicitWaitMs = 0;
  });
  afterEach(function () {
    implicitWaitSpy.resetHistory();
    newCommandTimeoutSpy.resetHistory();
  });
  describe('timeouts', function () {
    describe('errors', function () {
      it('should throw an error if something random is sent', async function () {
        await driver.timeouts('random timeout', 'howdy').should.eventually.be.rejected;
      });
      it('should throw an error if timeout is negative', async function () {
        await driver.timeouts('random timeout', -42).should.eventually.be.rejected;
      });
      it('should throw an errors if timeout type is unknown', async function () {
        await driver.timeouts('random timeout', 42).should.eventually.be.rejected;
      });
      it('should throw an error if something random is sent to scriptDuration', async function () {
        await driver.timeouts(undefined, undefined, 123, undefined, undefined).should.eventually.be.rejected;
      });
      it('should throw an error if something random is sent to pageLoadDuration', async function () {
        await driver.timeouts(undefined, undefined, undefined, 123, undefined).should.eventually.be.rejected;
      });
    });
    describe('implicit wait', function () {
      it('should call setImplicitWait when given an integer', async function () {
        await driver.timeouts('implicit', 42);
        implicitWaitSpy.calledOnce.should.be.true;
        implicitWaitSpy.firstCall.args[0].should.equal(42);
        driver.implicitWaitMs.should.eql(42);
      });
      it('should call setImplicitWait when given a string', async function () {
        await driver.timeouts('implicit', '42');
        implicitWaitSpy.calledOnce.should.be.true;
        implicitWaitSpy.firstCall.args[0].should.equal(42);
        driver.implicitWaitMs.should.eql(42);
      });
      it('should call setImplicitWait when given an integer to implicitDuration', async function () {
        await driver.timeouts(undefined, undefined, undefined, undefined, 42);
        implicitWaitSpy.calledOnce.should.be.true;
        implicitWaitSpy.firstCall.args[0].should.equal(42);
        driver.implicitWaitMs.should.eql(42);
      });
      it('should call setImplicitWait when given a string to implicitDuration', async function () {
        await driver.timeouts(undefined, undefined, undefined, undefined, '42');
        implicitWaitSpy.calledOnce.should.be.true;
        implicitWaitSpy.firstCall.args[0].should.equal(42);
        driver.implicitWaitMs.should.eql(42);
      });
    });
  });
  describe('implicitWait', function () {
    it('should call setImplicitWait when given an integer', async function () {
      await driver.implicitWait(42);
      implicitWaitSpy.calledOnce.should.be.true;
      implicitWaitSpy.firstCall.args[0].should.equal(42);
      driver.implicitWaitMs.should.eql(42);
    });
    it('should call setImplicitWait when given a string', async function () {
      await driver.implicitWait('42');
      implicitWaitSpy.calledOnce.should.be.true;
      implicitWaitSpy.firstCall.args[0].should.equal(42);
      driver.implicitWaitMs.should.eql(42);
    });
    it('should throw an error if something random is sent', async function () {
      await driver.implicitWait('howdy').should.eventually.be.rejected;
    });
    it('should throw an error if timeout is negative', async function () {
      await driver.implicitWait(-42).should.eventually.be.rejected;
    });
  });
  describe('set implicit wait', function () {
    it('should set the implicit wait with an integer', function () {
      driver.setImplicitWait(42);
      driver.implicitWaitMs.should.eql(42);
    });
    describe('with managed driver', function () {
      let managedDriver1 = new _.default();
      let managedDriver2 = new _.default();
      before(function () {
        driver.addManagedDriver(managedDriver1);
        driver.addManagedDriver(managedDriver2);
      });
      after(function () {
        driver.managedDrivers = [];
      });
      it('should set the implicit wait on managed drivers', function () {
        driver.setImplicitWait(42);
        driver.implicitWaitMs.should.eql(42);
        managedDriver1.implicitWaitMs.should.eql(42);
        managedDriver2.implicitWaitMs.should.eql(42);
      });
    });
  });
  describe('set new command timeout', function () {
    it('should set the new command timeout with an integer', function () {
      driver.setNewCommandTimeout(42);
      driver.newCommandTimeoutMs.should.eql(42);
    });
    describe('with managed driver', function () {
      let managedDriver1 = new _.default();
      let managedDriver2 = new _.default();
      before(function () {
        driver.addManagedDriver(managedDriver1);
        driver.addManagedDriver(managedDriver2);
      });
      after(function () {
        driver.managedDrivers = [];
      });
      it('should set the new command timeout on managed drivers', function () {
        driver.setNewCommandTimeout(42);
        driver.newCommandTimeoutMs.should.eql(42);
        managedDriver1.newCommandTimeoutMs.should.eql(42);
        managedDriver2.newCommandTimeoutMs.should.eql(42);
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvYmFzZWRyaXZlci90aW1lb3V0LXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwiZHJpdmVyIiwiQmFzZURyaXZlciIsImltcGxpY2l0V2FpdFNweSIsIm5ld0NvbW1hbmRUaW1lb3V0U3B5IiwiYmVmb3JlIiwic2lub24iLCJzcHkiLCJiZWZvcmVFYWNoIiwiaW1wbGljaXRXYWl0TXMiLCJhZnRlckVhY2giLCJyZXNldEhpc3RvcnkiLCJpdCIsInRpbWVvdXRzIiwiZXZlbnR1YWxseSIsImJlIiwicmVqZWN0ZWQiLCJ1bmRlZmluZWQiLCJjYWxsZWRPbmNlIiwidHJ1ZSIsImZpcnN0Q2FsbCIsImFyZ3MiLCJlcXVhbCIsImVxbCIsImltcGxpY2l0V2FpdCIsInNldEltcGxpY2l0V2FpdCIsIm1hbmFnZWREcml2ZXIxIiwibWFuYWdlZERyaXZlcjIiLCJhZGRNYW5hZ2VkRHJpdmVyIiwiYWZ0ZXIiLCJtYW5hZ2VkRHJpdmVycyIsInNldE5ld0NvbW1hbmRUaW1lb3V0IiwibmV3Q29tbWFuZFRpbWVvdXRNcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0FBLGNBQUtDLE1BQUw7O0FBQ0FELGNBQUtFLEdBQUwsQ0FBU0MsdUJBQVQ7O0FBR0FDLFFBQVEsQ0FBQyxTQUFELEVBQVksWUFBWTtBQUM5QixNQUFJQyxNQUFNLEdBQUcsSUFBSUMsU0FBSixFQUFiO0FBQ0EsTUFBSUMsZUFBSixFQUFxQkMsb0JBQXJCO0FBQ0FDLEVBQUFBLE1BQU0sQ0FBQyxZQUFZO0FBQ2pCRixJQUFBQSxlQUFlLEdBQUdHLGVBQU1DLEdBQU4sQ0FBVU4sTUFBVixFQUFrQixpQkFBbEIsQ0FBbEI7QUFDQUcsSUFBQUEsb0JBQW9CLEdBQUdFLGVBQU1DLEdBQU4sQ0FBVU4sTUFBVixFQUFrQixzQkFBbEIsQ0FBdkI7QUFDRCxHQUhLLENBQU47QUFJQU8sRUFB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QUFBLGNBQWMsQ0FBQ0ssbUJBQWYsQ0FBbUNuQyxNQUFuQyxDQUEwQzBCLEdBQTFDLENBQThDLEVBQTlDO0FBQ0QsT0FMQyxDQUFGO0FBTUQsS0FoQk8sQ0FBUjtBQWlCRCxHQXRCTyxDQUFSO0FBdUJELENBOUhPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCYXNlRHJpdmVyIGZyb20gJy4uLy4uJztcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbic7XG5cblxuY2hhaS5zaG91bGQoKTtcbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcblxuXG5kZXNjcmliZSgndGltZW91dCcsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IGRyaXZlciA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gIGxldCBpbXBsaWNpdFdhaXRTcHksIG5ld0NvbW1hbmRUaW1lb3V0U3B5O1xuICBiZWZvcmUoZnVuY3Rpb24gKCkge1xuICAgIGltcGxpY2l0V2FpdFNweSA9IHNpbm9uLnNweShkcml2ZXIsICdzZXRJbXBsaWNpdFdhaXQnKTtcbiAgICBuZXdDb21tYW5kVGltZW91dFNweSA9IHNpbm9uLnNweShkcml2ZXIsICdzZXROZXdDb21tYW5kVGltZW91dCcpO1xuICB9KTtcbiAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zID0gMDtcbiAgfSk7XG4gIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgaW1wbGljaXRXYWl0U3B5LnJlc2V0SGlzdG9yeSgpO1xuICAgIG5ld0NvbW1hbmRUaW1lb3V0U3B5LnJlc2V0SGlzdG9yeSgpO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3RpbWVvdXRzJywgZnVuY3Rpb24gKCkge1xuICAgIGRlc2NyaWJlKCdlcnJvcnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHNvbWV0aGluZyByYW5kb20gaXMgc2VudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZHJpdmVyLnRpbWVvdXRzKCdyYW5kb20gdGltZW91dCcsICdob3dkeScpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRpbWVvdXQgaXMgbmVnYXRpdmUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGRyaXZlci50aW1lb3V0cygncmFuZG9tIHRpbWVvdXQnLCAtNDIpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9ycyBpZiB0aW1lb3V0IHR5cGUgaXMgdW5rbm93bicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZHJpdmVyLnRpbWVvdXRzKCdyYW5kb20gdGltZW91dCcsIDQyKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBzb21ldGhpbmcgcmFuZG9tIGlzIHNlbnQgdG8gc2NyaXB0RHVyYXRpb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGRyaXZlci50aW1lb3V0cyh1bmRlZmluZWQsIHVuZGVmaW5lZCwgMTIzLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgc29tZXRoaW5nIHJhbmRvbSBpcyBzZW50IHRvIHBhZ2VMb2FkRHVyYXRpb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGRyaXZlci50aW1lb3V0cyh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAxMjMsIHVuZGVmaW5lZCkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnaW1wbGljaXQgd2FpdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzZXRJbXBsaWNpdFdhaXQgd2hlbiBnaXZlbiBhbiBpbnRlZ2VyJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkcml2ZXIudGltZW91dHMoJ2ltcGxpY2l0JywgNDIpO1xuICAgICAgICBpbXBsaWNpdFdhaXRTcHkuY2FsbGVkT25jZS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgICAgaW1wbGljaXRXYWl0U3B5LmZpcnN0Q2FsbC5hcmdzWzBdLnNob3VsZC5lcXVhbCg0Mik7XG4gICAgICAgIGRyaXZlci5pbXBsaWNpdFdhaXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNldEltcGxpY2l0V2FpdCB3aGVuIGdpdmVuIGEgc3RyaW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkcml2ZXIudGltZW91dHMoJ2ltcGxpY2l0JywgJzQyJyk7XG4gICAgICAgIGltcGxpY2l0V2FpdFNweS5jYWxsZWRPbmNlLnNob3VsZC5iZS50cnVlO1xuICAgICAgICBpbXBsaWNpdFdhaXRTcHkuZmlyc3RDYWxsLmFyZ3NbMF0uc2hvdWxkLmVxdWFsKDQyKTtcbiAgICAgICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2V0SW1wbGljaXRXYWl0IHdoZW4gZ2l2ZW4gYW4gaW50ZWdlciB0byBpbXBsaWNpdER1cmF0aW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkcml2ZXIudGltZW91dHModW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCA0Mik7XG4gICAgICAgIGltcGxpY2l0V2FpdFNweS5jYWxsZWRPbmNlLnNob3VsZC5iZS50cnVlO1xuICAgICAgICBpbXBsaWNpdFdhaXRTcHkuZmlyc3RDYWxsLmFyZ3NbMF0uc2hvdWxkLmVxdWFsKDQyKTtcbiAgICAgICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2V0SW1wbGljaXRXYWl0IHdoZW4gZ2l2ZW4gYSBzdHJpbmcgdG8gaW1wbGljaXREdXJhdGlvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZHJpdmVyLnRpbWVvdXRzKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgJzQyJyk7XG4gICAgICAgIGltcGxpY2l0V2FpdFNweS5jYWxsZWRPbmNlLnNob3VsZC5iZS50cnVlO1xuICAgICAgICBpbXBsaWNpdFdhaXRTcHkuZmlyc3RDYWxsLmFyZ3NbMF0uc2hvdWxkLmVxdWFsKDQyKTtcbiAgICAgICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnaW1wbGljaXRXYWl0JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgY2FsbCBzZXRJbXBsaWNpdFdhaXQgd2hlbiBnaXZlbiBhbiBpbnRlZ2VyJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgZHJpdmVyLmltcGxpY2l0V2FpdCg0Mik7XG4gICAgICBpbXBsaWNpdFdhaXRTcHkuY2FsbGVkT25jZS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGltcGxpY2l0V2FpdFNweS5maXJzdENhbGwuYXJnc1swXS5zaG91bGQuZXF1YWwoNDIpO1xuICAgICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBzZXRJbXBsaWNpdFdhaXQgd2hlbiBnaXZlbiBhIHN0cmluZycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGRyaXZlci5pbXBsaWNpdFdhaXQoJzQyJyk7XG4gICAgICBpbXBsaWNpdFdhaXRTcHkuY2FsbGVkT25jZS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGltcGxpY2l0V2FpdFNweS5maXJzdENhbGwuYXJnc1swXS5zaG91bGQuZXF1YWwoNDIpO1xuICAgICAgZHJpdmVyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgc29tZXRoaW5nIHJhbmRvbSBpcyBzZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgZHJpdmVyLmltcGxpY2l0V2FpdCgnaG93ZHknKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRpbWVvdXQgaXMgbmVnYXRpdmUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBkcml2ZXIuaW1wbGljaXRXYWl0KC00Mikuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZXQgaW1wbGljaXQgd2FpdCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIHNldCB0aGUgaW1wbGljaXQgd2FpdCB3aXRoIGFuIGludGVnZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIuc2V0SW1wbGljaXRXYWl0KDQyKTtcbiAgICAgIGRyaXZlci5pbXBsaWNpdFdhaXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnd2l0aCBtYW5hZ2VkIGRyaXZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBtYW5hZ2VkRHJpdmVyMSA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgICBsZXQgbWFuYWdlZERyaXZlcjIgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZHJpdmVyLmFkZE1hbmFnZWREcml2ZXIobWFuYWdlZERyaXZlcjEpO1xuICAgICAgICBkcml2ZXIuYWRkTWFuYWdlZERyaXZlcihtYW5hZ2VkRHJpdmVyMik7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZHJpdmVyLm1hbmFnZWREcml2ZXJzID0gW107XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc2V0IHRoZSBpbXBsaWNpdCB3YWl0IG9uIG1hbmFnZWQgZHJpdmVycycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZHJpdmVyLnNldEltcGxpY2l0V2FpdCg0Mik7XG4gICAgICAgIGRyaXZlci5pbXBsaWNpdFdhaXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICAgICAgbWFuYWdlZERyaXZlcjEuaW1wbGljaXRXYWl0TXMuc2hvdWxkLmVxbCg0Mik7XG4gICAgICAgIG1hbmFnZWREcml2ZXIyLmltcGxpY2l0V2FpdE1zLnNob3VsZC5lcWwoNDIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnc2V0IG5ldyBjb21tYW5kIHRpbWVvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBzZXQgdGhlIG5ldyBjb21tYW5kIHRpbWVvdXQgd2l0aCBhbiBpbnRlZ2VyJywgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnNldE5ld0NvbW1hbmRUaW1lb3V0KDQyKTtcbiAgICAgIGRyaXZlci5uZXdDb21tYW5kVGltZW91dE1zLnNob3VsZC5lcWwoNDIpO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCd3aXRoIG1hbmFnZWQgZHJpdmVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG1hbmFnZWREcml2ZXIxID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICAgIGxldCBtYW5hZ2VkRHJpdmVyMiA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgICBiZWZvcmUoZnVuY3Rpb24gKCkge1xuICAgICAgICBkcml2ZXIuYWRkTWFuYWdlZERyaXZlcihtYW5hZ2VkRHJpdmVyMSk7XG4gICAgICAgIGRyaXZlci5hZGRNYW5hZ2VkRHJpdmVyKG1hbmFnZWREcml2ZXIyKTtcbiAgICAgIH0pO1xuICAgICAgYWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBkcml2ZXIubWFuYWdlZERyaXZlcnMgPSBbXTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzZXQgdGhlIG5ldyBjb21tYW5kIHRpbWVvdXQgb24gbWFuYWdlZCBkcml2ZXJzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBkcml2ZXIuc2V0TmV3Q29tbWFuZFRpbWVvdXQoNDIpO1xuICAgICAgICBkcml2ZXIubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICAgICAgbWFuYWdlZERyaXZlcjEubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICAgICAgbWFuYWdlZERyaXZlcjIubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuZXFsKDQyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L2Jhc2Vkcml2ZXIvdGltZW91dC1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
