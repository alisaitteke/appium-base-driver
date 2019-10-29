"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _lodash = require("lodash");

var _protocol = require("../../lib/protocol");

var _crypto = _interopRequireDefault(require("crypto"));

var _chai = _interopRequireDefault(require("chai"));

_chai.default.should();

describe('Protocol', function () {
  describe('ensure protocol consistency', function () {
    it('should not change protocol between patch versions', function () {
      let shasum = _crypto.default.createHash('sha1');

      for (let [url, urlMapping] of _lodash._.toPairs(_protocol.METHOD_MAP)) {
        shasum.update(url);

        for (let [method, methodMapping] of _lodash._.toPairs(urlMapping)) {
          shasum.update(method);

          if (methodMapping.command) {
            shasum.update(methodMapping.command);
          }

          if (methodMapping.payloadParams) {
            let allParams = _lodash._.flatten(methodMapping.payloadParams.required);

            if (methodMapping.payloadParams.optional) {
              allParams = allParams.concat(_lodash._.flatten(methodMapping.payloadParams.optional));
            }

            for (let param of allParams) {
              shasum.update(param);
            }

            if (methodMapping.payloadParams.wrap) {
              shasum.update('skip');
              shasum.update(methodMapping.payloadParams.wrap);
            }
          }
        }
      }

      let hash = shasum.digest('hex').substring(0, 8);
      hash.should.equal('f46dc0b1');
    });
  });
  describe('check route to command name conversion', function () {
    it('should properly lookup correct command name for endpoint with session', function () {
      const cmdName = (0, _protocol.routeToCommandName)('/timeouts', 'POST');
      cmdName.should.equal('timeouts');
    });
    it('should properly lookup correct command name for endpoint with session', function () {
      const cmdName = (0, _protocol.routeToCommandName)('/timeouts/implicit_wait', 'POST');
      cmdName.should.equal('implicitWait');
    });
    it('should properly lookup correct command name for endpoint without session', function () {
      const cmdName = (0, _protocol.routeToCommandName)('/status', 'GET');
      cmdName.should.equal('getStatus');
    });
    it('should properly lookup correct command name for endpoint without leading slash', function () {
      const cmdName = (0, _protocol.routeToCommandName)('status', 'GET');
      cmdName.should.equal('getStatus');
    });
    it('should properly lookup correct command name for fully specified endpoint', function () {
      const cmdName = (0, _protocol.routeToCommandName)('/wd/hub/status', 'GET');
      cmdName.should.equal('getStatus');
    });
    it('should not find command name if incorrect input data has been specified', function () {
      for (let [route, method] of [['/wd/hub/status', 'POST'], ['/xstatus', 'GET'], ['status', 'POST']]) {
        const cmdName = (0, _protocol.routeToCommandName)(route, method);

        _chai.default.should().equal(cmdName, undefined);
      }
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcHJvdG9jb2wvcm91dGVzLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJkZXNjcmliZSIsIml0Iiwic2hhc3VtIiwiY3J5cHRvIiwiY3JlYXRlSGFzaCIsInVybCIsInVybE1hcHBpbmciLCJfIiwidG9QYWlycyIsIk1FVEhPRF9NQVAiLCJ1cGRhdGUiLCJtZXRob2QiLCJtZXRob2RNYXBwaW5nIiwiY29tbWFuZCIsInBheWxvYWRQYXJhbXMiLCJhbGxQYXJhbXMiLCJmbGF0dGVuIiwicmVxdWlyZWQiLCJvcHRpb25hbCIsImNvbmNhdCIsInBhcmFtIiwid3JhcCIsImhhc2giLCJkaWdlc3QiLCJzdWJzdHJpbmciLCJlcXVhbCIsImNtZE5hbWUiLCJyb3V0ZSIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0FBLGNBQUtDLE1BQUw7O0FBRUFDLFFBQVEsQ0FBQyxVQUFELEVBQWEsWUFBWTtBQUsvQkEsRUFBQUEsUUFBUSxDQUFDLDZCQUFELEVBQWdDLFlBQVk7QUFDbERDLElBQUFBLEVBQUUsQ0FBQyxtREFBRCxFQUFzRCxZQUFZO0FBQ2xFLFVBQUlDLE1BQU0sR0FBR0MsZ0JBQU9DLFVBQVAsQ0FBa0IsTUFBbEIsQ0FBYjs7QUFDQSxXQUFLLElBQUksQ0FBQ0MsR0FBRCxFQUFNQyxVQUFOLENBQVQsSUFBOEJDLFVBQUVDLE9BQUYsQ0FBVUMsb0JBQVYsQ0FBOUIsRUFBcUQ7QUFDbkRQLFFBQUFBLE1BQU0sQ0FBQ1EsTUFBUCxDQUFjTCxHQUFkOztBQUNBLGFBQUssSUFBSSxDQUFDTSxNQUFELEVBQVNDLGFBQVQsQ0FBVCxJQUFvQ0wsVUFBRUMsT0FBRixDQUFVRixVQUFWLENBQXBDLEVBQTJEO0FBQ3pESixVQUFBQSxNQUFNLENBQUNRLE1BQVAsQ0FBY0MsTUFBZDs7QUFDQSxjQUFJQyxhQUFhLENBQUNDLE9BQWxCLEVBQTJCO0FBQ3pCWCxZQUFBQSxNQUFNLENBQUNR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QU1lLE9BQU8sR0FBRyxrQ0FBbUJDLEtBQW5CLEVBQTBCaEIsTUFBMUIsQ0FBaEI7O0FBQ0FiLHNCQUFLQyxNQUFMLEdBQWMwQixLQUFkLENBQW9CQyxPQUFwQixFQUE2QkUsU0FBN0I7QUFDRDtBQUNGLEtBTEMsQ0FBRjtBQU1ELEdBaENPLENBQVI7QUFrQ0QsQ0F0RU8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgeyBfIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IE1FVEhPRF9NQVAsIHJvdXRlVG9Db21tYW5kTmFtZSB9IGZyb20gJy4uLy4uL2xpYi9wcm90b2NvbCc7XG5pbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcblxuXG5jaGFpLnNob3VsZCgpO1xuXG5kZXNjcmliZSgnUHJvdG9jb2wnLCBmdW5jdGlvbiAoKSB7XG5cbiAgLy8gVE9ETyB0ZXN0IGFnYWluc3QgYW4gZXhwbGljaXQgcHJvdG9jb2wgcmF0aGVyIHRoYW4gYSBoYXNoIG9mIGEgcHJldmlvdXNcbiAgLy8gcHJvdG9jb2xcblxuICBkZXNjcmliZSgnZW5zdXJlIHByb3RvY29sIGNvbnNpc3RlbmN5JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgbm90IGNoYW5nZSBwcm90b2NvbCBiZXR3ZWVuIHBhdGNoIHZlcnNpb25zJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNoYXN1bSA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJyk7XG4gICAgICBmb3IgKGxldCBbdXJsLCB1cmxNYXBwaW5nXSBvZiBfLnRvUGFpcnMoTUVUSE9EX01BUCkpIHtcbiAgICAgICAgc2hhc3VtLnVwZGF0ZSh1cmwpO1xuICAgICAgICBmb3IgKGxldCBbbWV0aG9kLCBtZXRob2RNYXBwaW5nXSBvZiBfLnRvUGFpcnModXJsTWFwcGluZykpIHtcbiAgICAgICAgICBzaGFzdW0udXBkYXRlKG1ldGhvZCk7XG4gICAgICAgICAgaWYgKG1ldGhvZE1hcHBpbmcuY29tbWFuZCkge1xuICAgICAgICAgICAgc2hhc3VtLnVwZGF0ZShtZXRob2RNYXBwaW5nLmNvbW1hbmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWV0aG9kTWFwcGluZy5wYXlsb2FkUGFyYW1zKSB7XG4gICAgICAgICAgICBsZXQgYWxsUGFyYW1zID0gXy5mbGF0dGVuKG1ldGhvZE1hcHBpbmcucGF5bG9hZFBhcmFtcy5yZXF1aXJlZCk7XG4gICAgICAgICAgICBpZiAobWV0aG9kTWFwcGluZy5wYXlsb2FkUGFyYW1zLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICAgIGFsbFBhcmFtcyA9IGFsbFBhcmFtcy5jb25jYXQoXy5mbGF0dGVuKG1ldGhvZE1hcHBpbmcucGF5bG9hZFBhcmFtcy5vcHRpb25hbCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgcGFyYW0gb2YgYWxsUGFyYW1zKSB7XG4gICAgICAgICAgICAgIHNoYXN1bS51cGRhdGUocGFyYW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1ldGhvZE1hcHBpbmcucGF5bG9hZFBhcmFtcy53cmFwKSB7XG4gICAgICAgICAgICAgIHNoYXN1bS51cGRhdGUoJ3NraXAnKTtcbiAgICAgICAgICAgICAgc2hhc3VtLnVwZGF0ZShtZXRob2RNYXBwaW5nLnBheWxvYWRQYXJhbXMud3JhcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgaGFzaCA9IHNoYXN1bS5kaWdlc3QoJ2hleCcpLnN1YnN0cmluZygwLCA4KTtcbiAgICAgIC8vIE1vZGlmeSB0aGUgaGFzaCB3aGVuZXZlciB0aGUgcHJvdG9jb2wgaGFzIGludGVudGlvbmFsbHkgYmVlbiBtb2RpZmllZC5cbiAgICAgIGhhc2guc2hvdWxkLmVxdWFsKCdmNDZkYzBiMScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2hlY2sgcm91dGUgdG8gY29tbWFuZCBuYW1lIGNvbnZlcnNpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBsb29rdXAgY29ycmVjdCBjb21tYW5kIG5hbWUgZm9yIGVuZHBvaW50IHdpdGggc2Vzc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGNtZE5hbWUgPSByb3V0ZVRvQ29tbWFuZE5hbWUoJy90aW1lb3V0cycsICdQT1NUJyk7XG4gICAgICBjbWROYW1lLnNob3VsZC5lcXVhbCgndGltZW91dHMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbG9va3VwIGNvcnJlY3QgY29tbWFuZCBuYW1lIGZvciBlbmRwb2ludCB3aXRoIHNlc3Npb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBjbWROYW1lID0gcm91dGVUb0NvbW1hbmROYW1lKCcvdGltZW91dHMvaW1wbGljaXRfd2FpdCcsICdQT1NUJyk7XG4gICAgICBjbWROYW1lLnNob3VsZC5lcXVhbCgnaW1wbGljaXRXYWl0Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IGxvb2t1cCBjb3JyZWN0IGNvbW1hbmQgbmFtZSBmb3IgZW5kcG9pbnQgd2l0aG91dCBzZXNzaW9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgY21kTmFtZSA9IHJvdXRlVG9Db21tYW5kTmFtZSgnL3N0YXR1cycsICdHRVQnKTtcbiAgICAgIGNtZE5hbWUuc2hvdWxkLmVxdWFsKCdnZXRTdGF0dXMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbG9va3VwIGNvcnJlY3QgY29tbWFuZCBuYW1lIGZvciBlbmRwb2ludCB3aXRob3V0IGxlYWRpbmcgc2xhc2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBjbWROYW1lID0gcm91dGVUb0NvbW1hbmROYW1lKCdzdGF0dXMnLCAnR0VUJyk7XG4gICAgICBjbWROYW1lLnNob3VsZC5lcXVhbCgnZ2V0U3RhdHVzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IGxvb2t1cCBjb3JyZWN0IGNvbW1hbmQgbmFtZSBmb3IgZnVsbHkgc3BlY2lmaWVkIGVuZHBvaW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgY21kTmFtZSA9IHJvdXRlVG9Db21tYW5kTmFtZSgnL3dkL2h1Yi9zdGF0dXMnLCAnR0VUJyk7XG4gICAgICBjbWROYW1lLnNob3VsZC5lcXVhbCgnZ2V0U3RhdHVzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBmaW5kIGNvbW1hbmQgbmFtZSBpZiBpbmNvcnJlY3QgaW5wdXQgZGF0YSBoYXMgYmVlbiBzcGVjaWZpZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKGxldCBbcm91dGUsIG1ldGhvZF0gb2YgW1snL3dkL2h1Yi9zdGF0dXMnLCAnUE9TVCddLCBbJy94c3RhdHVzJywgJ0dFVCddLCBbJ3N0YXR1cycsICdQT1NUJ11dKSB7XG4gICAgICAgIGNvbnN0IGNtZE5hbWUgPSByb3V0ZVRvQ29tbWFuZE5hbWUocm91dGUsIG1ldGhvZCk7XG4gICAgICAgIGNoYWkuc2hvdWxkKCkuZXF1YWwoY21kTmFtZSwgdW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L3Byb3RvY29sL3JvdXRlcy1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
