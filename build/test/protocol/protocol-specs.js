"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

require("../..");

var _chai = _interopRequireDefault(require("chai"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _protocol = require("../../lib/protocol/protocol");

var _driver = _interopRequireDefault(require("../../lib/basedriver/driver"));

_chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('Protocol', function () {
  describe('#driverShouldDoJwpProxy', function () {
    it('should not proxy if an image element is found in request url', function () {
      const d = new _driver.default();

      _sinon.default.stub(d, 'proxyActive').returns(true);

      _sinon.default.stub(d, 'proxyRouteIsAvoided').returns(false);

      const hasImageElements = [`/wd/hub/session/:sessionId/element/${_protocol.IMAGE_ELEMENT_PREFIX}bar`, `/wd/hub/session/:sessionId/element/${_protocol.IMAGE_ELEMENT_PREFIX}bar/click`, `/wd/hub/session/:sessionId/element/${_protocol.IMAGE_ELEMENT_PREFIX}bar/submit`, `/wd/hub/session/:sessionId/screenshot/${_protocol.IMAGE_ELEMENT_PREFIX}bar`];
      const noImageElements = [`/wd/hub/session/:sessionId/element/${_protocol.IMAGE_ELEMENT_PREFIX}`, `/wd/hub/session/:sessionId/screenshot/${_protocol.IMAGE_ELEMENT_PREFIX}`, `/wd/hub/session/:sessionId/element/bar${_protocol.IMAGE_ELEMENT_PREFIX}`, '/wd/hub/session/:sessionId/element/element123', '/wd/hub/session/:sessionId/title', `/wd/hub/session/:sessionId/notelement/${_protocol.IMAGE_ELEMENT_PREFIX}bar`];

      for (let testCase of hasImageElements) {
        const req = {
          body: {},
          params: {},
          originalUrl: testCase
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.false;
      }

      for (let testCase of noImageElements) {
        const req = {
          body: {},
          params: {},
          originalUrl: testCase
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.true;
      }
    });
    it('should not proxy if an image element is found in request body', function () {
      const d = new _driver.default();

      _sinon.default.stub(d, 'proxyActive').returns(true);

      _sinon.default.stub(d, 'proxyRouteIsAvoided').returns(false);

      const hasImageElements = [{
        [_protocol.W3C_ELEMENT_KEY]: `${_protocol.IMAGE_ELEMENT_PREFIX}bar`
      }, {
        [_protocol.W3C_ELEMENT_KEY]: `${_protocol.IMAGE_ELEMENT_PREFIX}foo`
      }, {
        [_protocol.MJSONWP_ELEMENT_KEY]: `${_protocol.IMAGE_ELEMENT_PREFIX}bar`
      }];
      const noImageElements = [{
        [_protocol.IMAGE_ELEMENT_PREFIX]: 'foo'
      }, {
        [_protocol.W3C_ELEMENT_KEY]: `${_protocol.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_protocol.MJSONWP_ELEMENT_KEY]: `${_protocol.IMAGE_ELEMENT_PREFIX}`
      }, {
        foo: 'bar'
      }, {
        [_protocol.W3C_ELEMENT_KEY]: 'bar'
      }, {
        [_protocol.MJSONWP_ELEMENT_KEY]: 'bar'
      }, {
        foo: `${_protocol.IMAGE_ELEMENT_PREFIX}bar`
      }, {
        foo: `bar${_protocol.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_protocol.W3C_ELEMENT_KEY]: `bar${_protocol.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_protocol.MJSONWP_ELEMENT_KEY]: `bar${_protocol.IMAGE_ELEMENT_PREFIX}`
      }];

      for (let testCase of hasImageElements) {
        const req = {
          body: testCase,
          params: {}
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.false;
      }

      for (let testCase of noImageElements) {
        const req = {
          body: testCase,
          params: {}
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.true;
      }
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcHJvdG9jb2wvcHJvdG9jb2wtc3BlY3MuanMiXSwibmFtZXMiOlsiY2hhaSIsInNob3VsZCIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwiZGVzY3JpYmUiLCJpdCIsImQiLCJCYXNlRHJpdmVyIiwic2lub24iLCJzdHViIiwicmV0dXJucyIsImhhc0ltYWdlRWxlbWVudHMiLCJJTUFHRV9FTEVNRU5UX1BSRUZJWCIsIm5vSW1hZ2VFbGVtZW50cyIsInRlc3RDYXNlIiwicmVxIiwiYm9keSIsInBhcmFtcyIsIm9yaWdpbmFsVXJsIiwiYmUiLCJmYWxzZSIsInRydWUiLCJXM0NfRUxFTUVOVF9LRVkiLCJNSlNPTldQX0VMRU1FTlRfS0VZIiwiZm9vIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQUEsY0FBS0MsTUFBTDs7QUFDQUQsY0FBS0UsR0FBTCxDQUFTQyx1QkFBVDs7QUFFQUMsUUFBUSxDQUFDLFVBQUQsRUFBYSxZQUFZO0FBRS9CQSxFQUFBQSxRQUFRLENBQUMseUJBQUQsRUFBNEIsWUFBWTtBQUM5Q0MsSUFBQUEsRUFBRSxDQUFDLDhEQUFELEVBQWlFLFlBQVk7QUFDN0UsWUFBTUMsQ0FBQyxHQUFHLElBQUlDLGVBQUosRUFBVjs7QUFDQUMscUJBQU1DLElBQU4sQ0FBV0gsQ0FBWCxFQUFjLGFBQWQsRUFBNkJJLE9BQTdCLENBQXFDLElBQXJDOztBQUNBRixxQkFBTUMsSUFBTixDQUFXSCxDQUFYLEVBQWMscUJBQWQsRUFBcUNJLE9BQXJDLENBQTZDLEtBQTdDOztBQUNBLFlBQU1DLGdCQUFnQixHQUFHLENBQ3RCLHNDQUFxQ0MsOEJBQXFCLEtBRHBDLEVBRXRCLHNDQUFxQ0EsOEJBQXFCLFdBRnBDLEVBR3RCLHNDQUFxQ0EsOEJBQXFCLFlBSHBDLEVBSXRCLHlDQUF3Q0EsOEJBQXFCLEtBSnZDLENBQXpCO0FBTUEsWUFBTUMsZUFBZSxHQUFHLENBQ3JCLHNDQUFxQ0QsOEJBQXFC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QU1FLEdBQUcsR0FBRztBQUFDQyxVQUFBQSxJQUFJLEVBQUVGLFFBQVA7QUFBaUJHLFVBQUFBLE1BQU0sRUFBRTtBQUF6QixTQUFaO0FBQ0EsOENBQXVCWCxDQUF2QixFQUEwQlMsR0FBMUIsRUFBK0IsSUFBL0IsRUFBcUNkLE1BQXJDLENBQTRDa0IsRUFBNUMsQ0FBK0NFLElBQS9DO0FBQ0Q7QUFFRixLQXpDQyxDQUFGO0FBMENELEdBdEVPLENBQVI7QUF1RUQsQ0F6RU8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgJy4uLy4uJzsgLy8gTk9URTogRm9yIHNvbWUgcmVhc29uIHRoaXMgZmlsZSBuZWVkcyB0byBiZSBpbXBvcnRlZCB0byBwcmV2ZW50IGEgYmFiZWwgZXJyb3JcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IE1KU09OV1BfRUxFTUVOVF9LRVksIFczQ19FTEVNRU5UX0tFWSwgZHJpdmVyU2hvdWxkRG9Kd3BQcm94eSwgSU1BR0VfRUxFTUVOVF9QUkVGSVggfSBmcm9tICcuLi8uLi9saWIvcHJvdG9jb2wvcHJvdG9jb2wnO1xuaW1wb3J0IEJhc2VEcml2ZXIgZnJvbSAnLi4vLi4vbGliL2Jhc2Vkcml2ZXIvZHJpdmVyJztcblxuY2hhaS5zaG91bGQoKTtcbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcblxuZGVzY3JpYmUoJ1Byb3RvY29sJywgZnVuY3Rpb24gKCkge1xuXG4gIGRlc2NyaWJlKCcjZHJpdmVyU2hvdWxkRG9Kd3BQcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIG5vdCBwcm94eSBpZiBhbiBpbWFnZSBlbGVtZW50IGlzIGZvdW5kIGluIHJlcXVlc3QgdXJsJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgICBzaW5vbi5zdHViKGQsICdwcm94eUFjdGl2ZScpLnJldHVybnModHJ1ZSk7XG4gICAgICBzaW5vbi5zdHViKGQsICdwcm94eVJvdXRlSXNBdm9pZGVkJykucmV0dXJucyhmYWxzZSk7XG4gICAgICBjb25zdCBoYXNJbWFnZUVsZW1lbnRzID0gW1xuICAgICAgICBgL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC8ke0lNQUdFX0VMRU1FTlRfUFJFRklYfWJhcmAsXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LyR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyL2NsaWNrYCxcbiAgICAgICAgYC93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXIvc3VibWl0YCxcbiAgICAgICAgYC93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3NjcmVlbnNob3QvJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXJgLFxuICAgICAgXTtcbiAgICAgIGNvbnN0IG5vSW1hZ2VFbGVtZW50cyA9IFtcbiAgICAgICAgYC93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1gLFxuICAgICAgICBgL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvc2NyZWVuc2hvdC8ke0lNQUdFX0VMRU1FTlRfUFJFRklYfWAsXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50L2JhciR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YCxcbiAgICAgICAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvZWxlbWVudDEyMycsXG4gICAgICAgICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC90aXRsZScsXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9ub3RlbGVtZW50LyR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyYCxcbiAgICAgIF07XG4gICAgICBmb3IgKGxldCB0ZXN0Q2FzZSBvZiBoYXNJbWFnZUVsZW1lbnRzKSB7XG4gICAgICAgIGNvbnN0IHJlcSA9IHtib2R5OiB7fSwgcGFyYW1zOiB7fSwgb3JpZ2luYWxVcmw6IHRlc3RDYXNlfTtcbiAgICAgICAgZHJpdmVyU2hvdWxkRG9Kd3BQcm94eShkLCByZXEsIG51bGwpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IHRlc3RDYXNlIG9mIG5vSW1hZ2VFbGVtZW50cykge1xuICAgICAgICBjb25zdCByZXEgPSB7Ym9keToge30sIHBhcmFtczoge30sIG9yaWdpbmFsVXJsOiB0ZXN0Q2FzZX07XG4gICAgICAgIGRyaXZlclNob3VsZERvSndwUHJveHkoZCwgcmVxLCBudWxsKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBwcm94eSBpZiBhbiBpbWFnZSBlbGVtZW50IGlzIGZvdW5kIGluIHJlcXVlc3QgYm9keScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgICAgc2lub24uc3R1YihkLCAncHJveHlBY3RpdmUnKS5yZXR1cm5zKHRydWUpO1xuICAgICAgc2lub24uc3R1YihkLCAncHJveHlSb3V0ZUlzQXZvaWRlZCcpLnJldHVybnMoZmFsc2UpO1xuICAgICAgY29uc3QgaGFzSW1hZ2VFbGVtZW50cyA9IFt7XG4gICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiBgJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXJgLFxuICAgICAgfSwge1xuICAgICAgICBbVzNDX0VMRU1FTlRfS0VZXTogYCR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9Zm9vYCxcbiAgICAgIH0sIHtcbiAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiBgJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXJgLFxuICAgICAgfV07XG4gICAgICBjb25zdCBub0ltYWdlRWxlbWVudHMgPSBbe1xuICAgICAgICBbSU1BR0VfRUxFTUVOVF9QUkVGSVhdOiAnZm9vJyxcbiAgICAgIH0sIHtcbiAgICAgICAgW1czQ19FTEVNRU5UX0tFWV06IGAke0lNQUdFX0VMRU1FTlRfUFJFRklYfWAsXG4gICAgICB9LCB7XG4gICAgICAgIFtNSlNPTldQX0VMRU1FTlRfS0VZXTogYCR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YCxcbiAgICAgIH0sIHtcbiAgICAgICAgZm9vOiAnYmFyJyxcbiAgICAgIH0sIHtcbiAgICAgICAgW1czQ19FTEVNRU5UX0tFWV06ICdiYXInLFxuICAgICAgfSwge1xuICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06ICdiYXInLFxuICAgICAgfSwge1xuICAgICAgICBmb286IGAke0lNQUdFX0VMRU1FTlRfUFJFRklYfWJhcmAsXG4gICAgICB9LCB7XG4gICAgICAgIGZvbzogYGJhciR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YFxuICAgICAgfSwge1xuICAgICAgICBbVzNDX0VMRU1FTlRfS0VZXTogYGJhciR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YFxuICAgICAgfSwge1xuICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06IGBiYXIke0lNQUdFX0VMRU1FTlRfUFJFRklYfWBcbiAgICAgIH1dO1xuICAgICAgZm9yIChsZXQgdGVzdENhc2Ugb2YgaGFzSW1hZ2VFbGVtZW50cykge1xuICAgICAgICBjb25zdCByZXEgPSB7Ym9keTogdGVzdENhc2UsIHBhcmFtczoge319O1xuICAgICAgICBkcml2ZXJTaG91bGREb0p3cFByb3h5KGQsIHJlcSwgbnVsbCkuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgdGVzdENhc2Ugb2Ygbm9JbWFnZUVsZW1lbnRzKSB7XG4gICAgICAgIGNvbnN0IHJlcSA9IHtib2R5OiB0ZXN0Q2FzZSwgcGFyYW1zOiB7fX07XG4gICAgICAgIGRyaXZlclNob3VsZERvSndwUHJveHkoZCwgcmVxLCBudWxsKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIH1cblxuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L3Byb3RvY29sL3Byb3RvY29sLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
