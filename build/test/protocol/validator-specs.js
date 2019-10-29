"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _validators = require("../../lib/protocol/validators");

var _chai = _interopRequireDefault(require("chai"));

_chai.default.should();

describe('Protocol', function () {
  describe('direct to driver', function () {
    describe('setUrl', function () {
      it('should fail when no url passed', function () {
        (() => {
          _validators.validators.setUrl();
        }).should.throw(/url/i);
      });
      it('should fail when given invalid url', function () {
        (() => {
          _validators.validators.setUrl('foo');
        }).should.throw(/url/i);
      });
      it('should succeed when given url starting with http', function () {
        (() => {
          _validators.validators.setUrl('http://appium.io');
        }).should.not.throw();
      });
      it('should succeed when given an android-like scheme', function () {
        (() => {
          _validators.validators.setUrl('content://contacts/people/1');
        }).should.not.throw();
      });
      it('should succeed with hyphens dots and plus chars in the scheme', function () {
        (() => {
          _validators.validators.setUrl('my-app.a+b://login');
        }).should.not.throw();
      });
      it('should succeed when given an about scheme', function () {
        (() => {
          _validators.validators.setUrl('about:blank');
        }).should.not.throw();
      });
      it('should succeed when given a data scheme', function () {
        (() => {
          _validators.validators.setUrl('data:text/html,<html></html>');
        }).should.not.throw();
      });
    });
    describe('implicitWait', function () {
      it('should fail when given no ms', function () {
        (() => {
          _validators.validators.implicitWait();
        }).should.throw(/ms/i);
      });
      it('should fail when given a non-numeric ms', function () {
        (() => {
          _validators.validators.implicitWait('five');
        }).should.throw(/ms/i);
      });
      it('should fail when given a negative ms', function () {
        (() => {
          _validators.validators.implicitWait(-1);
        }).should.throw(/ms/i);
      });
      it('should succeed when given an ms of 0', function () {
        (() => {
          _validators.validators.implicitWait(0);
        }).should.not.throw();
      });
      it('should succeed when given an ms greater than 0', function () {
        (() => {
          _validators.validators.implicitWait(100);
        }).should.not.throw();
      });
    });
    describe('asyncScriptTimeout', function () {
      it('should fail when given no ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout();
        }).should.throw(/ms/i);
      });
      it('should fail when given a non-numeric ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout('five');
        }).should.throw(/ms/i);
      });
      it('should fail when given a negative ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(-1);
        }).should.throw(/ms/i);
      });
      it('should succeed when given an ms of 0', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(0);
        }).should.not.throw();
      });
      it('should succeed when given an ms greater than 0', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(100);
        }).should.not.throw();
      });
    });
    describe('clickCurrent', function () {
      it('should fail when given an invalid button', function () {
        (() => {
          _validators.validators.clickCurrent(4);
        }).should.throw(/0, 1, or 2/i);
      });
      it('should succeed when given a valid button', function () {
        (() => {
          _validators.validators.clickCurrent(0);
        }).should.not.throw();
        (() => {
          _validators.validators.clickCurrent(1);
        }).should.not.throw();
        (() => {
          _validators.validators.clickCurrent(2);
        }).should.not.throw();
      });
    });
    describe('setNetworkConnection', function () {
      it('should fail when given no type', function () {
        (() => {
          _validators.validators.setNetworkConnection();
        }).should.throw(/0, 1, 2, 4, 6/i);
      });
      it('should fail when given an invalid type', function () {
        (() => {
          _validators.validators.setNetworkConnection(8);
        }).should.throw(/0, 1, 2, 4, 6/i);
      });
      it('should succeed when given a valid type', function () {
        (() => {
          _validators.validators.setNetworkConnection(0);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(1);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(2);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(4);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(6);
        }).should.not.throw();
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcHJvdG9jb2wvdmFsaWRhdG9yLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJkZXNjcmliZSIsIml0IiwidmFsaWRhdG9ycyIsInNldFVybCIsInRocm93Iiwibm90IiwiaW1wbGljaXRXYWl0IiwiYXN5bmNTY3JpcHRUaW1lb3V0IiwiY2xpY2tDdXJyZW50Iiwic2V0TmV0d29ya0Nvbm5lY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUdBQSxjQUFLQyxNQUFMOztBQUVBQyxRQUFRLENBQUMsVUFBRCxFQUFhLFlBQVk7QUFDL0JBLEVBQUFBLFFBQVEsQ0FBQyxrQkFBRCxFQUFxQixZQUFZO0FBRXZDQSxJQUFBQSxRQUFRLENBQUMsUUFBRCxFQUFXLFlBQVk7QUFDN0JDLE1BQUFBLEVBQUUsQ0FBQyxnQ0FBRCxFQUFtQyxZQUFZO0FBQy9DLFNBQUMsTUFBTTtBQUFDQyxpQ0FBV0MsTUFBWDtBQUFxQixTQUE3QixFQUErQkosTUFBL0IsQ0FBc0NLLEtBQXRDLENBQTRDLE1BQTVDO0FBQ0QsT0FGQyxDQUFGO0FBR0FILE1BQUFBLEVBQUUsQ0FBQyxvQ0FBRCxFQUF1QyxZQUFZO0FBQ25ELFNBQUMsTUFBTTtBQUFDQyxpQ0FBV0MsTUFBWCxDQUFrQixLQUFsQjtBQUEwQixTQUFsQyxFQUFvQ0osTUFBcEMsQ0FBMkNLLEtBQTNDLENBQWlELE1BQWpEO0FBQ0QsT0FGQyxDQUFGO0FBR0FILE1BQUFBLEVBQUUsQ0FBQyxrREFBRCxFQUFxRCxZQUFZO0FBQ2pFLFNBQUMsTUFBTTtBQUFDQyxpQ0FBV0MsTUFBWCxDQUFrQixrQkFBbEI7QUFBdUMsU0FBL0MsRUFBaURKLE1BQWpELENBQXdETSxHQUF4RCxDQUE0REQsS0FBNUQ7QUFDRCxPQUZDLENBQUY7QUFHQUgsTUFBQUEsRUFBRSxDQUFDLGtEQUFELEVBQXFELFlBQVk7QUFDakUsU0FBQyxNQUFNO0FBQUNDLGlDQUFXQyxNQUFYLENBQWtCLDZCQUFsQjtBQUFr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dEZPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHsgdmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL2xpYi9wcm90b2NvbC92YWxpZGF0b3JzJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuXG5cbmNoYWkuc2hvdWxkKCk7XG5cbmRlc2NyaWJlKCdQcm90b2NvbCcsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ2RpcmVjdCB0byBkcml2ZXInLCBmdW5jdGlvbiAoKSB7XG5cbiAgICBkZXNjcmliZSgnc2V0VXJsJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gbm8gdXJsIHBhc3NlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldFVybCgpO30pLnNob3VsZC50aHJvdygvdXJsL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBpbnZhbGlkIHVybCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldFVybCgnZm9vJyk7fSkuc2hvdWxkLnRocm93KC91cmwvaSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aGVuIGdpdmVuIHVybCBzdGFydGluZyB3aXRoIGh0dHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ2h0dHA6Ly9hcHBpdW0uaW8nKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aGVuIGdpdmVuIGFuIGFuZHJvaWQtbGlrZSBzY2hlbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ2NvbnRlbnQ6Ly9jb250YWN0cy9wZW9wbGUvMScpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdpdGggaHlwaGVucyBkb3RzIGFuZCBwbHVzIGNoYXJzIGluIHRoZSBzY2hlbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ215LWFwcC5hK2I6Ly9sb2dpbicpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gYWJvdXQgc2NoZW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0VXJsKCdhYm91dDpibGFuaycpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSBkYXRhIHNjaGVtZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldFVybCgnZGF0YTp0ZXh0L2h0bWwsPGh0bWw+PC9odG1sPicpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdpbXBsaWNpdFdhaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBubyBtcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmltcGxpY2l0V2FpdCgpO30pLnNob3VsZC50aHJvdygvbXMvaSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGEgbm9uLW51bWVyaWMgbXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5pbXBsaWNpdFdhaXQoJ2ZpdmUnKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBhIG5lZ2F0aXZlIG1zJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuaW1wbGljaXRXYWl0KC0xKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgd2hlbiBnaXZlbiBhbiBtcyBvZiAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuaW1wbGljaXRXYWl0KDApO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gbXMgZ3JlYXRlciB0aGFuIDAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5pbXBsaWNpdFdhaXQoMTAwKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnYXN5bmNTY3JpcHRUaW1lb3V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gZ2l2ZW4gbm8gbXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5hc3luY1NjcmlwdFRpbWVvdXQoKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBhIG5vbi1udW1lcmljIG1zJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuYXN5bmNTY3JpcHRUaW1lb3V0KCdmaXZlJyk7fSkuc2hvdWxkLnRocm93KC9tcy9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gZ2l2ZW4gYSBuZWdhdGl2ZSBtcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmFzeW5jU2NyaXB0VGltZW91dCgtMSk7fSkuc2hvdWxkLnRocm93KC9tcy9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gbXMgb2YgMCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmFzeW5jU2NyaXB0VGltZW91dCgwKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aGVuIGdpdmVuIGFuIG1zIGdyZWF0ZXIgdGhhbiAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuYXN5bmNTY3JpcHRUaW1lb3V0KDEwMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2NsaWNrQ3VycmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGFuIGludmFsaWQgYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuY2xpY2tDdXJyZW50KDQpO30pLnNob3VsZC50aHJvdygvMCwgMSwgb3IgMi9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSB2YWxpZCBidXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5jbGlja0N1cnJlbnQoMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuY2xpY2tDdXJyZW50KDEpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmNsaWNrQ3VycmVudCgyKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc2V0TmV0d29ya0Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBubyB0eXBlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oKTt9KS5zaG91bGQudGhyb3coLzAsIDEsIDIsIDQsIDYvaSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGFuIGludmFsaWQgdHlwZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldE5ldHdvcmtDb25uZWN0aW9uKDgpO30pLnNob3VsZC50aHJvdygvMCwgMSwgMiwgNCwgNi9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSB2YWxpZCB0eXBlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMSk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMik7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oNCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oNik7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwiZmlsZSI6InRlc3QvcHJvdG9jb2wvdmFsaWRhdG9yLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
